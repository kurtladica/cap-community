'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/')
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
        <div style={{
          textAlign: 'center',
          fontWeight: 900,
          fontSize: '30px',
          color: 'rgb(16, 137, 211)',
          marginBottom: '20px',
        }}>
          Sign In
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#DC2626',
            padding: '10px 15px',
            borderRadius: '15px',
            fontSize: '13px',
            marginBottom: '10px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            required
            type="email"
            placeholder="E-mail"
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
              borderInline: '2px solid transparent',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderInline = '2px solid #12B1D1'}
            onBlur={(e) => e.target.style.borderInline = '2px solid transparent'}
          />
          <input
            required
            type="password"
            placeholder="Password"
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
              borderInline: '2px solid transparent',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderInline = '2px solid #12B1D1'}
            onBlur={(e) => e.target.style.borderInline = '2px solid transparent'}
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
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseOver={(e) => { e.target.style.transform = 'scale(1.03)'; e.target.style.boxShadow = 'rgba(133, 189, 215, 0.88) 0px 23px 10px -20px' }}
            onMouseOut={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'rgba(133, 189, 215, 0.88) 0px 20px 10px -15px' }}
            onMouseDown={(e) => { e.target.style.transform = 'scale(0.95)' }}
            onMouseUp={(e) => { e.target.style.transform = 'scale(1.03)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          display: 'block',
          textAlign: 'center',
          marginTop: '15px',
        }}>
          <Link href="/signup" style={{
            textDecoration: 'none',
            color: '#0099ff',
            fontSize: '13px',
            fontWeight: 500,
          }}>
            Don&apos;t have an account? Sign Up
          </Link>
        </div>

        <div style={{
          display: 'block',
          textAlign: 'center',
          marginTop: '10px',
        }}>
          <Link href="/" style={{
            textDecoration: 'none',
            color: 'rgb(170, 170, 170)',
            fontSize: '11px',
          }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}