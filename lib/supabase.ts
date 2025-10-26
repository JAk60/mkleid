// lib/supabase.ts

import { createClient } from "@supabase/supabase-js";
import { Product } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fetch all products
export async function getProducts() {
	const { data, error } = await supabase
		.from("products")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data as Product[];
}

// Fetch single product by slug
export async function getProductBySlug(slug: string) {
	const { data, error } = await supabase
		.from("products")
		.select("*")
		.ilike("name", slug.replace(/-/g, " "))
		.single();

	if (error) throw error;
	return data as Product;
}

// Fetch products by category
export async function getProductsByCategory(categorySlug: string) {
	// Convert slug back to category name (e.g., 'mens-jersey' -> 'Mens-Jersey')
	const parts = categorySlug.split("-");
	const gender = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
	const category = parts
		.slice(1)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

	const categoryName = `${gender}-${category}`;

	const { data, error } = await supabase
		.from("products")
		.select("*")
		.eq("category", categoryName)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data as Product[];
}

// Fetch products by gender
export async function getProductsByGender(gender: "Male" | "Female") {
	const { data, error } = await supabase
		.from("products")
		.select("*")
		.eq("gender", gender)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data as Product[];
}

// Search products
export async function searchProducts(query: string) {
	const { data, error } = await supabase
		.from("products")
		.select("*")
		.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data as Product[];
}
