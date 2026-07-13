'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { createNotification } from '../../lib/notifications'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Friends() {
  const [user, setUser] = useState(null)
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      fetchFriendsData(session.user.id)
    }
    checkUser()
  }, [router])

  const fetchFriendsData = async (userId) => {
    const { data: allFriendships } = await supabase.from('friendships').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    const acceptedFriends = []
    const pendingRequests = []
    for (const friendship of allFriendships || []) {
      const otherId = friendship.sender_id === userId ? friendship.receiver_id : friendship.sender_id
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherId).single()
      const friendData = { friendshipId: friendship.id, profile, status: friendship.status, isSender: friendship.sender_id === userId, senderId: friendship.sender_id }
      if (friendship.status === 'accepted') acceptedFriends.push(friendData)
      else if (friendship.status === 'pending' && friendship.receiver_id === userId) pendingRequests.push(friendData)
    }
    setFriends(acceptedFriends)
    setRequests(pendingRequests)
    setLoading(false)
  }

  const handleAccept = async (friendshipId, senderId) => {
    await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date() }).eq('id', friendshipId)
    await createNotification(senderId, user.id, 'friend_accepted')
    fetchFriendsData(user.id)
  }

  const handleReject = async (friendshipId) => { await supabase.from('friendships').delete().eq('id', friendshipId); fetchFriendsData(user.id) }
  const handleUnfriend = async (friendshipId) => { await supabase.from('friendships').delete().eq('id', friendshipId); fetchFriendsData(user.id) }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">👥 Friends</h1>
        {requests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Friend Requests ({requests.length})</h2>
            {requests.map((req) => (
              <div key={req.friendshipId} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold mr-3">{req.profile?.full_name?.charAt(0) || '?'}</div>
                  <p className="font-semibold text-gray-800 dark:text-white">{req.profile?.full_name || 'Unknown'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(req.friendshipId, req.senderId)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Accept</button>
                  <button onClick={() => handleReject(req.friendshipId)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">All Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No friends yet. <a href="/search" className="text-blue-500 hover:underline">Find friends</a></p>
        ) : (
          friends.map((friend) => (
            <div key={friend.friendshipId} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold mr-3">{friend.profile?.full_name?.charAt(0) || '?'}</div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{friend.profile?.full_name || 'Unknown'}</p>
                  {friend.profile?.location && <p className="text-sm text-gray-500 dark:text-gray-400">📍 {friend.profile.location}</p>}
                </div>
              </div>
              <button onClick={() => handleUnfriend(friend.friendshipId)} className="text-red-500 hover:underline text-sm">Unfriend</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}