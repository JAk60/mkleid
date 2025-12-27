// app/api/admin/exchanges/route.ts - COMPLETE ADMIN EXCHANGE API
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ==========================================
// GET - FETCH ALL EXCHANGES (ADMIN)
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

    // Build query with admin client (bypasses RLS)
    let query = supabaseAdmin
      .from('exchange_requests')
      .select(`
        *,
        orders!inner(
          order_number,
          user_id,
          shipping_address
        )
      `)
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

    const { data: exchanges, error } = await query;

    if (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }

    console.log(`✅ Found ${exchanges?.length || 0} exchanges`);

    // Enrich with customer data
    const enrichedExchanges = exchanges?.map(exchange => {
      const order = exchange.orders;
      const shippingAddress = order?.shipping_address || {};
      
      return {
        ...exchange,
        customer_name: `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim() || 'N/A',
        customer_email: shippingAddress.email || 'N/A',
        customer_phone: shippingAddress.phone || 'N/A',
        order_number: order?.order_number || exchange.order_number
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedExchanges || []
    });

  } catch (error: any) {
    console.error('❌ Admin Get Exchanges Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
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
    const { data: currentExchange } = await supabaseAdmin
      .from('exchange_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentExchange) {
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

      // Set timestamp fields based on status
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
          // Auto-approve after payment collected
          if (currentExchange.status === 'awaiting_payment') {
            updates.status = 'approved';
            updates.approved_at = new Date().toISOString();
          }
          break;
        case 'REFUND_ISSUED':
          updates.refund_issued_at = new Date().toISOString();
          // Auto-complete after refund issued
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
    const { data: updated, error } = await supabaseAdmin
      .from('exchange_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      throw error;
    }

    console.log('✅ Exchange updated successfully');

    // TODO: Send email notification to customer
    await sendExchangeStatusEmail(updated);

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

    // Get exchange
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

    // Only allow cancellation of pending/awaiting_payment exchanges
    if (!['pending', 'awaiting_payment'].includes(exchange.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel exchange with status: ${exchange.status}` },
        { status: 400 }
      );
    }

    // Update to cancelled instead of deleting (preserve records)
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

    // Release reserved stock
    await releaseReservedStock(id);

    // Send cancellation email
    await sendExchangeCancellationEmail(cancelled);

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
// PATCH - BULK UPDATE (ADMIN)
// ==========================================

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ids, status, admin_notes } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Exchange IDs array required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status required for bulk update' },
        { status: 400 }
      );
    }

    console.log('📦 Admin: Bulk updating exchanges', { count: ids.length, status });

    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (admin_notes) updates.admin_notes = admin_notes;

    // Set timestamp based on status
    if (status === 'approved') updates.approved_at = new Date().toISOString();
    if (status === 'rejected') updates.rejected_at = new Date().toISOString();
    if (status === 'shipped') updates.shipped_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    // Update all exchanges
    const { data, error } = await supabaseAdmin
      .from('exchange_requests')
      .update(updates)
      .in('id', ids)
      .select();

    if (error) throw error;

    console.log(`✅ Bulk updated ${data.length} exchanges`);

    // Send bulk notifications
    for (const exchange of data) {
      await sendExchangeStatusEmail(exchange);
    }

    return NextResponse.json({
      success: true,
      updated: data.length,
      message: `Successfully updated ${data.length} exchanges`
    });

  } catch (error: any) {
    console.error('❌ Admin Bulk Update Error:', error);
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

async function sendExchangeStatusEmail(exchange: any) {
  // TODO: Implement email notification
  console.log('📧 TODO: Send email notification for exchange:', exchange.id);
  
  // Example integration:
  // - Use Resend, SendGrid, or similar
  // - Send different templates based on status
  // - Include tracking info, payment details, etc.
}

async function sendExchangeCancellationEmail(exchange: any) {
  // TODO: Implement cancellation email
  console.log('📧 TODO: Send cancellation email for exchange:', exchange.id);
}

async function releaseReservedStock(exchangeId: string) {
  // TODO: Implement stock release logic
  console.log('🔓 TODO: Release reserved stock for exchange:', exchangeId);
  
  // In production:
  // - Delete from inventory_reservations table
  // - Return stock to available_stock
}

// ==========================================
// STATISTICS ENDPOINT
// ==========================================

export async function OPTIONS(request: Request) {
  try {
    console.log('📊 Admin: Fetching exchange statistics');

    // Get all exchanges
    const { data: allExchanges } = await supabaseAdmin
      .from('exchange_requests')
      .select('*');

    if (!allExchanges) {
      return NextResponse.json({ success: false, error: 'No data found' });
    }

    // Calculate statistics
    const stats = {
      total: allExchanges.length,
      by_status: {
        pending: allExchanges.filter(e => e.status === 'pending').length,
        awaiting_payment: allExchanges.filter(e => e.status === 'awaiting_payment').length,
        approved: allExchanges.filter(e => e.status === 'approved').length,
        rejected: allExchanges.filter(e => e.status === 'rejected').length,
        shipped: allExchanges.filter(e => e.status === 'shipped').length,
        completed: allExchanges.filter(e => e.status === 'completed').length,
        cancelled: allExchanges.filter(e => e.status === 'cancelled').length,
      },
      by_settlement: {
        no_charge: allExchanges.filter(e => e.settlement_type === 'NO_CHARGE').length,
        collect_payment: allExchanges.filter(e => e.settlement_type === 'COLLECT_PAYMENT').length,
        issue_refund: allExchanges.filter(e => e.settlement_type === 'ISSUE_REFUND').length,
      },
      financial: {
        total_payment_pending: allExchanges
          .filter(e => e.settlement_type === 'COLLECT_PAYMENT' && e.settlement_status === 'PAYMENT_REQUIRED')
          .reduce((sum, e) => sum + (e.settlement_amount || 0), 0),
        total_payment_collected: allExchanges
          .filter(e => e.settlement_type === 'COLLECT_PAYMENT' && e.settlement_status === 'PAYMENT_COLLECTED')
          .reduce((sum, e) => sum + (e.settlement_amount || 0), 0),
        total_refund_pending: allExchanges
          .filter(e => e.settlement_type === 'ISSUE_REFUND' && e.settlement_status === 'REFUND_PENDING')
          .reduce((sum, e) => sum + (e.settlement_amount || 0), 0),
        total_refund_issued: allExchanges
          .filter(e => e.settlement_type === 'ISSUE_REFUND' && e.settlement_status === 'REFUND_ISSUED')
          .reduce((sum, e) => sum + (e.settlement_amount || 0), 0),
      },
      by_type: {
        size: allExchanges.filter(e => e.exchange_type === 'size').length,
        color: allExchanges.filter(e => e.exchange_type === 'color').length,
        product: allExchanges.filter(e => e.exchange_type === 'product').length,
      },
      recent_activity: allExchanges
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(e => ({
          id: e.id,
          order_number: e.order_number,
          status: e.status,
          settlement_type: e.settlement_type,
          created_at: e.created_at
        }))
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Admin Stats Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

