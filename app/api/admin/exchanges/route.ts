// app/api/admin/exchanges/route.ts - FIXED VERSION
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ==========================================
// GET - FETCH ALL EXCHANGES (ADMIN) - FIXED
// ==========================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    const settlementType = searchParams.get('settlementType');
    const limit = searchParams.get('limit');

    console.log('📦 Admin: Fetching exchanges', { status, userId, orderId, settlementType });

    // STEP 1: Get exchanges first WITHOUT join
    let query = supabaseAdmin
      .from('exchange_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    if (settlementType && settlementType !== 'all') {
      query = query.eq('settlement_type', settlementType);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: exchanges, error: exchangeError } = await query;

    if (exchangeError) {
      console.error('❌ Fetch exchanges error:', exchangeError);
      throw exchangeError;
    }

    console.log(`✅ Found ${exchanges?.length || 0} raw exchanges`);

    if (!exchanges || exchanges.length === 0) {
      console.log('⚠️ No exchanges found in database');
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // STEP 2: Manually enrich with order data
    const enrichedExchanges = await Promise.all(
      exchanges.map(async (exchange) => {
        try {
          // Get order data
          const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('order_number, user_id, shipping_address')
            .eq('id', exchange.order_id)
            .single();

          if (orderError) {
            console.warn(`⚠️ Could not fetch order for exchange ${exchange.id}:`, orderError.message);
          }

          // Extract customer info from shipping address
          const shippingAddress = order?.shipping_address || {};
          const customerName = `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim() || 'N/A';
          const customerEmail = shippingAddress.email || 'N/A';
          const customerPhone = shippingAddress.phone || 'N/A';

          return {
            ...exchange,
            order_number: order?.order_number || exchange.order_number || 'N/A',
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone
          };
        } catch (error: any) {
          console.error(`❌ Error enriching exchange ${exchange.id}:`, error);
          // Return exchange with placeholder data if enrichment fails
          return {
            ...exchange,
            order_number: exchange.order_number || 'N/A',
            customer_name: 'N/A',
            customer_email: 'N/A',
            customer_phone: 'N/A'
          };
        }
      })
    );

    console.log('✅ Successfully enriched exchanges');

    return NextResponse.json({
      success: true,
      data: enrichedExchanges
    });

  } catch (error: any) {
    console.error('❌ Admin Get Exchanges Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.details || null
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT - UPDATE EXCHANGE STATUS (ADMIN)
// ==========================================

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      status, 
      settlement_status,
      admin_notes, 
      tracking_number, 
      qc_notes,
      qc_status,
      rejection_reason
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Exchange ID required' },
        { status: 400 }
      );
    }

    console.log('✏️ Admin: Updating exchange', { id, status, settlement_status });

    // Get current exchange
    const { data: currentExchange, error: fetchError } = await supabaseAdmin
      .from('exchange_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentExchange) {
      console.error('❌ Exchange not found:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Exchange not found' },
        { status: 404 }
      );
    }

    // Build updates object
    const updates: any = { 
      updated_at: new Date().toISOString() 
    };

    // Status updates
    if (status) {
      updates.status = status;

      switch (status) {
        case 'approved':
          updates.approved_at = new Date().toISOString();
          break;
        case 'rejected':
          updates.rejected_at = new Date().toISOString();
          if (rejection_reason) updates.rejection_reason = rejection_reason;
          break;
        case 'shipped':
          updates.shipped_at = new Date().toISOString();
          if (tracking_number) updates.tracking_number = tracking_number;
          break;
        case 'completed':
          updates.completed_at = new Date().toISOString();
          break;
      }
    }

    // Settlement status updates
    if (settlement_status) {
      updates.settlement_status = settlement_status;

      switch (settlement_status) {
        case 'PAYMENT_COLLECTED':
          updates.payment_collected_at = new Date().toISOString();
          if (currentExchange.status === 'awaiting_payment') {
            updates.status = 'approved';
            updates.approved_at = new Date().toISOString();
          }
          break;
        case 'REFUND_ISSUED':
          updates.refund_issued_at = new Date().toISOString();
          if (currentExchange.status === 'shipped') {
            updates.status = 'completed';
            updates.completed_at = new Date().toISOString();
          }
          break;
      }
    }

    // Additional fields
    if (admin_notes) updates.admin_notes = admin_notes;
    if (tracking_number) updates.tracking_number = tracking_number;
    if (qc_notes) updates.qc_notes = qc_notes;
    if (qc_status) updates.qc_status = qc_status;

    // Validation
    if (status === 'rejected' && !rejection_reason && !admin_notes) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason or admin notes required when rejecting' },
        { status: 400 }
      );
    }

    if (status === 'shipped' && !updates.tracking_number && !currentExchange.tracking_number) {
      return NextResponse.json(
        { success: false, error: 'Tracking number required when marking as shipped' },
        { status: 400 }
      );
    }

    // Update exchange
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('exchange_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

    console.log('✅ Exchange updated successfully');

    return NextResponse.json({
      success: true,
      data: updated,
      message: getSuccessMessage(status, settlement_status)
    });

  } catch (error: any) {
    console.error('❌ Admin Update Exchange Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE - CANCEL EXCHANGE (ADMIN)
// ==========================================

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Exchange ID required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Admin: Cancelling exchange', { id, reason });

    const { data: exchange } = await supabaseAdmin
      .from('exchange_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (!exchange) {
      return NextResponse.json(
        { success: false, error: 'Exchange not found' },
        { status: 404 }
      );
    }

    if (!['pending', 'awaiting_payment'].includes(exchange.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel exchange with status: ${exchange.status}` },
        { status: 400 }
      );
    }

    const { data: cancelled, error } = await supabaseAdmin
      .from('exchange_requests')
      .update({
        status: 'cancelled',
        admin_notes: reason || 'Cancelled by admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Exchange cancelled successfully');

    return NextResponse.json({
      success: true,
      message: 'Exchange cancelled successfully'
    });

  } catch (error: any) {
    console.error('❌ Admin Cancel Exchange Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getSuccessMessage(status?: string, settlementStatus?: string): string {
  if (settlementStatus) {
    switch (settlementStatus) {
      case 'PAYMENT_COLLECTED':
        return 'Payment confirmed. Exchange approved and ready for processing.';
      case 'REFUND_ISSUED':
        return 'Refund issued successfully. Exchange completed.';
      default:
        return 'Settlement status updated successfully';
    }
  }

  if (status) {
    switch (status) {
      case 'approved':
        return 'Exchange approved successfully';
      case 'rejected':
        return 'Exchange rejected. Customer will be notified.';
      case 'shipped':
        return 'Exchange marked as shipped. Customer will receive tracking details.';
      case 'completed':
        return 'Exchange completed successfully';
      default:
        return 'Exchange updated successfully';
    }
  }

  return 'Exchange updated successfully';
}