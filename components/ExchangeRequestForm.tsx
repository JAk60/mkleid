'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, CheckCircle, AlertCircle, X } from 'lucide-react';
import { getProducts } from '@/lib/supabase';
import { Product } from '@/lib/types';

interface ExchangeRequestFormProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExchangeRequestForm({ order, onClose, onSuccess }: ExchangeRequestFormProps) {
  const [step, setStep] = useState(1);
  const [exchangeType, setExchangeType] = useState<'size' | 'color' | 'product'>('size');

  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [replacementItems, setReplacementItems] = useState<any[]>([]);

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load products when items are selected (needed for all exchange types)
  useEffect(() => {
    if (selectedItems.length > 0) {
      loadProducts();
    }
  }, [selectedItems.length]);

  const loadProducts = async () => {
    try {
      const products = await getProducts();
      setAvailableProducts(products.filter((p) => p.stock > 0));
    } catch {
      setError('Failed to load available products');
    }
  };

  // Reset replacements when exchange type changes
  useEffect(() => {
    // Re-initialize replacements with current values when exchange type changes
    if (selectedItems.length > 0) {
      setReplacementItems(selectedItems.map(item => ({
        order_item_id: item.order_item_id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
      })));
    }
  }, [exchangeType]);

  // ----------------------------
  // ITEM SELECT TOGGLE
  // ----------------------------
  const handleItemToggle = (item: any) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.order_item_id === item.id);

      if (exists) {
        // Remove from both selected and replacement lists
        setReplacementItems((repl) => 
          repl.filter((r) => r.order_item_id !== item.id)
        );
        return prev.filter((i) => i.order_item_id !== item.id);
      }

      // Add to selected items with full quantity by default
      const newItem = {
        order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        size: item.size,
        color: item.color,
        quantity: item.quantity, // Default to full quantity
        max_quantity: item.quantity,
        price: item.price,
      };

      // Initialize replacement with same quantity and original attributes
      setReplacementItems((repl) => [
        ...repl,
        {
          order_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          size: item.size, // Will be changed by user
          color: item.color, // Will be changed by user
          quantity: item.quantity,
          price: item.price,
        },
      ]);

      return [...prev, newItem];
    });
  };

  // ----------------------------
  // REPLACEMENT HANDLING
  // ----------------------------
  const updateReplacement = (original: any, updates: any) => {
    setReplacementItems((prev) => {
      const exists = prev.find((i) => i.order_item_id === original.order_item_id);

      const newItem = {
        order_item_id: original.order_item_id,
        product_id: original.product_id,
        product_name: original.product_name,
        product_image: original.product_image,
        size: original.size,
        color: original.color,
        quantity: original.quantity,
        price: original.price,
        ...updates,
      };

      if (exists) {
        return prev.map((i) =>
          i.order_item_id === original.order_item_id ? newItem : i
        );
      }

      return [...prev, newItem];
    });
  };

  // ----------------------------
  // PRODUCT REPLACEMENT HANDLER
  // ----------------------------
  const replaceWithProduct = (original: any, product: Product) => {
    setReplacementItems((prev) => {
      const filtered = prev.filter((i) => i.order_item_id !== original.order_item_id);
      
      // Get current replacement to preserve quantity
      const currentReplacement = prev.find((i) => i.order_item_id === original.order_item_id);
      
      return [
        ...filtered,
        {
          order_item_id: original.order_item_id,
          product_id: product.id,
          product_name: product.name,
          product_image: product.image_url,
          size: product.sizes[0] || 'N/A', // Auto-select first available size
          color: product.colors[0] || 'N/A', // Auto-select first available color
          quantity: currentReplacement?.quantity || original.quantity,
          price: product.price,
        },
      ];
    });
  };

  // ----------------------------
  // CALCULATE TOTALS
  // ----------------------------
  const calculateTotals = () => {
    const originalTotal = selectedItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    const replacementTotal = replacementItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    return { 
      originalTotal, 
      replacementTotal, 
      difference: replacementTotal - originalTotal 
    };
  };

  // ----------------------------
  // CHECK IF REPLACEMENT IS COMPLETE
  // ----------------------------
  const isReplacementComplete = (item: any) => {
    const replacement = replacementItems.find(
      (r) => r.order_item_id === item.order_item_id
    );

    if (!replacement) return false;

    // Must have quantity
    if (!replacement.quantity || replacement.quantity <= 0) return false;

    // For size exchange - must select a different size
    if (exchangeType === 'size') {
      return replacement.size && replacement.size !== item.size;
    }

    // For color exchange - must select a different color
    if (exchangeType === 'color') {
      return replacement.color && replacement.color !== item.color;
    }

    // For product exchange - must select a different product
    if (exchangeType === 'product') {
      return replacement.product_id && replacement.product_id !== item.product_id;
    }

    return false;
  };

  // ----------------------------
  // CHECK IF USER HAS STARTED SELECTION (to avoid premature errors)
  // ----------------------------
  const hasStartedSelection = (item: any) => {
    const replacement = replacementItems.find(
      (r) => r.order_item_id === item.order_item_id
    );

    if (!replacement) return false;

    // Check if user has made any change from original
    if (exchangeType === 'size') {
      return replacement.size !== item.size;
    }
    
    if (exchangeType === 'color') {
      return replacement.color !== item.color;
    }
    
    if (exchangeType === 'product') {
      return replacement.product_id !== item.product_id;
    }

    return false;
  };

  // ----------------------------
  // VALIDATE BEFORE MOVING TO NEXT STEP
  // ----------------------------
  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (selectedItems.length === 0) {
        setError('Please select at least one item to exchange');
        return false;
      }
    }

    if (currentStep === 2) {
      // Check if all items have complete replacements
      const incomplete = selectedItems.filter(item => !isReplacementComplete(item));
      
      if (incomplete.length > 0) {
        setError('Please complete replacement selection for all items');
        return false;
      }

      // Validate that changes were actually made
      for (const item of selectedItems) {
        const replacement = replacementItems.find(r => r.order_item_id === item.order_item_id);
        
        if (exchangeType === 'size' && replacement?.size === item.size) {
          setError(`Please select a different size for ${item.product_name}`);
          return false;
        }
        
        if (exchangeType === 'color' && replacement?.color === item.color) {
          setError(`Please select a different color for ${item.product_name}`);
          return false;
        }
        
        if (exchangeType === 'product' && replacement?.product_id === item.product_id) {
          setError(`Please select a different product for ${item.product_name}`);
          return false;
        }
      }
    }

    if (currentStep === 3) {
      if (!reason) {
        setError('Please select a reason for exchange');
        return false;
      }
    }

    setError('');
    return true;
  };

  // ----------------------------
  // SUBMIT
  // ----------------------------
  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          user_id: order.user_id,
          original_items: selectedItems,
          requested_items: replacementItems,
          exchange_type: exchangeType,
          reason,
          description,
          status: 'pending',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to submit exchange request');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setError('Network error submitting request');
      setLoading(false);
    }
  };

  const { originalTotal, replacementTotal, difference } = calculateTotals();

  // ----------------------------
  // SUCCESS MODAL
  // ----------------------------
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Exchange Request Submitted!</h2>
          <p className="text-gray-600 mb-6">We will review your request shortly.</p>

          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------
  // MAIN FORM (3 STEPS)
  // ----------------------------
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-6 shadow-xl">

        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Exchange Request</h2>
              <p className="text-gray-600 text-sm">Order #{order.order_number}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* STEP INDICATOR */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    s === step
                      ? 'bg-blue-600 text-white'
                      : s < step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      s < step ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg">
              {step === 1 && 'Select Items & Exchange Type'}
              {step === 2 && 'Choose Replacements'}
              {step === 3 && 'Review & Submit'}
            </h3>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mx-6 mb-4 bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* CONTENT */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">

          {/* STEP 1 — SELECT ITEMS & TYPE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4 text-lg">Select Items to Exchange</h3>

                <div className="grid gap-3">
                  {order.items.map((item: any, idx: number) => {
                    const selected = selectedItems.find((i) => i.order_item_id === item.id);

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                          selected ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                        }`}
                        onClick={() => handleItemToggle(item)}
                      >
                        <input
                          type="checkbox"
                          checked={!!selected}
                          readOnly
                          className="w-5 h-5 accent-blue-600"
                        />

                        <img src={item.product_image} className="w-16 h-16 rounded object-cover" alt={item.product_name} />

                        <div className="flex-1">
                          <div className="font-semibold">{item.product_name}</div>
                          <div className="text-sm text-gray-600">
                            Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                          </div>
                          <div className="font-bold text-gray-900 mt-1">₹{item.price}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Exchange Type</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { type: 'size', label: 'Size Exchange', desc: 'Change size only' },
                      { type: 'color', label: 'Color Exchange', desc: 'Change color only' },
                      { type: 'product', label: 'Product Exchange', desc: 'Exchange for different item' }
                    ].map(({ type, label, desc }) => (
                      <button
                        key={type}
                        onClick={() => setExchangeType(type as any)}
                        className={`border p-4 rounded-lg text-left transition-all ${
                          exchangeType === type 
                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' 
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <div className="font-semibold">{label}</div>
                        <div className="text-sm text-gray-600 mt-1">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — SELECT REPLACEMENTS */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-4">
                Select your preferred replacement for each item. You can adjust the quantity if needed.
              </p>

              {selectedItems.map((item, idx) => {
                const replacement = replacementItems.find(
                  (r) => r.order_item_id === item.order_item_id
                );

                const sourceProduct =
                  availableProducts.find((p) => p.id === item.product_id) || null;

                const isComplete = isReplacementComplete(item);
                const hasStarted = hasStartedSelection(item);

                // If we don't have product data yet, show loading
                if (exchangeType !== 'product' && !sourceProduct) {
                  return (
                    <div key={idx} className="border rounded-lg p-5 text-center text-gray-500">
                      Loading product options...
                    </div>
                  );
                }

                return (
                  <div 
                    key={idx} 
                    className={`border rounded-lg p-5 space-y-4 transition-all ${
                      isComplete ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <img src={item.product_image} className="w-16 h-16 rounded object-cover" alt={item.product_name} />
                        <div>
                          <h4 className="font-semibold">{item.product_name}</h4>
                          <p className="text-sm text-gray-600">
                            Current: Size {item.size}, Color {item.color}, Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      {isComplete && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>

                    {/* QUANTITY SELECTOR */}
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Quantity to Exchange
                      </label>

                      <select
                        value={replacement?.quantity || item.quantity}
                        onChange={(e) =>
                          updateReplacement(item, { quantity: Number(e.target.value) })
                        }
                        className="border rounded px-3 py-2 w-32"
                      >
                        {Array.from({ length: item.max_quantity }, (_, i) => i + 1).map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SIZE EXCHANGE */}
                    {exchangeType === 'size' && sourceProduct && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Select New Size *
                        </label>

                        <div className="flex gap-2 flex-wrap">
                          {sourceProduct.sizes.map((size) => {
                            const isCurrent = size === item.size;
                            const isSelected = replacement?.size === size;

                            return (
                              <button
                                key={size}
                                onClick={() => updateReplacement(item, { size })}
                                disabled={isCurrent}
                                className={`px-4 py-2 border rounded transition-all ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                    : isCurrent
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'border-gray-300 hover:border-blue-400'
                                }`}
                              >
                                {size} {isCurrent && '(Current)'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* COLOR EXCHANGE */}
                    {exchangeType === 'color' && sourceProduct && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Select New Color *
                        </label>

                        <div className="flex gap-2 flex-wrap">
                          {sourceProduct.colors.map((color) => {
                            const isCurrent = color === item.color;
                            const isSelected = replacement?.color === color;

                            return (
                              <button
                                key={color}
                                onClick={() => updateReplacement(item, { color })}
                                disabled={isCurrent}
                                className={`px-4 py-2 border rounded flex items-center gap-2 transition-all ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                    : isCurrent
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'border-gray-300 hover:border-blue-400'
                                }`}
                              >
                                <div
                                  className="w-5 h-5 rounded-full border"
                                  style={{ backgroundColor: color }}
                                />
                                {color} {isCurrent && '(Current)'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* PRODUCT EXCHANGE */}
                    {exchangeType === 'product' && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Choose Replacement Product *
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {availableProducts
                            .filter(p => p.id !== item.product_id)
                            .map((p) => {
                              const isSelected = replacement?.product_id === p.id;

                              return (
                                <button
                                  key={p.id}
                                  onClick={() => replaceWithProduct(item, p)}
                                  className={`border p-3 rounded-lg flex gap-3 text-left transition-all ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                      : 'border-gray-300 hover:border-blue-400'
                                  }`}
                                >
                                  <img src={p.image_url} className="w-12 h-12 rounded object-cover" alt={p.name} />
                                  <div className="flex-1">
                                    <div className="font-semibold text-sm">{p.name}</div>
                                    <div className="text-sm text-gray-600">₹{p.price}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Stock: {p.stock}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                        </div>

                        {/* Show size/color selection for the NEW product */}
                        {replacement?.product_id && replacement.product_id !== item.product_id && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3 border border-blue-200">
                            <p className="text-sm font-medium text-blue-900">
                              Configure your replacement:
                            </p>

                            {(() => {
                              const selectedProduct = availableProducts.find(
                                p => p.id === replacement.product_id
                              );
                              
                              if (!selectedProduct) return null;

                              return (
                                <>
                                  {/* Size selection for new product */}
                                  <div>
                                    <label className="text-xs font-medium block mb-2 text-gray-700">
                                      Size
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                      {selectedProduct.sizes.map((size) => (
                                        <button
                                          key={size}
                                          onClick={() => updateReplacement(item, { size })}
                                          className={`px-3 py-1.5 text-sm border rounded transition-all ${
                                            replacement.size === size
                                              ? 'border-blue-600 bg-blue-100 font-semibold'
                                              : 'border-gray-300 hover:border-blue-400'
                                          }`}
                                        >
                                          {size}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Color selection for new product */}
                                  <div>
                                    <label className="text-xs font-medium block mb-2 text-gray-700">
                                      Color
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                      {selectedProduct.colors.map((color) => (
                                        <button
                                          key={color}
                                          onClick={() => updateReplacement(item, { color })}
                                          className={`px-3 py-1.5 text-sm border rounded flex items-center gap-2 transition-all ${
                                            replacement.color === color
                                              ? 'border-blue-600 bg-blue-100 font-semibold'
                                              : 'border-gray-300 hover:border-blue-400'
                                          }`}
                                        >
                                          <div
                                            className="w-4 h-4 rounded-full border"
                                            style={{ backgroundColor: color }}
                                          />
                                          {color}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 3 — CONFIRM */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4 text-lg">Exchange Summary</h3>

                {selectedItems.map((item, idx) => {
                  const replacement = replacementItems.find(
                    r => r.order_item_id === item.order_item_id
                  );

                  return (
                    <div key={idx} className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold">Original</div>
                        <div className="text-sm text-gray-600">
                          {item.product_name} - {item.size}/{item.color} × {item.quantity}
                        </div>
                      </div>

                      <ArrowLeftRight className="w-5 h-5 text-blue-600" />

                      <div className="flex-1">
                        <div className="font-semibold">Replacement</div>
                        <div className="text-sm text-gray-600">
                          {replacement?.product_name} - {replacement?.size}/{replacement?.color} × {replacement?.quantity}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
                <div className="flex justify-between text-gray-700">
                  <span>Original Total</span>
                  <span className="font-semibold">₹{originalTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>Replacement Total</span>
                  <span className="font-semibold">₹{replacementTotal.toFixed(2)}</span>
                </div>

                {difference !== 0 && (
                  <div className="flex justify-between font-semibold border-t pt-3 text-lg">
                    <span>{difference < 0 ? 'Refund Amount' : 'Additional Payment'}</span>
                    <span className={difference < 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(difference).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Reason for Exchange *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select a reason</option>
                  <option value="wrong_size">Wrong Size</option>
                  <option value="wrong_color">Wrong Color</option>
                  <option value="doesnt_fit">Doesn't Fit</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="changed_mind">Changed Mind</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Additional Details (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide any additional information about your exchange request..."
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="p-6 border-t flex justify-between items-center bg-gray-50">
          <button
            onClick={() => {
              if (step > 1) {
                setError('');
                setStep(step - 1);
              } else {
                onClose();
              }
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="text-sm text-gray-600">
            Step {step} of 3
          </div>

          {step < 3 ? (
            <button
              onClick={() => {
                if (validateStep(step)) {
                  setStep(step + 1);
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting…' : 'Submit Exchange Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}