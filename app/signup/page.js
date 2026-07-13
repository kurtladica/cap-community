'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSignUp = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
      <form onSubmit={handleSignUp} className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-80">
        <h1 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Join CAP Community</h1>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border dark:border-gray-600 mb-2 rounded bg-white dark:bg-gray-700 dark:text-white" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border dark:border-gray-600 mb-4 rounded bg-white dark:bg-gray-700 dark:text-white" required />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Sign Up</button>
        <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">Already have an account? <a href="/login" className="text-blue-500">Log in</a></p>
      </form>
    </div>
  )
}