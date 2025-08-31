import { z } from 'zod';

/**
 * Utilitários de validação server-side para formulários
 * Garante que todos os dados recebidos do cliente sejam validados no servidor
 */

// Validação para formulário de login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido')
    .max(255, 'E-mail muito longo'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(128, 'Senha muito longa'),
});

// Validação para formulário de recuperação de senha
export const forgotPasswordSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, 'E-mail ou telefone é obrigatório')
    .refine(
      (value) => {
        // Validar se é e-mail ou telefone
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
        return emailRegex.test(value) || phoneRegex.test(value);
      },
      'Deve ser um e-mail ou telefone válido'
    ),
});

// Validação para reset de senha
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(128, 'Senha muito longa'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

// Validação para dados de pagamento
export const paymentDataSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  method: z.enum(['credit_card', 'debit_card', 'pix', 'boleto']),
  description: z.string().optional()
});

// Validação para transações
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().optional()
});

// Validação para usuários
export const userSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']).optional()
});

// Validação para formulário de cadastro
export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Formato de telefone inválido'),
  
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido')
    .max(255, 'E-mail muito longo'),
  
  gender: z.enum(['masculino', 'feminino', 'outro', 'nao_informar']),
  
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha muito longa')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  
  document: z
    .string()
    .min(1, 'CPF/CNPJ é obrigatório')
    .refine(
      (value) => {
        // Validar CPF ou CNPJ
        const cleanDoc = value.replace(/\D/g, '');
        return cleanDoc.length === 11 || cleanDoc.length === 14;
      },
      'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
    ),
  
  cep: z
    .string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-?\d{3}$/, 'Formato de CEP inválido'),
  
  addressStreet: z
    .string()
    .min(1, 'Logradouro é obrigatório')
    .max(200, 'Logradouro muito longo'),
  
  addressNumber: z
    .string()
    .min(1, 'Número é obrigatório')
    .max(10, 'Número muito longo'),
  
  addressNeighborhood: z
    .string()
    .min(1, 'Bairro é obrigatório')
    .max(100, 'Bairro muito longo'),
  
  addressCity: z
    .string()
    .min(1, 'Cidade é obrigatória')
    .max(100, 'Cidade muito longa'),
  
  addressCountry: z
    .string()
    .min(1, 'País é obrigatório')
    .max(50, 'País muito longo'),
  
  type: z.enum(['client', 'professional']),
  
  // Campos opcionais para profissionais
  specialty: z.string().optional(),
  hasVehicle: z.boolean().optional(),
  vehicleType: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleYear: z.string().optional(),
  crm: z.string().optional(),
  oab: z.string().optional(),
});

// Validação para mensagens de chat
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(1000, 'Mensagem muito longa')
    .refine(
      (value) => {
        // Verificar se não contém apenas espaços em branco
        return value.trim().length > 0;
      },
      'Mensagem não pode conter apenas espaços'
    ),
  
  professionalName: z
    .string()
    .min(1, 'Nome do profissional é obrigatório')
    .max(100, 'Nome muito longo'),
});

// Validação para formulário de suporte
export const supportMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Mensagem é obrigatória')
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(2000, 'Mensagem muito longa'),
  
  category: z.enum([
    'technical',
    'billing',
    'account',
    'service',
    'other'
  ]).optional(),
});

// Validação para dados de pagamento
export const paymentSchema = z.object({
  amount: z
    .number()
    .min(0.01, 'Valor deve ser maior que zero')
    .max(10000, 'Valor muito alto'),
  
  service: z
    .string()
    .min(1, 'Serviço é obrigatório')
    .max(200, 'Nome do serviço muito longo'),
  
  professionalName: z
    .string()
    .min(1, 'Nome do profissional é obrigatório')
    .max(100, 'Nome muito longo'),
  
  paymentMethod: z.enum(['pix', 'credit_card', 'wayne_cash']),
});

// Tipos TypeScript derivados dos schemas
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type ChatMessageData = z.infer<typeof chatMessageSchema>;
export type SupportMessageData = z.infer<typeof supportMessageSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;

/**
 * Função utilitária para validar dados de forma segura
 * @param schema Schema de validação Zod
 * @param data Dados a serem validados
 * @returns Resultado da validação com dados ou erros
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
}

/**
 * Middleware de validação para APIs
 * @param schema Schema de validação
 * @returns Função middleware
 */
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>
) {
  return (data: unknown) => {
    const result = validateData(schema, data);
    
    if (!result.success) {
      throw new Error(`Dados inválidos: ${result.errors.join(', ')}`);
    }
    
    return result.data;
  };
}

/**
 * Sanitizar dados de entrada removendo campos não permitidos
 * @param data Dados de entrada
 * @param allowedFields Campos permitidos
 * @returns Dados sanitizados
 */
export function sanitizeInput(
  data: Record<string, any>,
  allowedFields: string[]
): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const field of allowedFields) {
    if (field in data) {
      sanitized[field] = data[field];
    }
  }
  
  return sanitized;
}

/**
 * Validar e sanitizar arquivos de upload
 * @param file Arquivo a ser validado
 * @param options Opções de validação
 * @returns Resultado da validação
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // em bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { success: true; file: File } | { success: false; error: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB por padrão
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  } = options;
  
  // Verificar tamanho
  if (file.size > maxSize) {
    return {
      success: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`
    };
  }
  
  // Verificar tipo MIME
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
    };
  }
  
  // Verificar extensão
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return {
      success: false,
      error: `Extensão não permitida. Extensões aceitas: ${allowedExtensions.join(', ')}`
    };
  }
  
  return { success: true, file };
}