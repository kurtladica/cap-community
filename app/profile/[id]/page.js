'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function PublicProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
      setProfile(data)
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!profile) return <div className="p-8 text-center text-gray-500">User not found</div>

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="h-48 sm:h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        {profile?.cover_url && <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />}
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="relative -mt-16 sm:-mt-20 mb-4 flex justify-center sm:justify-start">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden shadow-lg bg-gray-300 dark:bg-gray-600">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-300 text-5xl font-bold">
                {profile?.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        </div>

        <div className="text-center sm:text-left mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{profile?.full_name || 'No name'}</h1>
          {profile?.location && <p className="text-gray-500 dark:text-gray-400">📍 {profile.location}</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          {profile?.bio && <div className="mb-4"><h3 className="font-semibold text-gray-700 dark:text-gray-300">Bio</h3><p className="text-gray-600 dark:text-gray-400">{profile.bio}</p></div>}
          {profile?.website && <div><h3 className="font-semibold text-gray-700 dark:text-gray-300">Website</h3><a href={profile.website} target="_blank" className="text-blue-500 hover:underline" rel="noreferrer">🔗 {profile.website}</a></div>}
          {!profile?.bio && !profile?.website && <p className="text-gray-500 dark:text-gray-400">No details yet.</p>}
        </div>

        <button onClick={() => router.back()} className="text-blue-500 hover:underline">← Back</button>
      </div>
    </div>
  )
}