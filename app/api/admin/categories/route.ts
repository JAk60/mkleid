// ========================================
// app/api/admin/categories/route.ts - Admin API
// ========================================

import { NextResponse } from "next/server";
import {
	getCategories,
	createCategory,
	updateCategory,
	deleteCategory,
} from "@/lib/categories-db";

export async function GET(request: Request) {
	try {
		const categories = await getCategories(true); // Include inactive
		return NextResponse.json({ success: true, data: categories });
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const category = await createCategory(body);
		return NextResponse.json({ success: true, data: category });
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const body = await request.json();
		const { id, ...updates } = body;
		const category = await updateCategory(id, updates);
		return NextResponse.json({ success: true, data: category });
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		if (!id) throw new Error("Category ID required");

		await deleteCategory(id);
		return NextResponse.json({ success: true });
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
