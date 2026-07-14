'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) {
      setError(error.message)
    } else {
      setMessage('Password reset link sent! Check your email.')
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
          Forgot Password
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 15px', borderRadius: '15px', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '10px 15px', borderRadius: '15px', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>{message}</div>}

        <form onSubmit={handleReset}>
          <input
            required
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <Link href="/login" style={{ textDecoration: 'none', color: '#0099ff', fontSize: '13px' }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}