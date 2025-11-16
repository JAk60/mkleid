"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { useState } from "react"
import HeroSection from "@/components/HeroSection"
import Marquee from "@/components/Marquee"
import Footer from "@/components/Footer"
import TrendCate from "@/components/Trending-categories"

export default function Home() {
  const [menCarouselIndex, setMenCarouselIndex] = useState(0)
  const [womenCarouselIndex, setWomenCarouselIndex] = useState(0)

  const menProducts = [
    { id: 1, name: "Male Shirt", image: "/mens-casual-shirt.png" },
    { id: 2, name: "Male Jeans", image: "/Male-jeans.png" },
    { id: 3, name: "Male Trouser", image: "/Male-trouser.jpg" },
    { id: 4, name: "Male Trouser", image: "/Male-trouser.jpg" },
  ]

  const womenProducts = [
    { id: 5, name: "Female Tods", image: "/Female-shoes.jpg" },
    { id: 6, name: "Female Shirt", image: "/Female-shirt.png" },
    { id: 7, name: "Female Jeans", image: "/diverse-Female-wearing-jeans.png" },
    { id: 8, name: "Female Trouser", image: "/Female-trouser.jpg" },
  ]

  const categoryGrid = [
    { id: 1, name: "Male Shirt", image: "/mens-casual-shirt.png" },
    { id: 2, name: "Male Shirt", image: "/mens-casual-shirt.png" },
    { id: 3, name: "Male Jeans", image: "/Male-jeans.png" },
    { id: 4, name: "Male Trouser", image: "/Male-trouser.jpg" },
    { id: 5, name: "Female Tods", image: "/Female-shoes.jpg" },
    { id: 6, name: "Female Shirt", image: "/Female-shirt.png" },
    { id: 7, name: "Female Jeans", image: "/diverse-Female-wearing-jeans.png" },
    { id: 8, name: "Female Trouser", image: "/Female-trouser.jpg" },
  ]

  const latestMen = [
    {
      id: 101,
      name: "Male Slim Fit Striped Spread Collar Casual Shirt",
      price: "₹1000",
      image: "/Male-casual-shirt.jpg",
    },
    { id: 102, name: "Male Slim Low Rise Jeans", price: "₹1000", image: "/Male-jeans.png" },
    {
      id: 103,
      name: "Male Regular Fit Clean Pure Cotton Trousers",
      price: "₹1500",
      image: "/Male-white-trousers.jpg",
    },
    { id: 104, name: "Male Slim Fit Green Cotton Brand Trousers", price: "₹2349", image: "/Male-green-trousers.jpg" },
  ]

  const latestWomen = [
    { id: 201, name: "Casual Regular Sleeves Solid Female Top", price: "₹400", image: "/Female-black-top.jpg" },
    { id: 202, name: "Female Flared High Rise Jeans", price: "₹1299", image: "/Female-flared-jeans.jpg" },
    { id: 203, name: "Female Regular Fit Solid Casual Shirt", price: "₹2199", image: "/Female-black-shirt.jpg" },
    { id: 204, name: "Female Relaxed Black Lycra Brand Trousers", price: "₹1699", image: "/Female-black-pants.jpg" },
  ]

  const messages = [
    { icon: '🎉', text: 'EXTRA 5% OFF FOR PREPAID' },
    { icon: '✈️', text: 'FREE SHIPPING ₹2000+' },
    { icon: '🎊', text: 'HIT ₹5K FOR 20%' },
    { icon: '💳', text: 'EXTRA 5% OFF FOR PREPAID' },
  ];


  return (
    <>
      {/*  */}
      <main className="min-h-screen bg-white">
        <Marquee messages={messages} />
        {/* Hero Section */}
        <HeroSection />
        {/* Product Grid Showcase */}
        {/* <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoryGrid.map((product) => (
                <Link
                  key={product.id}
                  href="/products"
                  className="group relative overflow-hidden rounded-lg bg-gray-200 aspect-square flex items-center justify-center hover:shadow-lg transition-shadow"
                >
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-white/40 group-hover:bg-white/50 transition-colors flex items-center justify-center">
                    <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm">
                      {product.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section> */}
<TrendCate />
        {/* Male's Latest Fashion */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-center">Male's Latest Fashion</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setMenCarouselIndex(Math.max(0, menCarouselIndex - 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-900 transition-colors flex items-center justify-center text-gray-900"
                >
                  ←
                </button>
                <button
                  onClick={() => setMenCarouselIndex(Math.min(latestMen.length - 4, menCarouselIndex + 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-900 transition-colors flex items-center justify-center text-gray-900"
                >
                  →
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {latestMen.map((product) => (
                <Link key={product.id} href="/products" className="group">
                  <div className="relative overflow-hidden rounded-lg bg-gray-200 aspect-square mb-4 flex items-center justify-center">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-gray-900">{product.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Female's Latest Fashion */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-center">Female's Latest Fashion</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setWomenCarouselIndex(Math.max(0, womenCarouselIndex - 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-900 transition-colors flex items-center justify-center text-gray-900"
                >
                  ←
                </button>
                <button
                  onClick={() => setWomenCarouselIndex(Math.min(latestWomen.length - 4, womenCarouselIndex + 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-900 transition-colors flex items-center justify-center text-gray-900"
                >
                  →
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {latestWomen.map((product) => (
                <Link key={product.id} href="/products" className="group">
                  <div className="relative overflow-hidden rounded-lg bg-gray-200 aspect-square mb-4 flex items-center justify-center">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-gray-900">{product.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  📦
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Items in stock</h3>
                <p className="text-sm text-gray-600">Always available</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  ✕
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Same day handling</h3>
                <p className="text-sm text-gray-600">Quick processing</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  📱
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Fast shipping</h3>
                <p className="text-sm text-gray-600">Delivery in 2-3 days</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  ☰
                </div>
                <h3 className="font-bold text-gray-900 mb-2">All payment methods</h3>
                <p className="text-sm text-gray-600">Secure checkout</p>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('/lush-forest-backdrop.png')" }}
          ></div>
          <div className="absolute inset-0 bg-gray-900/70"></div>
          <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Reviews</h2>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button className="text-2xl">←</button>
              <p className="text-lg leading-relaxed max-w-2xl">
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tempore quibusdam diam sed tempore adipiscing
                elit. Tempore quibusdam diam sed tempore adipiscing elit."
              </p>
              <button className="text-2xl">→</button>
            </div>
            <p className="font-bold">John Doe</p>
            <p className="text-sm text-white/80">Customer</p>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Subscribe to Our Newsletter</h2>
            <p className="text-gray-600 mb-8">Get the latest updates on new products and upcoming sales</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-yellow-500"
              />
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
