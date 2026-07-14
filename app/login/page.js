'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
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
          Sign Up
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

        <form onSubmit={handleSignUp}>
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
              outline: 'none',
            }}
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
              outline: 'none',
            }}
          />
          <input
            required
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <Link href="/login" style={{ textDecoration: 'none', color: '#0099ff', fontSize: '13px', fontWeight: 500 }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}