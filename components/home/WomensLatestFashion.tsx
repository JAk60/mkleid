// components/home/WomensLatestFashion.tsx

"use client";

import { useEffect, useState } from "react";

import { getProducts } from "@/lib/supabase";
import { Product } from "@/lib/types";
import Link from "next/link";
import ProductCard from "../products/ProductCard";


export default function WomensLatestFashion() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWomensProducts();
  }, []);

  const loadWomensProducts = async () => {
    try {
      // Get latest 8 women's products
      const allProducts = await getProducts();
      const womensProducts = allProducts
        .filter(p => p.gender === "Female")
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 8);
      
      setProducts(womensProducts);
    } catch (error) {
      console.error("Failed to load women's products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-12 bg-gray-50">
        <div className="max-w-7xl px-5 md:px-10 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[34px] font-semibold leading-tight">
              Women's Latest Fashion
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full py-12 bg-gray-50">
        <div className="max-w-7xl px-5 md:px-10 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[34px] font-semibold leading-tight">
              Women's Latest Fashion
            </h2>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No products available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-12 bg-gray-50">
      <div className="max-w-7xl px-5 md:px-10 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[34px] font-semibold leading-tight mb-3">
            Women's Latest Fashion
          </h2>
          <p className="text-gray-600">Discover the newest styles for women</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/products/gender/Female"
            className="inline-block px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            View All Women's Products
          </Link>
        </div>
      </div>
    </div>
  );
}