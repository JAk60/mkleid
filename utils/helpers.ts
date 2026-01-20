// utils/helpers.ts

import { Product, FilterState } from "@/lib/types";

/* ========================================
   TYPES
======================================== */

export type ColorObject = {
  name: string;
  hex: string;
};

export type ProductColor = string | ColorObject;

/* ========================================
   GENDER CONVERSION HELPERS
======================================== */

/**
 * Convert URL gender param to DB gender value
 */
export function urlGenderToDbGender(
  urlGender: string
): "Male" | "Female" | null {
  const lower = urlGender.toLowerCase();
  if (lower === "male" || lower === "mens") return "Male";
  if (lower === "female" || lower === "womens") return "Female";
  return null;
}

export function dbGenderToUrlGender(dbGender: string): string {
  if (dbGender === "Male") return "Male";
  if (dbGender === "Female") return "Female";
  return dbGender.toLowerCase();
}

export function dbGenderToDisplayName(dbGender: string): string {
  if (dbGender === "Male") return "Mens";
  if (dbGender === "Female") return "Womens";
  return dbGender;
}

/* ========================================
   CATEGORY HELPERS
======================================== */

export function urlCategoryToDbCategory(categorySlug: string): string {
  const parts = categorySlug.split("-");
  const prefix = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

  const suffix = parts
    .slice(1)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join("_");

  return `${prefix}-${suffix}`;
}

export function dbCategoryToDisplayName(dbCategory: string): string {
  return dbCategory.replace(/^(Mens|Womens)-/, "").replace(/_/g, " ");
}

/* ========================================
   PRODUCT FILTERING
======================================== */

export function getMenProducts(products: Product[]): Product[] {
  return products.filter(p => p.gender === "Male");
}

export function getWomenProducts(products: Product[]): Product[] {
  return products.filter(p => p.gender === "Female");
}

export function getProductsByGender(
  products: Product[],
  gender: "Male" | "Female"
): Product[] {
  return products.filter(p => p.gender === gender);
}

export function getProductsByGenderAndCategory(
  products: Product[],
  gender: "Male" | "Female",
  category: string
): Product[] {
  return products.filter(
    p => p.gender === gender && p.category === category
  );
}

/* ========================================
   SLUG HELPERS
======================================== */

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ========================================
   FORMATTING
======================================== */

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
}

/* ========================================
   SORTING
======================================== */

export function sortProducts(
  products: Product[],
  sortBy: FilterState["sortBy"]
): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

/* ========================================
   PRICE RANGE
======================================== */

export function getPriceRange(products: Product[]): [number, number] {
  if (!products.length) return [0, 100];
  const prices = products.map(p => p.price);
  return [
    Math.floor(Math.min(...prices)),
    Math.ceil(Math.max(...prices)),
  ];
}

/* ========================================
   SLUG ENHANCER
======================================== */

export function addSlugToProduct(product: Product): Product {
  return {
    ...product,
    slug: generateSlug(product.name),
  };
}

/* ========================================
   COLOR HELPERS (🔥 FIXED)
======================================== */

export function getAllColors(
  products: Product[]
): ProductColor[] {
  const colorMap = new Map<string, ProductColor>();

  products.forEach(product => {
    const colors = product.colors as ProductColor[] | undefined;
    if (!colors) return;

    colors.forEach(color => {
      const key =
        typeof color === "string"
          ? color
          : color.name || color.hex;

      if (!colorMap.has(key)) {
        colorMap.set(key, color);
      }
    });
  });

  return Array.from(colorMap.values());
}

/* ========================================
   CATEGORY EXTRACTION
======================================== */

export function extractCategoryFromSlug(slug: string): string {
  const withoutPrefix = slug.replace(/^(mens|womens)-/, "");

  const specialCases: Record<string, string> = {
    "baby-tees": "Baby Tees",
    "oversized-tshirt": "Oversized T-Shirt",
    "oversized-t-shirt": "Oversized T-Shirt",
    "flared-pants": "Flared Pants",
    "sweatpants": "Sweatpants",
    "sweatshirt": "Sweatshirt",
    "jersey": "Jersey",
    "shirts": "Shirts",
  };

  if (specialCases[withoutPrefix]) {
    return specialCases[withoutPrefix];
  }

  return withoutPrefix
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/* ========================================
   MAIN FILTER ENGINE
======================================== */

export function filterProducts(
  products: Product[],
  filters: FilterState
): Product[] {
  return products.filter(product => {
    if (
      filters.gender.length &&
      !filters.gender.includes(product.gender)
    ) {
      return false;
    }

    if (
      filters.categories.length &&
      !filters.categories.includes(product.category)
    ) {
      return false;
    }

    if (
      product.price < filters.priceRange[0] ||
      product.price > filters.priceRange[1]
    ) {
      return false;
    }

    if (filters.sizes.length) {
      const match = filters.sizes.some(size =>
        product.sizes.includes(size)
      );
      if (!match) return false;
    }

    if (filters.colors.length) {
      const productColors = (product.colors as ProductColor[] | undefined)
        ?.map(color =>
          typeof color === "string"
            ? color
            : color.name || color.hex
        ) ?? [];

      const match = filters.colors.some(fc =>
        productColors.includes(fc)
      );

      if (!match) return false;
    }

    if (filters.inStock && product.stock === 0) {
      return false;
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        product.name.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q);

      if (!match) return false;
    }

    return true;
  });
}
