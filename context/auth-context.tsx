"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => void
  logout: () => void
  signup: (email: string, password: string, name: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("user")
    if (saved) {
      setUser(JSON.parse(saved))
    }
  }, [])

  const login = (email: string, password: string) => {
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split("@")[0],
    }
    setUser(newUser)
    if (mounted) {
      localStorage.setItem("user", JSON.stringify(newUser))
    }
  }

  const logout = () => {
    setUser(null)
    if (mounted) {
      localStorage.removeItem("user")
    }
  }

  const signup = (email: string, password: string, name: string) => {
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
    }
    setUser(newUser)
    if (mounted) {
      localStorage.setItem("user", JSON.stringify(newUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, signup }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
