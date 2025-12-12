
// ========================================

// app/api/admin/exchanges/route.ts - Admin API
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('exchange_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: exchanges, error } = await query;

    if (error) throw error;

    // Enrich with user and order data
    const enriched = await Promise.all(
      (exchanges || []).map(async (exchange) => {
        const { data: order } = await supabase
          .from('orders')
          .select('order_number')
          .eq('id', exchange.order_id)
          .single();

        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(exchange.user_id);

        return {
          ...exchange,
          order_number: order?.order_number || 'N/A',
          customer_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown',
          customer_email: user?.email || 'N/A'
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enriched
    });

  } catch (error: any) {
    console.error('Admin get exchanges error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch exchanges' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, admin_notes, tracking_number } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (admin_notes) updates.admin_notes = admin_notes;
    if (tracking_number) updates.tracking_number = tracking_number;

    if (status === 'approved') updates.approved_at = new Date().toISOString();
    if (status === 'shipped') updates.shipped_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('exchange_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Update exchange error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update exchange' },
      { status: 500 }
    );
  }
}

// ========================================
// SQL MIGRATION - Run this in Supabase SQL Editor
// ========================================

/*
-- Create exchange_requests table
CREATE TABLE exchange_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) NOT NULL,
  user_id UUID NOT NULL,
  original_items JSONB NOT NULL,
  requested_items JSONB NOT NULL,
  exchange_type TEXT NOT NULL CHECK (exchange_type IN ('size', 'color', 'product')),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'shipped', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  admin_notes TEXT,
  tracking_number TEXT
);

-- Create indexes
CREATE INDEX idx_exchange_requests_user ON exchange_requests(user_id);
CREATE INDEX idx_exchange_requests_order ON exchange_requests(order_id);
CREATE INDEX idx_exchange_requests_status ON exchange_requests(status);
CREATE INDEX idx_exchange_requests_created ON exchange_requests(created_at DESC);

-- Enable RLS
ALTER TABLE exchange_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own exchanges
CREATE POLICY "Users can view own exchanges" ON exchange_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create exchanges
CREATE POLICY "Users can create exchanges" ON exchange_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can manage all exchanges
CREATE POLICY "Admins can manage all exchanges" ON exchange_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_exchange_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exchange_requests_updated_at
BEFORE UPDATE ON exchange_requests
FOR EACH ROW
EXECUTE FUNCTION update_exchange_updated_at();
*/