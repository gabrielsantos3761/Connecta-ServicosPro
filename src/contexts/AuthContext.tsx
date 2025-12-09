import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getUserProfile,
  switchActiveRole,
  addRoleToUser,
  onAuthStateChange,
  type UserProfile
} from '@/services/authService'
import {
  loginWithEmail,
  loginWithGoogle,
  loginWithFacebook,
  logout as sessionLogout,
  startSessionMonitoring,
} from '@/services/authSessionIntegration'
import {
  hasRolePermission,
  getAccessibleRoles,
  canAccessRoute,
  getHighestRole,
  getRolePermissionDescription,
} from '@/utils/roleHierarchy'

export type UserRole = 'owner' | 'client' | 'professional'

export interface User {
  id: string
  name: string
  email: string
  roles: UserRole[] // Array de roles que o usuário possui
  activeRole: UserRole // Role ativo no momento
  avatar?: string
  coverPhoto?: string
  // Campos específicos
  phone?: string
  cpf?: string
  gender?: string
  birthDate?: string
  // Campos de completude do perfil
  profileComplete?: boolean
  missingFields?: string[]
  profileCompleteness?: number
  // Aliases para compatibilidade com UserProfile
  uid: string // Alias para id
  displayName: string // Alias para name
  createdAt?: any
  updatedAt?: any
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, role: UserRole) => Promise<void>
  loginWithGoogle: (role: UserRole) => Promise<void>
  loginWithFacebook: (role: UserRole) => Promise<void>
  logout: () => void
  switchRole: (newRole: UserRole) => Promise<void>
  addRole: (newRole: UserRole, cnpj?: string) => Promise<void>
  hasRole: (role: UserRole) => boolean
  refreshUser: () => Promise<void>
  isLoading: boolean
  // Funções de hierarquia de roles
  hasPermission: (requiredRole: UserRole) => boolean
  canAccess: (requiredRole: UserRole) => boolean
  getAccessibleRoles: () => UserRole[]
  getPermissionDescription: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Converte UserProfile do Firebase para User do contexto
function profileToUser(profile: UserProfile): User {
  return {
    id: profile.uid,
    name: profile.displayName,
    email: profile.email,
    roles: profile.roles,
    activeRole: profile.activeRole,
    avatar: profile.photoURL,
    coverPhoto: profile.coverPhotoURL,
    phone: profile.phone,
    cpf: profile.cpf,
    gender: profile.gender,
    birthDate: profile.birthDate,
    profileComplete: profile.profileComplete,
    missingFields: profile.missingFields,
    profileCompleteness: profile.profileCompleteness,
    // Aliases para compatibilidade
    uid: profile.uid,
    displayName: profile.displayName,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Monitorar estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário autenticado - buscar perfil completo
        console.log('[AuthContext] Usuário autenticado:', firebaseUser.uid)

        try {
          // Aguardar um pouco para garantir que o token está disponível
          await new Promise(resolve => setTimeout(resolve, 500))

          // Tentar buscar o perfil com retry (para lidar com race condition durante registro)
          // Retries: 5 tentativas, delay inicial: 1s, delay máximo: 5s
          // Isso dá tempo para a Cloud Function criar o perfil durante o registro
          const profile = await getUserProfile(firebaseUser.uid, {
            retries: 5,
            initialDelay: 1000,
            maxDelay: 5000
          })

          if (profile) {
            console.log('[AuthContext] Perfil carregado com sucesso')
            setUser(profileToUser(profile))
          } else {
            console.warn('[AuthContext] Perfil não encontrado após todas as tentativas')
            // Perfil não encontrado - fazer logout
            await sessionLogout()
            setUser(null)
          }
        } catch (error) {
          console.error('[AuthContext] Erro ao buscar perfil do usuário:', error)
          // Se erro ao buscar perfil, fazer logout
          await sessionLogout()
          setUser(null)
        }
      } else {
        console.log('[AuthContext] Usuário não autenticado')
        // Usuário não autenticado
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Iniciar monitoramento de renovação automática de tokens
  useEffect(() => {
    if (user) {
      console.log('[AuthContext] Iniciando monitoramento de sessão para:', user.id)

      const stopMonitoring = startSessionMonitoring((error) => {
        console.error('[AuthContext] Erro na renovação automática de token:', error)

        // Se o erro indica que a sessão expirou, fazer logout
        if (error.message.includes('Sessão') || error.message.includes('expirada')) {
          console.warn('[AuthContext] Sessão expirada, fazendo logout...')
          logout()
        }
      })

      // Limpar ao desmontar ou quando usuário mudar
      return () => {
        console.log('[AuthContext] Parando monitoramento de sessão')
        stopMonitoring()
      }
    }
  }, [user])

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true)

    try {
      const profile = await loginWithEmail(email, password, role)
      const userData = profileToUser(profile)
      setUser(userData)

      // Navegação baseada no role ativo
      if (profile.activeRole === 'owner') {
        navigate('/selecionar-empresa')
      } else if (profile.activeRole === 'professional') {
        navigate('/profissional/associar-barbearia')
      } else {
        navigate('/')
      }
    } catch (error: any) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async (role: UserRole) => {
    console.log('🚀 [AuthContext] handleGoogleLogin iniciado. Role solicitado:', role)
    setIsLoading(true)

    try {
      console.log('📝 [AuthContext] Chamando loginWithGoogle...')
      const profile = await loginWithGoogle(role)
      console.log('✅ [AuthContext] loginWithGoogle retornou:', profile)

      const userData = profileToUser(profile)
      console.log('📊 [AuthContext] userData convertido:', userData)

      setUser(userData)
      console.log('✅ [AuthContext] Estado do usuário atualizado')

      // Navegação baseada no role ativo
      console.log('🧭 [AuthContext] Determinando navegação. activeRole:', profile.activeRole)

      if (profile.activeRole === 'owner') {
        console.log('➡️ [AuthContext] Navegando para /selecionar-empresa')
        navigate('/selecionar-empresa')
      } else if (profile.activeRole === 'professional') {
        console.log('➡️ [AuthContext] Navegando para /profissional/associar-barbearia')
        navigate('/profissional/associar-barbearia')
      } else {
        console.log('➡️ [AuthContext] Navegando para / (home)')
        navigate('/')
      }

      console.log('✅ [AuthContext] handleGoogleLogin concluído com sucesso')
    } catch (error: any) {
      console.error('❌ [AuthContext] Erro no handleGoogleLogin:', error)
      console.error('❌ [AuthContext] Mensagem do erro:', error.message)
      console.error('❌ [AuthContext] Stack do erro:', error.stack)
      throw error
    } finally {
      console.log('🏁 [AuthContext] handleGoogleLogin finalizado. isLoading = false')
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async (role: UserRole) => {
    console.log('🚀 [AuthContext] handleFacebookLogin iniciado. Role solicitado:', role)
    setIsLoading(true)

    try {
      console.log('📝 [AuthContext] Chamando loginWithFacebook...')
      const profile = await loginWithFacebook(role)
      console.log('✅ [AuthContext] loginWithFacebook retornou:', profile)

      const userData = profileToUser(profile)
      console.log('📊 [AuthContext] userData convertido:', userData)

      setUser(userData)
      console.log('✅ [AuthContext] Estado do usuário atualizado')

      // Navegação baseada no role ativo
      console.log('🧭 [AuthContext] Determinando navegação. activeRole:', profile.activeRole)

      if (profile.activeRole === 'owner') {
        console.log('➡️ [AuthContext] Navegando para /selecionar-empresa')
        navigate('/selecionar-empresa')
      } else if (profile.activeRole === 'professional') {
        console.log('➡️ [AuthContext] Navegando para /profissional/associar-barbearia')
        navigate('/profissional/associar-barbearia')
      } else {
        console.log('➡️ [AuthContext] Navegando para / (home)')
        navigate('/')
      }

      console.log('✅ [AuthContext] handleFacebookLogin concluído com sucesso')
    } catch (error: any) {
      console.error('❌ [AuthContext] Erro no handleFacebookLogin:', error)
      console.error('❌ [AuthContext] Mensagem do erro:', error.message)
      console.error('❌ [AuthContext] Stack do erro:', error.stack)
      throw error
    } finally {
      console.log('🏁 [AuthContext] handleFacebookLogin finalizado. isLoading = false')
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Usar o logout integrado que revoga a sessão
      await sessionLogout()
      setUser(null)

      // SEGURANÇA: Limpar todos os dados locais
      // Limpa localStorage (exceto configurações do tema e device ID)
      const keysToKeep = ['theme', 'language', 'barber_device_id']
      const storage = { ...localStorage }

      Object.keys(storage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key)
        }
      })

      // Limpa sessionStorage
      sessionStorage.clear()

      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Alterna entre roles existentes
  const switchRole = async (newRole: UserRole) => {
    if (!user) throw new Error('Usuário não autenticado')

    // Verifica se o usuário possui esse role
    if (!user.roles.includes(newRole)) {
      throw new Error(`Você não possui o perfil de ${newRole}`)
    }

    try {
      await switchActiveRole(user.id, newRole)

      // Atualiza o estado local
      const updatedProfile = await getUserProfile(user.id)
      if (updatedProfile) {
        setUser(profileToUser(updatedProfile))

        // Navega para a página apropriada
        if (newRole === 'owner') {
          navigate('/selecionar-empresa')
        } else if (newRole === 'professional') {
          navigate('/profissional/associar-barbearia')
        } else {
          navigate('/')
        }
      }
    } catch (error) {
      console.error('Erro ao alternar role:', error)
      throw error
    }
  }

  // Adiciona um novo role ao usuário
  const addRole = async (newRole: UserRole, cnpj?: string) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      await addRoleToUser(user.id, newRole, cnpj)

      // Atualiza o estado local
      const updatedProfile = await getUserProfile(user.id)
      if (updatedProfile) {
        setUser(profileToUser(updatedProfile))
      }
    } catch (error) {
      console.error('Erro ao adicionar role:', error)
      throw error
    }
  }

  // Verifica se o usuário possui um determinado role
  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) || false
  }

  // Atualiza os dados do usuário
  const refreshUser = async () => {
    if (!user) return

    try {
      const updatedProfile = await getUserProfile(user.id)
      if (updatedProfile) {
        setUser(profileToUser(updatedProfile))
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle: handleGoogleLogin,
        loginWithFacebook: handleFacebookLogin,
        logout,
        switchRole,
        addRole,
        hasRole,
        refreshUser,
        isLoading,
        // Funções de hierarquia de roles
        hasPermission: (requiredRole: UserRole) => {
          if (!user) return false;
          return hasRolePermission(user.activeRole, requiredRole);
        },
        canAccess: (requiredRole: UserRole) => {
          if (!user) return false;
          return canAccessRoute(user.activeRole, requiredRole);
        },
        getAccessibleRoles: () => {
          if (!user) return [];
          return getAccessibleRoles(user.activeRole);
        },
        getPermissionDescription: () => {
          if (!user) return 'Não autenticado';
          return getRolePermissionDescription(user.activeRole);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
