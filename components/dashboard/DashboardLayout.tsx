'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { TabNavigation } from './TabNavigation'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

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
          <h1 className="text-xl font-bold text-white">Whop App Portal</h1>
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

