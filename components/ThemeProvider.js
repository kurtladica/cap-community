'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
})

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    const isDark = saved === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    setMounted(true)
  }, [])

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.contains('dark')
    const newMode = !isDark
    
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
    
    setDarkMode(newMode)
    
    // Small delay then reload to ensure CSS updates
    setTimeout(() => {
      window.location.reload()
    }, 200)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  return context
}