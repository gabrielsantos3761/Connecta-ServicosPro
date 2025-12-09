/**
 * Componente para proteger conteúdo baseado em hierarquia de roles
 *
 * Este componente usa o sistema hierárquico onde:
 * - Owner pode ver conteúdo de owner, professional e client
 * - Professional pode ver conteúdo de professional e client
 * - Client pode ver apenas conteúdo de client
 */

import { ReactNode } from 'react';
import { useAuth, type UserRole } from '@/contexts/AuthContext';

interface ProtectedContentProps {
  /** Role mínimo necessário para ver o conteúdo */
  requiredRole: UserRole;
  /** Conteúdo a ser exibido se o usuário tiver permissão */
  children: ReactNode;
  /** Conteúdo alternativo se o usuário NÃO tiver permissão (opcional) */
  fallback?: ReactNode;
}

/**
 * Componente que renderiza conteúdo apenas se o usuário tiver a permissão necessária
 *
 * @example
 * ```tsx
 * // Owner e Professional podem ver, Client não
 * <ProtectedContent requiredRole="professional">
 *   <button>Gerenciar Agenda</button>
 * </ProtectedContent>
 *
 * // Apenas Owner pode ver
 * <ProtectedContent requiredRole="owner">
 *   <button>Painel Administrativo</button>
 * </ProtectedContent>
 *
 * // Todos podem ver (client é o nível mais baixo)
 * <ProtectedContent requiredRole="client">
 *   <button>Meu Perfil</button>
 * </ProtectedContent>
 * ```
 */
export function ProtectedContent({ requiredRole, children, fallback = null }: ProtectedContentProps) {
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão baseado na hierarquia
  const canView = hasPermission(requiredRole);

  return canView ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook customizado para verificar permissões em componentes
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const canManageSchedule = useHasPermission('professional');
 *
 *   return (
 *     <div>
 *       {canManageSchedule && <button>Gerenciar Agenda</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useHasPermission(requiredRole: UserRole): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(requiredRole);
}

/**
 * HOC (Higher-Order Component) para proteger páginas inteiras
 *
 * @example
 * ```tsx
 * // Página acessível apenas para Professional e Owner
 * export default withRoleProtection(SchedulePage, 'professional');
 *
 * // Página acessível apenas para Owner
 * export default withRoleProtection(AdminPage, 'owner');
 * ```
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole,
  FallbackComponent?: React.ComponentType
) {
  return function ProtectedComponent(props: P) {
    const { hasPermission } = useAuth();

    if (!hasPermission(requiredRole)) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
