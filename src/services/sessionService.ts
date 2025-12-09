/**
 * Session Service - Gestão de Sessões e Refresh Tokens
 *
 * Este serviço gerencia sessões de usuário, incluindo:
 * - Criação de sessões após login
 * - Renovação automática de tokens
 * - Revogação de sessões (logout)
 * - Listagem de dispositivos conectados
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type {
  CreateSessionPayload,
  CreateSessionResponse,
  RefreshSessionPayload,
  RefreshSessionResponse,
  RevokeSessionPayload,
  RevokeSessionResponse,
  RevokeAllSessionsPayload,
  RevokeAllSessionsResponse,
  SessionListItem,
  TokenInfo,
} from '@/types/session';
import { TokenStatus } from '@/types/session';

// Chaves do localStorage
const STORAGE_KEYS = {
  SESSION_ID: 'barber_session_id',
  REFRESH_TOKEN: 'barber_refresh_token',
  TOKEN_EXPIRES_AT: 'barber_token_expires_at',
  DEVICE_ID: 'barber_device_id',
} as const;

// Inicializar Functions
const functions = getFunctions(undefined, 'southamerica-east1');

// Cloud Functions
const createSessionFn = httpsCallable<any, CreateSessionResponse>(functions, 'createSession');
const refreshSessionFn = httpsCallable<RefreshSessionPayload, RefreshSessionResponse>(functions, 'refreshSession');
const revokeSessionFn = httpsCallable<RevokeSessionPayload, RevokeSessionResponse>(functions, 'revokeSession');
const revokeAllSessionsFn = httpsCallable<RevokeAllSessionsPayload, RevokeAllSessionsResponse>(functions, 'revokeAllSessions');
const listActiveSessionsFn = httpsCallable<{ currentSessionId?: string }, { success: boolean; sessions: SessionListItem[]; total: number }>(functions, 'listActiveSessions');
const validateSessionFn = httpsCallable<{ sessionId: string }, { valid: boolean; reason?: string; expiresAt?: string; lastUsedAt?: string }>(functions, 'validateSession');

/**
 * Gera ou recupera um Device ID único para este dispositivo
 */
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);

  if (!deviceId) {
    // Gerar um ID único baseado em timestamp + random
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }

  return deviceId;
}

/**
 * Obtém informações do User-Agent atual
 */
function getUserAgent(): string {
  return navigator.userAgent;
}

/**
 * Obtém o IP do usuário (simulado - em produção você usaria uma API)
 * Nota: Por privacidade, isso é opcional
 */
function getIpAddress(): string | undefined {
  // Em produção, você pode usar um serviço como ipify.org
  // Por enquanto, retorna undefined
  return undefined;
}

/**
 * Cria uma nova sessão após login bem-sucedido
 */
export async function createSession(
  uid: string,
  activeRole: string
): Promise<{ sessionId: string; accessToken: string }> {
  try {
    console.log('[sessionService] Criando nova sessão para usuário:', uid);

    const deviceId = getOrCreateDeviceId();
    const userAgent = getUserAgent();
    const ipAddress = getIpAddress();

    const payload = {
      uid,
      deviceId,
      userAgent,
      ipAddress,
      activeRole,
    };

    const result = await createSessionFn(payload);

    if (!result.data.success) {
      throw new Error(result.data.message || 'Erro ao criar sessão');
    }

    const { sessionId, refreshToken, accessToken, expiresAt } = result.data;

    // Guardar no localStorage
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt);

    console.log('[sessionService] Sessão criada com sucesso:', sessionId);

    // Fazer login com o custom token
    await signInWithCustomToken(auth, accessToken);

    return { sessionId, accessToken };
  } catch (error: any) {
    console.error('[sessionService] Erro ao criar sessão:', error);
    throw new Error(error.message || 'Erro ao criar sessão');
  }
}

/**
 * Renova o access token usando o refresh token
 */
export async function refreshSession(): Promise<{ accessToken: string }> {
  try {
    const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!sessionId || !refreshToken) {
      throw new Error('Sessão não encontrada. Faça login novamente.');
    }

    console.log('[sessionService] Renovando sessão:', sessionId);

    const result = await refreshSessionFn({ sessionId, refreshToken });

    if (!result.data.success) {
      throw new Error(result.data.message || 'Erro ao renovar sessão');
    }

    const { accessToken, expiresAt } = result.data;

    // Atualizar expiração no localStorage
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt);

    console.log('[sessionService] Sessão renovada com sucesso');

    // Fazer login com o novo custom token
    await signInWithCustomToken(auth, accessToken);

    return { accessToken };
  } catch (error: any) {
    console.error('[sessionService] Erro ao renovar sessão:', error);

    // Se erro de autenticação, limpar sessão local
    if (error.message?.includes('Sessão') || error.message?.includes('Token')) {
      clearSession();
    }

    throw new Error(error.message || 'Erro ao renovar sessão');
  }
}

/**
 * Revoga a sessão atual (logout)
 */
export async function revokeCurrentSession(): Promise<void> {
  try {
    const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

    if (!sessionId) {
      console.warn('[sessionService] Nenhuma sessão ativa para revogar');
      return;
    }

    console.log('[sessionService] Revogando sessão:', sessionId);

    try {
      await revokeSessionFn({ sessionId });
      console.log('[sessionService] Sessão revogada com sucesso');
    } catch (error) {
      console.error('[sessionService] Erro ao revogar sessão no backend:', error);
      // Continua mesmo se falhar, para garantir logout local
    }

    // Limpar dados locais
    clearSession();
  } catch (error: any) {
    console.error('[sessionService] Erro ao revogar sessão:', error);
    // Limpar dados locais mesmo em caso de erro
    clearSession();
    throw new Error(error.message || 'Erro ao fazer logout');
  }
}

/**
 * Revoga todas as sessões do usuário (logout de todos os dispositivos)
 */
export async function revokeAllSessions(exceptCurrent: boolean = false): Promise<number> {
  try {
    const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

    console.log('[sessionService] Revogando todas as sessões...');

    const result = await revokeAllSessionsFn({
      userId: auth.currentUser?.uid || '',
      exceptSessionId: exceptCurrent ? sessionId || undefined : undefined,
    });

    if (!result.data.success) {
      throw new Error(result.data.message || 'Erro ao revogar sessões');
    }

    const { revokedCount } = result.data;

    console.log(`[sessionService] ${revokedCount} sessões revogadas`);

    // Se não manteve a sessão atual, limpar dados locais
    if (!exceptCurrent) {
      clearSession();
    }

    return revokedCount;
  } catch (error: any) {
    console.error('[sessionService] Erro ao revogar todas as sessões:', error);
    throw new Error(error.message || 'Erro ao revogar sessões');
  }
}

/**
 * Lista todas as sessões ativas do usuário
 */
export async function listActiveSessions(): Promise<SessionListItem[]> {
  try {
    const currentSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

    console.log('[sessionService] Listando sessões ativas...');

    const result = await listActiveSessionsFn({ currentSessionId: currentSessionId || undefined });

    if (!result.data.success) {
      throw new Error('Erro ao listar sessões');
    }

    const { sessions } = result.data;

    console.log(`[sessionService] ${sessions.length} sessões ativas encontradas`);

    return sessions;
  } catch (error: any) {
    console.error('[sessionService] Erro ao listar sessões:', error);
    throw new Error(error.message || 'Erro ao listar sessões');
  }
}

/**
 * Valida se a sessão atual ainda é válida
 */
export async function validateCurrentSession(): Promise<boolean> {
  try {
    const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

    if (!sessionId) {
      return false;
    }

    const result = await validateSessionFn({ sessionId });

    if (!result.data.valid) {
      console.warn('[sessionService] Sessão inválida:', result.data.reason);
      clearSession();
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[sessionService] Erro ao validar sessão:', error);
    clearSession();
    return false;
  }
}

/**
 * Obtém informações sobre o token atual
 */
export function getTokenInfo(): TokenInfo {
  const expiresAtStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

  if (!expiresAtStr || !sessionId) {
    return {
      status: TokenStatus.INVALID,
      expiresAt: null,
      expiresIn: null,
      needsRefresh: true,
    };
  }

  const expiresAt = new Date(expiresAtStr);
  const now = new Date();
  const expiresIn = expiresAt.getTime() - now.getTime();

  if (expiresIn <= 0) {
    return {
      status: TokenStatus.EXPIRED,
      expiresAt,
      expiresIn: 0,
      needsRefresh: true,
    };
  }

  // Se falta menos de 5 minutos para expirar, precisa renovar
  const FIVE_MINUTES = 5 * 60 * 1000;
  const needsRefresh = expiresIn <= FIVE_MINUTES;

  return {
    status: TokenStatus.VALID,
    expiresAt,
    expiresIn,
    needsRefresh,
  };
}

/**
 * Verifica se tem sessão ativa
 */
export function hasActiveSession(): boolean {
  const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  return !!(sessionId && refreshToken);
}

/**
 * Obtém o ID da sessão atual
 */
export function getCurrentSessionId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.SESSION_ID);
}

/**
 * Limpa todos os dados da sessão do localStorage
 */
export function clearSession(): void {
  console.log('[sessionService] Limpando dados da sessão');

  localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);

  // Não remove DEVICE_ID, para manter consistência entre sessões
}

/**
 * Inicia o processo de renovação automática de tokens
 * Retorna uma função para cancelar o intervalo
 */
export function startAutoRefresh(onRefreshError?: (error: Error) => void): () => void {
  console.log('[sessionService] Iniciando renovação automática de tokens');

  // Verificar a cada 1 minuto
  const intervalId = setInterval(async () => {
    const tokenInfo = getTokenInfo();

    if (tokenInfo.needsRefresh && tokenInfo.status !== TokenStatus.INVALID) {
      console.log('[sessionService] Token precisa ser renovado automaticamente');

      try {
        await refreshSession();
        console.log('[sessionService] Token renovado automaticamente com sucesso');
      } catch (error: any) {
        console.error('[sessionService] Erro na renovação automática:', error);
        if (onRefreshError) {
          onRefreshError(error);
        }
      }
    }
  }, 60 * 1000); // 1 minuto

  // Retorna função para cancelar
  return () => {
    console.log('[sessionService] Parando renovação automática de tokens');
    clearInterval(intervalId);
  };
}
