/**
 * Whop API Client
 * 
 * This client is used to fetch company information from the Whop API.
 * 
 * Required credentials:
 * - WHOP_API_KEY: Your Whop API key (get it from https://whop.com/apps)
 */

const WHOP_API_BASE_URL = 'https://api.whop.com/api/v1'

export interface WhopCompany {
  id: string
  title: string
  route: string
  description: string
  logo?: {
    url: string
  }
  member_count: number
  verified: boolean
  created_at: string
  updated_at: string
}

export async function getWhopCompany(companyId: string): Promise<WhopCompany | null> {
  const apiKey = process.env.WHOP_API_KEY || process.env.NEXT_PUBLIC_WHOP_API_KEY

  console.log('[Whop Client] getWhopCompany called with companyId:', companyId)
  console.log('[Whop Client] API key configured:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No')

  if (!apiKey) {
    console.error('[Whop Client] Whop API key not configured. Check your .env file for WHOP_API_KEY')
    return null
  }

  const url = `${WHOP_API_BASE_URL}/companies/${companyId}`
  console.log('[Whop Client] Fetching from URL:', url)

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('[Whop Client] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error('[Whop Client] API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })

      if (response.status === 404) {
        console.warn(`[Whop Client] Company ${companyId} not found`)
        return null
      }
      throw new Error(`Whop API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('[Whop Client] Successfully fetched company data:', {
      id: data.id,
      title: data.title,
      hasTitle: !!data.title
    })
    return data
  } catch (error) {
    console.error('[Whop Client] Error fetching Whop company:', error)
    if (error instanceof Error) {
      console.error('[Whop Client] Error message:', error.message)
      console.error('[Whop Client] Error stack:', error.stack)
    }
    return null
  }
}

