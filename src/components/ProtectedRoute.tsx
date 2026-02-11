import { Navigate } from 'react-router-dom'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import { hasRolePermission } from '@/utils/roleHierarchy'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user) {
    // Verificação hierárquica: owner acessa tudo, professional acessa professional + client
    const hasAccess = allowedRoles.some(role => hasRolePermission(user.activeRole, role))

    if (!hasAccess) {
      if (user.activeRole === 'client') {
        return <Navigate to="/cliente" replace />
      }
      if (user.activeRole === 'professional') {
        return <Navigate to="/profissional" replace />
      }
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
