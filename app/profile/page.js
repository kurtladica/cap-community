'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'
import { timeAgo } from '../../lib/utils'
import Link from 'next/link'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [userPosts, setUserPosts] = useState([])
  const [friendsCount, setFriendsCount] = useState(0)
  const [friends, setFriends] = useState([])
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
      fetchUserPosts(session.user.id)
      fetchFriends(session.user.id)
      setLoading(false)
    }
    fetchProfile()
  }, [router])

  const fetchUserPosts = async (userId) => {
    const { data } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
    setUserPosts(data || [])
  }

  const fetchFriends = async (userId) => {
    const { data: friendships } = await supabase.from('friendships').select('sender_id, receiver_id').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).eq('status', 'accepted')
    setFriendsCount(friendships?.length || 0)
    
    const friendsList = await Promise.all((friendships || []).slice(0, 9).map(async (f) => {
      const friendId = f.sender_id === userId ? f.receiver_id : f.sender_id
      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', friendId).single()
      return { id: friendId, full_name: profile?.full_name || 'Unknown', avatar_url: profile?.avatar_url }
    }))
    setFriends(friendsList)
  }

  const handleUpload = async (file, type) => {
    if (!file || !user) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const field = type === 'avatar' ? 'avatar_url' : 'cover_url'
      await supabase.from('profiles').update({ [field]: publicUrl, updated_at: new Date() }).eq('id', user.id)
      setProfile(prev => ({ ...prev, [field]: publicUrl }))
    } catch (err) {
      alert('Upload failed')
    }
    setUploading(false)
  }

  const handleSave = async () => {
    const { error } = await supabase.from('profiles').update({ full_name: fullName, bio, location, website, updated_at: new Date() }).eq('id', user.id)
    if (!error) { setProfile(prev => ({ ...prev, full_name: fullName, bio, location, website })); setEditing(false) }
    else alert('Error saving profile')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cover Photo */}
      <div className="h-48 sm:h-64 md:h-80 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        {profile?.cover_url && <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />}
        <button onClick={() => coverInputRef.current?.click()} disabled={uploading}
          className="absolute bottom-4 right-4 bg-white text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow hover:bg-gray-50">
          {uploading ? 'Uploading...' : '📷 Edit Cover'}
        </button>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" 
          onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0], 'cover')} />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 mb-4 gap-4">
          <div className="relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-gray-300"
              onClick={() => avatarInputRef.current?.click()}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover cursor-pointer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-5xl font-bold cursor-pointer">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <button onClick={() => avatarInputRef.current?.click()} disabled={uploading}
              className="absolute bottom-0 right-0 bg-gray-200 rounded-full p-1.5 shadow hover:bg-gray-300">
              📷
            </button>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" 
            onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0], 'avatar')} />

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{profile?.full_name || 'No name'}</h1>
            <p className="text-gray-600">{friendsCount} friends</p>
          </div>

          <button onClick={() => setEditing(!editing)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300">
            {editing ? 'Cancel' : '✏️ Edit Profile'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-4">
          <button onClick={() => setActiveTab('posts')}
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'posts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-200 rounded-t-lg'}`}>
            Posts
          </button>
          <button onClick={() => setActiveTab('about')}
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-200 rounded-t-lg'}`}>
            About
          </button>
          <button onClick={() => setActiveTab('friends')}
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'friends' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-200 rounded-t-lg'}`}>
            Friends
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Edit Profile Form */}
            {editing && (
              <div className="bg-white rounded-lg shadow p-6 mb-4">
                <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
                <div className="space-y-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-2 border rounded" rows="3" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Website</label><input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full p-2 border rounded" /></div>
                  <button onClick={handleSave} className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-medium">💾 Save Changes</button>
                </div>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                {userPosts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    <p className="text-lg">No posts yet</p>
                  </div>
                ) : (
                  userPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-lg shadow p-4 mb-3">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden mr-3">
                          {profile?.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-semibold">{profile?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{timeAgo(post.created_at)}</p>
                        </div>
                      </div>
                      {post.content && <p className="mb-3">{post.content}</p>}
                      {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-lg max-h-96 object-cover" />}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4">About</h2>
                {profile?.bio && (
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Bio</p>
                    <p>{profile.bio}</p>
                  </div>
                )}
                {profile?.location && (
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Location</p>
                    <p>📍 {profile.location}</p>
                  </div>
                )}
                {profile?.website && (
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Website</p>
                    <a href={profile.website} target="_blank" className="text-blue-500 hover:underline" rel="noreferrer">🔗 {profile.website}</a>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Joined</p>
                  <p>📅 {new Date(profile?.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                {!profile?.bio && !profile?.location && !profile?.website && (
                  <p className="text-gray-500">No details yet. Click Edit Profile to add info.</p>
                )}
              </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4">Friends ({friendsCount})</h2>
                {friends.length === 0 ? (
                  <p className="text-gray-500">No friends yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {friends.map(friend => (
                      <Link key={friend.id} href={`/profile/${friend.id}`} className="text-center hover:bg-gray-50 rounded-lg p-2 transition">
                        <div className="w-16 h-16 rounded-full bg-gray-300 mx-auto mb-1 overflow-hidden">
                          {friend.avatar_url ? <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" /> :
                            <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{friend.full_name?.charAt(0)}</div>
                          }
                        </div>
                        <p className="text-xs font-medium truncate">{friend.full_name}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Intro */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-bold text-lg mb-3">Intro</h3>
              {profile?.bio && <p className="text-sm mb-2">{profile.bio}</p>}
              {profile?.location && <p className="text-sm mb-2">📍 Lives in {profile.location}</p>}
              {profile?.website && <p className="text-sm mb-2">🔗 <a href={profile.website} target="_blank" className="text-blue-500 hover:underline" rel="noreferrer">{profile.website}</a></p>}
              <p className="text-sm mb-2">📅 Joined {new Date(profile?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              {!profile?.bio && !profile?.location && !profile?.website && <p className="text-gray-500 text-sm">Add info in Edit Profile</p>}
            </div>

            {/* Photos preview */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-bold text-lg mb-3">Photos</h3>
              <div className="grid grid-cols-3 gap-1">
                {profile?.avatar_url && (
                  <div className="aspect-square bg-gray-200 rounded overflow-hidden">
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                )}
                {userPosts.filter(p => p.image_url).slice(0, 8).map(post => (
                  <div key={post.id} className="aspect-square bg-gray-200 rounded overflow-hidden">
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {!profile?.avatar_url && userPosts.filter(p => p.image_url).length === 0 && (
                <p className="text-gray-500 text-sm">No photos yet</p>
              )}
            </div>

            {/* Friends preview */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">Friends ({friendsCount})</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {friends.slice(0, 9).map(friend => (
                  <Link key={friend.id} href={`/profile/${friend.id}`} className="text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-300 mx-auto mb-1 overflow-hidden">
                      {friend.avatar_url ? <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-lg">{friend.full_name?.charAt(0)}</div>
                      }
                    </div>
                    <p className="text-xs truncate">{friend.full_name?.split(' ')[0]}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}