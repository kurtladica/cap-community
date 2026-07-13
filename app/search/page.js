'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { createNotification } from '../../lib/notifications'
import { useRouter } from 'next/navigation'

export default function Search() {
  const [user, setUser] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [friendships, setFriendships] = useState({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      fetchFriendships(session.user.id)
    }
    checkUser()
  }, [router])

  const fetchFriendships = async (userId) => {
    const { data } = await supabase.from('friendships').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    const map = {}
    data?.forEach((f) => { const otherId = f.sender_id === userId ? f.receiver_id : f.sender_id; map[otherId] = f })
    setFriendships(map)
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').or(`full_name.ilike.%${query}%,username.ilike.%${query}%`).limit(20)
    setResults(data || [])
    setLoading(false)
  }

  const handleSendRequest = async (receiverId) => {
    await supabase.from('friendships').insert({ sender_id: user.id, receiver_id: receiverId, status: 'pending' })
    await createNotification(receiverId, user.id, 'friend_request')
    fetchFriendships(user.id)
  }

  const handleAcceptRequest = async (friendshipId) => {
    await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date() }).eq('id', friendshipId)
    const key = Object.keys(friendships).find(k => friendships[k].id === friendshipId)
    if (key) await createNotification(friendships[key].sender_id, user.id, 'friend_accepted')
    fetchFriendships(user.id)
  }

  const handleRejectOrRemove = async (friendshipId) => { await supabase.from('friendships').delete().eq('id', friendshipId); fetchFriendships(user.id) }

  const getFriendshipStatus = (profileId) => {
    const friendship = friendships[profileId]
    if (!friendship) return 'none'
    if (friendship.status === 'accepted') return 'friends'
    if (friendship.sender_id === user.id) return 'sent'
    return 'received'
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">🔍 Find Friends</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Search by name..." className="flex-1 p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white" />
            <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Search</button>
          </div>
        </div>
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Searching...</p>
        ) : results.length > 0 ? (
          results.filter((p) => p.id !== user.id).map((profile) => {
            const status = getFriendshipStatus(profile.id)
            return (
              <div key={profile.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold mr-3">{profile.full_name?.charAt(0) || '?'}</div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{profile.full_name || 'No name'}</p>
                    {profile.location && <p className="text-sm text-gray-500 dark:text-gray-400">📍 {profile.location}</p>}
                  </div>
                </div>
                <div>
                  {status === 'none' && <button onClick={() => handleSendRequest(profile.id)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Add Friend</button>}
                  {status === 'sent' && <span className="text-gray-500 dark:text-gray-400 text-sm">Request Sent ⏳</span>}
                  {status === 'received' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptRequest(friendships[profile.id].id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Accept</button>
                      <button onClick={() => handleRejectOrRemove(friendships[profile.id].id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Reject</button>
                    </div>
                  )}
                  {status === 'friends' && <button onClick={() => handleRejectOrRemove(friendships[profile.id].id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Unfriend</button>}
                </div>
              </div>
            )
          })
        ) : query && <p className="text-center text-gray-500 dark:text-gray-400">No users found</p>}
      </div>
    </div>
  )
}