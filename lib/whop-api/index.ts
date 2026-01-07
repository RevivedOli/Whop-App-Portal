import Whop from '@whop/sdk'
import { headers } from 'next/headers'
import { createSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export interface TokenData {
  whop: Whop
  companyId: string
  userId: string
}

/**
 * Verifies the user's Supabase session and returns initialized Whop SDK.
 * Extracts companyId from the authenticated user's client record.
 */
export async function verifyUserToken(
  requestHeaders: Headers,
  requestUrl: string
): Promise<TokenData | null> {
  try {
    // Get authorization header (Supabase session token)
    const authHeader = requestHeaders.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[verifyUserToken] No authorization header found')
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify Supabase session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[verifyUserToken] Missing Supabase environment variables')
      return null
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('[verifyUserToken] Invalid Supabase token:', authError)
      return null
    }

    // Get companyId from query params first (for admin viewing different clients)
    const url = new URL(requestUrl)
    const companyIdFromParams = url.searchParams.get('companyId')

    let companyId: string | null = companyIdFromParams

    // If no companyId in params, get from user's client record
    if (!companyId) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('whop_company_id')
        .eq('user_id', user.id)
        .single()

      if (clientError || !client?.whop_company_id) {
        console.error('[verifyUserToken] No client record found for user:', clientError)
        // For admin users, they might not have a client record
        // They'll need to provide companyId in the request
        return null
      }

      companyId = client.whop_company_id
    }

    if (!companyId) {
      console.error('[verifyUserToken] No companyId available')
      return null
    }

    // Initialize Whop SDK with API key (we'll use API key for server-side operations)
    const whopApiKey = process.env.WHOP_API_KEY
    if (!whopApiKey) {
      console.error('[verifyUserToken] WHOP_API_KEY not configured')
      return null
    }

    // App API keys require appID, Company API keys don't
    const whopAppId = process.env.WHOP_APP_ID
    const whopConfig: { apiKey: string; appID?: string } = {
      apiKey: whopApiKey,
    }
    
    if (whopAppId) {
      whopConfig.appID = whopAppId
    }

    const whop = new Whop(whopConfig)

    return {
      whop,
      companyId,
      userId: user.id,
    }
  } catch (error) {
    console.error('[verifyUserToken] Error:', error)
    return null
  }
}

/**
 * Alternative: Verify using Supabase auth and get companyId from client record
 */
export async function verifyUserTokenWithSupabase(
  requestHeaders: Headers
): Promise<TokenData | null> {
  try {
    // Get Supabase session from cookies
    const supabase = createSupabaseClient()
    const authHeader = requestHeaders.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Verify Supabase token
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        console.error('[verifyUserTokenWithSupabase] Invalid Supabase token:', error)
        return null
      }

      // Get client record to find companyId
      const { data: client } = await supabase
        .from('clients')
        .select('whop_company_id')
        .eq('user_id', user.id)
        .single()

      if (!client?.whop_company_id) {
        console.error('[verifyUserTokenWithSupabase] No client record found for user')
        return null
      }

      // Initialize Whop SDK - we'll need the Whop API key or user token
      // For now, use API key from env
      const whopApiKey = process.env.WHOP_API_KEY
      if (!whopApiKey) {
        console.error('[verifyUserTokenWithSupabase] WHOP_API_KEY not configured')
        return null
      }

      // App API keys require appID, Company API keys don't
      const whopAppId = process.env.WHOP_APP_ID
      const whopConfig: { apiKey: string; appID?: string } = {
        apiKey: whopApiKey,
      }
      
      if (whopAppId) {
        whopConfig.appID = whopAppId
      }

      const whop = new Whop(whopConfig)

      return {
        whop,
        companyId: client.whop_company_id,
        userId: user.id,
      }
    }

    return null
  } catch (error) {
    console.error('[verifyUserTokenWithSupabase] Error:', error)
    return null
  }
}

