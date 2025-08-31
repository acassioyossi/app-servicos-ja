import { NextRequest, NextResponse } from 'next/server';
import { signupSchema, validateData, validateFile } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { applySecurityHeaders } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';
import bcrypt from 'bcryptjs';

/**
 * Rate limiting para tentativas de cadastro usando Redis
 */
async function checkSignupRateLimit(identifier: string): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `signup_attempts:${identifier}`;
  const maxAttempts = 3;
  const windowMs = 60 * 60 * 1000; // 1 hora
  
  try {
    const current = await CacheService.rateLimit.get(key) || 0;
    
    if (current >= maxAttempts) {
      return {
        success: false,
        remaining: 0,
        reset: Date.now() + windowMs
      };
    }
    
    await CacheService.rateLimit.increment(key, windowMs / 1000);
    
    return {
      success: true,
      remaining: maxAttempts - current - 1,
      reset: Date.now() + windowMs
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Em caso de erro, permitir a operação
    return {
      success: true,
      remaining: maxAttempts - 1,
      reset: Date.now() + windowMs
    };
  }
}

/**
 * API de cadastro com validação server-side completa
 * POST /api/auth/signup
 */
export async function POST(request: NextRequest) {
  try {
    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Aplicar rate limiting baseado em Redis
    const identifier = request.ip || 'anonymous';
    const rateLimitResult = await checkSignupRateLimit(identifier);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas tentativas de cadastro. Tente novamente em 1 hora.',
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          }
        }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Parse do FormData para lidar com arquivos
    const formData = await request.formData();
    
    // Extrair dados do formulário
    const data = extractFormData(formData);
    
    // Validação server-side dos dados
    const validation = validateData(signupSchema, data);
    
    if (!validation.success) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Dados inválidos',
          errors: validation.errors
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    const validatedData = validation.data;
    
    // Sanitizar dados de texto
    const sanitizedData = {
      ...validatedData,
      name: sanitizeText(validatedData.name),
      email: sanitizeText(validatedData.email.toLowerCase().trim()),
      phone: sanitizeText(validatedData.phone),
      addressStreet: sanitizeText(validatedData.addressStreet),
      addressNeighborhood: sanitizeText(validatedData.addressNeighborhood),
      addressCity: sanitizeText(validatedData.addressCity),
      addressCountry: sanitizeText(validatedData.addressCountry),
    };
    
    // Validar arquivos se fornecidos
    const documentFront = formData.get('documentPhotoFront') as File;
    const documentBack = formData.get('documentPhotoBack') as File;
    const cnhPhoto = formData.get('cnhPhoto') as File;
    
    if (documentFront) {
      const frontValidation = validateFile(documentFront, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
      });
      
      if (!frontValidation.success) {
        const response = NextResponse.json(
          {
            success: false,
            message: 'Erro na foto da frente do documento',
            error: frontValidation.error
          },
          { status: 400 }
        );
        applySecurityHeaders(response);
        return response;
      }
    }
    
    if (documentBack) {
      const backValidation = validateFile(documentBack, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
      });
      
      if (!backValidation.success) {
        const response = NextResponse.json(
          {
            success: false,
            message: 'Erro na foto do verso do documento',
            error: backValidation.error
          },
          { status: 400 }
        );
        applySecurityHeaders(response);
        return response;
      }
    }
    
    // Verificar se e-mail já existe (com cache)
    const emailExists = await checkEmailExists(sanitizedData.email);
    if (emailExists) {
      // Log da tentativa de cadastro com email duplicado
      try {
        await prisma.auditLog.create({
          data: {
            userId: null,
            action: 'SIGNUP_ATTEMPT_DUPLICATE_EMAIL',
            resource: 'user',
            resourceId: null,
            details: {
              email: sanitizedData.email,
              userType: sanitizedData.type,
              ip: request.ip,
              userAgent: request.headers.get('user-agent')
            }
          }
        });
      } catch (error) {
        console.error('Audit log error:', error);
      }
      
      const response = NextResponse.json(
        {
          success: false,
          message: 'E-mail já cadastrado',
          error: 'Este e-mail já está sendo usado por outro usuário'
        },
        { status: 409 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Verificar se documento já existe (com cache)
    const documentExists = await checkDocumentExists(sanitizedData.document);
    if (documentExists) {
      // Log da tentativa de cadastro com documento duplicado
      try {
        await prisma.auditLog.create({
          data: {
            userId: null,
            action: 'SIGNUP_ATTEMPT_DUPLICATE_DOCUMENT',
            resource: 'user',
            resourceId: null,
            details: {
              document: sanitizedData.document.replace(/\d/g, '*'), // Mascarar documento no log
              userType: sanitizedData.type,
              ip: request.ip,
              userAgent: request.headers.get('user-agent')
            }
          }
        });
      } catch (error) {
        console.error('Audit log error:', error);
      }
      
      const response = NextResponse.json(
        {
          success: false,
          message: 'Documento já cadastrado',
          error: 'Este CPF/CNPJ já está sendo usado por outro usuário'
        },
        { status: 409 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Criar usuário
    const user = await createUser(sanitizedData, {
      documentFront,
      documentBack,
      cnhPhoto
    });
    
    // Log do cadastro bem-sucedido
    console.info(`New user registered: ${user.id} (${user.email}) from IP: ${request.ip}`);
    
    // Log de auditoria do cadastro bem-sucedido
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_SIGNUP_SUCCESS',
          resource: 'user',
          resourceId: user.id,
          details: {
            userType: user.type,
            registrationMethod: 'web',
            hasDocuments: !!(documentFrontPath || documentBackPath),
            hasCNH: !!cnhPhotoPath,
            ip: request.ip,
            userAgent: request.headers.get('user-agent')
          }
        }
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
    
    // Invalidar caches relacionados
    try {
      await CacheService.user.del(`email_exists:${sanitizedData.email}`);
      await CacheService.user.del(`document_exists:${sanitizedData.document.replace(/\D/g, '')}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
    
    const response = NextResponse.json({
      success: true,
      message: 'Cadastro realizado com sucesso',
      user: {
        id: user.id,
        name: sanitizeText(user.name),
        email: user.email,
        type: user.type
      }
    });
    
    // Aplicar cabeçalhos de segurança
    applySecurityHeaders(response);
    
    return response;
    
  } catch (error) {
    console.error('Signup error:', error);
    
    const response = NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor'
      },
      { status: 500 }
    );
    
    applySecurityHeaders(response);
    return response;
  }
}

/**
 * Extrair dados do FormData
 * @param formData FormData da requisição
 * @returns Objeto com os dados extraídos
 */
function extractFormData(formData: FormData): Record<string, any> {
  const data: Record<string, any> = {};
  
  // Campos de texto
  const textFields = [
    'name', 'phone', 'email', 'gender', 'password', 'document',
    'cep', 'addressStreet', 'addressNumber', 'addressNeighborhood',
    'addressCity', 'addressCountry', 'type', 'specialty',
    'vehicleType', 'vehicleModel', 'vehiclePlate', 'vehicleColor',
    'vehicleYear', 'crm', 'oab'
  ];
  
  textFields.forEach(field => {
    const value = formData.get(field);
    if (value && typeof value === 'string') {
      data[field] = value;
    }
  });
  
  // Campos booleanos
  data.hasVehicle = formData.get('hasVehicle') === 'true';
  
  return data;
}

/**
 * Verificar se e-mail já existe (com cache)
 * @param email E-mail a ser verificado
 * @returns True se o e-mail já existe
 */
async function checkEmailExists(email: string): Promise<boolean> {
  const cacheKey = `email_exists:${email}`;
  
  try {
    // Verificar cache primeiro
    const cached = await CacheService.user.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }
    
    // Buscar no banco de dados
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email
      },
      select: {
        id: true
      }
    });
    
    const exists = !!existingUser;
    
    // Cachear resultado por 5 minutos
    await CacheService.user.set(cacheKey, exists ? 'true' : 'false', 300);
    
    return exists;
  } catch (error) {
    console.error('Error checking email existence:', error);
    // Em caso de erro, verificar diretamente no banco
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email
      },
      select: {
        id: true
      }
    });
    
    return !!existingUser;
  }
}

/**
 * Verificar se documento já existe (com cache)
 * @param document Número do documento
 * @returns True se o documento já existe
 */
async function checkDocumentExists(document: string): Promise<boolean> {
  const cleanDoc = document.replace(/\D/g, '');
  const cacheKey = `document_exists:${cleanDoc}`;
  
  try {
    // Verificar cache primeiro
    const cached = await CacheService.user.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }
    
    // Buscar no banco de dados
    const existingUser = await prisma.user.findFirst({
      where: {
        document: cleanDoc
      },
      select: {
        id: true
      }
    });
    
    const exists = !!existingUser;
    
    // Cachear resultado por 5 minutos
    await CacheService.user.set(cacheKey, exists ? 'true' : 'false', 300);
    
    return exists;
  } catch (error) {
    console.error('Error checking document existence:', error);
    // Em caso de erro, verificar diretamente no banco
    const existingUser = await prisma.user.findFirst({
      where: {
        document: cleanDoc
      },
      select: {
        id: true
      }
    });
    
    return !!existingUser;
  }
}

/**
 * Criar novo usuário
 * @param data Dados validados do usuário
 * @param files Arquivos de upload
 * @returns Usuário criado
 */
async function createUser(
  data: any,
  files: {
    documentFront?: File;
    documentBack?: File;
    cnhPhoto?: File;
  }
): Promise<{
  id: string;
  name: string;
  email: string;
  type: 'client' | 'professional';
}> {
  try {
    // Hash da senha
    const passwordHash = await bcrypt.hash(data.password, 12);
    
    // Limpar documento
    const cleanDoc = data.document.replace(/\D/g, '');
    
    // Upload seguro dos arquivos
    let documentFrontPath: string | null = null;
    let documentBackPath: string | null = null;
    let cnhPhotoPath: string | null = null;
    
    if (files.documentFront || files.documentBack) {
      const { uploadDocumentFiles } = await import('@/lib/file-upload');
      const documentUpload = await uploadDocumentFiles(
        files.documentFront || null,
        files.documentBack || null,
        data.email // Usar email como identificador temporário
      );
      
      if (!documentUpload.success) {
        throw new Error(documentUpload.error || 'Falha no upload dos documentos');
      }
      
      documentFrontPath = documentUpload.frontResult?.filePath || null;
      documentBackPath = documentUpload.backResult?.filePath || null;
    }
    
    if (files.cnhPhoto) {
      const { uploadFile } = await import('@/lib/file-upload');
      const cnhUpload = await uploadFile(files.cnhPhoto, 'cnh', data.email);
      
      if (!cnhUpload.success) {
        throw new Error(cnhUpload.error || 'Falha no upload da CNH');
      }
      
      cnhPhotoPath = cnhUpload.filePath;
    }
    
    // Criar usuário no banco
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        name: data.name,
        type: data.type.toUpperCase(),
        document: cleanDoc,
        passwordHash,
        isVerified: false,
        wayneCashBalance: 0,
        addressStreet: data.address?.street || '',
        addressNumber: data.address?.number || '',
        addressNeighborhood: data.address?.neighborhood || '',
        addressCity: data.address?.city || '',
        addressState: data.address?.state || '',
        addressCountry: data.address?.country || 'Brasil',
        addressZipCode: data.address?.zipCode || '',
        documentFrontPath,
        documentBackPath,
        cnhPhotoPath,
        // Criar perfil profissional se for profissional
        ...(data.type === 'professional' && {
          professionalProfile: {
            create: {
              specialty: data.specialty?.toUpperCase() || 'OTHER',
              rating: 0,
              totalServices: 0,
              isAvailable: true,
              vehicleType: data.vehicle?.type || null,
              vehicleModel: data.vehicle?.model || null,
              vehiclePlate: data.vehicle?.plate || null,
              vehicleColor: data.vehicle?.color || null,
              vehicleYear: data.vehicle?.year || null,
            }
          }
        })
      },
      select: {
        id: true,
        name: true,
        email: true,
        type: true
      }
    });
    
    // Log da atividade
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        details: {
          userType: data.type,
          registrationMethod: 'web'
        }
      }
    });
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type.toLowerCase() as 'client' | 'professional'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Erro ao criar usuário');
  }
}

// Métodos não permitidos
export async function GET() {
  const response = NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
  applySecurityHeaders(response);
  return response;
}

export async function PUT() {
  const response = NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
  applySecurityHeaders(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
  applySecurityHeaders(response);
  return response;
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  applySecurityHeaders(response);
  return response;
}