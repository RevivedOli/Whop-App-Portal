'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AIConfigTab } from '@/components/tabs/AIConfigTab'
import { WelcomeTab } from '@/components/tabs/WelcomeTab'
import { KnowledgeTab } from '@/components/tabs/KnowledgeTab'
import { MembersTab } from '@/components/tabs/MembersTab'
import { ReportsTab } from '@/components/tabs/ReportsTab'
import { ReengageTab } from '@/components/tabs/ReengageTab'

export default function ClientDashboardTabPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const tab = params.tab as string
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadClientId()
    }
  }, [user, authLoading, router])

  const loadClientId = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setClientId(data?.id || null)
    } catch (error) {
      console.error('Error loading client:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderTab = () => {
    if (!clientId) return null

    switch (tab) {
      case 'welcome':
        return <WelcomeTab clientId={clientId} />
      case 'knowledge':
        return <KnowledgeTab clientId={clientId} />
      case 'members':
        return <MembersTab clientId={clientId} />
      case 'reports':
        return <ReportsTab clientId={clientId} />
      case 're-engage':
        return <ReengageTab clientId={clientId} />
      case 'ai-config':
      default:
        return <AIConfigTab clientId={clientId} />
    }
  }

  if (authLoading || loading || !clientId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <DashboardLayout clientId={clientId} isAdmin={false}>
      {renderTab()}
    </DashboardLayout>
  )
}

