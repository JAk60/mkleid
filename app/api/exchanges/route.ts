// app/api/exchanges/route.ts
import { NextResponse } from 'next/server';
import { 
  createExchangeRequest,
  getUserExchangeRequests,
  checkExchangeEligibility,
  ExchangeRequest 
} from '@/lib/supabase-exchanges';
import { supabase } from '@/lib/supabase';

// ==========================================
// POST - Create Exchange Request
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'order_id',
      'user_id',
      'original_items',
      'requested_items',
      'exchange_type',
      'reason'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Verify user owns the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, order_number')
      .eq('id', body.order_id)
      .eq('user_id', body.user_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Order not found or does not belong to you' 
        },
        { status: 403 }
      );
    }

    // Check eligibility first
    const eligibility = await checkExchangeEligibility(
      body.order_id,
      body.user_id
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        { 
          success: false, 
          error: eligibility.reason 
        },
        { status: 400 }
      );
    }

    // Prepare exchange data
    const exchangeData: Omit<ExchangeRequest, 'id' | 'created_at' | 'updated_at'> = {
      order_id: body.order_id,
      order_number: order.order_number,
      user_id: body.user_id,
      original_items: body.original_items,
      requested_items: body.requested_items,
      exchange_type: body.exchange_type,
      reason: body.reason,
      description: body.description || '',
      original_total: 0, // Will be calculated
      requested_total: 0, // Will be calculated
      price_difference: 0, // Will be calculated
      status: 'pending',
      user_agent: body.user_agent,
      ip_address: body.ip_address
    };

    // Create exchange request (with all validations)
    const result = await createExchangeRequest(exchangeData);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      );
    }

    // Send confirmation email (optional - implement separately)
    // await sendExchangeConfirmationEmail(result.data);

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Exchange request submitted successfully'
    });

  } catch (error: any) {
    console.error('Exchange API POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create exchange request' 
      },
      { status: 500 }
    );
  }
}

// ==========================================
// GET - Fetch Exchange Requests
// ==========================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    const exchanges = await getUserExchangeRequests(userId);

    return NextResponse.json({
      success: true,
      data: exchanges,
      count: exchanges.length
    });

  } catch (error: any) {
    console.error('Exchange API GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch exchange requests' 
      },
      { status: 500 }
    );
  }
}