/**
 * Utilitários para sanitização de conteúdo e prevenção de XSS
 */

// Fallback para quando DOMPurify não estiver disponível
function basicSanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza HTML removendo scripts maliciosos e tags perigosas
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: usar sanitização básica
    return basicSanitize(html);
  }
  
  try {
    // Tentar usar DOMPurify se disponível
    const DOMPurify = require('dompurify');
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'i', 'b',
        'ul', 'ol', 'li', 'a', 'img', 'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id'
      ],
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
  } catch (error) {
    console.warn('DOMPurify não disponível, usando sanitização básica:', error);
    return basicSanitize(html);
  }
}

/**
 * Sanitiza texto simples removendo caracteres perigosos
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/[<>"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    })
    .trim();
}

/**
 * Sanitiza URLs para prevenir javascript: e data: URLs maliciosos
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Bloquear protocolos perigosos
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:'
  ];
  
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return '';
    }
  }
  
  // Permitir apenas HTTP, HTTPS e URLs relativas
  if (trimmedUrl.startsWith('http://') || 
      trimmedUrl.startsWith('https://') || 
      trimmedUrl.startsWith('/') ||
      trimmedUrl.startsWith('./') ||
      trimmedUrl.startsWith('../')) {
    return url.trim();
  }
  
  // Se não começar com protocolo válido, assumir URL relativa
  if (!trimmedUrl.includes(':')) {
    return url.trim();
  }
  
  return '';
}

/**
 * Sanitiza atributos de imagem
 */
export function sanitizeImageProps(props: {
  src?: string;
  alt?: string;
  title?: string;
}): {
  src: string;
  alt: string;
  title?: string;
} {
  return {
    src: sanitizeUrl(props.src || ''),
    alt: sanitizeText(props.alt || ''),
    title: props.title ? sanitizeText(props.title) : undefined
  };
}

/**
 * Sanitiza propriedades de link
 */
export function sanitizeLinkProps(props: {
  href?: string;
  title?: string;
  children?: string;
}): {
  href: string;
  title?: string;
  children: string;
} {
  return {
    href: sanitizeUrl(props.href || ''),
    title: props.title ? sanitizeText(props.title) : undefined,
    children: sanitizeText(props.children || '')
  };
}

/**
 * Valida e sanitiza mensagens de chat
 */
export function sanitizeChatMessage(message: {
  text?: string;
  html?: string;
  sender?: string;
  timestamp?: string;
}): {
  text: string;
  html: string;
  sender: string;
  timestamp: string;
} {
  return {
    text: sanitizeText(message.text || ''),
    html: sanitizeHtml(message.html || message.text || ''),
    sender: sanitizeText(message.sender || 'Anônimo'),
    timestamp: sanitizeText(message.timestamp || new Date().toISOString())
  };
}

/**
 * Remove scripts inline e event handlers de strings HTML
 */
export function removeInlineScripts(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return html
    // Remover tags script
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    // Remover event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remover javascript: URLs
    .replace(/javascript:[^"']*/gi, '')
    // Remover data: URLs suspeitas
    .replace(/data:(?!image\/)[^"']*/gi, '');
}

/**
 * Configuração de sanitização para diferentes contextos
 */
export const SANITIZE_CONFIGS = {
  STRICT: {
    ALLOWED_TAGS: ['p', 'br'],
    ALLOWED_ATTR: [],
    FORBID_SCRIPT: true
  },
  BASIC: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'i'],
    ALLOWED_ATTR: [],
    FORBID_SCRIPT: true
  },
  RICH: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b',
      'ul', 'ol', 'li', 'a', 'img', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
    FORBID_SCRIPT: true
  }
} as const;