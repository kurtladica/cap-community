'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      fetchUnreadMessages(session.user.id)
      setLoading(false)
    }
    checkUser()
  }, [router])

  const fetchUnreadMessages = async (userId) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false)
    setUnreadMessages(count || 0)
  }

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => fetchUnreadMessages(user.id))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => fetchUnreadMessages(user.id))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4 sm:p-8 pt-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome back!</h1>
          <p className="text-gray-500 mt-1">What would you like to do?</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link href="/profile" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">👤</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base text-gray-800">My Profile</p>
          </Link>
          <Link href="/posts" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">📢</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base text-gray-800">Feed</p>
          </Link>
          <Link href="/friends" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">👥</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base text-gray-800">Friends</p>
          </Link>
          <Link href="/search" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">🔍</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base text-gray-800">Find Friends</p>
          </Link>
          <Link href="/messages" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center relative">
            <span className="text-2xl sm:text-3xl">💬</span>
            {unreadMessages > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold">
                {unreadMessages}
              </span>
            )}
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base text-gray-800">Messages</p>
          </Link>
          <Link href="/notifications" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition text-center">
            <span className="text-2xl sm:text-3xl">🔔</span>
            <p className="mt-1 sm:mt-2 font-semibold text-sm sm:text-base text-gray-800">Notifications</p>
          </Link>
        </div>
      </div>
    </div>
  )
}