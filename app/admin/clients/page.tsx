'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Client } from '@/lib/types'

export default function AdminClientsPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    console.log('AdminClientsPage useEffect:', { authLoading, user: user?.id, role, hasLoaded: hasLoadedRef.current })
    
    if (authLoading) {
      console.log('Waiting for auth to load...')
      return // Wait for auth to load
    }
    
    if (!user) {
      console.log('No user, redirecting to login')
      router.push('/login')
      return
    }
    
    if (role === null) {
      console.log('Role is null, waiting...')
      return // Still loading role
    }
    
    if (role !== 'admin') {
      console.log('Not admin, redirecting to dashboard. Role:', role)
      // If not admin, redirect to dashboard
      router.push('/dashboard')
      return
    }
    
    // User is admin, load clients (only once)
    if (user && role === 'admin' && !hasLoadedRef.current) {
      console.log('Loading clients for admin...')
      hasLoadedRef.current = true
      loadClients()
    }
  }, [user, role, authLoading]) // Removed router from deps

  // Timeout fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && user && role === 'admin') {
        console.warn('Loading timeout - stopping load')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [loading, user, role])

  const loadClients = async () => {
    try {
      console.log('Loading clients for admin user:', user?.id)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })

      console.log('Clients query result:', { data, error })

      if (error) {
        console.error('Error loading clients:', error)
        throw error
      }
      setClients(data || [])
      console.log('Clients loaded:', data?.length || 0)
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients([]) // Set empty array on error
    } finally {
      setLoading(false)
      console.log('Loading clients complete')
    }
  }

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authLoading) {
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

  if (!user) {
    console.log('No user in render, returning null')
    return null // Will redirect
  }

  if (role === null) {
    console.log('Role is null in render, showing loading')
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white mb-4">Loading role...</div>
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

  if (role !== 'admin') {
    console.log('Not admin in render, returning null. Role:', role)
    return null // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white mb-4">Loading clients...</div>
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Select Client</h1>
          <p className="text-gray-400">Choose a client to manage their configuration</p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => router.push(`/admin/clients/${client.id}`)}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 hover:border-blue-500 hover:bg-[#1f1f1f] transition-all text-left"
            >
              <h2 className="text-xl font-semibold text-white mb-2">{client.name}</h2>
              <p className="text-sm text-gray-400">
                Created: {new Date(client.created_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>

        {filteredClients.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              {searchQuery ? 'No clients found matching your search.' : 'No clients found.'}
            </p>
            {!searchQuery && (
              <button
                onClick={async () => {
                  try {
                    const { data, error } = await supabase
                      .from('clients')
                      .insert([{ name: 'Test Client' }])
                      .select()
                      .single()

                    if (error) throw error
                    if (data) {
                      // Reload clients
                      setClients([data])
                      setLoading(false)
                    }
                  } catch (error) {
                    console.error('Error creating test client:', error)
                    alert('Failed to create test client. Check console for details.')
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Test Client
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

