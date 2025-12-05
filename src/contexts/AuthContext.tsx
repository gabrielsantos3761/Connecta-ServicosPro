import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loginWithEmail,
  loginWithGoogle,
  loginWithFacebook,
  logout as firebaseLogout,
  onAuthStateChange,
  getUserProfile,
  switchActiveRole,
  addRoleToUser,
  type UserProfile
} from '@/services/authService'

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
  isLoading: boolean
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
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          if (profile) {
            setUser(profileToUser(profile))
          } else {
            // Perfil não encontrado - fazer logout
            await firebaseLogout()
            setUser(null)
          }
        } catch (error) {
          console.error('Erro ao buscar perfil do usuário:', error)
          // Se erro ao buscar perfil, fazer logout
          await firebaseLogout()
          setUser(null)
        }
      } else {
        // Usuário não autenticado
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
    setIsLoading(true)

    try {
      const profile = await loginWithGoogle(role)
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

  const handleFacebookLogin = async (role: UserRole) => {
    setIsLoading(true)

    try {
      const profile = await loginWithFacebook(role)
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

  const logout = async () => {
    try {
      await firebaseLogout()
      setUser(null)

      // SEGURANÇA: Limpar todos os dados locais
      // Limpa localStorage (exceto configurações do tema)
      const keysToKeep = ['theme', 'language']
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
        isLoading,
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
