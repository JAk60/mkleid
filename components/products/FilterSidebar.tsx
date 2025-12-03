// components/FilterSidebar.tsx

'use client';

import { FilterState, CATEGORIES, ALL_SIZES } from '@/lib/types';
import { X } from 'lucide-react';

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableColors: string[];
  priceRange: [number, number];
  onReset: () => void;
}

export default function FilterSidebar({
  filters,
  onChange,
  availableColors,
  priceRange,
  onReset
}: FilterSidebarProps) {

  const handleGenderChange = (gender: string) => {
    const newGenders = filters.gender.includes(gender)
      ? filters.gender.filter(g => g !== gender)
      : [...filters.gender, gender];
    onChange({ ...filters, gender: newGenders, categories: [] }); // Reset categories when gender changes
  };

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onChange({ ...filters, categories: newCategories });
  };

  const handleSizeChange = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size];
    onChange({ ...filters, sizes: newSizes });
  };

  const handleColorChange = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    onChange({ ...filters, colors: newColors });
  };

  const getAvailableCategories = () => {
    if (filters.gender.length === 0) {
      return [...CATEGORIES.Male?.map(c => ({ name: c, gender: 'Male' })),
      ...CATEGORIES.Female?.map(c => ({ name: c, gender: 'Female' }))];
    }

    return filters.gender.flatMap(g =>
      CATEGORIES[g as 'Male' | 'Female']?.map(c => ({ name: c, gender: g }))
    );
  };

  const hasActiveFilters =
    filters.gender.length > 0 ||
    filters.categories.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.inStock ||
    filters.priceRange[0] !== priceRange[0] ||
    filters.priceRange[1] !== priceRange[1];

  return (
    <div className="bg-[#E3D9C6] w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Gender Filter */}
      <div className="border-b pb-6">
        <h3 className="font-medium mb-3">Gender</h3>
        <div className="space-y-2">
          {['Male', 'Female'].map(gender => (
            <label key={gender} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.gender.includes(gender)}
                onChange={() => handleGenderChange(gender)}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm">{gender === 'Male' ? 'Mens' : 'Womens'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-b pb-6">
        <h3 className="font-medium mb-3">Category</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {getAvailableCategories()?.map(({ name, gender }) => {
            const categoryKey = `${gender}-${name}`;
            return (
              <label key={categoryKey} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(categoryKey)}
                  onChange={() => handleCategoryChange(categoryKey)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm">{name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="border-b pb-6">
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="space-y-3">
          <input
            type="range"
            min={priceRange[0]}
            max={priceRange[1]}
            value={filters.priceRange[1]}
            onChange={(e) => onChange({
              ...filters,
              priceRange: [priceRange[0], Number(e.target.value)]
            })}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>${priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Size Filter */}
      <div className="border-b pb-6">
        <h3 className="font-medium mb-3">Sizes</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map(size => (
            <button
              key={size}
              onClick={() => handleSizeChange(size)}
              className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${filters.sizes.includes(size)
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-[#E3D9C6] text-gray-900 border-gray-300 hover:border-gray-900'
                }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter */}
      <div className="border-b pb-6">
        <h3 className="font-medium mb-3">Colors</h3>
        <div className="flex flex-wrap gap-2">
          {availableColors.map(color => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${filters.colors.includes(color)
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-[#E3D9C6] text-gray-900 border-gray-300 hover:border-gray-900'
                }`}
            >
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{
                  backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase()
                }}
              />
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Filter */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ ...filters, inStock: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-sm">In stock only</span>
        </label>
      </div>
    </div>
  );
}