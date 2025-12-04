// app/api/admin/products/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    console.log('📦 Admin Products API called');

    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const limit = searchParams.get('limit');
    const gender = searchParams.get('gender');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock'); // Get products with low stock
    const outOfStock = searchParams.get('outOfStock'); // Get out of stock products

    // Build query
    let query = supabase
      .from('products')
      .select('*');

    // Apply filters
    if (gender) {
      query = query.eq('gender', gender);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (lowStock === 'true') {
      query = query.lte('stock', 5).gt('stock', 0);
    }

    if (outOfStock === 'true') {
      query = query.eq('stock', 0);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    // Order by created date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data: products, error } = await query;

    if (error) {
      console.error('❌ Products query error:', error);
      throw error;
    }

    console.log(`✅ Found ${products?.length || 0} products`);

    return NextResponse.json(products || [], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('❌ Admin Products API Error:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch products',
        products: []
      },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: Request) {
  try {
    console.log('📝 Creating new product...');

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'price', 'category', 'gender', 'stock'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert product
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: body.name,
        description: body.description || '',
        price: body.price,
        image_url: body.image_url || '',
        category: body.category,
        sizes: body.sizes || ['S', 'M', 'L', 'XL'],
        colors: body.colors || ['Black'],
        stock: body.stock,
        gender: body.gender,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Create product error:', error);
      throw error;
    }

    console.log('✅ Product created:', data.id);

    return NextResponse.json(
      { success: true, product: data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ Create product error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create product' 
      },
      { status: 500 }
    );
  }
}

// PUT/PATCH - Update product
export async function PUT(request: Request) {
  try {
    console.log('✏️ Updating product...');

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Update product
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update product error:', error);
      throw error;
    }

    console.log('✅ Product updated:', data.id);

    return NextResponse.json(
      { success: true, product: data },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Update product error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update product' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(request: Request) {
  try {
    console.log('🗑️ Deleting product...');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Delete product error:', error);
      throw error;
    }

    console.log('✅ Product deleted:', id);

    return NextResponse.json(
      { success: true, message: 'Product deleted successfully' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Delete product error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete product' 
      },
      { status: 500 }
    );
  }
}