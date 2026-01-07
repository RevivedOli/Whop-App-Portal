'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AIConfigTab } from '@/components/tabs/AIConfigTab'

export default function ClientDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (authLoading) return // Wait for auth to load
    
    if (!user) {
      router.push('/login')
      return
    }

    // Only load client ID once when user is available
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadClientId()
    }
  }, [user, authLoading]) // Removed router and clientId from deps to prevent loops

  // Timeout fallback - if loading takes too long, stop loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && user) {
        console.warn('Loading timeout - stopping load')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [loading, user])

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('Dashboard - User:', user.id, 'Loading:', loading, 'ClientId:', clientId)
    }
  }, [user, loading, clientId])

  const loadClientId = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      console.log('Loading client for user:', user.id)
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // If no client found, show error message
        if (error.code === 'PGRST116') {
          // No rows returned - client doesn't exist
          console.log('No client record found for user')
          setClientId(null)
        } else {
          console.error('Error loading client:', error)
          throw error
        }
      } else {
        console.log('Client ID loaded:', data?.id)
        setClientId(data?.id || null)
      }
    } catch (error) {
      console.error('Error loading client:', error)
      setClientId(null)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white mb-4">Loading...</div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (!clientId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-[#1a1a1a] border border-gray-700 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">No Client Record Found</h2>
          <p className="text-gray-400 mb-4">
            Your account doesn't have an associated client record. Please contact an administrator.
          </p>
          <button
            onClick={() => {
              supabase.auth.signOut()
              router.push('/login')
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout clientId={clientId} isAdmin={false}>
      <AIConfigTab clientId={clientId} />
    </DashboardLayout>
  )
}

