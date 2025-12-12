// lib/supabase-exchanges.ts
import { supabase } from './supabase';

export interface ExchangeRequest {
  id?: string;
  order_id: string;
  user_id: string;
  original_items: ExchangeItem[];
  requested_items: ExchangeItem[];
  exchange_type: 'size' | 'color' | 'product';
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'completed';
  created_at?: string;
  updated_at?: string;
  approved_at?: string;
  shipped_at?: string;
  completed_at?: string;
  admin_notes?: string;
  tracking_number?: string;
}

export interface ExchangeItem {
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  product_image?: string;
}

// Create exchange request
export async function createExchangeRequest(
  exchangeData: Omit<ExchangeRequest, 'id' | 'created_at' | 'updated_at' | 'approved_at' | 'shipped_at' | 'completed_at'>
): Promise<ExchangeRequest> {
  const { data, error } = await supabase
    .from('exchange_requests')
    .insert(exchangeData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user's exchange requests
export async function getUserExchangeRequests(userId: string): Promise<ExchangeRequest[]> {
  const { data, error } = await supabase
    .from('exchange_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get exchange request by ID
export async function getExchangeRequestById(id: string): Promise<ExchangeRequest | null> {
  const { data, error } = await supabase
    .from('exchange_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Admin: Update exchange request status
export async function updateExchangeStatus(
  id: string,
  status: ExchangeRequest['status'],
  adminNotes?: string,
  trackingNumber?: string
): Promise<ExchangeRequest> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminNotes) updates.admin_notes = adminNotes;
  if (trackingNumber) updates.tracking_number = trackingNumber;
  
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
  return data;
}

// Admin: Get all exchange requests
export async function getAllExchangeRequests(
  status?: ExchangeRequest['status']
): Promise<ExchangeRequest[]> {
  let query = supabase
    .from('exchange_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Validate exchange request
export function validateExchange(
  originalItems: ExchangeItem[],
  requestedItems: ExchangeItem[]
): { valid: boolean; error?: string } {
  // Calculate total values
  const originalTotal = originalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const requestedTotal = requestedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Check if requested total exceeds original (customer would need to pay difference)
  if (requestedTotal > originalTotal) {
    const difference = requestedTotal - originalTotal;
    return {
      valid: false,
      error: `Selected items total ₹${requestedTotal.toFixed(2)} which is ₹${difference.toFixed(2)} more than your original order. Please adjust your selection.`
    };
  }

  // Check if quantities match for same-price exchanges
  const originalQty = originalItems.reduce((sum, item) => sum + item.quantity, 0);
  const requestedQty = requestedItems.reduce((sum, item) => sum + item.quantity, 0);

  if (originalTotal === requestedTotal && originalQty !== requestedQty) {
    return {
      valid: false,
      error: 'Quantity mismatch. Please select the same number of items.'
    };
  }

  return { valid: true };
}