// components/Trending-categories.tsx - WITH REAL DATA

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getProducts } from "@/lib/supabase"
import { formatPrice, addSlugToProduct } from "@/utils/helpers"
import type { Product } from "@/lib/types"

export default function TrendingCategories() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrendingProducts()
  }, [])

  const loadTrendingProducts = async () => {
    try {
      // Get latest 4 products (trending/new arrivals)
      const allProducts = await getProducts()
      const trendingProducts = allProducts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)
        .map(addSlugToProduct)
      
      setProducts(trendingProducts)
    } catch (error) {
      console.error("Failed to load trending products:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-20 md:py-2 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-16 md:mb-20">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-3/4 mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-16 md:mb-20">
          <h2 className="text-xs md:text-sm font-bold tracking-widest text-gray-900 uppercase">
            Latest Drop
          </h2>
          <Link
            href="/products"
            className="text-xs md:text-sm font-bold tracking-widest text-gray-900 hover:text-gray-600 transition-colors uppercase"
          >
            Discover More
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-12">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <div className="group cursor-pointer">
                <div className="relative overflow-hidden bg-gray-100 aspect-3/4 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                  
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <span className="text-gray-900 font-bold text-lg">OUT OF STOCK</span>
                    </div>
                  )}
                  
                  {product.stock > 0 && product.stock <= 5 && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded">
                      ONLY {product.stock} LEFT
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 font-semibold">
                    {formatPrice(product.price)}
                  </p>
                  
                  {/* Sizes */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Sizes:</span>
                    <span className="font-medium">{product.sizes.join(', ')}</span>
                  </div>
                  
                  {/* Colors */}
                  <div className="flex items-center gap-2">
                    {product.colors.slice(0, 4).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{
                          backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase()
                        }}
                        title={color}
                      />
                    ))}
                    {product.colors.length > 4 && (
                      <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Link
            href="/products"
            className="px-12 py-3 border border-gray-900 text-gray-900 text-sm font-bold tracking-widest hover:bg-gray-900 hover:text-white transition-colors uppercase"
          >
            Discover More
          </Link>
        </div>
      </div>
    </section>
  )
}