/**
 * Sistema de Hierarquia de Roles
 *
 * Hierarquia (do maior para o menor):
 * Owner (Proprietário) > Professional (Profissional) > Client (Cliente)
 *
 * Cada nível superior herda automaticamente as permissões dos níveis inferiores:
 * - Owner tem acesso a tudo (owner + professional + client)
 * - Professional tem acesso a professional + client
 * - Client tem acesso apenas a client
 */

import type { UserRole } from '@/contexts/AuthContext';

/**
 * Mapa de hierarquia de roles
 * Quanto maior o número, maior o nível hierárquico
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  client: 1,
  professional: 2,
  owner: 3,
};

/**
 * Mapa de roles que cada nível herda (incluindo ele mesmo)
 */
const ROLE_INHERITANCE: Record<UserRole, UserRole[]> = {
  client: ['client'],
  professional: ['professional', 'client'],
  owner: ['owner', 'professional', 'client'],
};

/**
 * Verifica se um role tem permissão para acessar funcionalidades de outro role
 *
 * @param userRole - Role do usuário
 * @param requiredRole - Role necessário para acessar a funcionalidade
 * @returns true se o usuário tem permissão, false caso contrário
 *
 * @example
 * hasRolePermission('owner', 'client') // true - owner pode acessar recursos de client
 * hasRolePermission('professional', 'client') // true - professional pode acessar recursos de client
 * hasRolePermission('client', 'professional') // false - client NÃO pode acessar recursos de professional
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Retorna todos os roles que um usuário pode acessar (incluindo o próprio)
 *
 * @param userRole - Role do usuário
 * @returns Array de roles acessíveis
 *
 * @example
 * getAccessibleRoles('owner') // ['owner', 'professional', 'client']
 * getAccessibleRoles('professional') // ['professional', 'client']
 * getAccessibleRoles('client') // ['client']
 */
export function getAccessibleRoles(userRole: UserRole): UserRole[] {
  return ROLE_INHERITANCE[userRole];
}

/**
 * Verifica se o usuário tem permissão para acessar uma rota específica
 *
 * @param userRole - Role do usuário
 * @param routeRole - Role necessário para acessar a rota
 * @returns true se o usuário pode acessar, false caso contrário
 */
export function canAccessRoute(userRole: UserRole, routeRole: UserRole): boolean {
  return hasRolePermission(userRole, routeRole);
}

/**
 * Retorna o role mais alto que o usuário possui
 * Útil para determinar o nível de acesso padrão
 *
 * @param roles - Array de roles do usuário
 * @returns Role com maior hierarquia
 *
 * @example
 * getHighestRole(['client', 'professional']) // 'professional'
 * getHighestRole(['client', 'owner']) // 'owner'
 */
export function getHighestRole(roles: UserRole[]): UserRole {
  return roles.reduce((highest, current) => {
    return ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest;
  }, roles[0]);
}

/**
 * Verifica se um role é superior a outro na hierarquia
 *
 * @param role1 - Primeiro role
 * @param role2 - Segundo role
 * @returns true se role1 é superior a role2
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Retorna uma mensagem descritiva sobre as permissões do role
 *
 * @param userRole - Role do usuário
 * @returns Descrição das permissões
 */
export function getRolePermissionDescription(userRole: UserRole): string {
  const accessible = getAccessibleRoles(userRole);

  if (userRole === 'owner') {
    return 'Acesso total: Proprietário, Profissional e Cliente';
  } else if (userRole === 'professional') {
    return 'Acesso: Profissional e Cliente';
  } else {
    return 'Acesso: Cliente';
  }
}

/**
 * Filtra uma lista de itens baseado na hierarquia de roles
 * Útil para mostrar apenas opções acessíveis ao usuário
 *
 * @param items - Lista de itens com role
 * @param userRole - Role do usuário
 * @returns Lista filtrada de itens acessíveis
 */
export function filterByRoleAccess<T extends { role: UserRole }>(
  items: T[],
  userRole: UserRole
): T[] {
  return items.filter(item => hasRolePermission(userRole, item.role));
}
