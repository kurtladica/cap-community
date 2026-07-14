'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Password updated! Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div style={{
        maxWidth: '350px',
        width: '100%',
        background: 'linear-gradient(0deg, rgb(255, 255, 255) 0%, rgb(244, 247, 251) 100%)',
        borderRadius: '40px',
        padding: '25px 35px',
        border: '5px solid white',
        boxShadow: 'rgba(133, 189, 215, 0.88) 0px 30px 30px -20px',
      }}>
        <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '24px', color: 'rgb(16, 137, 211)', marginBottom: '20px' }}>
          Set New Password
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 15px', borderRadius: '15px', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '10px 15px', borderRadius: '15px', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>{message}</div>}

        <form onSubmit={handleUpdate}>
          <input
            required
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              background: 'white',
              border: 'none',
              padding: '15px 20px',
              borderRadius: '20px',
              marginTop: '15px',
              boxShadow: '#cff0ff 0px 10px 10px -5px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'block',
              width: '100%',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%)',
              color: 'white',
              paddingBlock: '15px',
              margin: '20px auto',
              borderRadius: '20px',
              boxShadow: 'rgba(133, 189, 215, 0.88) 0px 20px 10px -15px',
              border: 'none',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}