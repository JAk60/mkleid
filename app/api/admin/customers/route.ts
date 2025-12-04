// app/api/admin/customers/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('👥 Admin Customers API called');

    // Get all users from Supabase Auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Users query error:', usersError);
      throw usersError;
    }

    // For each user, get their order statistics
    const customersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get total orders
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get total spent
        const { data: paidOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('user_id', user.id)
          .eq('payment_status', 'paid');

        const totalSpent = paidOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

        // Get last order date
        const { data: lastOrder } = await supabase
          .from('orders')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'N/A',
          phone: user.user_metadata?.phone || null,
          created_at: user.created_at,
          total_orders: totalOrders || 0,
          total_spent: totalSpent,
          last_order_date: lastOrder?.created_at || null
        };
      })
    );

    console.log(`✅ Found ${customersWithStats.length} customers`);

    return NextResponse.json(customersWithStats, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('❌ Admin Customers API Error:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch customers',
        customers: []
      },
      { status: 500 }
    );
  }
}