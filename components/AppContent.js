'use client'
import Navbar from './Navbar'

export default function AppContent({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  )
}