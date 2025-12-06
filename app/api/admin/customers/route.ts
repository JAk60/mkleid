// app/api/admin/customers/route.ts
// FIXED: Uses service role key to access auth users

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin'; // Import admin client

export async function GET() {
  try {
    console.log('👥 Admin Customers API called');

    // Use admin client to list users (requires service role key)
    const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const users = data?.users || [];
    console.log(`✅ Found ${users.length} auth users`);

    if (users.length === 0) {
      console.warn('⚠️ No customers found. Make sure users are registered.');
      return NextResponse.json([], {
        status: 200,
        headers: { 'Cache-Control': 'no-store, must-revalidate' }
      });
    }

    // For each user, get their order statistics
    const customersWithStats = await Promise.all(
      users.map(async (user) => {
        try {
          // Get total orders count
          const { count: totalOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Get total spent from paid orders
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
            .maybeSingle();

          return {
            id: user.id,
            email: user.email || 'No email',
            name: user.user_metadata?.name || 
                  user.user_metadata?.full_name || 
                  user.email?.split('@')[0] || 
                  'Anonymous User',
            phone: user.user_metadata?.phone || user.phone || null,
            created_at: user.created_at,
            total_orders: totalOrders || 0,
            total_spent: totalSpent,
            last_order_date: lastOrder?.created_at || null
          };
        } catch (userError: any) {
          console.error(`Error processing user ${user.id}:`, userError);
          return {
            id: user.id,
            email: user.email || 'No email',
            name: user.user_metadata?.name || 'Error loading',
            phone: null,
            created_at: user.created_at,
            total_orders: 0,
            total_spent: 0,
            last_order_date: null
          };
        }
      })
    );

    console.log(`✅ Processed ${customersWithStats.length} customers with stats`);

    return NextResponse.json(customersWithStats, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, must-revalidate' }
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