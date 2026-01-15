// app/api/admin/products/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    console.log('📦 Admin Products API called');

    const { searchParams } = new URL(request.url);
    
    const limit = searchParams.get('limit');
    const gender = searchParams.get('gender');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');
    const outOfStock = searchParams.get('outOfStock');

    // Build query for products
    let query = supabase
      .from('products')
      .select('*');

    if (gender) query = query.eq('gender', gender);
    if (category) query = query.eq('category', category);
    if (lowStock === 'true') query = query.lte('stock', 5).gt('stock', 0);
    if (outOfStock === 'true') query = query.eq('stock', 0);
    if (limit) query = query.limit(parseInt(limit));

    query = query.order('created_at', { ascending: false });

    const { data: products, error } = await query;

    if (error) {
      console.error('❌ Products query error:', error);
      throw error;
    }

    // Fetch images and size charts for each product
    const productsWithDetails = await Promise.all(
      (products || []).map(async (product) => {
        // Fetch product images
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', product.id)
          .order('display_order', { ascending: true });

        // Fetch size chart
        const { data: sizeChart } = await supabase
          .from('size_charts')
          .select('*')
          .eq('product_id', product.id)
          .order('size', { ascending: true });

        return {
          ...product,
          images: images || [],
          size_chart: sizeChart || [],
        };
      })
    );

    console.log(`✅ Found ${productsWithDetails.length} products with images and size charts`);

    return NextResponse.json(productsWithDetails, {
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
    
    const requiredFields = ['name', 'price', 'category', 'gender', 'stock'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: body.name,
        description: body.description || '',
        price: body.price,
        image_url: body.image_url || (body.images?.[0]?.image_url || ''),
        category: body.category,
        sizes: body.sizes || ['S', 'M', 'L', 'XL'],
        colors: body.colors || ['Black'],
        stock: body.stock,
        gender: body.gender,
        has_size_chart: body.has_size_chart || false,
      })
      .select()
      .single();

    if (productError) {
      console.error('❌ Create product error:', productError);
      throw productError;
    }

    console.log('✅ Product created:', product.id);

    // Insert product images if provided
    if (body.images && body.images.length > 0) {
      const imagesToInsert = body.images.map((img: any) => ({
        product_id: product.id,
        image_url: img.image_url,
        display_order: img.display_order,
        is_primary: img.is_primary || false,
      }));

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imagesToInsert);

      if (imagesError) {
        console.error('❌ Insert images error:', imagesError);
      } else {
        console.log(`✅ Inserted ${imagesToInsert.length} images`);
      }
    }

    // Insert size chart if provided
    if (body.has_size_chart && body.size_chart && body.size_chart.length > 0) {
      const sizeChartToInsert = body.size_chart.map((chart: any) => ({
        product_id: product.id,
        size: chart.size,
        chest: chart.chest || null,
        length: chart.length || null,
        bust: chart.bust || null,
        length_female: chart.length_female || null,
        notes: chart.notes || '',
      }));

      const { error: chartError } = await supabase
        .from('size_charts')
        .insert(sizeChartToInsert);

      if (chartError) {
        console.error('❌ Insert size chart error:', chartError);
      } else {
        console.log(`✅ Inserted ${sizeChartToInsert.length} size chart entries`);
      }
    }

    return NextResponse.json(
      { success: true, product },
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

// PUT - Update product
export async function PUT(request: Request) {
  try {
    console.log('✏️ Updating product...');

    const body = await request.json();
    const { id, images, size_chart, has_size_chart, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Update primary image_url if images are provided
    if (images && images.length > 0) {
      const primaryImage = images.find((img: any) => img.is_primary) || images[0];
      updates.image_url = primaryImage.image_url;
    }

    // Update has_size_chart flag
    updates.has_size_chart = has_size_chart || false;

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (productError) {
      console.error('❌ Update product error:', productError);
      throw productError;
    }

    console.log('✅ Product updated:', product.id);

    // Update product images
    if (images) {
      // Delete existing images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id);

      // Insert new images
      if (images.length > 0) {
        const imagesToInsert = images.map((img: any) => ({
          product_id: id,
          image_url: img.image_url,
          display_order: img.display_order,
          is_primary: img.is_primary || false,
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);

        if (imagesError) {
          console.error('❌ Update images error:', imagesError);
        } else {
          console.log(`✅ Updated ${imagesToInsert.length} images`);
        }
      }
    }

    // Update size chart
    if (has_size_chart !== undefined) {
      // Delete existing size chart
      await supabase
        .from('size_charts')
        .delete()
        .eq('product_id', id);

      // Insert new size chart if enabled
      if (has_size_chart && size_chart && size_chart.length > 0) {
        const sizeChartToInsert = size_chart.map((chart: any) => ({
          product_id: id,
          size: chart.size,
          chest: chart.chest || null,
          length: chart.length || null,
          bust: chart.bust || null,
          length_female: chart.length_female || null,
          notes: chart.notes || '',
        }));

        const { error: chartError } = await supabase
          .from('size_charts')
          .insert(sizeChartToInsert);

        if (chartError) {
          console.error('❌ Update size chart error:', chartError);
        } else {
          console.log(`✅ Updated ${sizeChartToInsert.length} size chart entries`);
        }
      }
    }

    return NextResponse.json(
      { success: true, product },
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

    // Delete product (CASCADE will handle images and size_charts)
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