'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState(null)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      fetchUnreadCount(session.user.id)
    }
    checkUser()
  }, [router])

  const fetchUnreadCount = async (userId) => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    setUnreadNotifs(count || 0)
  }

  // Real-time notification counter
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchUnreadCount(user.id)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-lg">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold">🏠 CAP Community</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-sm sm:text-base hover:bg-red-600">
            Log out
          </button>
        </div>
        
        {/* Navigation Grid */}
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
          <Link href="/notifications" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center relative">
            <span className="text-2xl sm:text-3xl">🔔</span>
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {unreadNotifs}
              </span>
            )}
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base">Notifications</p>
          </Link>
        </div>
      </div>
    </div>
  )
}