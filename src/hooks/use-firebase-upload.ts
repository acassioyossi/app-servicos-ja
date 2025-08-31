"use client";

import { useState, useCallback } from 'react';
import FirebaseStorageService, { UploadProgress, UploadResult } from '@/lib/firebase-storage';
import { useToast } from './use-toast';

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: UploadedFile[];
}

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export const useFirebaseUpload = () => {
  const { toast } = useToast();
  
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFiles: []
  });

  // Upload de arquivo único
  const uploadFile = useCallback(async (
    file: File,
    path: string,
    fileName?: string,
    allowedTypes?: string[],
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    setState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));
    
    try {
      const result = await FirebaseStorageService.uploadFileWithProgress(
        file,
        path,
        fileName,
        allowedTypes,
        (progress: UploadProgress) => {
          setState(prev => ({ ...prev, progress: progress.percentage }));
          onProgress?.(progress.percentage);
        }
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Erro no upload');
      }
      
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        url: result.downloadURL!,
        type: file.type,
        size: file.size,
        uploadedAt: new Date()
      };
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, uploadedFile]
      }));
      
      toast({
        title: 'Upload concluído',
        description: `Arquivo ${file.name} enviado com sucesso`
      });
      
      return result.downloadURL!;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage
      }));
      
      toast({
        title: 'Erro no upload',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    }
  }, [toast]);

  // Upload de múltiplos arquivos
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    path: string,
    allowedTypes?: string[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<string[]> => {
    setState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));
    
    const uploadedUrls: string[] = [];
    
    try {
      const results = await FirebaseStorageService.uploadMultipleFiles(
        files,
        path,
        allowedTypes,
        (fileIndex, progress) => {
          const totalProgress = ((fileIndex * 100) + progress.percentage) / files.length;
          setState(prev => ({ ...prev, progress: totalProgress }));
          onProgress?.(fileIndex, progress.percentage);
        }
      );
      
      const uploadedFiles: UploadedFile[] = [];
      
      results.forEach((result, index) => {
        if (result.success && result.downloadURL) {
          uploadedUrls.push(result.downloadURL);
          uploadedFiles.push({
            id: `${Date.now()}_${index}`,
            name: files[index].name,
            url: result.downloadURL,
            type: files[index].type,
            size: files[index].size,
            uploadedAt: new Date()
          });
        }
      });
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, ...uploadedFiles]
      }));
      
      toast({
        title: 'Upload concluído',
        description: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`
      });
      
      return uploadedUrls;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload múltiplo';
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage
      }));
      
      toast({
        title: 'Erro no upload',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return uploadedUrls;
    }
  }, [toast]);

  // Upload de avatar
  const uploadAvatar = useCallback(async (
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    return uploadFile(
      file,
      'avatars',
      `${userId}_avatar.${file.name.split('.').pop()}`,
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      onProgress
    );
  }, [uploadFile]);

  // Upload de imagem de serviço
  const uploadServiceImage = useCallback(async (
    file: File,
    serviceId: string,
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    return uploadFile(
      file,
      'service-images',
      `${serviceId}_${Date.now()}.${file.name.split('.').pop()}`,
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      onProgress
    );
  }, [uploadFile]);

  // Upload de documento
  const uploadDocument = useCallback(async (
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    return uploadFile(
      file,
      'documents',
      `${userId}_${Date.now()}_${file.name}`,
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      onProgress
    );
  }, [uploadFile]);

  // Upload de anexo de chat
  const uploadChatAttachment = useCallback(async (
    file: File,
    chatId: string,
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm', 'video/ogg'
    ];
    
    return uploadFile(
      file,
      'chat-attachments',
      `${chatId}_${Date.now()}_${file.name}`,
      allowedTypes,
      onProgress
    );
  }, [uploadFile]);

  // Deletar arquivo
  const deleteFile = useCallback(async (fileUrl: string): Promise<boolean> => {
    try {
      const success = await FirebaseStorageService.deleteFileByURL(fileUrl);
      
      if (success) {
        setState(prev => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles.filter(file => file.url !== fileUrl)
        }));
        
        toast({
          title: 'Arquivo deletado',
          description: 'Arquivo removido com sucesso'
        });
      }
      
      return success;
    } catch (error) {
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar o arquivo',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Gerar thumbnail de imagem
  const generateThumbnail = useCallback(async (
    file: File,
    maxWidth = 200,
    maxHeight = 200,
    quality = 0.8
  ): Promise<Blob | null> => {
    try {
      return await FirebaseStorageService.generateImageThumbnail(file, maxWidth, maxHeight, quality);
    } catch (error) {
      console.error('Erro ao gerar thumbnail:', error);
      return null;
    }
  }, []);

  // Validar arquivo
  const validateFile = useCallback((file: File, allowedTypes?: string[]) => {
    return FirebaseStorageService.validateFile(file, allowedTypes);
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Limpar arquivos uploadados
  const clearUploadedFiles = useCallback(() => {
    setState(prev => ({ ...prev, uploadedFiles: [] }));
  }, []);

  // Utilitários
  const formatFileSize = useCallback((bytes: number): string => {
    return FirebaseStorageService.formatFileSize(bytes);
  }, []);

  const isImageFile = useCallback((fileType: string): boolean => {
    return FirebaseStorageService.isImageFile(fileType);
  }, []);

  const isDocumentFile = useCallback((fileType: string): boolean => {
    return FirebaseStorageService.isDocumentFile(fileType);
  }, []);

  const isAudioFile = useCallback((fileType: string): boolean => {
    return FirebaseStorageService.isAudioFile(fileType);
  }, []);

  const isVideoFile = useCallback((fileType: string): boolean => {
    return FirebaseStorageService.isVideoFile(fileType);
  }, []);

  return {
    // Estado
    isUploading: state.isUploading,
    progress: state.progress,
    error: state.error,
    uploadedFiles: state.uploadedFiles,
    
    // Ações de upload
    uploadFile,
    uploadMultipleFiles,
    uploadAvatar,
    uploadServiceImage,
    uploadDocument,
    uploadChatAttachment,
    
    // Ações de gerenciamento
    deleteFile,
    generateThumbnail,
    validateFile,
    clearError,
    clearUploadedFiles,
    
    // Utilitários
    formatFileSize,
    isImageFile,
    isDocumentFile,
    isAudioFile,
    isVideoFile
  };
};

export default useFirebaseUpload;