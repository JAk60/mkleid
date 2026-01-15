// app/products/[slug]/page.tsx - FIXED VERSION WITH PROPER COLOR HANDLING

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { getProducts } from '@/lib/supabase';
import { formatPrice, generateSlug, generateCategorySlug, addSlugToProduct } from '@/utils/helpers';
import ProductCard from '@/components/products/ProductCard';
import { ChevronLeft, Check, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { toast } from 'react-hot-toast';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { addItem, isInCart, getCartItemQuantity } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
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
                
                // Set default size and color
                setSelectedSize(foundProduct.sizes[0] || '');
                
                // Handle color - get first color value
                const firstColor = foundProduct.colors[0];
                const colorValue = typeof firstColor === 'string' 
                    ? firstColor 
                    : (firstColor && typeof firstColor === 'object' && 'hex' in firstColor)
                        ? (firstColor as { hex: string }).hex
                        : 'Black';
                setSelectedColor(colorValue);

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

    // Reset quantity when size or color changes
    useEffect(() => {
        if (product && selectedSize && selectedColor) {
            const itemInCart = getCartItemQuantity(product.id, selectedSize, selectedColor);
            if (itemInCart > 0) {
                setQuantity(1); // Reset to 1 when changing to variant already in cart
            }
        }
    }, [selectedSize, selectedColor, product, getCartItemQuantity]);

    const handleQuantityChange = (change: number) => {
        const newQuantity = quantity + change;

        if (newQuantity < 1) return;

        if (product && product.stock > 0) {
            // Check total quantity (in cart + new quantity)
            const itemInCart = getCartItemQuantity(product.id, selectedSize, selectedColor);
            const totalQuantity = itemInCart + newQuantity;
            
            if (totalQuantity > product.stock) {
                toast.error(`Only ${product.stock} items available in stock`);
                return;
            }
        }

        setQuantity(newQuantity);
    };

    const handleColorChange = (color: any) => {
        // Get color value
        const colorValue = typeof color === 'string' 
            ? color 
            : (color && typeof color === 'object' && 'hex' in color)
                ? (color as { hex: string }).hex
                : 'Black';
        
        setSelectedColor(colorValue);
        // Reset quantity when color changes
        setQuantity(1);
    };

    const handleSizeChange = (size: string) => {
        setSelectedSize(size);
        // Reset quantity when size changes
        setQuantity(1);
    };

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

        // Check stock including items already in cart
        const itemInCart = getCartItemQuantity(product.id, selectedSize, selectedColor);
        const totalQuantity = itemInCart + quantity;
        
        if (totalQuantity > product.stock) {
            toast.error(`Only ${product.stock - itemInCart} more items available`);
            return;
        }

        setIsAdding(true);

        // Add items to cart based on quantity
        for (let i = 0; i < quantity; i++) {
            addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url || '/placeholder-product.jpg',
                size: selectedSize,
                color: selectedColor,
                stock: product.stock,
            });
        }

        const itemDescription = `${quantity} × ${product.name} (${selectedSize}, ${selectedColor})`;
        toast.success(`Added ${itemDescription} to cart!`, {
            icon: '🛒',
            duration: 3000,
        });

        // Reset adding state and quantity after animation
        setTimeout(() => {
            setIsAdding(false);
            setQuantity(1);
        }, 600);
    };

    // Helper to get color hex
    const getColorHex = (color: any): string => {
        if (typeof color === 'string') {
            return color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase();
        } else if (color && typeof color === 'object' && 'hex' in color) {
            return (color as { hex: string }).hex;
        }
        return '#000000';
    };

    // Helper to get color name/value
    const getColorValue = (color: any): string => {
        if (typeof color === 'string') {
            return color;
        } else if (color && typeof color === 'object' && 'hex' in color) {
            return (color as { hex: string }).hex;
        }
        return 'Unknown';
    };

    // Helper to get color display name
    const getColorName = (color: any): string => {
        if (typeof color === 'string') {
            return color;
        } else if (color && typeof color === 'object') {
            const colorObj = color as { name?: string; hex: string };
            return colorObj.name || colorObj.hex;
        }
        return 'Unknown';
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
    const inCart = isInCart(product.id, selectedSize, selectedColor);
    const cartQuantity = getCartItemQuantity(product.id, selectedSize, selectedColor);

    // Prepare images array (support for future multiple images)
    const images = product.images && product.images.length > 0
        ? product.images
        : [product.image_url];

    return (
        <div className="min-h-screen bg-[#E3D9C6]">
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
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
                                        className={`relative aspect-square rounded-lg overflow-hidden ${
                                            selectedImage === index ? 'ring-2 ring-gray-900' : 'ring-1 ring-gray-200'
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
                            {cartQuantity > 0 && (
                                <p className="text-blue-600 font-medium text-sm mt-1">
                                    {cartQuantity} already in cart
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
                                        onClick={() => handleSizeChange(size)}
                                        disabled={isOutOfStock}
                                        className={`px-6 py-3 border rounded-lg font-medium transition-all ${
                                            selectedSize === size
                                                ? 'bg-gray-900 text-white border-gray-900'
                                                : 'bg-[#E3D9C6] text-gray-900 border-gray-300 hover:border-gray-900'
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
                                Color: <span className="font-normal text-gray-600">
                                    {getColorName(product.colors.find(c => getColorValue(c) === selectedColor))}
                                </span>
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {product.colors.map((color, index) => {
                                    const colorValue = getColorValue(color);
                                    const colorHex = getColorHex(color);
                                    const colorName = getColorName(color);
                                    const isSelected = selectedColor === colorValue;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleColorChange(color)}
                                            disabled={isOutOfStock}
                                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                                                isSelected
                                                    ? 'border-gray-900 ring-2 ring-gray-900'
                                                    : 'border-gray-300 hover:border-gray-900'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full border border-gray-300"
                                                style={{ backgroundColor: colorHex }}
                                            />
                                            <span className="text-sm font-medium">{colorName}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quantity Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-3">
                                Quantity
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border border-gray-300 rounded-lg">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={isOutOfStock || quantity <= 1}
                                        className="px-4 py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="px-6 py-3 font-medium border-x border-gray-300 min-w-[60px] text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={isOutOfStock || (product.stock > 0 && (cartQuantity + quantity) >= product.stock)}
                                        className="px-4 py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                {product.stock > 0 && product.stock <= 10 && (
                                    <span className="text-sm text-gray-600">
                                        Max: {product.stock - cartQuantity} available
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="space-y-3">
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock || isAdding}
                                className={`w-full py-4 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                    isOutOfStock
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
                                        Add More to Cart
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        Add {quantity > 1 ? `${quantity} ` : ''}to Cart
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