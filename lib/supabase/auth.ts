import { supabase } from './client'

export type UserRole = 'admin' | 'client'

export interface User {
  id: string
  email?: string
  role: UserRole
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getUserRole(userId: string): Promise<UserRole> {
  console.log('getUserRole called with userId:', userId)
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    console.log('Role query result:', { data, error })

    if (!error && data) {
      console.log('Role found:', data.role)
      return data.role as UserRole
    } else if (error) {
      console.error('Error fetching role:', error.code, error.message)
      // If it's a "not found" error, that's okay - we'll try fallback
      if (error.code !== 'PGRST116') {
        throw error
      }
    }
  } catch (err: any) {
    console.error('Exception fetching role from user_roles table:', err)
  }

  // Fallback to checking user_metadata
  try {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('User metadata:', user?.user_metadata)
    if (user?.user_metadata?.role) {
      return user.user_metadata.role as UserRole
    }
  } catch (err) {
    console.error('Error fetching user metadata:', err)
  }

  // Default to client if no role found
  console.warn('No role found, defaulting to client')
  return 'client'
}

