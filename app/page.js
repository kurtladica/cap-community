'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4 sm:p-8 pt-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome back!
          </h1>
          <p className="text-gray-500 mt-1">What would you like to do?</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link href="/profile" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">👤</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base">My Profile</p>
          </Link>
          <Link href="/posts" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">📢</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base">Feed</p>
          </Link>
          <Link href="/friends" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">👥</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base">Friends</p>
          </Link>
          <Link href="/search" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">🔍</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base">Find Friends</p>
          </Link>
          <Link href="/messages" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">💬</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base">Messages</p>
          </Link>
          <Link href="/notifications" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">🔔</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base">Notifications</p>
          </Link>
        </div>
      </div>
    </div>
  )
}