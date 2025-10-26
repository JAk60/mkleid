"use client"

import { Navbar } from "@/components/navbar"
import { ProductCard } from "@/components/product-card"
import { useState } from "react"

const PRODUCTS = [
  {
    id: "1",
    name: "Classic Oversized Tee",
    price: 29.99,
    image: "/oversized-tshirt-clothing.jpg",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Comfortable and stylish oversized t-shirt perfect for any occasion.",
    specs: ["100% Cotton", "Relaxed Fit", "Breathable"],
  },
  {
    id: "2",
    name: "Cargo Pants",
    price: 59.99,
    image: "/cargo-pants-fashion.jpg",
    sizes: ["28", "30", "32", "34", "36", "38"],
    description: "Trendy cargo pants with multiple pockets and modern fit.",
    specs: ["Cotton Blend", "Multiple Pockets", "Durable"],
  },
  {
    id: "3",
    name: "Hoodie Sweatshirt",
    price: 49.99,
    image: "/hoodie-sweatshirt.jpg",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Cozy hoodie perfect for layering and casual wear.",
    specs: ["Fleece Lined", "Kangaroo Pocket", "Drawstring Hood"],
  },
  {
    id: "4",
    name: "Vintage Denim Jacket",
    price: 79.99,
    image: "/denim-jacket-vintage.jpg",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Classic denim jacket with a modern twist.",
    specs: ["100% Denim", "Button Closure", "Chest Pockets"],
  },
  {
    id: "5",
    name: "Jogger Pants",
    price: 44.99,
    image: "/jogger-pants-athletic.jpg",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Comfortable joggers for active lifestyle.",
    specs: ["Elastic Waist", "Tapered Legs", "Moisture Wicking"],
  },
  {
    id: "6",
    name: "Crop Top",
    price: 24.99,
    image: "/crop-top-fashion.jpg",
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Trendy crop top perfect for summer style.",
    specs: ["Lightweight", "Fitted Cut", "Breathable"],
  },
  {
    id: "7",
    name: "Leather Jacket",
    price: 129.99,
    image: "/leather-jacket-style.jpg",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Premium leather jacket for a bold statement.",
    specs: ["Genuine Leather", "Zipper Closure", "Lined Interior"],
  },
  {
    id: "8",
    name: "Skirt Mini",
    price: 34.99,
    image: "/mini-skirt-fashion.jpg",
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Stylish mini skirt for any occasion.",
    specs: ["Elastic Waist", "A-Line Cut", "Comfortable"],
  },
]

export default function ProductsPage() {
  const [selectedSize, setSelectedSize] = useState<string>("")

  const filteredProducts = selectedSize ? PRODUCTS.filter((p) => p.sizes.includes(selectedSize)) : PRODUCTS

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Collection</h1>
            <p className="text-lg text-muted-foreground">Discover our latest and greatest pieces</p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSize("")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSize === "" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              All Sizes
            </button>
            {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSize === size ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
