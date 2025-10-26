"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { useState } from "react"

export default function Home() {
  const [menCarouselIndex, setMenCarouselIndex] = useState(0)
  const [womenCarouselIndex, setWomenCarouselIndex] = useState(0)

  const menProducts = [
    { id: 1, name: "Men Shirt", image: "/mens-casual-shirt.png" },
    { id: 2, name: "Men Jeans", image: "/men-jeans.png" },
    { id: 3, name: "Men Trouser", image: "/men-trouser.jpg" },
    { id: 4, name: "Men Trouser", image: "/men-trouser.jpg" },
  ]

  const womenProducts = [
    { id: 5, name: "Women Tods", image: "/women-shoes.jpg" },
    { id: 6, name: "Women Shirt", image: "/women-shirt.png" },
    { id: 7, name: "Women Jeans", image: "/diverse-women-wearing-jeans.png" },
    { id: 8, name: "Women Trouser", image: "/women-trouser.jpg" },
  ]

  const categoryGrid = [
    { id: 1, name: "Men Shirt", image: "/mens-casual-shirt.png" },
    { id: 2, name: "Men Shirt", image: "/mens-casual-shirt.png" },
    { id: 3, name: "Men Jeans", image: "/men-jeans.png" },
    { id: 4, name: "Men Trouser", image: "/men-trouser.jpg" },
    { id: 5, name: "Women Tods", image: "/women-shoes.jpg" },
    { id: 6, name: "Women Shirt", image: "/women-shirt.png" },
    { id: 7, name: "Women Jeans", image: "/diverse-women-wearing-jeans.png" },
    { id: 8, name: "Women Trouser", image: "/women-trouser.jpg" },
  ]

  const latestMen = [
    {
      id: 101,
      name: "Men Slim Fit Striped Spread Collar Casual Shirt",
      price: "₹1000",
      image: "/men-casual-shirt.jpg",
    },
    { id: 102, name: "Men Slim Low Rise Jeans", price: "₹1000", image: "/men-jeans.png" },
    {
      id: 103,
      name: "Men Regular Fit Clean Pure Cotton Trousers",
      price: "₹1500",
      image: "/men-white-trousers.jpg",
    },
    { id: 104, name: "Men Slim Fit Green Cotton Brand Trousers", price: "₹2349", image: "/men-green-trousers.jpg" },
  ]

  const latestWomen = [
    { id: 201, name: "Casual Regular Sleeves Solid Women Top", price: "₹400", image: "/women-black-top.jpg" },
    { id: 202, name: "Women Flared High Rise Jeans", price: "₹1299", image: "/women-flared-jeans.jpg" },
    { id: 203, name: "Women Regular Fit Solid Casual Shirt", price: "₹2199", image: "/women-black-shirt.jpg" },
    { id: 204, name: "Women Relaxed Black Lycra Brand Trousers", price: "₹1699", image: "/women-black-pants.jpg" },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Main Hero - Left Side */}
              <div className="md:col-span-2 relative overflow-hidden rounded-lg bg-gray-100 h-96 md:h-full flex items-center justify-center group">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('/offers-banner.png')" }}
                ></div>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="relative z-10 text-center text-white px-6">
                  <div className="inline-block bg-yellow-500 text-gray-900 px-4 py-2 rounded-full text-sm font-bold mb-4">
                    SALE UP TO 40% OFF
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-6">Ecommerce Online Store</h1>
                  <Link
                    href="/products"
                    className="inline-block px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg font-bold transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>

              {/* Side Category Cards - Right Side */}
              <div className="flex flex-col gap-6">
                {/* Women Category Card */}
                <div className="relative overflow-hidden rounded-lg bg-gray-100 h-44 flex items-end justify-between p-6 group cursor-pointer hover:shadow-lg transition-shadow">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/woman-shopping.jpg')" }}
                  ></div>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-1">Women</h3>
                    <p className="text-white/90 text-sm">New Collection</p>
                  </div>
                  <Link
                    href="/products"
                    className="relative z-10 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg text-sm font-bold transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>

                {/* Men Category Card */}
                <div className="relative overflow-hidden rounded-lg bg-gray-100 h-44 flex items-end justify-between p-6 group cursor-pointer hover:shadow-lg transition-shadow">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/man-with-shopping-bags.jpg')" }}
                  ></div>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-1">Men</h3>
                    <p className="text-white/90 text-sm">Latest Styles</p>
                  </div>
                  <Link
                    href="/products"
                    className="relative z-10 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg text-sm font-bold transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Grid Showcase */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
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
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm">
                      {product.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Men's Latest Fashion */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-center">Men's Latest Fashion</h2>
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

        {/* Women's Latest Fashion */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-center">Women's Latest Fashion</h2>
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Logo</h3>
              <p className="text-sm text-gray-600">
                Lorem ipsum has been the industry's standard dummy text since the 1500s.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Shopping & Categories</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/products" className="hover:text-gray-900">
                    Partners
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-gray-900">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-gray-900">
                    Team
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-gray-900">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/" className="hover:text-gray-900">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-gray-900">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-gray-900">
                    Docs
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-gray-900">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">About</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/about" className="hover:text-gray-900">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-gray-900">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-gray-900">
                    License
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-gray-900">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">&copy; 2025 All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-semibold">
                f
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-semibold">
                in
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-semibold">
                tw
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-semibold">
                ig
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
