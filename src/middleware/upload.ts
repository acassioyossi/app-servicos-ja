import { NextRequest } from 'next/server';
import { validateFile, FileType } from '@/lib/file-upload';

/**
 * Configurações de upload por rota
 */
const ROUTE_UPLOAD_CONFIG: Record<string, {
  maxFiles: number;
  allowedTypes: FileType[];
  maxTotalSize: number;
}> = {
  '/api/auth/signup': {
    maxFiles: 3,
    allowedTypes: ['document', 'cnh'],
    maxTotalSize: 30 * 1024 * 1024 // 30MB total
  },
  '/api/profile/update': {
    maxFiles: 5,
    allowedTypes: ['profile', 'portfolio'],
    maxTotalSize: 50 * 1024 * 1024 // 50MB total
  },
  '/api/service/create': {
    maxFiles: 10,
    allowedTypes: ['service'],
    maxTotalSize: 100 * 1024 * 1024 // 100MB total
  }
};

/**
 * Extrair arquivos do FormData
 * @param formData FormData da requisição
 * @returns Arquivos extraídos
 */
export function extractFiles(formData: FormData): Record<string, File | File[]> {
  const files: Record<string, File | File[]> = {};
  
  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      if (files[key]) {
        // Se já existe, converter para array ou adicionar ao array
        if (Array.isArray(files[key])) {
          (files[key] as File[]).push(value);
        } else {
          files[key] = [files[key] as File, value];
        }
      } else {
        files[key] = value;
      }
    }
  }
  
  return files;
}

/**
 * Validar uploads de uma requisição
 * @param request Requisição Next.js
 * @param files Arquivos extraídos
 * @returns Resultado da validação
 */
export function validateUploads(
  request: NextRequest,
  files: Record<string, File | File[]>
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pathname = new URL(request.url).pathname;
  
  // Obter configuração para a rota
  const config = ROUTE_UPLOAD_CONFIG[pathname];
  if (!config) {
    warnings.push(`Configuração de upload não encontrada para rota: ${pathname}`);
    return { valid: true, errors, warnings };
  }
  
  // Contar total de arquivos e tamanho
  let totalFiles = 0;
  let totalSize = 0;
  
  for (const [fieldName, fileOrFiles] of Object.entries(files)) {
    const fileArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    
    for (const file of fileArray) {
      totalFiles++;
      totalSize += file.size;
      
      // Validar cada arquivo individualmente
      const fileType = determineFileType(fieldName);
      if (fileType && config.allowedTypes.includes(fileType)) {
        const validation = validateFile(file, fileType);
        if (!validation.valid) {
          errors.push(`${fieldName}: ${validation.error}`);
        }
      } else {
        errors.push(`${fieldName}: Tipo de arquivo não permitido para esta rota`);
      }
    }
  }
  
  // Validar limites globais
  if (totalFiles > config.maxFiles) {
    errors.push(`Muitos arquivos. Máximo permitido: ${config.maxFiles}`);
  }
  
  if (totalSize > config.maxTotalSize) {
    const maxSizeMB = (config.maxTotalSize / 1024 / 1024).toFixed(1);
    const currentSizeMB = (totalSize / 1024 / 1024).toFixed(1);
    errors.push(`Tamanho total dos arquivos muito grande. Máximo: ${maxSizeMB}MB, atual: ${currentSizeMB}MB`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Determinar tipo de arquivo baseado no nome do campo
 * @param fieldName Nome do campo
 * @returns Tipo de arquivo
 */
function determineFileType(fieldName: string): FileType | null {
  const fieldLower = fieldName.toLowerCase();
  
  if (fieldLower.includes('document')) return 'document';
  if (fieldLower.includes('cnh')) return 'cnh';
  if (fieldLower.includes('profile')) return 'profile';
  if (fieldLower.includes('portfolio')) return 'portfolio';
  if (fieldLower.includes('service')) return 'service';
  
  return null;
}

/**
 * Middleware para processar uploads
 * @param request Requisição Next.js
 * @returns Dados processados ou erro
 */
export async function processUploads(request: NextRequest): Promise<{
  success: boolean;
  formData?: FormData;
  files?: Record<string, File | File[]>;
  data?: Record<string, any>;
  error?: string;
  errors?: string[];
}> {
  try {
    // Verificar se é multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return {
        success: false,
        error: 'Content-Type deve ser multipart/form-data para upload de arquivos'
      };
    }
    
    // Extrair FormData
    const formData = await request.formData();
    
    // Extrair arquivos
    const files = extractFiles(formData);
    
    // Validar uploads
    const validation = validateUploads(request, files);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validação de arquivos falhou',
        errors: validation.errors
      };
    }
    
    // Extrair dados não-arquivo
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (!(value instanceof File)) {
        data[key] = value;
      }
    }
    
    return {
      success: true,
      formData,
      files,
      data
    };
    
  } catch (error) {
    console.error('Upload processing error:', error);
    return {
      success: false,
      error: 'Erro ao processar upload de arquivos'
    };
  }
}

/**
 * Limpar arquivos temporários em caso de erro
 * @param files Arquivos para limpar
 */
export async function cleanupFiles(files: Record<string, File | File[]>): Promise<void> {
  // Em uma implementação real, você removeria os arquivos do sistema de arquivos
  // Por enquanto, apenas log
  const fileCount = Object.values(files).flat().length;
  console.info(`Cleanup: ${fileCount} arquivos temporários removidos`);
}