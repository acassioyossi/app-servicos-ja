import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  StorageReference,
  UploadTask,
  UploadTaskSnapshot,
  FullMetadata
} from 'firebase/storage';
import { storage, FIREBASE_STORAGE_PATHS } from './firebase';

// Tipos
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface UploadResult {
  success: boolean;
  downloadURL?: string;
  error?: string;
  metadata?: FullMetadata;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  downloadURL: string;
  fullPath: string;
  createdAt: string;
  updatedAt: string;
}

// Configurações
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

// Classe de serviço Firebase Storage
export class FirebaseStorageService {
  // Validar arquivo
  static validateFile(file: File, allowedTypes?: string[]): { valid: boolean; error?: string } {
    // Verificar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Verificar tipo se especificado
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  // Upload simples de arquivo
  static async uploadFile(
    file: File,
    path: string,
    fileName?: string,
    allowedTypes?: string[]
  ): Promise<UploadResult> {
    try {
      // Validar arquivo
      const validation = this.validateFile(file, allowedTypes);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Gerar nome único se não fornecido
      const finalFileName = fileName || `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `${path}/${finalFileName}`);

      // Upload do arquivo
      const snapshot = await uploadBytes(storageRef, file, {
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      // Obter URL de download
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        downloadURL,
        metadata: snapshot.metadata
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao fazer upload do arquivo'
      };
    }
  }

  // Upload com progresso
  static uploadFileWithProgress(
    file: File,
    path: string,
    fileName?: string,
    allowedTypes?: string[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return new Promise((resolve) => {
      // Validar arquivo
      const validation = this.validateFile(file, allowedTypes);
      if (!validation.valid) {
        resolve({
          success: false,
          error: validation.error
        });
        return;
      }

      // Gerar nome único se não fornecido
      const finalFileName = fileName || `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `${path}/${finalFileName}`);

      // Criar task de upload
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      // Monitorar progresso
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            state: snapshot.state as any
          };
          onProgress?.(progress);
        },
        (error) => {
          resolve({
            success: false,
            error: error.message || 'Erro ao fazer upload do arquivo'
          });
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              success: true,
              downloadURL,
              metadata: uploadTask.snapshot.metadata
            });
          } catch (error: any) {
            resolve({
              success: false,
              error: error.message || 'Erro ao obter URL de download'
            });
          }
        }
      );
    });
  }

  // Upload de avatar
  static async uploadAvatar(file: File, userId: string): Promise<UploadResult> {
    return this.uploadFile(
      file,
      FIREBASE_STORAGE_PATHS.AVATARS,
      `${userId}_avatar.${file.name.split('.').pop()}`,
      ALLOWED_IMAGE_TYPES
    );
  }

  // Upload de imagem de serviço
  static async uploadServiceImage(file: File, serviceId: string): Promise<UploadResult> {
    return this.uploadFile(
      file,
      FIREBASE_STORAGE_PATHS.SERVICE_IMAGES,
      `${serviceId}_${Date.now()}.${file.name.split('.').pop()}`,
      ALLOWED_IMAGE_TYPES
    );
  }

  // Upload de documento
  static async uploadDocument(file: File, userId: string): Promise<UploadResult> {
    return this.uploadFile(
      file,
      FIREBASE_STORAGE_PATHS.DOCUMENTS,
      `${userId}_${Date.now()}_${file.name}`,
      ALLOWED_DOCUMENT_TYPES
    );
  }

  // Upload de anexo de chat
  static async uploadChatAttachment(
    file: File,
    chatId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const allowedTypes = [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
      ...ALLOWED_AUDIO_TYPES,
      ...ALLOWED_VIDEO_TYPES
    ];

    return this.uploadFileWithProgress(
      file,
      FIREBASE_STORAGE_PATHS.CHAT_ATTACHMENTS,
      `${chatId}_${Date.now()}_${file.name}`,
      allowedTypes,
      onProgress
    );
  }

  // Upload múltiplo
  static async uploadMultipleFiles(
    files: File[],
    path: string,
    allowedTypes?: string[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadFileWithProgress(
        file,
        path,
        undefined,
        allowedTypes,
        (progress) => onProgress?.(i, progress)
      );
      results.push(result);
    }

    return results;
  }

  // Deletar arquivo
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      return false;
    }
  }

  // Deletar por URL
  static async deleteFileByURL(downloadURL: string): Promise<boolean> {
    try {
      const fileRef = ref(storage, downloadURL);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo por URL:', error);
      return false;
    }
  }

  // Listar arquivos em um diretório
  static async listFiles(path: string): Promise<FileInfo[]> {
    try {
      const listRef = ref(storage, path);
      const result = await listAll(listRef);
      
      const files: FileInfo[] = [];
      
      for (const itemRef of result.items) {
        try {
          const [downloadURL, metadata] = await Promise.all([
            getDownloadURL(itemRef),
            getMetadata(itemRef)
          ]);
          
          files.push({
            name: itemRef.name,
            size: metadata.size,
            type: metadata.contentType || 'unknown',
            downloadURL,
            fullPath: itemRef.fullPath,
            createdAt: metadata.timeCreated,
            updatedAt: metadata.updated
          });
        } catch (error) {
          console.error(`Erro ao obter informações do arquivo ${itemRef.name}:`, error);
        }
      }
      
      return files;
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      return [];
    }
  }

  // Obter metadados do arquivo
  static async getFileMetadata(filePath: string): Promise<FullMetadata | null> {
    try {
      const fileRef = ref(storage, filePath);
      return await getMetadata(fileRef);
    } catch (error) {
      console.error('Erro ao obter metadados:', error);
      return null;
    }
  }

  // Atualizar metadados do arquivo
  static async updateFileMetadata(
    filePath: string,
    metadata: { [key: string]: string }
  ): Promise<boolean> {
    try {
      const fileRef = ref(storage, filePath);
      await updateMetadata(fileRef, {
        customMetadata: metadata
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar metadados:', error);
      return false;
    }
  }

  // Obter URL de download
  static async getDownloadURL(filePath: string): Promise<string | null> {
    try {
      const fileRef = ref(storage, filePath);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Erro ao obter URL de download:', error);
      return null;
    }
  }

  // Utilitários
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  static isImageFile(fileType: string): boolean {
    return ALLOWED_IMAGE_TYPES.includes(fileType);
  }

  static isDocumentFile(fileType: string): boolean {
    return ALLOWED_DOCUMENT_TYPES.includes(fileType);
  }

  static isAudioFile(fileType: string): boolean {
    return ALLOWED_AUDIO_TYPES.includes(fileType);
  }

  static isVideoFile(fileType: string): boolean {
    return ALLOWED_VIDEO_TYPES.includes(fileType);
  }

  // Gerar thumbnail para imagem (usando canvas)
  static async generateImageThumbnail(
    file: File,
    maxWidth = 200,
    maxHeight = 200,
    quality = 0.8
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.isImageFile(file.type)) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }
}

export default FirebaseStorageService;