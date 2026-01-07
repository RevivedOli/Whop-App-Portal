'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUserRole, type UserRole } from '@/lib/supabase/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
  user: SupabaseUser | null
  role: UserRole | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('AuthProvider - Session:', session?.user?.id)
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          const userRole = await getUserRole(session.user.id)
          console.log('AuthProvider - User role:', userRole)
          setRole(userRole)
        } catch (error) {
          console.error('Error getting user role:', error)
          // Default to client if role can't be determined
          setRole('client')
        }
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          const userRole = await getUserRole(session.user.id)
          setRole(userRole)
        } catch (error) {
          console.error('Error getting user role:', error)
          // Default to client if role can't be determined
          setRole('client')
        }
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

