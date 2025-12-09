/**
 * Auth Session Integration
 *
 * Este módulo integra o sistema de autenticação tradicional (authService)
 * com o novo sistema de gestão de sessões (sessionService).
 *
 * Funções wrapper que combinam login + criação de sessão
 */

import type { UserProfile, UserRole } from './authService';
import {
  loginWithEmail as authLoginWithEmail,
  loginWithGoogle as authLoginWithGoogle,
  loginWithFacebook as authLoginWithFacebook,
  logout as authLogout,
} from './authService';
import {
  createSession,
  revokeCurrentSession,
  startAutoRefresh,
} from './sessionService';

/**
 * Login com Email + Criação de Sessão
 *
 * @param email Email do usuário
 * @param password Senha do usuário
 * @param role Role esperado
 * @returns Perfil do usuário autenticado
 */
export async function loginWithEmail(
  email: string,
  password: string,
  role: UserRole
): Promise<UserProfile> {
  console.log('[authSessionIntegration] Iniciando login com email...');

  try {
    // 1. Fazer login tradicional (Firebase Auth)
    const userProfile = await authLoginWithEmail(email, password, role);

    console.log('[authSessionIntegration] Login bem-sucedido, criando sessão...');

    // 2. Criar sessão no backend
    try {
      await createSession(userProfile.uid, userProfile.activeRole);
      console.log('[authSessionIntegration] Sessão criada com sucesso');
    } catch (sessionError: any) {
      console.error('[authSessionIntegration] Erro ao criar sessão:', sessionError);
      // Não falha o login se a criação da sessão falhar
      // O usuário ainda está autenticado no Firebase Auth
      console.warn('[authSessionIntegration] Login concluído sem sessão gerenciada');
    }

    return userProfile;
  } catch (error: any) {
    console.error('[authSessionIntegration] Erro no login:', error);
    throw error;
  }
}

/**
 * Login com Google + Criação de Sessão
 *
 * @param role Role desejado
 * @returns Perfil do usuário autenticado
 */
export async function loginWithGoogle(role: UserRole): Promise<UserProfile> {
  console.log('[authSessionIntegration] Iniciando login com Google...');

  try {
    // 1. Fazer login tradicional (Firebase Auth)
    const userProfile = await authLoginWithGoogle(role);

    console.log('[authSessionIntegration] Login bem-sucedido, criando sessão...');

    // 2. Criar sessão no backend
    try {
      await createSession(userProfile.uid, userProfile.activeRole);
      console.log('[authSessionIntegration] Sessão criada com sucesso');
    } catch (sessionError: any) {
      console.error('[authSessionIntegration] Erro ao criar sessão:', sessionError);
      // Não falha o login se a criação da sessão falhar
      console.warn('[authSessionIntegration] Login concluído sem sessão gerenciada');
    }

    return userProfile;
  } catch (error: any) {
    console.error('[authSessionIntegration] Erro no login com Google:', error);
    throw error;
  }
}

/**
 * Login com Facebook + Criação de Sessão
 *
 * @param role Role desejado
 * @returns Perfil do usuário autenticado
 */
export async function loginWithFacebook(role: UserRole): Promise<UserProfile> {
  console.log('[authSessionIntegration] Iniciando login com Facebook...');

  try {
    // 1. Fazer login tradicional (Firebase Auth)
    const userProfile = await authLoginWithFacebook(role);

    console.log('[authSessionIntegration] Login bem-sucedido, criando sessão...');

    // 2. Criar sessão no backend
    try {
      await createSession(userProfile.uid, userProfile.activeRole);
      console.log('[authSessionIntegration] Sessão criada com sucesso');
    } catch (sessionError: any) {
      console.error('[authSessionIntegration] Erro ao criar sessão:', sessionError);
      // Não falha o login se a criação da sessão falhar
      console.warn('[authSessionIntegration] Login concluído sem sessão gerenciada');
    }

    return userProfile;
  } catch (error: any) {
    console.error('[authSessionIntegration] Erro no login com Facebook:', error);
    throw error;
  }
}

/**
 * Logout + Revogação de Sessão
 *
 * Faz logout do Firebase Auth e revoga a sessão no backend
 */
export async function logout(): Promise<void> {
  console.log('[authSessionIntegration] Iniciando logout...');

  try {
    // 1. Revogar sessão no backend (se existir)
    try {
      await revokeCurrentSession();
      console.log('[authSessionIntegration] Sessão revogada no backend');
    } catch (sessionError: any) {
      console.error('[authSessionIntegration] Erro ao revogar sessão:', sessionError);
      // Continua com o logout mesmo se a revogação falhar
    }

    // 2. Fazer logout do Firebase Auth
    await authLogout();

    console.log('[authSessionIntegration] Logout concluído com sucesso');
  } catch (error: any) {
    console.error('[authSessionIntegration] Erro no logout:', error);
    throw error;
  }
}

/**
 * Inicia o monitoramento automático de renovação de tokens
 *
 * @param onRefreshError Callback chamado em caso de erro na renovação
 * @returns Função para parar o monitoramento
 */
export function startSessionMonitoring(
  onRefreshError?: (error: Error) => void
): () => void {
  console.log('[authSessionIntegration] Iniciando monitoramento de sessão');

  return startAutoRefresh(onRefreshError);
}

/**
 * Re-exporta funções úteis do sessionService para conveniência
 */
export {
  refreshSession,
  listActiveSessions,
  revokeAllSessions,
  validateCurrentSession,
  hasActiveSession,
  getCurrentSessionId,
  getTokenInfo,
} from './sessionService';
