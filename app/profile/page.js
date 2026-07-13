'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      // Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name || '')
        setBio(data.bio || '')
        setLocation(data.location || '')
        setWebsite(data.website || '')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [router])

  const handleSave = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        bio,
        location,
        website,
        updated_at: new Date(),
      })
      .eq('id', user.id)

    if (!error) {
      setProfile({ ...profile, full_name: fullName, bio, location, website })
      setEditing(false)
    } else {
      alert('Error saving profile')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cover Photo Area */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        {profile?.cover_url && (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-2xl mx-auto px-4">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-4xl">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Name and Edit Button */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{profile?.full_name || 'No name set'}</h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Details */}
        {editing ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Tell us about yourself"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Where are you from?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {profile?.bio && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700">Bio</h3>
                <p>{profile.bio}</p>
              </div>
            )}
            {profile?.location && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700">Location</h3>
                <p>📍 {profile.location}</p>
              </div>
            )}
            {profile?.website && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700">Website</h3>
                <a href={profile.website} target="_blank" className="text-blue-500 hover:underline">
                  🔗 {profile.website}
                </a>
              </div>
            )}
            {!profile?.bio && !profile?.location && !profile?.website && (
              <p className="text-gray-500">No details yet. Click Edit Profile to add some!</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}