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
      } else {
        setUser(session.user)
      }
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome to CAP Community!</h1>
        <div className="space-x-2">
          <Link href="/profile" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            My Profile
          </Link>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Log out
          </button>
        </div>
      </div>
      <p className="mt-4 text-gray-600">Logged in as: {user.email}</p>
    </div>
  )
}