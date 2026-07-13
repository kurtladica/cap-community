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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <p className="p-8">Loading...</p>

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">🏠 CAP Community</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Log out
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/messages" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition text-center">
  <span className="text-3xl">💬</span>
  <p className="mt-2 font-semibold">Messages</p>
</Link>
          <Link href="/profile" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition text-center">
            <span className="text-3xl">👤</span>
            <p className="mt-2 font-semibold">My Profile</p>
          </Link>
          <Link href="/posts" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition text-center">
            <span className="text-3xl">📢</span>
            <p className="mt-2 font-semibold">Feed</p>
          </Link>
          <Link href="/friends" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition text-center">
            <span className="text-3xl">👥</span>
            <p className="mt-2 font-semibold">Friends</p>
          </Link>
          <Link href="/search" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition text-center">
            <span className="text-3xl">🔍</span>
            <p className="mt-2 font-semibold">Find Friends</p>
          </Link>
          <Link href="/notifications" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition text-center relative">
            <span className="text-3xl">🔔</span>
            {unreadNotifs > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadNotifs}
              </span>
            )}
            <p className="mt-2 font-semibold">Notifications</p>
          </Link>
        </div>
      </div>
    </div>
  )
}