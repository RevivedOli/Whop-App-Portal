'use client'

import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AIConfigTab } from '@/components/tabs/AIConfigTab'
import { WelcomeTab } from '@/components/tabs/WelcomeTab'
import { KnowledgeTab } from '@/components/tabs/KnowledgeTab'
import { MembersTab } from '@/components/tabs/MembersTab'
import { ReportsTab } from '@/components/tabs/ReportsTab'
import { ReengageTab } from '@/components/tabs/ReengageTab'

export default function AdminClientDashboardTabPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const tab = params.tab as string

  const renderTab = () => {
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

  return (
    <DashboardLayout clientId={clientId} isAdmin={true}>
      {renderTab()}
    </DashboardLayout>
  )
}

