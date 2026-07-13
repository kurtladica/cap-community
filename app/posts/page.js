'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { createNotification } from '../../lib/notifications'

export default function Posts() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commentInputs, setCommentInputs] = useState({})
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      fetchPosts(session.user.id)
    }
    checkUser()
  }, [router])

  const fetchPosts = async (userId) => {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')

    const friendIds = friendships?.map(f => 
      f.sender_id === userId ? f.receiver_id : f.sender_id
    ) || []
    const allIds = [userId, ...friendIds]

    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', allIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
      setLoading(false)
      return
    }

    const postsWithDetails = await Promise.all(
      (postsData || []).map(async (post) => {
        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', post.user_id)
          .single()

        // Get likes count
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        // Check if current user liked
        const { data: userLike } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .single()

        // Get comments
        const { data: comments } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:user_id (full_name)
          `)
          .eq('post_id', post.id)
          .order('created_at', { ascending: true })

        return {
          ...post,
          profiles: profile,
          likesCount: likesCount || 0,
          liked: !!userLike,
          likeId: userLike?.id,
          comments: comments || [],
        }
      })
    )

    setPosts(postsWithDetails)
    setLoading(false)
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (!content.trim() && !imageFile) return
    setPosting(true)
    let imageUrl = null

    if (imageFile) {
      const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
    }

    const { error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: content.trim(), image_url: imageUrl })

    if (!error) {
      setContent('')
      setImageFile(null)
      fetchPosts(user.id)
    }
    setPosting(false)
  }

  const handleLike = async (post) => {
    if (post.liked) {
      await supabase.from('likes').delete().eq('id', post.likeId)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: post.id })
      // Notify post owner (only when liking, not unliking)
      if (post.user_id !== user.id) {
        await createNotification(post.user_id, user.id, 'like', post.id)
      }
    }
    fetchPosts(user.id)
  }

  const handleComment = async (postId) => {
    const commentText = commentInputs[postId]?.trim()
    if (!commentText) return

    await supabase.from('comments').insert({
      user_id: user.id,
      post_id: postId,
      content: commentText,
    })

    // Notify post owner
    const { data: postData } = await supabase.from('posts').select('user_id').eq('id', postId).single()
    if (postData && postData.user_id !== user.id) {
      await createNotification(postData.user_id, user.id, 'comment', postId)
    }

    setCommentInputs({ ...commentInputs, [postId]: '' })
    fetchPosts(user.id)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📢 News Feed</h1>
          <button onClick={() => router.push('/')} className="text-blue-500 hover:underline">← Home</button>
        </div>

        {/* Create Post */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handlePost}>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?" className="w-full p-3 border rounded-lg resize-none mb-3" rows="3" />
            <div className="flex justify-between items-center">
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm" />
              <button type="submit" disabled={posting || (!content.trim() && !imageFile)}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Posts */}
        {loading ? (
          <p className="text-center text-gray-500">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">No posts to show!</p>
            <button onClick={() => router.push('/search')}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Find Friends</button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4 mb-4">
              {/* Author */}
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold mr-3">
                  {post.profiles?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold">{post.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Content */}
              {post.content && <p className="mb-3">{post.content}</p>}
              {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-lg mb-3 max-h-96 object-cover" />}

              {/* Like Button */}
              <div className="flex items-center gap-2 mb-3 border-t pt-3">
                <button onClick={() => handleLike(post)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${post.liked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {post.liked ? '❤️' : '🤍'} {post.likesCount > 0 && post.likesCount}
                </button>
              </div>

              {/* Comments */}
              <div className="border-t pt-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="mb-2 text-sm">
                    <span className="font-semibold">{comment.profiles?.full_name || 'Unknown'}</span>
                    <span className="ml-2">{comment.content}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    placeholder="Write a comment..."
                    className="flex-1 p-2 border rounded-lg text-sm"
                  />
                  <button onClick={() => handleComment(post.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                    Post
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}