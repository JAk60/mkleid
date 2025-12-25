// app/api/exchanges/route.ts - COMPLETE REWRITE WITH SETTLEMENT
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
  
  // Get current product prices (authoritative source)
  const products = await getProducts();
  const productMap = new Map(products.map(p => [p.id, p]));

  // Calculate original total (from order history)
  const originalTotal = originalItems.reduce(
    (sum, item) => sum + (item.original_price * item.quantity),
    0
  );

  // Calculate replacement total (from CURRENT prices)
  let replacementTotal = 0;
  
  for (const item of requestedItems) {
    const product = productMap.get(item.product_id);
    if (!product) {
      throw new Error(`Product ${item.product_id} not found or unavailable`);
    }
    
    // Use current price, not historical
    replacementTotal += product.price * item.quantity;
  }

  // Calculate difference
  const difference = replacementTotal - originalTotal;
  
  // Calculate tax (18% GST)
  const tax = Math.round(Math.abs(difference) * 0.18);
  const finalDifference = difference + (difference > 0 ? tax : -tax);

  // Determine settlement type
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
// ELIGIBILITY CHECK
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

  // Check for pending exchanges
  const { data: pending } = await supabase
    .from('exchange_requests')
    .select('id')
    .eq('order_id', orderId)
    .in('status', ['pending', 'approved', 'processing', 'shipped']);

  if (pending && pending.length > 0) {
    return { 
      eligible: false, 
      reason: 'An exchange is already in progress for this order' 
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
// RESERVE STOCK (LOCK INVENTORY)
// ==========================================

async function reserveStock(exchangeId: string, items: ExchangeItem[]) {
  // This would create inventory reservations
  // For now, we'll just log it
  console.log(`🔒 Stock reserved for exchange ${exchangeId}:`, items);
  
  // In production, you'd:
  // 1. Create entries in an `inventory_reservations` table
  // 2. Decrease available_stock (separate from physical stock)
  // 3. Set expiration time (e.g., 48 hours)
  
  return { reserved: true };
}

// ==========================================
// POST - CREATE EXCHANGE REQUEST
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

    // 2. Check eligibility
    const eligibility = await checkEligibility(order_id, user_id);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { success: false, error: eligibility.reason },
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
        initialStatus = 'pending'; // Goes to admin for approval
        settlementStatus = 'COMPLETED';
        break;
      
      case 'COLLECT_PAYMENT':
        initialStatus = 'awaiting_payment';
        settlementStatus = 'PAYMENT_REQUIRED';
        break;
      
      case 'ISSUE_REFUND':
        initialStatus = 'pending'; // Admin approves, then refund after QC
        settlementStatus = 'REFUND_PENDING';
        break;
    }

    // 6. Get order number
    const { data: order } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', order_id)
      .single();

    // 7. Create exchange request
    const { data: exchange, error: exchangeError } = await supabase
      .from('exchange_requests')
      .insert({
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
      })
      .select()
      .single();

    if (exchangeError) {
      console.error('Exchange creation error:', exchangeError);
      throw exchangeError;
    }

    // 8. Reserve stock for replacement items
    await reserveStock(exchange.id, requested_items);

    // 9. Prepare response based on settlement type
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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const { data: exchanges, error } = await supabase
      .from('exchange_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
        updates.status = 'pending'; // Now goes to admin
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

    const { data: updated, error } = await supabase
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