import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { CacheService } from './cache-service';
import { prisma } from './prisma';

/**
 * Configurações de upload
 */
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: {
    images: ['image/jpeg', 'image/png', 'image/webp'],
    documents: ['image/jpeg', 'image/png', 'application/pdf'],
    videos: ['video/mp4', 'video/webm', 'video/quicktime']
  },
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
};

/**
 * Tipos de arquivo permitidos
 */
export type FileType = 'document' | 'profile' | 'portfolio' | 'service' | 'cnh';

/**
 * Resultado do upload
 */
export interface UploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileUrl?: string;
  error?: string;
}

/**
 * Validar arquivo
 * @param file Arquivo para validar
 * @param type Tipo de arquivo
 * @returns Resultado da validação
 */
export function validateFile(file: File, type: FileType): { valid: boolean; error?: string } {
  // Verificar tamanho
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo permitido: ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB`
    };
  }

  // Verificar tipo MIME
  let allowedTypes: string[] = [];
  
  switch (type) {
    case 'document':
    case 'cnh':
      allowedTypes = UPLOAD_CONFIG.allowedMimeTypes.documents;
      break;
    case 'profile':
    case 'portfolio':
    case 'service':
      allowedTypes = [...UPLOAD_CONFIG.allowedMimeTypes.images, ...UPLOAD_CONFIG.allowedMimeTypes.videos];
      break;
    default:
      allowedTypes = UPLOAD_CONFIG.allowedMimeTypes.images;
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Gerar nome único para arquivo
 * @param originalName Nome original do arquivo
 * @param type Tipo de arquivo
 * @returns Nome único
 */
function generateUniqueFileName(originalName: string, type: FileType): string {
  const timestamp = Date.now();
  const randomId = randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
  
  return `${type}_${timestamp}_${randomId}.${extension}`;
}

/**
 * Log de atividade de upload
 * @param userId ID do usuário
 * @param action Ação realizada
 * @param metadata Metadados da ação
 * @param ipAddress IP do usuário
 */
async function logUploadActivity(
  userId: string,
  action: 'UPLOAD_SUCCESS' | 'UPLOAD_FAILED' | 'UPLOAD_ERROR',
  metadata: any,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource: 'FILE_UPLOAD',
        metadata,
        ipAddress,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log upload activity:', error);
  }
}

/**
 * Fazer upload de arquivo
 * @param file Arquivo para upload
 * @param type Tipo de arquivo
 * @param userId ID do usuário (opcional, para organização)
 * @param ipAddress IP do usuário (para auditoria)
 * @returns Resultado do upload
 */
export async function uploadFile(
  file: File,
  type: FileType,
  userId?: string,
  ipAddress?: string
): Promise<UploadResult> {
  try {
    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }

    // Validar arquivo
    const validation = validateFile(file, type);
    if (!validation.valid) {
      // Log tentativa de upload inválido
      if (userId) {
        await logUploadActivity(userId, 'UPLOAD_FAILED', {
          reason: 'validation_failed',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          error: validation.error
        }, ipAddress);
      }
      
      return {
        success: false,
        error: validation.error
      };
    }

    // Gerar nome único
    const fileName = generateUniqueFileName(file.name, type);
    
    // Definir diretório baseado no tipo e usuário
    const subDir = userId ? `${type}/${userId}` : type;
    const uploadPath = join(process.cwd(), 'public', UPLOAD_CONFIG.uploadDir, subDir);
    
    // Criar diretório se não existir
    await mkdir(uploadPath, { recursive: true });
    
    // Caminho completo do arquivo
    const filePath = join(uploadPath, fileName);
    const relativePath = join(UPLOAD_CONFIG.uploadDir, subDir, fileName);
    
    // Converter File para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Salvar arquivo
    await writeFile(filePath, buffer);
    
    // URL pública do arquivo
    const fileUrl = `${UPLOAD_CONFIG.baseUrl}/${relativePath.replace(/\\/g, '/')}`;
    
    // Log upload bem-sucedido
    if (userId) {
      await logUploadActivity(userId, 'UPLOAD_SUCCESS', {
        fileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: relativePath,
        uploadType: type
      }, ipAddress);
    }
    
    // Cachear informações do arquivo por 1 hora
    const fileCacheKey = `file:${fileName}`;
    await CacheService.temp.set(fileCacheKey, {
      fileName,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath: relativePath,
      fileUrl,
      uploadedAt: new Date().toISOString(),
      userId
    }, 3600);
    
    console.info(`File uploaded successfully: ${fileName} (${file.size} bytes)`);
    
    return {
      success: true,
      filePath: relativePath,
      fileName,
      fileUrl
    };
    
  } catch (error) {
    console.error('File upload error:', error);
    
    // Log erro de upload
    if (userId) {
      await logUploadActivity(userId, 'UPLOAD_ERROR', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, ipAddress);
    }
    
    return {
      success: false,
      error: 'Falha no upload do arquivo'
    };
  }
}

/**
 * Fazer upload de múltiplos arquivos
 * @param files Arquivos para upload
 * @param type Tipo de arquivo
 * @param userId ID do usuário (opcional)
 * @param ipAddress IP do usuário (para auditoria)
 * @returns Resultados dos uploads
 */
export async function uploadMultipleFiles(
  files: File[],
  type: FileType,
  userId?: string,
  ipAddress?: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  
  for (const file of files) {
    const result = await uploadFile(file, type, userId, ipAddress);
    results.push(result);
  }
  
  return results;
}

/**
 * Fazer upload de arquivos de documentos (frente e verso)
 * @param documentFront Documento frente
 * @param documentBack Documento verso
 * @param userId ID do usuário
 * @param ipAddress IP do usuário (para auditoria)
 * @returns Resultados dos uploads
 */
export async function uploadDocumentFiles(
  documentFront: File | null,
  documentBack: File | null,
  userId: string,
  ipAddress?: string
): Promise<{
  frontResult?: UploadResult;
  backResult?: UploadResult;
  success: boolean;
  error?: string;
}> {
  try {
    const results: {
      frontResult?: UploadResult;
      backResult?: UploadResult;
      success: boolean;
      error?: string;
    } = { success: true };
    
    if (documentFront) {
      results.frontResult = await uploadFile(documentFront, 'document', userId, ipAddress);
      if (!results.frontResult.success) {
        results.success = false;
        results.error = `Erro no upload do documento (frente): ${results.frontResult.error}`;
        return results;
      }
    }
    
    if (documentBack) {
      results.backResult = await uploadFile(documentBack, 'document', userId, ipAddress);
      if (!results.backResult.success) {
        results.success = false;
        results.error = `Erro no upload do documento (verso): ${results.backResult.error}`;
        return results;
      }
    }
    
    // Cachear informações dos documentos por 24 horas
    const docCacheKey = `documents:${userId}`;
    await CacheService.temp.set(docCacheKey, {
      frontPath: results.frontResult?.filePath,
      backPath: results.backResult?.filePath,
      uploadedAt: new Date().toISOString()
    }, 24 * 60 * 60);
    
    return results;
    
  } catch (error) {
    console.error('Document upload error:', error);
    
    // Log erro de upload de documentos
    await logUploadActivity(userId, 'UPLOAD_ERROR', {
      uploadType: 'documents',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, ipAddress);
    
    return {
      success: false,
      error: 'Falha no upload dos documentos'
    };
  }
}

/**
 * Sanitizar nome de arquivo
 * @param fileName Nome do arquivo
 * @returns Nome sanitizado
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Obter informações do arquivo
 * @param file Arquivo
 * @returns Informações do arquivo
 */
export function getFileInfo(file: File): {
  name: string;
  size: number;
  type: string;
  sizeFormatted: string;
} {
  const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
  
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    sizeFormatted: `${sizeInMB} MB`
  };
}

/**
 * Obter informações de arquivo do cache
 * @param fileName Nome do arquivo
 * @returns Informações do arquivo ou null
 */
export async function getFileFromCache(fileName: string): Promise<any | null> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    const fileCacheKey = `file:${fileName}`;
    return await CacheService.temp.get(fileCacheKey);
  } catch (error) {
    console.error('Error getting file from cache:', error);
    return null;
  }
}

/**
 * Limpar cache de arquivos do usuário
 * @param userId ID do usuário
 */
export async function clearUserFileCache(userId: string): Promise<void> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Limpar cache de documentos
    const docCacheKey = `documents:${userId}`;
    await CacheService.temp.del(docCacheKey);
    
    console.info(`File cache cleared for user: ${userId}`);
  } catch (error) {
    console.error('Error clearing user file cache:', error);
  }
}

/**
 * Validar arquivo com cache
 * @param file Arquivo para validar
 * @param type Tipo de arquivo
 * @returns Resultado da validação
 */
export async function validateFileWithCache(file: File, type: FileType): Promise<{ valid: boolean; error?: string }> {
  try {
    // Gerar hash do arquivo para cache
    const fileHash = `${file.name}_${file.size}_${file.type}`;
    const validationCacheKey = `validation:${Buffer.from(fileHash).toString('base64')}`;
    
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Verificar cache primeiro
    const cachedValidation = await CacheService.temp.get(validationCacheKey);
    if (cachedValidation) {
      return cachedValidation;
    }
    
    // Fazer validação
    const validation = validateFile(file, type);
    
    // Cachear resultado por 1 hora
    await CacheService.temp.set(validationCacheKey, validation, 3600);
    
    return validation;
  } catch (error) {
    console.error('Error in cached validation:', error);
    // Fallback para validação normal
    return validateFile(file, type);
  }
}

/**
 * Obter estatísticas de upload do usuário
 * @param userId ID do usuário
 * @returns Estatísticas de upload
 */
export async function getUserUploadStats(userId: string): Promise<{
  totalUploads: number;
  totalSize: number;
  lastUpload?: string;
}> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    const statsCacheKey = `upload_stats:${userId}`;
    
    // Verificar cache primeiro
    const cachedStats = await CacheService.analytics.get(statsCacheKey);
    if (cachedStats) {
      return typeof cachedStats === 'object' ? cachedStats : { totalUploads: 0, totalSize: 0 };
    }
    
    // Buscar do banco de dados
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        action: 'UPLOAD_SUCCESS',
        resource: 'FILE_UPLOAD'
      },
      select: {
        metadata: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    const stats = {
      totalUploads: logs.length,
      totalSize: logs.reduce((sum, log) => sum + (log.metadata?.fileSize || 0), 0),
      lastUpload: logs[0]?.timestamp?.toISOString()
    };
    
    // Cachear por 1 hora
    await CacheService.analytics.set(statsCacheKey, stats, 3600);
    
    return stats;
  } catch (error) {
    console.error('Error getting upload stats:', error);
    return { totalUploads: 0, totalSize: 0 };
  }
}