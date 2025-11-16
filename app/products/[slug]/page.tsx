// app/products/[slug]/page.tsx - UPDATED WITH CART

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { getProducts } from '@/lib/supabase';
import { formatPrice, generateSlug, generateCategorySlug, addSlugToProduct } from '@/utils/helpers';
import ProductCard from '@/components/products/ProductCard';
import { ChevronLeft, Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { toast } from 'react-hot-toast';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { addItem, isInCart } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        async function fetchProduct() {
            try {
                const allProducts = await getProducts();
                const productsWithSlugs = allProducts.map(addSlugToProduct);

                // Find the product by slug
                const foundProduct = productsWithSlugs.find(
                    p => p.slug === slug
                );

                if (!foundProduct) {
                    router.push('/products');
                    return;
                }

                setProduct(foundProduct);
                setSelectedSize(foundProduct.sizes[0] || '');
                setSelectedColor(foundProduct.colors[0] || '');

                // Get related products from same category
                const related = productsWithSlugs
                    .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
                    .slice(0, 4);
                setRelatedProducts(related);

            } catch (error) {
                console.error('Error fetching product:', error);
                router.push('/products');
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
    }, [slug, router]);

    const handleAddToCart = () => {
        if (!product) return;

        if (!selectedSize) {
            toast.error('Please select a size');
            return;
        }

        if (!selectedColor) {
            toast.error('Please select a color');
            return;
        }

        if (product.stock === 0) {
            toast.error('This item is out of stock');
            return;
        }

        setIsAdding(true);

        // Add item to cart
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url || '/placeholder-product.jpg',
            size: selectedSize,
            color: selectedColor,
            stock: product.stock,
        });

        toast.success(`Added ${product.name} to cart!`, {
            icon: '🛒',
        });

        // Reset adding state after animation
        setTimeout(() => setIsAdding(false), 600);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading product...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return null;
    }

    const categorySlug = generateCategorySlug(product.category);
    const isOutOfStock = product.stock === 0;
    const inCart = isInCart(product.id, selectedSize);

    // Prepare images array (support for future multiple images)
    const images = product.images && product.images.length > 0
        ? product.images
        : [product.image_url];

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/products" className="text-gray-600 hover:text-gray-900">
                            Products
                        </Link>
                        <span className="text-gray-400">/</span>
                        <Link
                            href={`/products/category/${categorySlug}`}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            {product.category.split('-').pop()}
                        </Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900">{product.name}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <Link
                    href="/products"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to all products
                </Link>

                {/* Product Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Images */}
                    <div className="space-y-4">
                        <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-gray-100">
                            <Image
                                src={images[selectedImage] || '/placeholder-product.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                                    <span className="text-white font-semibold text-2xl">Out of Stock</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Gallery (for future multiple images) */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`relative aspect-square rounded-lg overflow-hidden ${selectedImage === index ? 'ring-2 ring-gray-900' : 'ring-1 ring-gray-200'
                                            }`}
                                    >
                                        <Image
                                            src={img || '/placeholder-product.jpg'}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="25vw"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                            <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
                        </div>

                        <p className="text-gray-600 leading-relaxed">{product.description}</p>

                        {/* Stock Status */}
                        <div>
                            {isOutOfStock ? (
                                <p className="text-red-600 font-medium">Out of stock</p>
                            ) : product.stock <= 5 ? (
                                <p className="text-orange-600 font-medium">Only {product.stock} left in stock!</p>
                            ) : (
                                <p className="text-green-600 font-medium flex items-center gap-1">
                                    <Check className="w-5 h-5" />
                                    In stock
                                </p>
                            )}
                        </div>

                        {/* Size Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-3">
                                Size: <span className="font-normal text-gray-600">{selectedSize}</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {product.sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        disabled={isOutOfStock}
                                        className={`px-6 py-3 border rounded-lg font-medium transition-all ${selectedSize === size
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-900 border-gray-300 hover:border-gray-900'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-3">
                                Color: <span className="font-normal text-gray-600">{selectedColor}</span>
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {product.colors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        disabled={isOutOfStock}
                                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${selectedColor === color
                                            ? 'border-gray-900 ring-2 ring-gray-900'
                                            : 'border-gray-300 hover:border-gray-900'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-300"
                                            style={{
                                                backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase()
                                            }}
                                        />
                                        <span className="text-sm font-medium">{color}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="space-y-3">
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock || isAdding}
                                className={`w-full py-4 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${isOutOfStock
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : inCart
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                                    } ${isAdding ? 'scale-95' : 'scale-100'}`}
                            >
                                {isOutOfStock ? (
                                    'Out of Stock'
                                ) : isAdding ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Adding...
                                    </>
                                ) : inCart ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Added to Cart
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        Add to Cart
                                    </>
                                )}
                            </button>

                            {inCart && (
                                <Link
                                    href="/cart"
                                    className="block w-full py-4 text-center border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    View Cart
                                </Link>
                            )}
                        </div>

                        {/* Additional Info */}
                        <div className="border-t pt-6 space-y-3 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Category:</span>
                                <Link
                                    href={`/products/category/${categorySlug}`}
                                    className="text-gray-900 hover:underline font-medium"
                                >
                                    {product.category.split('-').pop()}
                                </Link>
                            </div>
                            <div className="flex justify-between">
                                <span>Gender:</span>
                                <span className="text-gray-900 font-medium">
                                    {product.gender === 'Male' ? 'Mens' : 'Womens'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Available Sizes:</span>
                                <span className="text-gray-900 font-medium">{product.sizes.join(', ')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">You might also like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <ProductCard key={relatedProduct.id} product={relatedProduct} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}