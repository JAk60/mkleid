"use client";
import { useState, useEffect, SetStateAction, useRef } from "react";
import Link from "next/link";

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

interface Product {
  id: number;
  name: string;
  image: string;
  price: string;
  link: string;
}

interface CarouselProps {
  products: Product[];
  title: string;
  gender: string;
}

function Carousel({ products, title, gender }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // FIXED — interval starts once
  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const startAutoSlide = () => {
    stopAutoSlide();
    intervalRef.current = setInterval(() => {
      nextSlide();
    }, 5000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const nextSlide = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % products.length);

    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);

    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setCurrentIndex(index);

    setTimeout(() => setIsAnimating(false), 500);
    startAutoSlide();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const diff = touchStart - touchEnd;

    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();

    setTouchStart(0);
    setTouchEnd(0);
    startAutoSlide();
  };

  const current = products[currentIndex];

  return (
    <div
      className="relative w-full h-[90vh] overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: `url(${current.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: isAnimating ? "scale(1.1)" : "scale(1)",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-end pb-12 md:pb-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-4 md:mb-6">
            <span className="inline-block px-4 py-2 bg-[#E3D9C6]/10 backdrop-blur-sm text-white text-sm md:text-base font-semibold rounded-full border border-white/20">
              {title}
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
            {current.name}
          </h2>

          <div className="mb-6 md:mb-8">
            <span className="text-2xl md:text-4xl font-bold text-white">
              {current.price}
            </span>
          </div>

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

      {/* Navigation Arrows - Desktop Only */}
      <button
        onClick={() => { prevSlide(); startAutoSlide(); }}
        className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-black/30 backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-[#E3D9C6] hover:text-black transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={() => { nextSlide(); startAutoSlide(); }}
        className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-black/30 backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-[#E3D9C6] hover:text-black transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Pagination Dots - Desktop Only */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-20 gap-3">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`transition-all ${
              i === currentIndex
                ? "w-12 h-3 bg-[#E3D9C6]"
                : "w-3 h-3 bg-[#E3D9C6]/40 hover:bg-[#E3D9C6]/60"
            } rounded-full`}
          />
        ))}
      </div>

      {/* Slide Counter - Desktop Only */}
      <div className="hidden md:block absolute top-8 right-8 z-20 text-white text-sm font-semibold bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
        {currentIndex + 1} / {products.length}
      </div>
    </div>
  );
}

export default function HeroCarousel() {
  return (
    <div className="w-full bg-[#E3D9C6]">
      <Carousel products={mensProducts} title="MEN'S COLLECTION" gender="Men's" />
      <Carousel products={womensProducts} title="WOMEN'S COLLECTION" gender="Women's" />
    </div>
  );
}