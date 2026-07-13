'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Notifications() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      fetchNotifications(session.user.id)
    }
    checkUser()
  }, [router])

  const fetchNotifications = async (userId) => {
    const { data } = await supabase
      .from('notifications')
      .select(`
        *,
        from_profile:from_user_id (full_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications(data || [])
    setUnreadCount(data?.filter(n => !n.read).length || 0)
    setLoading(false)
  }

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    fetchNotifications(user.id)
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    fetchNotifications(user.id)
  }

  const getNotificationText = (notif) => {
    const name = notif.from_profile?.full_name || 'Someone'
    switch (notif.type) {
      case 'like': return `${name} liked your post`
      case 'comment': return `${name} commented on your post`
      case 'friend_request': return `${name} sent you a friend request`
      case 'friend_accepted': return `${name} accepted your friend request`
      default: return ''
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return '❤️'
      case 'comment': return '💬'
      case 'friend_request': return '👋'
      case 'friend_accepted': return '✅'
      default: return '🔔'
    }
  }

  const handleClick = (notif) => {
    markAsRead(notif.id)
    if (notif.type === 'like' || notif.type === 'comment') {
      router.push('/posts')
    } else {
      router.push('/friends')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-blue-500 hover:underline text-sm">
                Mark all read
              </button>
            )}
            <button onClick={() => router.push('/')} className="text-blue-500 hover:underline text-sm">← Home</button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`p-4 mb-2 rounded-lg shadow cursor-pointer hover:shadow-md transition ${
                notif.read ? 'bg-white' : 'bg-blue-50 border-l-4 border-blue-500'
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getNotificationIcon(notif.type)}</span>
                <div className="flex-1">
                  <p className={`${notif.read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                    {getNotificationText(notif)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                {!notif.read && <span className="w-3 h-3 bg-blue-500 rounded-full"></span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}