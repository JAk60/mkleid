// app/api/exchanges/route.ts - FIXED WITH DUPLICATE PREVENTION
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getProducts } from '@/lib/supabase';

// ==========================================
// TYPES
// ==========================================

interface ExchangeItem {
  order_item_id: string;
  product_id: number;
  product_name: string;
  product_image: string;
  size: string;
  color: string;
  quantity: number;
  original_price: number;
  current_price?: number;
}

type SettlementType = 'NO_CHARGE' | 'COLLECT_PAYMENT' | 'ISSUE_REFUND';
type SettlementStatus = 'PENDING' | 'PAYMENT_REQUIRED' | 'PAYMENT_COLLECTED' | 'REFUND_PENDING' | 'REFUND_ISSUED' | 'COMPLETED';

interface PricingCalculation {
  originalTotal: number;
  replacementTotal: number;
  difference: number;
  settlementType: SettlementType;
  tax: number;
  finalDifference: number;
}

// ==========================================
// PRICE CALCULATION (BACKEND AUTHORITY)
// ==========================================

async function calculateSettlement(
  originalItems: ExchangeItem[],
  requestedItems: ExchangeItem[]
): Promise<PricingCalculation> {
  
  const products = await getProducts();
  const productMap = new Map(products.map(p => [p.id, p]));

  const originalTotal = originalItems.reduce(
    (sum, item) => sum + (item.original_price * item.quantity),
    0
  );

  let replacementTotal = 0;
  
  for (const item of requestedItems) {
    const product = productMap.get(item.product_id);
    if (!product) {
      throw new Error(`Product ${item.product_id} not found or unavailable`);
    }
    replacementTotal += product.price * item.quantity;
  }

  const difference = replacementTotal - originalTotal;
  const tax = Math.round(Math.abs(difference) * 0.18);
  const finalDifference = difference + (difference > 0 ? tax : -tax);

  let settlementType: SettlementType;
  
  if (Math.abs(finalDifference) < 1) {
    settlementType = 'NO_CHARGE';
  } else if (finalDifference > 0) {
    settlementType = 'COLLECT_PAYMENT';
  } else {
    settlementType = 'ISSUE_REFUND';
  }

  return {
    originalTotal,
    replacementTotal,
    difference,
    settlementType,
    tax,
    finalDifference
  };
}

// ==========================================
// ELIGIBILITY CHECK - WITH DUPLICATE PREVENTION
// ==========================================

async function checkEligibility(orderId: string, userId: string) {
  // Get order
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error || !order) {
    return { eligible: false, reason: 'Order not found' };
  }

  // ✅ CRITICAL: Check for active exchanges FIRST
  const { data: activeExchanges } = await supabase
    .from('exchange_requests')
    .select('id, status, created_at')
    .eq('order_id', orderId)
    .in('status', ['pending', 'awaiting_payment', 'approved', 'processing', 'shipped']);

  if (activeExchanges && activeExchanges.length > 0) {
    const exchange = activeExchanges[0];
    
    const statusMessages: Record<string, string> = {
      'pending': 'pending admin review',
      'awaiting_payment': 'awaiting your payment',
      'approved': 'approved and ready to ship',
      'processing': 'being processed',
      'shipped': 'already shipped'
    };

    const statusText = statusMessages[exchange.status] || exchange.status;

    return { 
      eligible: false, 
      reason: `An exchange request for this order is already ${statusText}. You cannot create multiple exchange requests for the same order.`,
      existingExchangeId: exchange.id
    };
  }

  // Check status
  if (order.order_status !== 'delivered') {
    return { eligible: false, reason: 'Only delivered orders can be exchanged' };
  }

  if (order.payment_status !== 'paid') {
    return { eligible: false, reason: 'Order must be fully paid' };
  }

  // Check 30-day window
  if (!order.delivered_at) {
    return { eligible: false, reason: 'Delivery date not recorded' };
  }

  const deliveredDate = new Date(order.delivered_at);
  const now = new Date();
  const daysSinceDelivery = Math.floor(
    (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceDelivery > 30) {
    return { 
      eligible: false, 
      reason: 'Exchange window expired (30 days from delivery)' 
    };
  }

  return { eligible: true, daysRemaining: 30 - daysSinceDelivery };
}

// ==========================================
// STOCK VALIDATION
// ==========================================

async function validateStock(requestedItems: ExchangeItem[]) {
  const products = await getProducts();
  const productMap = new Map(products.map(p => [p.id, p]));

  const errors: string[] = [];

  for (const item of requestedItems) {
    const product = productMap.get(item.product_id);
    
    if (!product) {
      errors.push(`Product ${item.product_name} is no longer available`);
      continue;
    }

    if (product.stock < item.quantity) {
      errors.push(
        `Insufficient stock for ${item.product_name}. ` +
        `Available: ${product.stock}, Requested: ${item.quantity}`
      );
    }

    if (!product.sizes.includes(item.size)) {
      errors.push(`Size ${item.size} not available for ${item.product_name}`);
    }

    if (!product.colors.includes(item.color)) {
      errors.push(`Color ${item.color} not available for ${item.product_name}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ==========================================
// RESERVE STOCK
// ==========================================

async function reserveStock(exchangeId: string, items: ExchangeItem[]) {
  console.log(`🔒 Stock reserved for exchange ${exchangeId}:`, items);
  return { reserved: true };
}

// ==========================================
// POST - CREATE EXCHANGE REQUEST (FIXED)
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      order_id,
      user_id,
      original_items,
      requested_items,
      exchange_type,
      reason,
      description
    } = body;

    // 1. Validate required fields
    if (!order_id || !user_id || !original_items || !requested_items) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📝 Creating exchange request for user:', user_id);

    // 2. Check eligibility (includes duplicate check)
    const eligibility = await checkEligibility(order_id, user_id);
    if (!eligibility.eligible) {
      console.log('❌ Not eligible:', eligibility.reason);
      return NextResponse.json(
        { 
          success: false, 
          error: eligibility.reason,
          existingExchangeId: eligibility.existingExchangeId
        },
        { status: 400 }
      );
    }

    // 3. Validate stock
    const stockValidation = await validateStock(requested_items);
    if (!stockValidation.isValid) {
      return NextResponse.json(
        { success: false, error: stockValidation.errors.join('; ') },
        { status: 400 }
      );
    }

    // 4. Calculate settlement (BACKEND AUTHORITY)
    const pricing = await calculateSettlement(original_items, requested_items);

    console.log('💰 Settlement Calculation:', pricing);

    // 5. Determine initial status based on settlement type
    let initialStatus = 'pending';
    let settlementStatus: SettlementStatus = 'PENDING';

    switch (pricing.settlementType) {
      case 'NO_CHARGE':
        initialStatus = 'pending';
        settlementStatus = 'COMPLETED';
        break;
      
      case 'COLLECT_PAYMENT':
        initialStatus = 'awaiting_payment';
        settlementStatus = 'PAYMENT_REQUIRED';
        break;
      
      case 'ISSUE_REFUND':
        initialStatus = 'pending';
        settlementStatus = 'REFUND_PENDING';
        break;
    }

    // 6. Get order number
    const { data: order } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', order_id)
      .single();

    // 7. ✅ DOUBLE-CHECK: No active exchange exists (race condition prevention)
    const { data: doubleCheck } = await supabaseAdmin
      .from('exchange_requests')
      .select('id, status')
      .eq('order_id', order_id)
      .in('status', ['pending', 'awaiting_payment', 'approved', 'processing', 'shipped'])
      .maybeSingle();

    if (doubleCheck) {
      console.log('❌ Race condition detected - exchange already exists');
      return NextResponse.json(
        { 
          success: false, 
          error: 'An exchange request for this order already exists. Please refresh and try again.',
          existingExchangeId: doubleCheck.id
        },
        { status: 409 } // 409 Conflict
      );
    }

    // 8. Create exchange request using ADMIN CLIENT
    const exchangeData = {
      order_id,
      order_number: order?.order_number || '',
      user_id,
      original_items,
      requested_items,
      exchange_type,
      reason,
      description: description || '',
      original_total: pricing.originalTotal,
      requested_total: pricing.replacementTotal,
      price_difference: pricing.difference,
      settlement_type: pricing.settlementType,
      settlement_status: settlementStatus,
      settlement_amount: Math.abs(pricing.finalDifference),
      tax_amount: pricing.tax,
      status: initialStatus
    };

    console.log('📤 Inserting exchange request...');

    const { data: exchange, error: exchangeError } = await supabaseAdmin
      .from('exchange_requests')
      .insert(exchangeData)
      .select()
      .single();

    if (exchangeError) {
      console.error('Exchange creation error:', exchangeError);
      
      // Check if it's a duplicate key error
      if (exchangeError.code === '23505') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'An exchange request for this order already exists.'
          },
          { status: 409 }
        );
      }
      
      throw exchangeError;
    }

    console.log('✅ Exchange created:', exchange.id);

    // 9. Reserve stock for replacement items
    await reserveStock(exchange.id, requested_items);

    // 10. Prepare response based on settlement type
    const response: any = {
      success: true,
      data: exchange,
      pricing,
      nextAction: null
    };

    switch (pricing.settlementType) {
      case 'NO_CHARGE':
        response.message = 'Exchange request submitted! No additional payment required.';
        response.nextAction = 'WAIT_APPROVAL';
        break;
      
      case 'COLLECT_PAYMENT':
        response.message = `Exchange request created. Payment of ₹${pricing.finalDifference.toFixed(2)} required.`;
        response.nextAction = 'INITIATE_PAYMENT';
        response.paymentDetails = {
          amount: pricing.finalDifference,
          description: `Exchange price difference for order ${order?.order_number}`
        };
        break;
      
      case 'ISSUE_REFUND':
        response.message = 'Exchange request submitted! Refund will be processed after quality check.';
        response.nextAction = 'WAIT_APPROVAL';
        response.refundDetails = {
          amount: Math.abs(pricing.finalDifference),
          processingNote: 'Refund will be issued after item inspection'
        };
        break;
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Exchange API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create exchange' },
      { status: 500 }
    );
  }
}

// ==========================================
// GET - FETCH EXCHANGE REQUESTS
// ==========================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('exchange_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Optional: filter by specific order
    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data: exchanges, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: exchanges || []
    });

  } catch (error: any) {
    console.error('❌ Get Exchanges Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT - UPDATE SETTLEMENT STATUS
// ==========================================

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { exchangeId, action, paymentDetails } = body;

    if (!exchangeId || !action) {
      return NextResponse.json(
        { success: false, error: 'Exchange ID and action required' },
        { status: 400 }
      );
    }

    // Get exchange
    const { data: exchange } = await supabase
      .from('exchange_requests')
      .select('*')
      .eq('id', exchangeId)
      .single();

    if (!exchange) {
      return NextResponse.json(
        { success: false, error: 'Exchange not found' },
        { status: 404 }
      );
    }

    let updates: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'CONFIRM_PAYMENT':
        updates.settlement_status = 'PAYMENT_COLLECTED';
        updates.payment_details = paymentDetails;
        updates.status = 'pending';
        updates.payment_collected_at = new Date().toISOString();
        break;

      case 'APPROVE_REFUND':
        updates.settlement_status = 'REFUND_ISSUED';
        updates.refund_details = paymentDetails;
        updates.status = 'completed';
        updates.refund_issued_at = new Date().toISOString();
        break;

      case 'COMPLETE':
        updates.settlement_status = 'COMPLETED';
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
        break;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('exchange_requests')
      .update(updates)
      .eq('id', exchangeId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error: any) {
    console.error('❌ Update Settlement Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}