'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <p className="p-8">Loading...</p>

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">🏠 Welcome to CAP Community!</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Log out
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/profile" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition text-center">
            <span className="text-3xl">👤</span>
            <p className="mt-2 font-semibold">My Profile</p>
          </Link>
          <Link href="/posts" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition text-center">
            <span className="text-3xl">📢</span>
            <p className="mt-2 font-semibold">Feed</p>
          </Link>
        </div>
      </div>
    </div>
  )
}