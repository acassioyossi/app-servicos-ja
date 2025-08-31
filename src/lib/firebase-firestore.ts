import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { db, FIREBASE_COLLECTIONS } from './firebase';

// Tipos
export interface Message {
  id?: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'location' | 'price_offer';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    imageUrl?: string;
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
    priceOffer?: {
      amount: number;
      description: string;
      status: 'pending' | 'accepted' | 'rejected';
    };
  };
  isRead: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Chat {
  id?: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: any;
  };
  unreadCount: Record<string, number>;
  serviceId?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}

export interface Transaction {
  id?: string;
  serviceId: string;
  clientId: string;
  professionalId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'cash';
  description: string;
  metadata?: {
    paymentId?: string;
    refundId?: string;
    failureReason?: string;
  };
  createdAt: any;
  updatedAt: any;
}

export interface Service {
  id?: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  professionalId: string;
  clientId?: string;
  price: {
    type: 'fixed' | 'hourly' | 'negotiable';
    amount?: number;
    currency: 'BRL';
  };
  location: {
    address: string;
    city: string;
    state: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  scheduledFor?: any;
  images?: string[];
  requirements?: string[];
  estimatedDuration?: number; // em horas
  createdAt: any;
  updatedAt: any;
}

export interface Review {
  id?: string;
  serviceId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1-5
  comment?: string;
  isAnonymous: boolean;
  createdAt: any;
}

// Classe de serviço Firestore
export class FirestoreService {
  // === MENSAGENS ===
  
  // Enviar mensagem
  static async sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const messageData = {
        ...message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, FIREBASE_COLLECTIONS.MESSAGES), messageData);
      
      // Atualizar chat com última mensagem
      await this.updateChatLastMessage(message.chatId, {
        content: message.content,
        senderId: message.senderId,
        createdAt: serverTimestamp()
      });

      // Incrementar contador de não lidas
      await this.incrementUnreadCount(message.chatId, message.receiverId);

      return docRef.id;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return null;
    }
  }

  // Buscar mensagens de um chat
  static async getChatMessages(chatId: string, limitCount = 50): Promise<Message[]> {
    try {
      const q = query(
        collection(db, FIREBASE_COLLECTIONS.MESSAGES),
        where('chatId', '==', chatId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }

  // Escutar mensagens em tempo real
  static listenToChatMessages(
    chatId: string,
    callback: (messages: Message[]) => void,
    limitCount = 50
  ): Unsubscribe {
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.MESSAGES),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      callback(messages.reverse()); // Reverter para ordem cronológica
    });
  }

  // Marcar mensagens como lidas
  static async markMessagesAsRead(chatId: string, userId: string): Promise<boolean> {
    try {
      const batch = writeBatch(db);
      
      // Buscar mensagens não lidas
      const q = query(
        collection(db, FIREBASE_COLLECTIONS.MESSAGES),
        where('chatId', '==', chatId),
        where('receiverId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      
      // Marcar como lidas
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true, updatedAt: serverTimestamp() });
      });

      // Resetar contador de não lidas
      const chatRef = doc(db, 'chats', chatId);
      batch.update(chatRef, {
        [`unreadCount.${userId}`]: 0,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      return false;
    }
  }

  // === CHATS ===
  
  // Criar ou buscar chat
  static async getOrCreateChat(participants: string[], serviceId?: string): Promise<string | null> {
    try {
      // Buscar chat existente
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains-any', participants)
      );

      const snapshot = await getDocs(q);
      const existingChat = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.every((p: string) => participants.includes(p)) &&
               participants.every(p => data.participants.includes(p));
      });

      if (existingChat) {
        return existingChat.id;
      }

      // Criar novo chat
      const chatData: Omit<Chat, 'id'> = {
        participants,
        unreadCount: participants.reduce((acc, p) => ({ ...acc, [p]: 0 }), {}),
        status: 'active',
        serviceId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar/buscar chat:', error);
      return null;
    }
  }

  // Buscar chats do usuário
  static async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      return [];
    }
  }

  // Escutar chats do usuário
  static listenToUserChats(userId: string, callback: (chats: Chat[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      callback(chats);
    });
  }

  // === SERVIÇOS ===
  
  // Criar serviço
  static async createService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const serviceData = {
        ...service,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, FIREBASE_COLLECTIONS.SERVICES), serviceData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      return null;
    }
  }

  // Buscar serviços
  static async getServices(filters?: {
    category?: string;
    city?: string;
    status?: string;
    professionalId?: string;
    clientId?: string;
  }): Promise<Service[]> {
    try {
      let q = query(collection(db, FIREBASE_COLLECTIONS.SERVICES));

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters?.city) {
        q = query(q, where('location.city', '==', filters.city));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.professionalId) {
        q = query(q, where('professionalId', '==', filters.professionalId));
      }
      if (filters?.clientId) {
        q = query(q, where('clientId', '==', filters.clientId));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return [];
    }
  }

  // Atualizar serviço
  static async updateService(serviceId: string, updates: Partial<Service>): Promise<boolean> {
    try {
      const serviceRef = doc(db, FIREBASE_COLLECTIONS.SERVICES, serviceId);
      await updateDoc(serviceRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      return false;
    }
  }

  // === TRANSAÇÕES ===
  
  // Criar transação
  static async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const transactionData = {
        ...transaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, FIREBASE_COLLECTIONS.TRANSACTIONS), transactionData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return null;
    }
  }

  // Atualizar status da transação
  static async updateTransactionStatus(
    transactionId: string,
    status: Transaction['status'],
    metadata?: Transaction['metadata']
  ): Promise<boolean> {
    try {
      const transactionRef = doc(db, FIREBASE_COLLECTIONS.TRANSACTIONS, transactionId);
      const updates: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (metadata) {
        updates.metadata = metadata;
      }

      await updateDoc(transactionRef, updates);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      return false;
    }
  }

  // === AVALIAÇÕES ===
  
  // Criar avaliação
  static async createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const reviewData = {
        ...review,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, FIREBASE_COLLECTIONS.REVIEWS), reviewData);
      
      // Atualizar rating do profissional
      await this.updateProfessionalRating(review.revieweeId);
      
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      return null;
    }
  }

  // Atualizar rating do profissional
  static async updateProfessionalRating(professionalId: string): Promise<void> {
    try {
      const q = query(
        collection(db, FIREBASE_COLLECTIONS.REVIEWS),
        where('revieweeId', '==', professionalId)
      );

      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => doc.data() as Review);
      
      if (reviews.length === 0) return;

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, professionalId);
      await updateDoc(userRef, {
        rating: averageRating,
        reviewCount: reviews.length,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar rating:', error);
    }
  }

  // === UTILITÁRIOS PRIVADOS ===
  
  private static async updateChatLastMessage(chatId: string, lastMessage: any): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar última mensagem:', error);
    }
  }

  private static async incrementUnreadCount(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao incrementar contador:', error);
    }
  }
}

export default FirestoreService;