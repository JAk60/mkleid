// utils/helpers.ts

import { Product, FilterState } from "@/lib/types";

// ========================================
// GENDER CONVERSION HELPERS
// ========================================

/**
 * Convert URL gender param to DB gender value
 * URL: "Male" or "Female" → DB: "Male" or "Female"
 */
export function urlGenderToDbGender(
	urlGender: string
): "Male" | "Female" | null {
	const lower = urlGender.toLowerCase();
	if (lower === "male" || lower === "mens") return "Male";
	if (lower === "female" || lower === "womens") return "Female";
	return null;
}

/**
 * Convert DB gender value to URL gender param
 * DB: "Male" or "Female" → URL: "Male" or "Female"
 */
export function dbGenderToUrlGender(dbGender: string): string {
	if (dbGender === "Male") return "Male";
	if (dbGender === "Female") return "Female";
	return dbGender.toLowerCase();
}

/**
 * Convert DB gender to display name
 * DB: "Male" → Display: "Mens"
 * DB: "Female" → Display: "Womens"
 */
export function dbGenderToDisplayName(dbGender: string): string {
	if (dbGender === "Male") return "Mens";
	if (dbGender === "Female") return "Womens";
	return dbGender;
}

// ========================================
// CATEGORY CONVERSION HELPERS
// ========================================

/**
 * Convert URL category slug to DB category format
 * URL: "mens-oversized-tshirt" → DB: "Mens-Oversized_tshirt"
 */
export function urlCategoryToDbCategory(categorySlug: string): string {
	const parts = categorySlug.split("-");

	// Capitalize first part (mens/womens -> Mens/Womens)
	const prefix = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

	// Join remaining parts with underscores and capitalize each word
	const suffix = parts
		.slice(1)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("_");

	return `${prefix}-${suffix}`;
}

/**
 * Convert DB category to display name
 * DB: "Mens-Oversized_tshirt" → Display: "Oversized Tshirt"
 */
export function dbCategoryToDisplayName(dbCategory: string): string {
	return dbCategory
		.replace(/^(Mens|Womens)-/, "") // Remove prefix
		.replace(/_/g, " "); // Replace underscores with spaces
}

// ========================================
// PRODUCT FILTERING BY GENDER
// ========================================

/**
 * Get all products for Male
 */
export function getMenProducts(products: Product[]): Product[] {
	return products.filter((p) => p.gender === "Male");
}

/**
 * Get all products for Female
 */
export function getWomenProducts(products: Product[]): Product[] {
	return products.filter((p) => p.gender === "Female");
}

/**
 * Get products by gender
 */
export function getProductsByGender(
	products: Product[],
	gender: "Male" | "Female"
): Product[] {
	return products.filter((p) => p.gender === gender);
}

/**
 * Get products by gender and category
 */
export function getProductsByGenderAndCategory(
	products: Product[],
	gender: "Male" | "Female",
	category: string
): Product[] {
	return products.filter(
		(p) => p.gender === gender && p.category === category
	);
}

// ========================================
// SLUG GENERATION
// ========================================

// Generate slug from product name
export function generateSlug(name: string): string {
	return name
		?.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Generate category slug
export function generateCategorySlug(category: string): string {
	return category
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Parse category slug back to original format
export function parseCategorySlug(slug: string): {
	gender: string | null;
	category: string;
	isGenderSpecific: boolean;
} {
	// Check if it starts with mens/womens
	if (slug.startsWith("mens-") || slug.startsWith("womens-")) {
		const parts = slug.split("-");
		const genderPrefix = parts[0]; // 'mens' or 'womens'
		const gender = genderPrefix === "mens" ? "Male" : "Female";
		const categoryPart = parts
			.slice(1)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		return {
			gender,
			category: `${gender}-${categoryPart}`,
			isGenderSpecific: true,
		};
	} else {
		// Gender-neutral category (e.g., 'jersey', 'sweatpants')
		const categoryPart = slug
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		return {
			gender: null,
			category: categoryPart,
			isGenderSpecific: false,
		};
	}
}

// ========================================
// FORMATTING
// ========================================

// Format price
export function formatPrice(price: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "INR",
	}).format(price);
}

// ========================================
// FILTERING & SORTING
// ========================================

// Filter products based on filter state
export function filterProducts(
	products: Product[],
	filters: FilterState
): Product[] {
	return products.filter((product) => {
		// Gender filter
		if (
			filters.gender.length > 0 &&
			!filters.gender.includes(product.gender)
		) {
			return false;
		}

		// Category filter
		if (
			filters.categories.length > 0 &&
			!filters.categories.includes(product.category)
		) {
			return false;
		}

		// Price range filter
		if (
			product.price < filters.priceRange[0] ||
			product.price > filters.priceRange[1]
		) {
			return false;
		}

		// Size filter
		if (filters.sizes.length > 0) {
			const hasSize = filters.sizes.some((size) =>
				product.sizes.includes(size)
			);
			if (!hasSize) return false;
		}

		// Color filter
		if (filters.colors.length > 0) {
			const hasColor = filters.colors.some((color) =>
				product.colors
					.map((c) => c.toLowerCase())
					.includes(color.toLowerCase())
			);
			if (!hasColor) return false;
		}

		// Stock filter
		if (filters.inStock && product.stock === 0) {
			return false;
		}

		// Search query filter
		if (filters.searchQuery) {
			const query = filters.searchQuery.toLowerCase();
			const matchesName = product.name.toLowerCase().includes(query);
			const matchesDescription = product.description
				.toLowerCase()
				.includes(query);
			if (!matchesName && !matchesDescription) return false;
		}

		return true;
	});
}

// Sort products
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

// Get all unique colors from products
export function getAllColors(products: Product[]): string[] {
	const colors = new Set<string>();
	products.forEach((product) => {
		product.colors.forEach((color) => colors.add(color));
	});
	return Array.from(colors).sort();
}

// Get price range from products
export function getPriceRange(products: Product[]): [number, number] {
	if (products.length === 0) return [0, 100];

	const prices = products.map((p) => p.price);
	return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
}

// Add slug to product
export function addSlugToProduct(product: Product): Product {
	return {
		...product,
		slug: generateSlug(product.name),
	};
}
