// lib/supabase-orders.ts

import { supabase } from './supabase';

// Types
export interface Address {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id?: string;
  user_id: string;
  order_number?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  shipping_address: Address;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  product_image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// ========== ADDRESS FUNCTIONS ==========

export async function getAddresses(userId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Address[];
}

export async function getDefaultAddress(userId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data as Address | null;
}

export async function createAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>) {
  // If this is set as default, unset all other defaults for this user
  if (address.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', address.user_id);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert(address)
    .select()
    .single();

  if (error) throw error;
  return data as Address;
}

export async function updateAddress(id: string, updates: Partial<Address>) {
  if (updates.is_default && updates.user_id) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', updates.user_id);
  }

  const { data, error } = await supabase
    .from('addresses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Address;
}

export async function deleteAddress(id: string) {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========== ORDER FUNCTIONS ==========

export async function createOrder(order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderPayment(
  orderId: string,
  paymentData: {
    razorpay_payment_id: string;
    razorpay_signature: string;
    payment_status: 'paid' | 'failed';
    paid_at?: string;
  }
) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      ...paymentData,
      order_status: paymentData.payment_status === 'paid' ? 'confirmed' : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderStatus(orderId: string, status: Order['order_status']) {
  const updates: any = {
    order_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'shipped') updates.shipped_at = new Date().toISOString();
  if (status === 'delivered') updates.delivered_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function cancelOrder(orderId: string) {
  return updateOrderStatus(orderId, 'cancelled');
}