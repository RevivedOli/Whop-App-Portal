'use client'

import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AIConfigTab } from '@/components/tabs/AIConfigTab'

export default function AdminClientDashboardPage() {
  const params = useParams()
  const clientId = params.clientId as string

  return (
    <DashboardLayout clientId={clientId} isAdmin={true}>
      <AIConfigTab clientId={clientId} />
    </DashboardLayout>
  )
}

