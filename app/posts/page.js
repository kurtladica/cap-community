'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { createNotification } from '../../lib/notifications'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Posts() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commentInputs, setCommentInputs] = useState({})
  const [editingPost, setEditingPost] = useState(null)
  const [editContent, setEditContent] = useState('')
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', post.user_id)
          .single()

        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        const { data: userLike } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .single()

        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true })

        const commentsWithProfiles = await Promise.all(
          (commentsData || []).map(async (comment) => {
            const { data: commentProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', comment.user_id)
              .single()
            return { ...comment, profiles: commentProfile }
          })
        )

        return {
          ...post,
          profiles: profile,
          likesCount: likesCount || 0,
          liked: !!userLike,
          likeId: userLike?.id,
          comments: commentsWithProfiles || [],
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

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', postId)
    fetchPosts(user.id)
  }

  const handleEditPost = (post) => {
    setEditingPost(post.id)
    setEditContent(post.content || '')
  }

  const handleSaveEdit = async (postId) => {
    if (!editContent.trim()) return
    await supabase.from('posts').update({ content: editContent.trim(), updated_at: new Date() }).eq('id', postId)
    setEditingPost(null)
    setEditContent('')
    fetchPosts(user.id)
  }

  const handleLike = async (post) => {
    if (post.liked) {
      await supabase.from('likes').delete().eq('id', post.likeId)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: post.id })
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

    const { data: postData } = await supabase.from('posts').select('user_id').eq('id', postId).single()
    if (postData && postData.user_id !== user.id) {
      await createNotification(postData.user_id, user.id, 'comment', postId)
    }

    setCommentInputs({ ...commentInputs, [postId]: '' })
    fetchPosts(user.id)
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    fetchPosts(user.id)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">📢 News Feed</h1>

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
        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">No posts to show!</p>
            <button onClick={() => router.push('/search')}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Find Friends</button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4 mb-4">
              {/* Author */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold mr-3">
                    {post.profiles?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold">{post.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {/* Edit/Delete buttons (only for post owner) */}
                {post.user_id === user.id && (
                  <div className="flex gap-2">
                    {editingPost !== post.id && (
                      <button onClick={() => handleEditPost(post)} className="text-blue-500 text-sm hover:underline">
                        Edit
                      </button>
                    )}
                    <button onClick={() => handleDeletePost(post.id)} className="text-red-500 text-sm hover:underline">
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Content or Edit Mode */}
              {editingPost === post.id ? (
                <div className="mb-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded-lg mb-2"
                    rows="3"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(post.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                      Save
                    </button>
                    <button onClick={() => setEditingPost(null)} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {post.content && <p className="mb-3">{post.content}</p>}
                  {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-lg mb-3 max-h-96 object-cover" />}
                </>
              )}

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
                  <div key={comment.id} className="mb-2 text-sm flex justify-between items-start">
                    <div>
                      <span className="font-semibold">{comment.profiles?.full_name || 'Unknown'}</span>
                      <span className="ml-2">{comment.content}</span>
                    </div>
                    {comment.user_id === user.id && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">
                        ✕
                      </button>
                    )}
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