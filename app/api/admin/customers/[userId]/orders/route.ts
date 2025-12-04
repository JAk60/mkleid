// app/api/admin/customers/[userId]/orders/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    console.log(`📦 Fetching orders for user: ${userId}`);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
    console.error('❌ Customer Orders API Error:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch customer orders',
        orders: []
      },
      { status: 500 }
    );
  }
}