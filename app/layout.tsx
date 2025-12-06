'use client'
import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CartProvider } from "@/context/cart-context"
import { AuthProvider } from "@/context/auth-context"
import Header from "@/components/header"
import Footer from "@/components/Footer"
import { usePathname } from 'next/navigation'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const paragraph = localFont({
  src: [
    {
      path: '../public/fonts/Paragraph.otf',
      weight: '400',
      style: 'normal',
    }
  ],
  variable: '--font-paragraph',
})


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <html lang="en" className={paragraph.variable}>
      <body className={`--font-paragraph`}>
        <AuthProvider>
          <CartProvider>
            {!isAdminRoute && <Header />}
            {children}
            {!isAdminRoute && <Footer />}
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}