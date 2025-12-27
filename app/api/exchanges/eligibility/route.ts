// app/api/exchanges/eligibility/route.ts - NEW FILE

import { NextResponse } from 'next/server';
import { checkExchangeEligibility } from '@/lib/supabase-exchanges';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // You'll need to get userId from session/auth
    // For now, we'll get it from the order
    const { supabase } = await import('@/lib/supabase');
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const eligibility = await checkExchangeEligibility(orderId, order.user_id);

    return NextResponse.json({
      success: true,
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      warnings: eligibility.warnings,
      daysRemaining: eligibility.daysRemaining
    });

  } catch (error: any) {
    console.error('Eligibility check API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}