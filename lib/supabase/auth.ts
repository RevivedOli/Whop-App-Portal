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
      // Handle specific error codes
      if (error.code === 'PGRST116') {
        // No rows found - user doesn't have a role yet
        console.log('No role record found for user')
      } else if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
        // RLS recursion error - try using service role or bypass
        console.warn('RLS recursion detected, trying alternative method')
        // We'll fall through to metadata check
      } else {
        // Other errors - log but don't throw, try fallback
        console.warn('Role query error, trying fallback:', error.message)
      }
    }
  } catch (err: any) {
    console.error('Exception fetching role from user_roles table:', err)
    // If it's a recursion error, continue to fallback
    if (err.code === '42P17' || err.message?.includes('infinite recursion')) {
      console.warn('RLS recursion error caught, using fallback')
    }
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

