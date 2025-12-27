// ==========================================
// lib/supabase-exchanges.ts - COMPLETE REWRITE
// ==========================================

import { supabase } from './supabase';
import { Product } from './types';
import { getProducts } from './supabase';

// ==========================================
// TYPES
// ==========================================

export interface ExchangeItem {
  order_item_id: string;
  product_id: number;
  product_name: string;
  product_image: string;
  size: string;
  color: string;
  quantity: number;
  original_price: number; // Price at time of original order
  current_price?: number; // Current market price (for validation)
  available_for_exchange?: number; // Quantity not yet exchanged
}

export interface ExchangeRequest {
  id?: string;
  order_id: string;
  order_number?: string;
  user_id: string;
  
  // Items
  original_items: ExchangeItem[];
  requested_items: ExchangeItem[];
  
  // Exchange details
  exchange_type: 'size' | 'color' | 'product';
  reason: 'wrong_size' | 'wrong_color' | 'doesnt_fit' | 'quality_issue' | 'changed_mind' | 'other';
  description?: string;
  
  // Pricing
  original_total: number;
  requested_total: number;
  price_difference: number;
  
  // Status tracking
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  approved_at?: string;
  rejected_at?: string;
  shipped_at?: string;
  completed_at?: string;
  
  // Admin fields
  admin_notes?: string;
  rejection_reason?: string;
  tracking_number?: string;
  
  // Metadata
  user_agent?: string;
  ip_address?: string;
}

export interface ExchangeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExchangeEligibility {
  eligible: boolean;
  reason?: string;
  warnings?: string[];
  daysRemaining?: number;
}

// ==========================================
// ELIGIBILITY CHECKING
// ==========================================

// lib/supabase-exchanges.ts - FIXED DUPLICATE PREVENTION

// Update the checkExchangeEligibility function:

export async function checkExchangeEligibility(
  orderId: string,
  userId: string
): Promise<ExchangeEligibility> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return {
        eligible: false,
        reason: 'Order not found or does not belong to you'
      };
    }

    // Check order status
    if (order.order_status !== 'delivered') {
      return {
        eligible: false,
        reason: `Only delivered orders can be exchanged. Current status: ${order.order_status}`
      };
    }

    // Check payment status
    if (order.payment_status !== 'paid') {
      return {
        eligible: false,
        reason: 'Order must be fully paid to request exchange'
      };
    }

    // Check delivery date and exchange window (30 days)
    if (!order.delivered_at) {
      return {
        eligible: false,
        reason: 'Delivery date not recorded'
      };
    }

    const deliveredDate = new Date(order.delivered_at);
    const now = new Date();
    const daysSinceDelivery = Math.floor(
      (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const EXCHANGE_WINDOW_DAYS = 30;

    if (daysSinceDelivery > EXCHANGE_WINDOW_DAYS) {
      return {
        eligible: false,
        reason: `Exchange window has expired. Items must be exchanged within ${EXCHANGE_WINDOW_DAYS} days of delivery.`
      };
    }

    const daysRemaining = EXCHANGE_WINDOW_DAYS - daysSinceDelivery;
    const warnings: string[] = [];

    if (daysRemaining <= 5) {
      warnings.push(`Only ${daysRemaining} days remaining to exchange this order`);
    }

    // ✅ FIXED: Check for ANY existing exchange requests (including rejected/cancelled)
    const { data: existingExchanges } = await supabase
      .from('exchange_requests')
      .select('id, status, original_items')
      .eq('order_id', orderId);

    // Check for active exchanges
    const activeExchanges = existingExchanges?.filter(e => 
      ['pending', 'awaiting_payment', 'approved', 'processing', 'shipped'].includes(e.status)
    );

    if (activeExchanges && activeExchanges.length > 0) {
      return {
        eligible: false,
        reason: 'An exchange request is already in progress for this order. You cannot create multiple exchange requests.'
      };
    }

    // ✅ NEW: Calculate which items have already been exchanged
    const exchangedItemsMap = new Map<string, number>();
    
    // Include completed exchanges in the calculation
    const completedExchanges = existingExchanges?.filter(e => 
      e.status === 'completed'
    ) || [];

    completedExchanges.forEach(exchange => {
      exchange.original_items.forEach((item: any) => {
        const key = `${item.product_id}-${item.size}-${item.color}`;
        const current = exchangedItemsMap.get(key) || 0;
        exchangedItemsMap.set(key, current + item.quantity);
      });
    });

    // Check if ALL items have been fully exchanged
    let allItemsExchanged = true;
    for (const orderItem of order.items) {
      const key = `${orderItem.product_id}-${orderItem.size}-${orderItem.color}`;
      const exchangedQty = exchangedItemsMap.get(key) || 0;
      if (exchangedQty < orderItem.quantity) {
        allItemsExchanged = false;
        break;
      }
    }

    if (allItemsExchanged) {
      return {
        eligible: false,
        reason: 'All items from this order have already been exchanged.'
      };
    }

    return {
      eligible: true,
      daysRemaining,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error: any) {
    console.error('Exchange eligibility check error:', error);
    return {
      eligible: false,
      reason: 'Unable to verify exchange eligibility. Please try again.'
    };
  }
}

// ✅ NEW: Function to get available items for exchange
export async function getAvailableItemsForExchange(orderId: string): Promise<{
  items: Array<{
    product_id: number;
    product_name: string;
    product_image: string;
    size: string;
    color: string;
    original_quantity: number;
    exchanged_quantity: number;
    available_quantity: number;
  }>;
  message?: string;
}> {
  try {
    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) {
      return { items: [], message: 'Order not found' };
    }

    // Get all completed exchanges
    const { data: exchanges } = await supabase
      .from('exchange_requests')
      .select('original_items')
      .eq('order_id', orderId)
      .eq('status', 'completed');

    // Calculate exchanged quantities
    const exchangedMap = new Map<string, number>();
    exchanges?.forEach(exchange => {
      exchange.original_items.forEach((item: any) => {
        const key = `${item.product_id}-${item.size}-${item.color}`;
        const current = exchangedMap.get(key) || 0;
        exchangedMap.set(key, current + item.quantity);
      });
    });

    // Build available items list
    const availableItems = order.items.map((item: any) => {
      const key = `${item.product_id}-${item.size}-${item.color}`;
      const exchangedQty = exchangedMap.get(key) || 0;
      const availableQty = item.quantity - exchangedQty;

      return {
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        size: item.size,
        color: item.color,
        original_quantity: item.quantity,
        exchanged_quantity: exchangedQty,
        available_quantity: availableQty
      };
    }).filter((item: { available_quantity: number; }) => item.available_quantity > 0);

    return { items: availableItems };

  } catch (error: any) {
    console.error('Error getting available items:', error);
    return { items: [], message: 'Error loading available items' };
  }
}

// ==========================================
// ITEM VALIDATION
// ==========================================

export async function validateExchangeItems(
  orderId: string,
  selectedItems: ExchangeItem[]
): Promise<ExchangeValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Get order with items
    const { data: order } = await supabase
      .from('orders')
      .select('items')
      .eq('id', orderId)
      .single();

    if (!order) {
      errors.push('Order not found');
      return { isValid: false, errors, warnings };
    }

    // Get all exchange history for this order
    const { data: pastExchanges } = await supabase
      .from('exchange_requests')
      .select('original_items, status')
      .eq('order_id', orderId)
      .in('status', ['approved', 'completed']);

    // Calculate already exchanged quantities
    const exchangedQuantities = new Map<string, number>();
    
    if (pastExchanges) {
      pastExchanges.forEach(exchange => {
        exchange.original_items.forEach((item: any) => {
          const key = `${item.product_id}-${item.size}-${item.color}`;
          const current = exchangedQuantities.get(key) || 0;
          exchangedQuantities.set(key, current + item.quantity);
        });
      });
    }

    // Validate each selected item
    for (const selectedItem of selectedItems) {
      // Find item in original order
      const orderItem = order.items.find((oi: any) => 
        oi.product_id === selectedItem.product_id &&
        oi.size === selectedItem.size &&
        oi.color === selectedItem.color
      );

      if (!orderItem) {
        errors.push(`Item not found in original order: ${selectedItem.product_name}`);
        continue;
      }

      // Check available quantity for exchange
      const key = `${selectedItem.product_id}-${selectedItem.size}-${selectedItem.color}`;
      const alreadyExchanged = exchangedQuantities.get(key) || 0;
      const availableQty = orderItem.quantity - alreadyExchanged;

      if (availableQty <= 0) {
        errors.push(`${selectedItem.product_name} has already been fully exchanged`);
        continue;
      }

      if (selectedItem.quantity > availableQty) {
        errors.push(
          `Cannot exchange ${selectedItem.quantity} units of ${selectedItem.product_name}. ` +
          `Maximum available: ${availableQty} (${alreadyExchanged} already exchanged)`
        );
      }

      // Verify price matches order
      if (Math.abs(selectedItem.original_price - orderItem.price) > 0.01) {
        errors.push(
          `Price mismatch for ${selectedItem.product_name}. ` +
          `Expected: ₹${orderItem.price}, Got: ₹${selectedItem.original_price}`
        );
      }
    }

    if (selectedItems.length === 0) {
      errors.push('At least one item must be selected for exchange');
    }

  } catch (error: any) {
    console.error('Item validation error:', error);
    errors.push('Failed to validate items. Please try again.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ==========================================
// REPLACEMENT VALIDATION
// ==========================================

export async function validateReplacements(
  originalItems: ExchangeItem[],
  replacementItems: ExchangeItem[],
  exchangeType: 'size' | 'color' | 'product'
): Promise<ExchangeValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Get all available products for validation
    const products = await getProducts();
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate each replacement
    for (const original of originalItems) {
      const replacement = replacementItems.find(
        r => r.order_item_id === original.order_item_id
      );

      if (!replacement) {
        errors.push(`Missing replacement for ${original.product_name}`);
        continue;
      }

      // Validate quantity
      if (replacement.quantity <= 0) {
        errors.push(`Invalid quantity for replacement of ${original.product_name}`);
        continue;
      }

      if (replacement.quantity > original.quantity) {
        errors.push(
          `Replacement quantity (${replacement.quantity}) cannot exceed original (${original.quantity})`
        );
      }

      // Type-specific validation
      switch (exchangeType) {
        case 'size': {
          // Must keep same product and color, change size
          if (replacement.product_id !== original.product_id) {
            errors.push(`Product cannot be changed in size exchange for ${original.product_name}`);
          }
          if (replacement.color !== original.color) {
            errors.push(`Color cannot be changed in size exchange for ${original.product_name}`);
          }
          if (replacement.size === original.size) {
            errors.push(`New size must be different from original for ${original.product_name}`);
          }

          // Verify size availability
          const product = productMap.get(original.product_id);
          if (product && !product.sizes.includes(replacement.size)) {
            errors.push(
              `Size "${replacement.size}" is not available for ${original.product_name}. ` +
              `Available sizes: ${product.sizes.join(', ')}`
            );
          }
          break;
        }

        case 'color': {
          // Must keep same product and size, change color
          if (replacement.product_id !== original.product_id) {
            errors.push(`Product cannot be changed in color exchange for ${original.product_name}`);
          }
          if (replacement.size !== original.size) {
            errors.push(`Size cannot be changed in color exchange for ${original.product_name}`);
          }
          if (replacement.color === original.color) {
            errors.push(`New color must be different from original for ${original.product_name}`);
          }

          // Verify color availability
          const product = productMap.get(original.product_id);
          if (product && !product.colors.includes(replacement.color)) {
            errors.push(
              `Color "${replacement.color}" is not available for ${original.product_name}. ` +
              `Available colors: ${product.colors.join(', ')}`
            );
          }
          break;
        }

        case 'product': {
          // Can change everything but must have valid new product
          if (replacement.product_id === original.product_id) {
            errors.push(`New product must be different from original for ${original.product_name}`);
          }

          const newProduct = productMap.get(replacement.product_id);
          if (!newProduct) {
            errors.push(`Replacement product no longer available`);
            continue;
          }

          // Check stock
          if (newProduct.stock < replacement.quantity) {
            errors.push(
              `Insufficient stock for ${newProduct.name}. ` +
              `Available: ${newProduct.stock}, Requested: ${replacement.quantity}`
            );
          }

          // Verify size and color for new product
          if (!newProduct.sizes.includes(replacement.size)) {
            errors.push(
              `Size "${replacement.size}" not available for ${newProduct.name}. ` +
              `Available: ${newProduct.sizes.join(', ')}`
            );
          }

          if (!newProduct.colors.includes(replacement.color)) {
            errors.push(
              `Color "${replacement.color}" not available for ${newProduct.name}. ` +
              `Available: ${newProduct.colors.join(', ')}`
            );
          }

          // Price difference warning
          const priceDiff = Math.abs(newProduct.price - original.original_price);
          const percentDiff = (priceDiff / original.original_price) * 100;

          if (percentDiff > 50) {
            warnings.push(
              `Large price difference for ${newProduct.name} (${percentDiff.toFixed(0)}% different)`
            );
          }
          break;
        }
      }
    }

  } catch (error: any) {
    console.error('Replacement validation error:', error);
    errors.push('Failed to validate replacements. Please try again.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ==========================================
// STOCK VERIFICATION
// ==========================================

export async function verifyStockAvailability(
  replacementItems: ExchangeItem[]
): Promise<ExchangeValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const products = await getProducts();
    const productMap = new Map(products.map(p => [p.id, p]));

    for (const item of replacementItems) {
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
      } else if (product.stock < item.quantity * 2) {
        warnings.push(
          `Low stock for ${item.product_name} (${product.stock} remaining)`
        );
      }
    }

  } catch (error: any) {
    console.error('Stock verification error:', error);
    errors.push('Unable to verify stock availability. Please try again.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ==========================================
// PRICE CALCULATION
// ==========================================

export function calculateExchangePricing(
  originalItems: ExchangeItem[],
  replacementItems: ExchangeItem[]
) {
  const originalTotal = originalItems.reduce(
    (sum, item) => sum + (item.original_price * item.quantity),
    0
  );

  const replacementTotal = replacementItems.reduce(
    (sum, item) => sum + ((item.current_price || item.original_price) * item.quantity),
    0
  );

  const difference = replacementTotal - originalTotal;

  return {
    originalTotal,
    replacementTotal,
    difference,
    needsPayment: difference > 0,
    needsRefund: difference < 0,
    breakdown: {
      originalItems: originalItems.map(item => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.original_price,
        total: item.original_price * item.quantity
      })),
      replacementItems: replacementItems.map(item => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.current_price || item.original_price,
        total: (item.current_price || item.original_price) * item.quantity
      }))
    }
  };
}

// ==========================================
// CREATE EXCHANGE REQUEST
// ==========================================

export async function createExchangeRequest(
  exchangeData: Omit<ExchangeRequest, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: ExchangeRequest; error?: string }> {
  try {
    // 1. Check eligibility
    const eligibility = await checkExchangeEligibility(
      exchangeData.order_id,
      exchangeData.user_id
    );

    if (!eligibility.eligible) {
      return {
        success: false,
        error: eligibility.reason || 'Order not eligible for exchange'
      };
    }

    // 2. Validate selected items
    const itemValidation = await validateExchangeItems(
      exchangeData.order_id,
      exchangeData.original_items
    );

    if (!itemValidation.isValid) {
      return {
        success: false,
        error: itemValidation.errors.join('; ')
      };
    }

    // 3. Validate replacements
    const replacementValidation = await validateReplacements(
      exchangeData.original_items,
      exchangeData.requested_items,
      exchangeData.exchange_type
    );

    if (!replacementValidation.isValid) {
      return {
        success: false,
        error: replacementValidation.errors.join('; ')
      };
    }

    // 4. Verify stock
    const stockValidation = await verifyStockAvailability(
      exchangeData.requested_items
    );

    if (!stockValidation.isValid) {
      return {
        success: false,
        error: stockValidation.errors.join('; ')
      };
    }

    // 5. Calculate pricing
    const pricing = calculateExchangePricing(
      exchangeData.original_items,
      exchangeData.requested_items
    );

    // 6. Create exchange request
    const { data, error } = await supabase
      .from('exchange_requests')
      .insert({
        ...exchangeData,
        original_total: pricing.originalTotal,
        requested_total: pricing.replacementTotal,
        price_difference: pricing.difference,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as ExchangeRequest
    };

  } catch (error: any) {
    console.error('Create exchange request error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create exchange request'
    };
  }
}

// ==========================================
// GET EXCHANGE REQUESTS
// ==========================================

export async function getUserExchangeRequests(
  userId: string
): Promise<ExchangeRequest[]> {
  const { data, error } = await supabase
    .from('exchange_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ExchangeRequest[];
}

export async function getExchangeRequestById(
  id: string,
  userId?: string
): Promise<ExchangeRequest | null> {
  let query = supabase
    .from('exchange_requests')
    .select('*')
    .eq('id', id);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as ExchangeRequest | null;
}

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

export async function updateExchangeStatus(
  id: string,
  status: ExchangeRequest['status'],
  adminNotes?: string,
  rejectionReason?: string,
  trackingNumber?: string
): Promise<ExchangeRequest> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (adminNotes) updates.admin_notes = adminNotes;
  if (rejectionReason) updates.rejection_reason = rejectionReason;
  if (trackingNumber) updates.tracking_number = trackingNumber;

  // Set timestamp fields based on status
  if (status === 'approved') updates.approved_at = new Date().toISOString();
  if (status === 'rejected') updates.rejected_at = new Date().toISOString();
  if (status === 'shipped') updates.shipped_at = new Date().toISOString();
  if (status === 'completed') updates.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('exchange_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ExchangeRequest;
}

export async function getAllExchangeRequests(
  filters?: {
    status?: ExchangeRequest['status'];
    userId?: string;
    orderId?: string;
  }
): Promise<ExchangeRequest[]> {
  let query = supabase
    .from('exchange_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.orderId) {
    query = query.eq('order_id', filters.orderId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ExchangeRequest[];
}