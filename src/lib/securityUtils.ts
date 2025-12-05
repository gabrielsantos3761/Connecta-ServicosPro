/**
 * Utilitários de Segurança para o Frontend
 *
 * IMPORTANTE:
 * - Sanitiza dados do usuário antes de enviar ao backend
 * - Valida formatos de entrada
 * - Previne XSS e injection attacks
 * - NUNCA confie apenas na validação do frontend
 */

/**
 * Sanitiza string removendo caracteres perigosos
 * Previne XSS e outros ataques de injeção
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';

  return str
    .replace(/[<>]/g, '') // Remove tags HTML
    .replace(/['"]/g, '') // Remove aspas que podem quebrar queries
    .replace(/[{}]/g, '') // Remove chaves
    .trim()
    .substring(0, 1000); // Limita tamanho máximo
}

/**
 * Sanitiza HTML para prevenir XSS
 * Remove todos os elementos HTML perigosos
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida senha
 * Mínimo 8 caracteres, pelo menos uma letra e um número
 */
export function isValidPassword(password: string): boolean {
  if (typeof password !== 'string') return false;

  // Mínimo 8 caracteres
  if (password.length < 8) return false;

  // Pelo menos uma letra
  if (!/[a-zA-Z]/.test(password)) return false;

  // Pelo menos um número
  if (!/[0-9]/.test(password)) return false;

  return true;
}

/**
 * Valida força da senha
 * Retorna: 'weak', 'medium', 'strong'
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (!password || password.length < 8) return 'weak';

  let strength = 0;

  // Comprimento
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;

  // Letras maiúsculas e minúsculas
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;

  // Números
  if (/[0-9]/.test(password)) strength += 1;

  // Caracteres especiais
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
}

/**
 * Valida CPF (formato e dígitos verificadores)
 */
export function isValidCPF(cpf: string): boolean {
  if (typeof cpf !== 'string') return false;

  // Remove formatação
  const cleanCPF = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;

  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;

  if (parseInt(cleanCPF.charAt(10)) !== secondDigit) return false;

  return true;
}

/**
 * Valida CNPJ (formato e dígitos verificadores)
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (typeof cnpj !== 'string') return false;

  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Validação dos dígitos verificadores
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Valida telefone
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') return false;

  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

/**
 * Valida URL
 */
export function isValidURL(url: string): boolean {
  if (typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    // Apenas HTTPS permitido para URLs externas
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Valida tamanho de string
 */
export function isValidStringLength(str: string, min: number, max: number): boolean {
  if (typeof str !== 'string') return false;
  return str.length >= min && str.length <= max;
}

/**
 * Escapa caracteres especiais de regex
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove espaços extras e normaliza string
 */
export function normalizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Limpa dados do localStorage no logout
 * IMPORTANTE: Sempre limpar dados sensíveis ao fazer logout
 */
export function clearLocalData(): void {
  // Limpa localStorage (exceto configurações do tema, etc)
  const keysToKeep = ['theme', 'language'];
  const storage = { ...localStorage };

  Object.keys(storage).forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // Limpa sessionStorage completamente
  sessionStorage.clear();

  // Limpa cookies de sessão (se houver)
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  });
}

/**
 * Detecta tentativas de SQL injection em strings
 * Retorna true se detectar padrões suspeitos
 */
export function detectSQLInjection(str: string): boolean {
  if (typeof str !== 'string') return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(--|\;|\/\*|\*\/)/,
    /(\bOR\b.*=.*|1=1|'=')/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(str));
}

/**
 * Detecta tentativas de XSS em strings
 * Retorna true se detectar padrões suspeitos
 */
export function detectXSS(str: string): boolean {
  if (typeof str !== 'string') return false;

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onerror=, onclick=, etc
    /<iframe/gi,
    /eval\(/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(str));
}

/**
 * Valida objeto completo contra schema
 */
export function validateSchema<T>(data: unknown, schema: {
  [K in keyof T]: (value: unknown) => boolean;
}): data is T {
  if (typeof data !== 'object' || data === null) return false;

  const dataObj = data as Record<string, unknown>;

  return Object.entries(schema).every(([key, validator]) => {
    return validator(dataObj[key]);
  });
}

/**
 * Throttle para prevenir spam de requisições
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Debounce para atrasar execução
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
