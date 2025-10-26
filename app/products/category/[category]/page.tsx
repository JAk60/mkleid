// app/products/category/[category]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product, FilterState } from '@/lib/types';
import { getProducts } from '@/lib/supabase';
import { 
  filterProducts, 
  sortProducts, 
  getAllColors, 
  getPriceRange,
  addSlugToProduct,
  parseCategorySlug
} from '@/utils/helpers';
import ProductCard from '@/components/products/ProductCard';
import FilterSidebar from '@/components/products/FilterSidebar';
import SearchBar from '@/components/SearchBar';
import { SlidersHorizontal, X, ChevronLeft } from 'lucide-react';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as string;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categoryInfo, setCategoryInfo] = useState<{ 
    gender: string | null; 
    category: string;
    isGenderSpecific: boolean;
  } | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    gender: [],
    categories: [],
    priceRange: [0, 100],
    sizes: [],
    colors: [],
    inStock: false,
    searchQuery: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Parse category slug
        const parsedCategory = parseCategorySlug(categorySlug);
        setCategoryInfo(parsedCategory);

        // Fetch all products
        const products = await getProducts();
        const productsWithSlugs = products.map(addSlugToProduct);
        setAllProducts(productsWithSlugs);

        let filtered: Product[];

        if (parsedCategory.isGenderSpecific) {
          // Gender-specific: filter by exact category (e.g., "Male-Jersey")
          filtered = productsWithSlugs.filter(p => p.category === parsedCategory.category);
        } else {
          // Gender-neutral: filter by category name across both genders
          // E.g., "Jersey" matches both "Male-Jersey" and "Female-Jersey"
          filtered = productsWithSlugs.filter(p => {
            const categoryPart = p.category.split('-')[1]; // Get "Jersey" from "Male-Jersey"
            return categoryPart?.toLowerCase() === parsedCategory.category.toLowerCase();
          });
        }
        
        if (filtered.length === 0) {
          // Category doesn't exist, redirect to all products
          router.push('/products');
          return;
        }

        setCategoryProducts(filtered);
        
        // Set initial price range and pre-select the category/gender
        const range = getPriceRange(filtered);
        if (parsedCategory.isGenderSpecific) {
          setFilters(prev => ({ 
            ...prev, 
            priceRange: range,
            categories: [parsedCategory.category] // Pre-select this specific category
          }));
        } else {
          // For gender-neutral, just set price range
          setFilters(prev => ({ 
            ...prev, 
            priceRange: range
          }));
        }

      } catch (error) {
        console.error('Error fetching products:', error);
        router.push('/products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [categorySlug, router]);

  const priceRange = getPriceRange(categoryProducts);
  const availableColors = getAllColors(categoryProducts);
  const filteredProducts = filterProducts(categoryProducts, filters);
  const sortedProducts = sortProducts(filteredProducts, filters.sortBy);

  const handleResetFilters = () => {
    setFilters({
      gender: [],
      categories: categoryInfo?.isGenderSpecific ? [categoryInfo.category] : [],
      priceRange: priceRange,
      sizes: [],
      colors: [],
      inStock: false,
      searchQuery: '',
      sortBy: 'newest',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!categoryInfo) {
    return null;
  }

  // Display names
  const categoryDisplayName = categoryInfo.isGenderSpecific 
    ? categoryInfo.category.split('-').pop() // "Jersey" from "Male-Jersey"
    : categoryInfo.category; // "Jersey"
  
  const genderDisplayName = categoryInfo.gender === 'Male' ? 'Mens' : 
                           categoryInfo.gender === 'Female' ? 'Womens' : 
                           null;

  const pageTitle = categoryInfo.isGenderSpecific 
    ? `${genderDisplayName} ${categoryDisplayName}`
    : categoryDisplayName;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/products" className="text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <span className="text-gray-400">/</span>
            {genderDisplayName && (
              <>
                <span className="text-gray-900">{genderDisplayName}</span>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-900">{categoryDisplayName}</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
          {!categoryInfo.isGenderSpecific && (
            <p className="text-gray-600 mb-6">
              Showing products for both mens and womens
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1">
              <SearchBar
                value={filters.searchQuery}
                onChange={(value) => setFilters({ ...filters, searchQuery: value })}
                placeholder={`Search ${categoryDisplayName?.toLowerCase()}...`}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </button>
              
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Products Link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to all products
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                availableColors={availableColors}
                priceRange={priceRange}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Mobile Sidebar */}
          {mobileFiltersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileFiltersOpen(false)}>
              <div 
                className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <button 
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar
                  filters={filters}
                  onChange={setFilters}
                  availableColors={availableColors}
                  priceRange={priceRange}
                  onReset={handleResetFilters}
                />
              </div>
            </div>
          )}

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{sortedProducts.length}</span> of{' '}
                <span className="font-semibold">{categoryProducts.length}</span> products
              </p>
            </div>

            {sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">No products found</p>
                <p className="text-gray-400 text-sm mb-4">Try adjusting your filters</p>
                <button
                  onClick={handleResetFilters}
                  className="text-gray-900 hover:underline font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}