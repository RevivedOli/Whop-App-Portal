'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/components/auth/AuthProvider'

export default function LoginPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') {
        router.push('/admin/clients')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, role, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="text-white mb-4">Loading...</div>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return <LoginForm />
}

