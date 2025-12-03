"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Sample images - replace with your actual product images
const mensProducts = [
  {
    id: 1,
    name: "Men's Premium Oversized T-Shirt",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=800&fit=crop",
    price: "₹1,299",
    link: "/products/gender/Male"
  },
  {
    id: 2,
    name: "Men's Classic Jersey",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&h=800&fit=crop",
    price: "₹1,499",
    link: "/products/gender/Male"
  },
  {
    id: 3,
    name: "Men's Streetwear Collection",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&h=800&fit=crop",
    price: "₹1,799",
    link: "/products/gender/Male"
  }
];

const womensProducts = [
  {
    id: 1,
    name: "Women's Elegant Baby Tees",
    image: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=1200&h=800&fit=crop",
    price: "₹999",
    link: "/products/gender/Female"
  },
  {
    id: 2,
    name: "Women's Trendy Jersey",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1200&h=800&fit=crop",
    price: "₹1,399",
    link: "/products/gender/Female"
  },
  {
    id: 3,
    name: "Women's Fashion Collection",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&h=800&fit=crop",
    price: "₹1,599",
    link: "/products/gender/Female"
  }
];

function Carousel({ products, title, gender }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const current = products[currentIndex];

  return (
    <div className="relative w-full h-[80vh] overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: `url(${current.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: isAnimating ? "scale(1.1)" : "scale(1)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-12 md:pb-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          {/* Category Badge */}
          <div className="mb-4 md:mb-6">
            <span className="inline-block px-4 py-2 bg-[#E3D9C6]/10 backdrop-blur-sm text-white text-sm md:text-base font-semibold rounded-full border border-white/20">
              {title}
            </span>
          </div>

          {/* Product Name */}
          <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
            {current.name}
          </h2>

          {/* Price */}
          <div className="mb-6 md:mb-8">
            <span className="text-2xl md:text-4xl font-bold text-white">
              {current.price}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={current.link}>
              <button className="px-8 py-4 bg-[#E3D9C6] text-black font-bold text-lg rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 w-full sm:w-auto">
                Shop {gender} Collection
              </button>
            </Link>
            <Link href={`/products/${current.id}`}>
              <button className="px-8 py-4 bg-transparent text-white font-bold text-lg rounded-lg border-2 border-white hover:bg-[#E3D9C6] hover:text-black transition-all transform hover:scale-105 w-full sm:w-auto">
                View Details
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-16 md:h-16 bg-[#E3D9C6]/10 backdrop-blur-sm hover:bg-[#E3D9C6]/20 rounded-full flex items-center justify-center transition-all group border border-white/20"
        disabled={isAnimating}
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-16 md:h-16 bg-[#E3D9C6]/10 backdrop-blur-sm hover:bg-[#E3D9C6]/20 rounded-full flex items-center justify-center transition-all group border border-white/20"
        disabled={isAnimating}
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all ${index === currentIndex
                ? "w-8 md:w-12 h-2 md:h-3 bg-[#E3D9C6]"
                : "w-2 md:w-3 h-2 md:h-3 bg-[#E3D9C6]/40 hover:bg-[#E3D9C6]/60"
              } rounded-full`}
            disabled={isAnimating}
          />
        ))}
      </div>

      {/* Slide Number */}
      <div className="absolute top-4 md:top-8 right-4 md:right-8 z-20 text-white text-sm md:text-base font-semibold bg-[#E3D9C6]/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
        {currentIndex + 1} / {products.length}
      </div>
    </div>
  );
}

export default function HeroCarousel() {
  return (
    <div className="w-full bg-[#E3D9C6]">
      {/* Men's Carousel */}
      <Carousel products={mensProducts} title="MEN'S COLLECTION" gender="Men's" />

      {/* Women's Carousel */}
      <Carousel products={womensProducts} title="WOMEN'S COLLECTION" gender="Women's" />
    </div>
  );
}