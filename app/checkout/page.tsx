// app/checkout/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { initializeRazorpay, openRazorpayCheckout } from "@/lib/razorpay"
import { createOrder, getAddresses, createAddress, type Address } from "@/lib/supabase-orders"

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")

  const [addressForm, setAddressForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false,
  })

  const tax = total * 0.1
  const shippingCost = 0
  const finalTotal = total + tax + shippingCost

  useEffect(() => {
    if (isLoggedIn && user) {
      loadAddresses()
    }
  }, [isLoggedIn, user])

  const loadAddresses = async () => {
    try {
      const userAddresses = await getAddresses(user!.id)
      setAddresses(userAddresses)
      const defaultAddr = userAddresses.find(addr => addr.is_default)
      if (defaultAddr) setSelectedAddress(defaultAddr)
    } catch (error) {
      console.error("Failed to load addresses:", error)
    }
  }

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setAddressForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleSaveAddress = async () => {
    try {
      const newAddress = await createAddress({
        ...addressForm,
        user_id: user!.id
      })
      setAddresses(prev => [...prev, newAddress])
      setSelectedAddress(newAddress)
      setShowAddressForm(false)
      setAddressForm({
        first_name: "",
        last_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        is_default: false,
      })
    } catch (error) {
      console.error("Failed to save address:", error)
      alert("Failed to save address")
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert("Please select a delivery address")
      return
    }

    setLoading(true)

    try {
      // Initialize Razorpay
      const res = await initializeRazorpay()
      if (!res) {
        alert("Failed to load Razorpay. Please check your internet connection.")
        setLoading(false)
        return
      }

      // Create order in database
      const orderData = {
        user_id: user!.id,
        items: items.map(item => ({
          product_id: parseInt(item.id),
          product_name: item.name,
          product_image: item.image,
          size: item.size,
          color: "Black", // You can add color to cart items
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        subtotal: total,
        tax,
        shipping_cost: shippingCost,
        total: finalTotal,
        shipping_address: selectedAddress,
        payment_method: "razorpay",
        payment_status: "pending" as const,
        order_status: "pending" as const,
      }

      const order = await createOrder(orderData)

      // Create Razorpay order
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalTotal,
          currency: "INR",
          receipt: order.order_number,
          notes: {
            order_id: order.id,
            user_id: user!.id,
          },
        }),
      })

      const { order: razorpayOrder } = await response.json()

      // Open Razorpay checkout
      openRazorpayCheckout(
        {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "genzquicks",
          description: `Order #${order.order_number}`,
          prefill: {
            name: `${selectedAddress.first_name} ${selectedAddress.last_name}`,
            email: user!.email,
            contact: selectedAddress.phone,
          },
          notes: {
            order_id: order.id!,
          },
        },
        async (response) => {
          // Payment successful
          try {
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order.id,
              }),
            })

            const result = await verifyResponse.json()

            if (result.success) {
              setOrderNumber(order.order_number!)
              setOrderComplete(true)
              clearCart()
            } else {
              alert("Payment verification failed")
            }
          } catch (error) {
            console.error("Verification error:", error)
            alert("Payment verification failed")
          }
          setLoading(false)
        },
        (error) => {
          // Payment failed or cancelled
          console.error("Payment error:", error)
          alert("Payment failed or was cancelled")
          setLoading(false)
        }
      )
    } catch (error) {
      console.error("Order creation error:", error)
      alert("Failed to create order")
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <>
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

  if (orderComplete) {
    return (
      <>
        <main className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-3xl font-bold mb-4">Order Confirmed!</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Thank you for your purchase. Your order has been placed successfully.
            </p>
            <div className="bg-muted p-6 rounded-lg mb-8 text-left">
              <p className="font-semibold mb-2">Order Details:</p>
              <p className="text-muted-foreground">Order ID: #{orderNumber}</p>
              <p className="text-muted-foreground">Total: ₹{finalTotal.toFixed(2)}</p>
              <p className="text-muted-foreground">Estimated Delivery: 5-7 business days</p>
            </div>
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

  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping Address */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-border rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Delivery Address</h2>

                {addresses.length > 0 && !showAddressForm && (
                  <div className="space-y-4 mb-6">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddress?.id === addr.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold">
                          {addr.first_name} {addr.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{addr.phone}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {addr.address_line1}
                          {addr.address_line2 && `, ${addr.address_line2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {addr.city}, {addr.state} {addr.postal_code}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {showAddressForm && (
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <input
                      type="text"
                      name="first_name"
                      placeholder="First Name"
                      value={addressForm.first_name}
                      onChange={handleAddressFormChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="last_name"
                      placeholder="Last Name"
                      value={addressForm.last_name}
                      onChange={handleAddressFormChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={addressForm.phone}
                      onChange={handleAddressFormChange}
                      className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="address_line1"
                      placeholder="Address Line 1"
                      value={addressForm.address_line1}
                      onChange={handleAddressFormChange}
                      className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="address_line2"
                      placeholder="Address Line 2 (Optional)"
                      value={addressForm.address_line2}
                      onChange={handleAddressFormChange}
                      className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={handleAddressFormChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={handleAddressFormChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <input
                      type="text"
                      name="postal_code"
                      placeholder="Postal Code"
                      value={addressForm.postal_code}
                      onChange={handleAddressFormChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <label className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_default"
                        checked={addressForm.is_default}
                        onChange={handleAddressFormChange}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Set as default address</span>
                    </label>
                  </div>
                )}

                <div className="flex gap-4">
                  {showAddressForm ? (
                    <>
                      <button
                        onClick={handleSaveAddress}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                      >
                        Save Address
                      </button>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
                    >
                      + Add New Address
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={!selectedAddress || loading}
                className="w-full py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Pay with Razorpay"}
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
                    <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}