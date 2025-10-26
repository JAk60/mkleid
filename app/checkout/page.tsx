"use client"

import type React from "react"

import { Navbar } from "@/components/navbar"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<"shipping" | "payment" | "confirmation">("shipping")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  })

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-lg text-muted-foreground mb-6">Your cart is empty</p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
      </>
    )
  }

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-lg text-muted-foreground mb-6">Please log in to continue checkout</p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Go to Login
            </Link>
          </div>
        </main>
      </>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlaceOrder = () => {
    setStep("confirmation")
    clearCart()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>

          {step === "confirmation" ? (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-3xl font-bold mb-4">Order Confirmed!</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Thank you for your purchase. Your order has been placed successfully.
              </p>
              <div className="bg-muted p-6 rounded-lg mb-8 text-left">
                <p className="font-semibold mb-2">Order Details:</p>
                <p className="text-muted-foreground">
                  Order ID: #GQ{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
                <p className="text-muted-foreground">Total: ${(total * 1.1).toFixed(2)}</p>
                <p className="text-muted-foreground">Estimated Delivery: 2-3 business days</p>
              </div>
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-8">
                {/* Shipping */}
                <div className="border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="address"
                      placeholder="Street Address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="zip"
                      placeholder="ZIP Code"
                      value={formData.zip}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                </div>

                {/* Payment */}
                <div className="border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-6">Payment Information</h2>
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card Number"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="cardExpiry"
                        placeholder="MM/YY"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <input
                        type="text"
                        name="cardCvc"
                        placeholder="CVC"
                        value={formData.cardCvc}
                        onChange={handleInputChange}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg"
                >
                  Place Order
                </button>
              </div>

              {/* Order Summary */}
              <div className="border border-border rounded-lg p-6 h-fit sticky top-20">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex justify-between text-sm">
                      <span>
                        {item.name} (Size {item.size}) x{item.quantity}
                      </span>
                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${(total * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">${(total * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
