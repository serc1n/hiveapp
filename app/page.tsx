'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MainApp } from '@/components/MainApp'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <LoadingSpinner />
  }

  if (!session) {
    return null
  }

  return <MainApp />
}
