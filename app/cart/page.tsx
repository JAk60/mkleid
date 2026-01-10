"use client"

import { Navbar } from "@/components/navbar"
import { useCart } from "@/context/cart-context"
import { formatPrice } from "@/utils/helpers"
import { Minus, Plus } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <>

        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground mb-6">Your cart is empty</p>
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="border border-border rounded-lg p-4 flex gap-4">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                    <p className="text-sm text-muted-foreground">color: {item.color}</p>
                    <p className="text-lg font-bold text-primary mt-2">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center"
                      >
                        <Minus/>
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center"
                      >
                        <Plus/>
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id, item.size)}
                      className="text-sm text-destructive hover:text-destructive/80 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border border-border rounded-lg p-6 h-fit sticky top-20">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-semibold">${(total * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(total * 1.1)}
                  </span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="w-full block text-center py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold mb-3"
              >
                Proceed to Checkout
              </Link>
              <button
                onClick={clearCart}
                className="w-full py-3 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
