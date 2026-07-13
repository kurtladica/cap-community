'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const { darkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        fetchUnreadCount(session.user.id)
      }
    }
    checkUser()
  }, [])

  const fetchUnreadCount = async (userId) => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    setUnreadNotifs(count || 0)
  }

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('navbar-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadCount(user.id))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path) => pathname === path

  if (!user) return null

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="font-bold text-lg sm:text-xl text-blue-600 dark:text-blue-400">
            CAP Community
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <Link href="/posts" className={`px-3 py-2 rounded-lg text-sm ${isActive('/posts') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>📢 Feed</Link>
            <Link href="/friends" className={`px-3 py-2 rounded-lg text-sm ${isActive('/friends') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>👥 Friends</Link>
            <Link href="/messages" className={`px-3 py-2 rounded-lg text-sm ${isActive('/messages') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>💬 Messages</Link>
            <Link href="/notifications" className={`px-3 py-2 rounded-lg text-sm relative ${isActive('/notifications') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
              🔔
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{unreadNotifs}</span>
              )}
            </Link>
            <Link href="/profile" className={`px-3 py-2 rounded-lg text-sm ${isActive('/profile') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>👤 Profile</Link>
            <Link href="/search" className={`px-3 py-2 rounded-lg text-sm ${isActive('/search') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>🔍 Search</Link>
            <button onClick={toggleDarkMode} className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="ml-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg">Log out</button>
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <button onClick={toggleDarkMode} className="px-2 py-1 text-sm">{darkMode ? '☀️' : '🌙'}</button>
            <Link href="/notifications" className="relative px-2 py-1">
              🔔
              {unreadNotifs > 0 && <span className="absolute -top-0.5 right-0 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">{unreadNotifs}</span>}
            </Link>
            <button onClick={handleLogout} className="text-red-500 text-sm px-2 py-1">Log out</button>
          </div>
        </div>

        <div className="sm:hidden flex justify-around py-2 border-t dark:border-gray-700">
          <Link href="/posts" className={`flex flex-col items-center text-xs ${isActive('/posts') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}><span className="text-lg">📢</span> Feed</Link>
          <Link href="/friends" className={`flex flex-col items-center text-xs ${isActive('/friends') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}><span className="text-lg">👥</span> Friends</Link>
          <Link href="/messages" className={`flex flex-col items-center text-xs ${isActive('/messages') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}><span className="text-lg">💬</span> Chat</Link>
          <Link href="/profile" className={`flex flex-col items-center text-xs ${isActive('/profile') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}><span className="text-lg">👤</span> Profile</Link>
          <Link href="/search" className={`flex flex-col items-center text-xs ${isActive('/search') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}><span className="text-lg">🔍</span> Search</Link>
        </div>
      </div>
    </nav>
  )
}