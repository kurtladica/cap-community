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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showConvoDelete, setShowConvoDelete] = useState(false)
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
    }).on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
      setMessages((prev) => prev.filter(m => m.id !== payload.old.id))
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

  const handleDeleteMessage = async (messageId) => {
    await supabase.from('messages').delete().eq('id', messageId)
    setShowDeleteConfirm(null)
    fetchMessages(selectedFriend.id)
  }

  const handleDeleteConversation = async () => {
    // Delete messages sent by user to friend
    await supabase.from('messages').delete().eq('sender_id', user.id).eq('receiver_id', selectedFriend.id)
    
    // Delete messages sent by friend to user
    await supabase.from('messages').delete().eq('sender_id', selectedFriend.id).eq('receiver_id', user.id)
    
    setShowConvoDelete(false)
    setMessages([])
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">💬 Messages</h1>
        <div className="flex flex-col sm:flex-row gap-4 h-[70vh]">
          {/* Friends List */}
          <div className="w-full sm:w-1/3 bg-white rounded-lg shadow p-4 overflow-y-auto">
            <h2 className="font-semibold mb-3 text-gray-700">Friends</h2>
            {friends.length === 0 ? <p className="text-gray-500 text-sm">No friends yet.</p> : friends.map((friend) => (
              <div key={friend.id} onClick={() => { setSelectedFriend(friend); fetchMessages(friend.id) }} className={`p-3 rounded-lg mb-2 cursor-pointer flex items-center justify-between ${selectedFriend?.id === friend.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold mr-3">{friend.full_name?.charAt(0) || '?'}</div>
                  <p className="font-medium text-gray-800">{friend.full_name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
            {selectedFriend ? (
              <>
                {/* Chat Header with Delete Convo button */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold mr-3">{selectedFriend.full_name?.charAt(0) || '?'}</div>
                    <p className="font-semibold text-gray-800">{selectedFriend.full_name}</p>
                  </div>
                  <button 
                    onClick={() => setShowConvoDelete(true)}
                    className="text-red-500 text-sm hover:underline"
                    title="Delete conversation"
                  >
                    🗑️ Delete Chat
                  </button>
                </div>

                {/* Delete Conversation Confirmation */}
                {showConvoDelete && (
                  <div className="bg-red-50 border-b border-red-200 p-3 flex items-center justify-between">
                    <p className="text-sm text-red-700">Delete entire conversation?</p>
                    <div className="flex gap-2">
                      <button onClick={handleDeleteConversation} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Delete</button>
                      <button onClick={() => setShowConvoDelete(false)} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && <p className="text-center text-gray-500 mt-8">No messages yet. Say hello!</p>}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`group flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className="relative">
                        <div className={`max-w-[70%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender_id === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {/* Delete button - only for own messages */}
                        {msg.sender_id === user.id && (
                          <button 
                            onClick={() => setShowDeleteConfirm(msg.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                            title="Delete message"
                          >
                            ✕
                          </button>
                        )}
                        {/* Delete confirmation */}
                        {showDeleteConfirm === msg.id && (
                          <div className="absolute -top-12 right-0 bg-white shadow-lg rounded-lg p-2 z-10 border">
                            <p className="text-xs text-gray-700 mb-1">Delete message?</p>
                            <div className="flex gap-1">
                              <button onClick={() => handleDeleteMessage(msg.id)} className="bg-red-500 text-white px-2 py-0.5 rounded text-xs hover:bg-red-600">Delete</button>
                              <button onClick={() => setShowDeleteConfirm(null)} className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded text-xs hover:bg-gray-400">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Message */}
                <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-2 border rounded-lg" />
                  <button type="submit" disabled={!newMessage.trim()} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50">Send</button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500"><p>Select a friend to start chatting</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}