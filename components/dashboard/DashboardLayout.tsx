'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { TabNavigation } from './TabNavigation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function DashboardLayout({
  children,
  clientId,
  isAdmin = false,
}: {
  children: React.ReactNode
  clientId?: string
  isAdmin?: boolean
}) {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()
  const [whopCompanyName, setWhopCompanyName] = useState<string | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch Whop company name if clientId is available
  useEffect(() => {
    if (!clientId) {
      console.log('[DashboardLayout] No clientId provided, skipping Whop company fetch')
      return
    }

    console.log('[DashboardLayout] Starting to fetch Whop company for clientId:', clientId)

    const fetchWhopCompany = async () => {
      setLoadingCompany(true)
      try {
        // First, get the client's whop_company_id
        console.log('[DashboardLayout] Fetching client data from Supabase...')
        const { data: client, error } = await supabase
          .from('clients')
          .select('whop_company_id, name')
          .eq('id', clientId)
          .single()

        console.log('[DashboardLayout] Client data:', { client, error })

        if (error) {
          console.error('[DashboardLayout] Error fetching client:', error)
          setLoadingCompany(false)
          return
        }

        if (!client?.whop_company_id) {
          console.warn('[DashboardLayout] No Whop company ID found for client:', clientId, 'Client data:', client)
          setLoadingCompany(false)
          return
        }

        console.log('[DashboardLayout] Found whop_company_id:', client.whop_company_id)
        setDebugInfo(`Found whop_company_id: ${client.whop_company_id}`)
        console.log('[DashboardLayout] Fetching company info from API...')

        // Fetch company info from Whop API
        const apiUrl = `/api/whop/company/${client.whop_company_id}`
        console.log('[DashboardLayout] API URL:', apiUrl)
        const response = await fetch(apiUrl)
        console.log('[DashboardLayout] API response status:', response.status, response.statusText)
        setDebugInfo(`API Status: ${response.status} ${response.statusText}`)

        if (response.ok) {
          const company = await response.json()
          console.log('[DashboardLayout] Company data received:', company)
          console.log('[DashboardLayout] Company title:', company.title)
          setWhopCompanyName(company.title)
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('[DashboardLayout] Failed to fetch Whop company:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
        }
      } catch (error) {
        console.error('[DashboardLayout] Error fetching Whop company:', error)
      } finally {
        setLoadingCompany(false)
      }
    }

    fetchWhopCompany()
  }, [clientId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white mb-4">Loading...</div>
          <button
            onClick={async () => {
              await signOut()
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const basePath = isAdmin ? `/admin/clients/${clientId}` : '/dashboard'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-gray-800 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Whop App Portal</h1>
            {whopCompanyName && (
              <p className="text-sm text-gray-400 mt-1">{whopCompanyName}</p>
            )}
            {loadingCompany && (
              <p className="text-sm text-gray-500 mt-1">Loading company info...</p>
            )}
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <p className="text-xs text-gray-600 mt-1">Debug: {debugInfo}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <TabNavigation basePath={basePath} />
        {children}
      </div>
    </div>
  )
}

