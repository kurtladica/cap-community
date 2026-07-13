'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Messages() {
  const [user, setUser] = useState(null)
  const [friends, setFriends] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      fetchFriends(session.user.id)
    }
    checkUser()
  }, [router])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!user || !selectedFriend) return
    const channel = supabase.channel('messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const newMsg = payload.new
      if ((newMsg.sender_id === user.id && newMsg.receiver_id === selectedFriend.id) || (newMsg.sender_id === selectedFriend.id && newMsg.receiver_id === user.id)) {
        setMessages((prev) => [...prev, newMsg])
        if (newMsg.receiver_id === user.id) supabase.from('messages').update({ read: true }).eq('id', newMsg.id)
      }
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, selectedFriend])

  const fetchFriends = async (userId) => {
    const { data: friendships } = await supabase.from('friendships').select('sender_id, receiver_id').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).eq('status', 'accepted')
    const friendsList = await Promise.all((friendships || []).map(async (f) => {
      const friendId = f.sender_id === userId ? f.receiver_id : f.sender_id
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', friendId).single()
      return { id: friendId, full_name: profile?.full_name || 'Unknown' }
    }))
    setFriends(friendsList)
    setLoading(false)
  }

  const fetchMessages = async (friendId) => {
    const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`).order('created_at', { ascending: true })
    setMessages(data || [])
    const unreadIds = (data || []).filter(m => m.receiver_id === user.id && !m.read).map(m => m.id)
    if (unreadIds.length > 0) await supabase.from('messages').update({ read: true }).in('id', unreadIds)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedFriend) return
    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selectedFriend.id, content: newMessage.trim() })
    setNewMessage('')
    fetchMessages(selectedFriend.id)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">💬 Messages</h1>
        <div className="flex flex-col sm:flex-row gap-4 h-[70vh]">
          <div className="w-full sm:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow p-4 overflow-y-auto">
            <h2 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Friends</h2>
            {friends.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-sm">No friends yet.</p> : friends.map((friend) => (
              <div key={friend.id} onClick={() => { setSelectedFriend(friend); fetchMessages(friend.id) }} className={`p-3 rounded-lg mb-2 cursor-pointer flex items-center ${selectedFriend?.id === friend.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold mr-3">{friend.full_name?.charAt(0) || '?'}</div>
                <p className="font-medium text-gray-800 dark:text-white">{friend.full_name}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
            {selectedFriend ? (
              <>
                <div className="p-4 border-b dark:border-gray-700 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold mr-3">{selectedFriend.full_name?.charAt(0) || '?'}</div>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedFriend.full_name}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No messages yet. Say hello!</p>}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-lg ${msg.sender_id === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-700 flex gap-2">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" />
                  <button type="submit" disabled={!newMessage.trim()} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50">Send</button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400"><p>Select a friend to start chatting</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}