// app/api/exchanges/route.ts - Customer API
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, user_id, original_items, requested_items, exchange_type, reason, description, status } = body;

    // Validate required fields
    if (!order_id || !user_id || !original_items || !requested_items || !exchange_type || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', order_id)
      .single();

    // Get user details
    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);

    // Create exchange request
    const { data, error } = await supabase
      .from('exchange_requests')
      .insert({
        order_id,
        user_id,
        original_items,
        requested_items,
        exchange_type,
        reason,
        description,
        status: status || 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        order_number: order?.order_number,
        customer_name: user?.user_metadata?.name || user?.email,
        customer_email: user?.email
      }
    });

  } catch (error: any) {
    console.error('Create exchange error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create exchange request' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('exchange_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error: any) {
    console.error('Get exchanges error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch exchanges' },
      { status: 500 }
    );
  }
}
