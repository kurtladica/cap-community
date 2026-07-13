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
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      fetchFriendships(session.user.id)
    }
    checkUser()
  }, [router])

  const fetchFriendships = async (userId) => {
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    
    const map = {}
    data?.forEach((f) => {
      const otherId = f.sender_id === userId ? f.receiver_id : f.sender_id
      map[otherId] = f
    })
    setFriendships(map)
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(20)

    setResults(data || [])
    setLoading(false)
  }

  const handleSendRequest = async (receiverId) => {
    const { error } = await supabase
      .from('friendships')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending',
      })

    if (!error) {
      // Send notification to receiver
      await createNotification(receiverId, user.id, 'friend_request')
      fetchFriendships(user.id)
    }
  }

  const handleAcceptRequest = async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date() })
      .eq('id', friendshipId)

    if (!error) {
      // Send notification to sender
      const friendship = friendships[Object.keys(friendships).find(
        key => friendships[key].id === friendshipId
      )]
      if (friendship) {
        await createNotification(friendship.sender_id, user.id, 'friend_accepted')
      }
      fetchFriendships(user.id)
    }
  }

  const handleRejectOrRemove = async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (!error) fetchFriendships(user.id)
  }

  const getFriendshipStatus = (profileId) => {
    const friendship = friendships[profileId]
    if (!friendship) return 'none'
    if (friendship.status === 'accepted') return 'friends'
    if (friendship.sender_id === user.id) return 'sent'
    return 'received'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🔍 Find Friends</h1>
          <button onClick={() => router.push('/')} className="text-blue-500 hover:underline">
            ← Home
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name..."
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <p className="text-center text-gray-500">Searching...</p>
        ) : results.length > 0 ? (
          results
            .filter((p) => p.id !== user.id)
            .map((profile) => {
              const status = getFriendshipStatus(profile.id)
              return (
                <div key={profile.id} className="bg-white rounded-lg shadow p-4 mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold mr-3">
                      {profile.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold">{profile.full_name || 'No name'}</p>
                      {profile.location && <p className="text-sm text-gray-500">📍 {profile.location}</p>}
                    </div>
                  </div>

                  <div>
                    {status === 'none' && (
                      <button
                        onClick={() => handleSendRequest(profile.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Add Friend
                      </button>
                    )}
                    {status === 'sent' && (
                      <span className="text-gray-500 text-sm">Request Sent ⏳</span>
                    )}
                    {status === 'received' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(friendships[profile.id].id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectOrRemove(friendships[profile.id].id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {status === 'friends' && (
                      <button
                        onClick={() => handleRejectOrRemove(friendships[profile.id].id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Unfriend
                      </button>
                    )}
                  </div>
                </div>
              )
            })
        ) : query && (
          <p className="text-center text-gray-500">No users found</p>
        )}
      </div>
    </div>
  )
}