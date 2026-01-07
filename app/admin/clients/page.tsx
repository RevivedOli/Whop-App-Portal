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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newWhopCompanyId, setNewWhopCompanyId] = useState('')
  const [creating, setCreating] = useState(false)
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

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !newWhopCompanyId.trim()) {
      alert('Please fill in both name and Whop Company ID')
      return
    }

    setCreating(true)
    try {
      console.log('Creating client:', { name: newClientName.trim(), whop_company_id: newWhopCompanyId.trim() })
      
      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            name: newClientName.trim(),
            whop_company_id: newWhopCompanyId.trim(),
            enabled: true,
            is_active: true,
          },
        ])
        .select()
        .single()

      console.log('Create client result:', { data, error })

      if (error) {
        console.error('Error creating client:', error)
        throw error
      }

      if (data) {
        console.log('Client created successfully:', data)
        setClients([...clients, data])
        setShowCreateModal(false)
        setNewClientName('')
        setNewWhopCompanyId('')
        // Reload clients to ensure we have the latest data
        loadClients()
      }
    } catch (error: any) {
      console.error('Error creating client:', error)
      alert(`Failed to create client: ${error.message || 'Unknown error'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleEnabled = async (clientId: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ enabled: !currentEnabled, is_active: !currentEnabled })
        .eq('id', clientId)

      if (error) throw error

      // Update local state
      setClients(
        clients.map((client) =>
          client.id === clientId
            ? { ...client, enabled: !currentEnabled, is_active: !currentEnabled }
            : client
        )
      )
    } catch (error: any) {
      console.error('Error toggling client enabled state:', error)
      alert(`Failed to update client: ${error.message}`)
    }
  }

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Select Client</h1>
            <p className="text-gray-400">Choose a client to manage their configuration</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            + Create Client
          </button>
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
            <div
              key={client.id}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 hover:border-blue-500 hover:bg-[#1f1f1f] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <button
                  onClick={() => router.push(`/admin/clients/${client.id}`)}
                  className="flex-1 text-left"
                >
                  <h2 className="text-xl font-semibold text-white mb-2">{client.name}</h2>
                  {client.whop_company_id && (
                    <p className="text-xs text-gray-500 mb-2">ID: {client.whop_company_id}</p>
                  )}
                  <p className="text-sm text-gray-400">
                    Created: {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </button>
                <div
                  className="ml-4 flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={client.enabled ?? client.is_active ?? true}
                      onChange={() =>
                        handleToggleEnabled(client.id, client.enabled ?? client.is_active ?? true)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    client.enabled ?? client.is_active ?? true
                      ? 'bg-green-600/20 text-green-300'
                      : 'bg-gray-600/20 text-gray-400'
                  }`}
                >
                  {client.enabled ?? client.is_active ?? true ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              {searchQuery ? 'No clients found matching your search.' : 'No clients found.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Your First Client
              </button>
            )}
          </div>
        )}

        {/* Create Client Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateModal(false)
              setNewClientName('')
              setNewWhopCompanyId('')
            }}
          >
            <div
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Create New Client</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Enter client name"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Whop Company ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newWhopCompanyId}
                    onChange={(e) => setNewWhopCompanyId(e.target.value)}
                    placeholder="Enter Whop Company ID"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewClientName('')
                    setNewWhopCompanyId('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={creating || !newClientName.trim() || !newWhopCompanyId.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

