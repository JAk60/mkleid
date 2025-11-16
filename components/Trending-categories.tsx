"use client"

import Link from "next/link"

interface Product {
  id: number
  name: string
  image: string
  price: number
  bgColor: string
}

interface TendcateProps {
  products?: Product[]
}

const defaultProducts: Product[] = [
  {
    id: 1,
    name: "Grey Checkmate T-Shirt",
    image: "/grey-checkmate-tshirt.jpg",
    price: 4700,
    bgColor: "bg-gray-900",
  },
  {
    id: 2,
    name: "White Commitment T-Shirt",
    image: "/white-commitment-tshirt.jpg",
    price: 4200,
    bgColor: "bg-gray-100",
  },
  {
    id: 3,
    name: "Red Assumption T-Shirt",
    image: "/red-assumption-tshirt.jpg",
    price: 4200,
    bgColor: "bg-red-600",
  },
  {
    id: 4,
    name: "Black Personal T-Shirt",
    image: "/black-personal-tshirt.jpg",
    price: 4200,
    bgColor: "bg-gray-950",
  },
]

export default function Tendcate({ products = defaultProducts }: TendcateProps) {
  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-16 md:mb-20">
          <h2 className="text-xs md:text-sm font-bold tracking-widest text-gray-900 uppercase">Latest Drop</h2>
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
            <Link key={product.id} href={`/products/${product.id}`}>
              <div className="group cursor-pointer">
                <div
                  className={`relative overflow-hidden ${product.bgColor} aspect-[3/4] flex items-center justify-center transition-transform duration-500 group-hover:scale-105`}
                >
                  {/* Product Image */}
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                </div>

                <div className="mt-6 space-y-2">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 font-semibold">RS. {product.price.toLocaleString()}</p>
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
