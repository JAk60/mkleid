"use client"

import type React from "react"

import { Navbar } from "@/components/navbar"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState("")
  const { login, signup } = useAuth()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignup) {
      signup(email, password, name)
    } else {
      login(email, password)
    }
    router.push("/")
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="border border-border rounded-xl p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">{isSignup ? "Create Account" : "Welcome Back"}</h1>
              <p className="text-muted-foreground">{isSignup ? "Join genzquicks today" : "Sign in to your account"}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                {isSignup ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="text-center">
              <p className="text-muted-foreground">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => {
                    setIsSignup(!isSignup)
                    setEmail("")
                    setPassword("")
                    setName("")
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  {isSignup ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
