'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { createNotification } from '../../lib/notifications'
import { timeAgo } from '../../lib/utils'
import LoadingSpinner from '../../components/LoadingSpinner'
import Link from 'next/link'

export default function Posts() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commentInputs, setCommentInputs] = useState({})
  const [menuOpen, setMenuOpen] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [editContent, setEditContent] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      fetchPosts(session.user.id)
    }
    checkUser()
  }, [router])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setMenuOpen(null)
    if (menuOpen) document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [menuOpen])

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

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', allIds)
      .order('created_at', { ascending: false })

    const postsWithDetails = await Promise.all((postsData || []).map(async (post) => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', post.user_id).single()
      const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id)
      const { data: userLike } = await supabase.from('likes').select('*').eq('post_id', post.id).eq('user_id', userId).single()
      const { data: commentsData } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
      const commentsWithProfiles = await Promise.all((commentsData || []).map(async (comment) => {
        const { data: cp } = await supabase.from('profiles').select('*').eq('id', comment.user_id).single()
        return { ...comment, profiles: cp }
      }))
      return { ...post, profiles: profile, likesCount: likesCount || 0, liked: !!userLike, likeId: userLike?.id, comments: commentsWithProfiles || [] }
    }))
    setPosts(postsWithDetails)
    setLoading(false)
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (!content.trim() && !imageFile) return
    setPosting(true)
    let imageUrl = null
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, imageFile)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    }
    await supabase.from('posts').insert({ user_id: user.id, content: content.trim(), image_url: imageUrl })
    setContent(''); setImageFile(null); fetchPosts(user.id); setPosting(false)
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setMenuOpen(null)
    fetchPosts(user.id)
  }

  const handleEditPost = (post) => {
    setEditingPost(post.id)
    setEditContent(post.content || '')
    setMenuOpen(null)
  }

  const handleSaveEdit = async (postId) => {
    if (!editContent.trim()) return
    await supabase.from('posts').update({ content: editContent.trim(), updated_at: new Date() }).eq('id', postId)
    setEditingPost(null); setEditContent(''); fetchPosts(user.id)
  }

  const handleLike = async (post) => {
    if (post.liked) {
      await supabase.from('likes').delete().eq('id', post.likeId)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: post.id })
      if (post.user_id !== user.id) await createNotification(post.user_id, user.id, 'like', post.id)
    }
    fetchPosts(user.id)
  }

  const handleComment = async (postId) => {
    const commentText = commentInputs[postId]?.trim()
    if (!commentText) return
    await supabase.from('comments').insert({ user_id: user.id, post_id: postId, content: commentText })
    const { data: postData } = await supabase.from('posts').select('user_id').eq('id', postId).single()
    if (postData && postData.user_id !== user.id) await createNotification(postData.user_id, user.id, 'comment', postId)
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
        <h1 className="text-2xl font-bold mb-6 text-gray-800">📢 News Feed</h1>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handlePost}>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind?" className="w-full p-3 border rounded-lg resize-none mb-3" rows="3" />
            <div className="flex justify-between items-center">
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm" />
              <button type="submit" disabled={posting || (!content.trim() && !imageFile)} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">No posts to show!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <Link href={`/profile/${post.user_id}`} className="flex items-center hover:opacity-80 transition">
                  <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden mr-3 flex-shrink-0">
                    {post.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                        {post.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 hover:underline">
                      {post.profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">{timeAgo(post.created_at)}</p>
                  </div>
                </Link>

                {/* Horizontal three-dot menu - only for post owner */}
                {post.user_id === user.id && (
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === post.id ? null : post.id) }}
                      className="text-gray-500 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="6" viewBox="0 0 20 6" fill="currentColor">
                        <circle cx="3" cy="3" r="2"/>
                        <circle cx="10" cy="3" r="2"/>
                        <circle cx="17" cy="3" r="2"/>
                      </svg>
                    </button>
                    
                    {menuOpen === post.id && (
                      <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg py-1 z-20 border min-w-[120px]">
                        <button 
                          onClick={() => handleEditPost(post)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          ✏️ Edit Post
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                        >
                          🗑️ Delete Post
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editingPost === post.id ? (
                <div className="mb-3">
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-2 border rounded-lg mb-2" rows="3" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(post.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Save</button>
                    <button onClick={() => setEditingPost(null)} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {post.content && <p className="mb-3 text-gray-800">{post.content}</p>}
                  {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-lg mb-3 max-h-96 object-cover" />}
                </>
              )}

              <div className="flex items-center gap-2 mb-3 border-t pt-3">
                <button onClick={() => handleLike(post)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${post.liked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {post.liked ? '❤️' : '🤍'} {post.likesCount > 0 && post.likesCount}
                </button>
              </div>

              <div className="border-t pt-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="mb-2 text-sm flex justify-between items-start">
                    <div>
                      <Link href={`/profile/${comment.user_id}`} className="font-semibold text-gray-800 hover:underline">
                        {comment.profiles?.full_name || 'Unknown'}
                      </Link>
                      <span className="ml-2 text-gray-700">{comment.content}</span>
                    </div>
                    {comment.user_id === user.id && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
                    )}
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input type="text" value={commentInputs[post.id] || ''} onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)} placeholder="Write a comment..." className="flex-1 p-2 border rounded-lg text-sm" />
                  <button onClick={() => handleComment(post.id)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Post</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}