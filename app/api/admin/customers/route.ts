// app/api/admin/customers/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('👥 Admin Customers API called');

    // Try to get users from Supabase Auth
    let users: any[] = [];
    let usersError = null;

    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error('❌ Auth listUsers error:', error);
        usersError = error;
      } else {
        users = data?.users || [];
      }
    } catch (authError: any) {
      console.error('❌ Auth API error:', authError);
      usersError = authError;
    }

    // If we can't get users from auth, return empty array with warning
    if (usersError || users.length === 0) {
      console.warn('⚠️ Could not fetch users from Supabase Auth. Returning empty list.');
      console.warn('This might be because:');
      console.warn('1. You need to use a service role key (not anon key)');
      console.warn('2. Auth admin API is not available in your plan');
      console.warn('3. Network/permission issues');
      
      return NextResponse.json([], {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      });
    }

    console.log(`✅ Found ${users.length} auth users`);

    // For each user, get their order statistics
    const customersWithStats = await Promise.all(
      users.map(async (user) => {
        try {
          // Get total orders count
          const { count: totalOrders, error: ordersCountError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (ordersCountError) {
            console.error(`Error counting orders for user ${user.id}:`, ordersCountError);
          }

          // Get total spent from paid orders
          const { data: paidOrders, error: paidOrdersError } = await supabase
            .from('orders')
            .select('total')
            .eq('user_id', user.id)
            .eq('payment_status', 'paid');

          if (paidOrdersError) {
            console.error(`Error fetching paid orders for user ${user.id}:`, paidOrdersError);
          }

          const totalSpent = paidOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

          // Get last order date
          const { data: lastOrder, error: lastOrderError } = await supabase
            .from('orders')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error if no orders

          if (lastOrderError) {
            console.error(`Error fetching last order for user ${user.id}:`, lastOrderError);
          }

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
          // Return minimal user data if processing fails
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
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('❌ Admin Customers API Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return empty array instead of error to prevent frontend crash
    return NextResponse.json([], {
      status: 200, // Return 200 with empty array instead of 500
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Error': error.message || 'Unknown error'
      }
    });
  }
}