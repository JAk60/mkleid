// components/ProductCard.tsx

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatPrice, generateSlug } from '@/utils/helpers';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const slug = generateSlug(product.name);
  const isOutOfStock = product.stock === 0;

  return (
    <Link 
      href={`/products/${slug}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-3">
        <Image
          src={product.image_url || '/placeholder-product.jpg'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}

        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Only {product.stock} left
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <p className="font-semibold text-gray-900 whitespace-nowrap">
            {formatPrice(product.price)}
          </p>
        </div>

        <p className="text-sm text-gray-500 line-clamp-1">
          {product.description}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex gap-1">
            {product.colors.slice(0, 4).map((color) => (
              <div
                key={color}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ 
                  backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase()
                }}
                title={color}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-gray-500 ml-1">
                +{product.colors.length - 4}
              </span>
            )}
          </div>

          <span className="text-xs text-gray-400">•</span>

          <div className="text-xs text-gray-500">
            {product.sizes.join(', ')}
          </div>
        </div>
      </div>
    </Link>
  );
}