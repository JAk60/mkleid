// app/api/admin/orders/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    console.log('📦 Admin Orders API called');

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('order_status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('❌ Orders query error:', error);
      throw error;
    }

    console.log(`✅ Found ${orders?.length || 0} orders`);

    return NextResponse.json(orders || [], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('❌ Admin Orders API Error:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch orders',
        orders: []
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('✏️ Updating order...');

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update order error:', error);
      throw error;
    }

    console.log('✅ Order updated:', data.id);

    return NextResponse.json(
      { success: true, order: data },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Update order error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update order' 
      },
      { status: 500 }
    );
  }
}