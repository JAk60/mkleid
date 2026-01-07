// app/order-success/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, Truck, MapPin, Calendar, ArrowRight, Download } from "lucide-react"
import { getOrderById, type Order } from "@/lib/supabase-orders"
import { useCart } from "@/context/cart-context"

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const { clearCart } = useCart()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Clear cart on success page load
    clearCart()

    if (!orderId) {
      setError("No order ID provided")
      setLoading(false)
      return
    }

    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    try {
      const orderData = await getOrderById(orderId!)
      setOrder(orderData)
    } catch (err) {
      console.error("Failed to load order:", err)
      setError("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const getEstimatedDelivery = () => {
    const today = new Date()
    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + 7) // 5-7 business days
    
    return deliveryDate.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error || "Order not found"}</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Success Banner */}
      <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-xl text-green-50 mb-2">
            Thank you for your purchase
          </p>
          <p className="text-green-100">
            Your order has been successfully placed and is being processed
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Order Details Card */}
        <div className="bg-white border border-border rounded-xl shadow-sm p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Order Number</h2>
              <p className="text-2xl font-bold text-gray-900">#{order.order_number}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Order Date</h2>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(order.created_at!).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>

          {/* Estimated Delivery */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Estimated Delivery</h3>
                <p className="text-blue-700 font-medium">{getEstimatedDelivery()}</p>
                <p className="text-sm text-blue-600 mt-1">Usually delivered in 5-7 business days</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <img
                    src={item.product_image || "/placeholder-product.jpg"}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.product_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (18%)</span>
                <span>₹{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping_cost === 0 ? "Free" : `₹${order.shipping_cost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-2">
                <span>Total</span>
                <span className="text-primary">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white border border-border rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold">Shipping Address</h3>
          </div>
          <div className="text-sm space-y-1 text-gray-700">
            <p className="font-semibold">
              {order.shipping_address.first_name} {order.shipping_address.last_name}
            </p>
            <p>{order.shipping_address.phone}</p>
            <p className="mt-2">
              {order.shipping_address.address_line1}
              {order.shipping_address.address_line2 && `, ${order.shipping_address.address_line2}`}
            </p>
            <p>
              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
            </p>
            <p>{order.shipping_address.country}</p>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white border border-border rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold mb-6">What happens next?</h3>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="w-0.5 h-16 bg-green-200" />
              </div>
              <div className="flex-1 pb-8">
                <h4 className="font-semibold mb-1">Order Placed</h4>
                <p className="text-sm text-muted-foreground">
                  Your order has been successfully placed and payment confirmed
                </p>
                <p className="text-xs text-green-600 mt-1">Completed</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <div className="w-0.5 h-16 bg-gray-200" />
              </div>
              <div className="flex-1 pb-8">
                <h4 className="font-semibold mb-1">Processing</h4>
                <p className="text-sm text-muted-foreground">
                  We're preparing your items for shipment
                </p>
                <p className="text-xs text-gray-500 mt-1">1-2 business days</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-gray-400" />
                </div>
                <div className="w-0.5 h-16 bg-gray-200" />
              </div>
              <div className="flex-1 pb-8">
                <h4 className="font-semibold mb-1">Shipped</h4>
                <p className="text-sm text-muted-foreground">
                  Your order is on its way to you
                </p>
                <p className="text-xs text-gray-500 mt-1">3-5 business days</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Delivered</h4>
                <p className="text-sm text-muted-foreground">
                  Your order has been delivered
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            📧 A confirmation email has been sent to <span className="font-semibold">{order.shipping_address?.email || "your email"}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href={`/orders/${order.id}`}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <Package className="w-5 h-5" />
            Track Order
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 px-6 py-4 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Need help with your order?
          </p>
          <Link
            href="/contact"
            className="text-primary hover:underline font-medium"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}