import { supabase } from './client'

/**
 * Gets the current Supabase session token for API authentication
 */
export async function getSessionToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

