'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const avatarInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
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

  const handleUploadAvatar = async (file) => {
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date() })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
      alert('✅ Profile picture updated!')
    } catch (err) {
      alert('❌ Failed: ' + err.message)
    }
    setUploadingAvatar(false)
  }

  const handleUploadCover = async (file) => {
    if (!file || !user) return
    setUploadingCover(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/cover-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl, updated_at: new Date() })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, cover_url: publicUrl }))
      alert('✅ Cover photo updated!')
    } catch (err) {
      alert('❌ Failed: ' + err.message)
    }
    setUploadingCover(false)
  }

  const handleSave = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, bio, location, website, updated_at: new Date() })
      .eq('id', user.id)
    if (!error) { 
      setProfile(prev => ({ ...prev, full_name: fullName, bio, location, website }))
      setEditing(false)
      alert('✅ Profile saved!')
    } else {
      alert('❌ Error saving profile')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Cover Photo */}
      <div className="h-48 sm:h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        {profile?.cover_url && (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        )}
        
        {/* Upload buttons overlay */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium shadow hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {uploadingCover ? '⏳ Uploading...' : '📷 Edit Cover'}
          </button>
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" 
          onChange={(e) => e.target.files[0] && handleUploadCover(e.target.files[0])} />
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20 mb-4 flex justify-center sm:justify-start">
          <div className="relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden shadow-lg bg-gray-300 dark:bg-gray-600">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-300 text-5xl font-bold">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-2 shadow border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              title="Change profile picture"
            >
              {uploadingAvatar ? '⏳' : '📷'}
            </button>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" 
            onChange={(e) => e.target.files[0] && handleUploadAvatar(e.target.files[0])} />
        </div>

        {/* Name & Edit */}
        <div className="flex justify-between items-start mb-6 flex-col sm:flex-row gap-2 text-center sm:text-left">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {profile?.full_name || 'No name set'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
          </div>
          <button onClick={() => setEditing(!editing)} 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm w-full sm:w-auto">
            {editing ? 'Cancel' : '✏️ Edit Profile'}
          </button>
        </div>

        {/* Profile Details */}
        {editing ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} 
                  className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} 
                  className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" rows="3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} 
                  className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} 
                  className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" />
              </div>
              <button onClick={handleSave} 
                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                💾 Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            {profile?.bio && <div className="mb-4"><h3 className="font-semibold text-gray-700 dark:text-gray-300">Bio</h3><p className="text-gray-600 dark:text-gray-400">{profile.bio}</p></div>}
            {profile?.location && <div className="mb-4"><h3 className="font-semibold text-gray-700 dark:text-gray-300">Location</h3><p className="text-gray-600 dark:text-gray-400">📍 {profile.location}</p></div>}
            {profile?.website && <div className="mb-4"><h3 className="font-semibold text-gray-700 dark:text-gray-300">Website</h3><a href={profile.website} target="_blank" className="text-blue-500 hover:underline" rel="noreferrer">🔗 {profile.website}</a></div>}
            {!profile?.bio && !profile?.location && !profile?.website && <p className="text-gray-500 dark:text-gray-400">No details yet. Click Edit Profile to add some!</p>}
          </div>
        )}
      </div>
    </div>
  )
}