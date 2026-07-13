import { supabase } from './supabase'

// Send a notification
export const createNotification = async (userId, fromUserId, type, postId = null) => {
  // Don't notify yourself
  if (userId === fromUserId) return

  await supabase.from('notifications').insert({
    user_id: userId,
    from_user_id: fromUserId,
    type,
    post_id: postId,
  })
}