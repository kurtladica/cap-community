'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Posts() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [posting, setPosting] = useState(false)
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
      fetchPosts(session.user.id)
    }
    checkUser()
  }, [router])

  const fetchPosts = async (userId) => {
    // Get accepted friend IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')

    const friendIds = friendships?.map(f => 
      f.sender_id === userId ? f.receiver_id : f.sender_id
    ) || []

    // Include current user's posts too
    const allIds = [userId, ...friendIds]

    // Fetch posts from friends and self
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `)
      .in('user_id', allIds)
      .order('created_at', { ascending: false })

    setPosts(data || [])
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
      .insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
      })

    if (!error) {
      setContent('')
      setImageFile(null)
      fetchPosts(user.id)
    } else {
      alert('Error creating post')
    }
    setPosting(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📢 News Feed</h1>
          <button onClick={() => router.push('/')} className="text-blue-500 hover:underline">
            ← Home
          </button>
        </div>

        {/* Create Post */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handlePost}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border rounded-lg resize-none mb-3"
              rows="3"
            />
            <div className="flex justify-between items-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="text-sm"
              />
              <button
                type="submit"
                disabled={posting || (!content.trim() && !imageFile)}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <p className="text-center text-gray-500">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">No posts to show!</p>
            <p>Add friends to see their posts, or create your own.</p>
            <button
              onClick={() => router.push('/search')}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Find Friends
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4 mb-4">
              {/* Author */}
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold mr-3">
                  {post.profiles?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold">{post.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Content */}
              {post.content && <p className="mb-3">{post.content}</p>}

              {/* Image */}
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="Post image"
                  className="w-full rounded-lg mb-3 max-h-96 object-cover"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}