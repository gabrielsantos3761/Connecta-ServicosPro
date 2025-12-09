/**
 * Types para Sistema de Sessões e Refresh Tokens
 *
 * Este arquivo define os tipos para o sistema de gestão de sessões,
 * permitindo controle granular sobre tokens e dispositivos conectados.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Interface para uma sessão ativa de usuário
 * Armazenada na coleção 'sessions' do Firestore
 */
export interface UserSession {
  /** ID único da sessão */
  id: string;

  /** UID do usuário no Firebase Auth */
  userId: string;

  /** Identificador único do dispositivo */
  deviceId: string;

  /** User-Agent do navegador/dispositivo */
  userAgent: string;

  /** Endereço IP de origem (opcional, por privacidade) */
  ipAddress?: string;

  /** Hash do refresh token (NUNCA armazenar o token em texto plano) */
  refreshTokenHash: string;

  /** Role ativo no momento da criação da sessão */
  activeRole: string;

  /** Data de criação da sessão */
  createdAt: Timestamp | Date;

  /** Data de expiração (com sliding expiration) */
  expiresAt: Timestamp | Date;

  /** Última vez que a sessão foi usada (para sliding expiration) */
  lastUsedAt: Timestamp | Date;

  /** Data em que a sessão foi revogada (null se ativa) */
  revokedAt: Timestamp | Date | null;

  /** Se a sessão está ativa */
  isActive: boolean;

  /** Metadados adicionais do dispositivo */
  deviceMetadata?: {
    platform?: string;      // 'web', 'android', 'ios'
    browser?: string;       // 'chrome', 'firefox', etc.
    browserVersion?: string;
    os?: string;            // 'Windows', 'macOS', 'Linux', etc.
    deviceName?: string;    // Nome amigável do dispositivo
  };
}

/**
 * Payload para criar uma nova sessão
 */
export interface CreateSessionPayload {
  userId: string;
  deviceId: string;
  userAgent: string;
  ipAddress?: string;
  activeRole: string;
  deviceMetadata?: UserSession['deviceMetadata'];
}

/**
 * Resposta da criação de sessão
 */
export interface CreateSessionResponse {
  success: boolean;
  sessionId: string;
  refreshToken: string;      // Token para o cliente guardar
  accessToken: string;       // ID Token do Firebase
  expiresAt: Date;
  message: string;
}

/**
 * Payload para renovar sessão
 */
export interface RefreshSessionPayload {
  sessionId: string;
  refreshToken: string;
}

/**
 * Resposta da renovação de sessão
 */
export interface RefreshSessionResponse {
  success: boolean;
  accessToken: string;       // Novo ID Token do Firebase
  expiresAt: Date;           // Nova data de expiração (sliding)
  message: string;
}

/**
 * Payload para revogar sessão
 */
export interface RevokeSessionPayload {
  sessionId: string;
}

/**
 * Resposta da revogação de sessão
 */
export interface RevokeSessionResponse {
  success: boolean;
  message: string;
}

/**
 * Payload para revogar todas as sessões
 */
export interface RevokeAllSessionsPayload {
  userId: string;
  exceptSessionId?: string;  // Opcional: manter uma sessão ativa (a atual)
}

/**
 * Resposta da revogação de todas as sessões
 */
export interface RevokeAllSessionsResponse {
  success: boolean;
  revokedCount: number;
  message: string;
}

/**
 * Interface para listar sessões ativas
 */
export interface SessionListItem {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress?: string;
  createdAt: Date;
  lastUsedAt: Date;
  isCurrent: boolean;        // Se é a sessão atual
}

/**
 * Configurações de duração de sessão
 */
export interface SessionConfig {
  /** Duração do access token em milissegundos (padrão: 1 hora) */
  accessTokenDuration: number;

  /** Duração do refresh token em milissegundos (padrão: 90 dias) */
  refreshTokenDuration: number;

  /** Se deve usar sliding expiration (renova a cada uso) */
  useSlidingExpiration: boolean;

  /** Tempo antes da expiração para renovar automaticamente (padrão: 5 minutos) */
  autoRefreshThreshold: number;

  /** Número máximo de sessões ativas por usuário (0 = ilimitado) */
  maxSessionsPerUser: number;
}

/**
 * Configuração padrão de sessões
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  accessTokenDuration: 60 * 60 * 1000,           // 1 hora
  refreshTokenDuration: 90 * 24 * 60 * 60 * 1000, // 90 dias
  useSlidingExpiration: true,
  autoRefreshThreshold: 5 * 60 * 1000,           // 5 minutos
  maxSessionsPerUser: 5,                         // Máximo 5 dispositivos
};

/**
 * Estado do token
 */
export enum TokenStatus {
  VALID = 'valid',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  INVALID = 'invalid',
}

/**
 * Informações sobre o token atual
 */
export interface TokenInfo {
  status: TokenStatus;
  expiresAt: Date | null;
  expiresIn: number | null;  // Milissegundos até expirar
  needsRefresh: boolean;     // Se deve renovar
}
