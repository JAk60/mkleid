// components/ExchangeRequestForm.tsx - COMPLETE ROBUST VERSION
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { getProducts } from '@/lib/supabase';
import { Product } from '@/lib/types';

interface ExchangeRequestFormProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

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
  max_quantity: number;
}

type ExchangeType = 'size' | 'color' | 'product';

export default function ExchangeRequestForm({ order, onClose, onSuccess }: ExchangeRequestFormProps) {
  // State
  const [step, setStep] = useState(1);
  const [exchangeType, setExchangeType] = useState<ExchangeType>('size');
  const [selectedItems, setSelectedItems] = useState<ExchangeItem[]>([]);
  const [replacementItems, setReplacementItems] = useState<ExchangeItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // Load products when items selected
  useEffect(() => {
    if (selectedItems.length > 0 && availableProducts.length === 0) {
      loadProducts();
    }
  }, [selectedItems.length]);

  // Reset replacements when exchange type changes
  useEffect(() => {
    if (selectedItems.length > 0) {
      // Keep existing replacements but validate against new type
      setReplacementItems(prev => 
        prev.map(r => {
          const original = selectedItems.find(s => s.order_item_id === r.order_item_id);
          if (!original) return r;
          
          // Reset to original values based on exchange type
          switch (exchangeType) {
            case 'size':
              return { ...r, color: original.color, product_id: original.product_id };
            case 'color':
              return { ...r, size: original.size, product_id: original.product_id };
            case 'product':
              return r; // Keep all changes for product exchange
            default:
              return r;
          }
        })
      );
    }
  }, [exchangeType]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const products = await getProducts();
      setAvailableProducts(products.filter(p => p.stock > 0));
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load available products');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Item selection toggle
  const handleItemToggle = (item: any) => {
    const exists = selectedItems.find(i => i.order_item_id === item.id);

    if (exists) {
      setSelectedItems(prev => prev.filter(i => i.order_item_id !== item.id));
      setReplacementItems(prev => prev.filter(r => r.order_item_id !== item.id));
    } else {
      const newItem: ExchangeItem = {
        order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        original_price: item.price,
        max_quantity: item.quantity
      };

      setSelectedItems(prev => [...prev, newItem]);
      setReplacementItems(prev => [...prev, { ...newItem }]);
    }
  };

  // Update replacement
  const updateReplacement = (original: ExchangeItem, updates: Partial<ExchangeItem>) => {
    setReplacementItems(prev => 
      prev.map(item => 
        item.order_item_id === original.order_item_id 
          ? { ...item, ...updates }
          : item
      )
    );
  };

  // Replace with different product
  const replaceWithProduct = (original: ExchangeItem, product: Product) => {
    const currentReplacement = replacementItems.find(r => r.order_item_id === original.order_item_id);
    
    setReplacementItems(prev => 
      prev.map(item => 
        item.order_item_id === original.order_item_id
          ? {
              ...item,
              product_id: product.id,
              product_name: product.name,
              product_image: product.image_url,
              size: product.sizes[0] || item.size,
              color: product.colors[0] || item.color,
              current_price: product.price,
              quantity: currentReplacement?.quantity || item.quantity
            }
          : item
      )
    );
  };

  // Check if replacement is complete
  const isReplacementComplete = (item: ExchangeItem): boolean => {
    const replacement = replacementItems.find(r => r.order_item_id === item.order_item_id);
    if (!replacement || replacement.quantity <= 0) return false;

    switch (exchangeType) {
      case 'size':
        return replacement.size !== item.size && 
               replacement.product_id === item.product_id &&
               replacement.color === item.color;
      case 'color':
        return replacement.color !== item.color && 
               replacement.product_id === item.product_id &&
               replacement.size === item.size;
      case 'product':
        return replacement.product_id !== item.product_id &&
               replacement.size !== '' &&
               replacement.color !== '';
      default:
        return false;
    }
  };

  // Validate step
  const validateStep = (currentStep: number): boolean => {
    setError('');
    setWarnings([]);

    if (currentStep === 1) {
      if (selectedItems.length === 0) {
        setError('Please select at least one item to exchange');
        return false;
      }
    }

    if (currentStep === 2) {
      const incomplete = selectedItems.filter(item => !isReplacementComplete(item));
      
      if (incomplete.length > 0) {
        setError(`Please complete replacement selection for: ${incomplete.map(i => i.product_name).join(', ')}`);
        return false;
      }

      // Validate changes were made
      for (const item of selectedItems) {
        const replacement = replacementItems.find(r => r.order_item_id === item.order_item_id);
        
        if (!replacement) continue;

        if (exchangeType === 'size' && replacement.size === item.size) {
          setError(`Please select a different size for ${item.product_name}`);
          return false;
        }
        
        if (exchangeType === 'color' && replacement.color === item.color) {
          setError(`Please select a different color for ${item.product_name}`);
          return false;
        }
        
        if (exchangeType === 'product' && replacement.product_id === item.product_id) {
          setError(`Please select a different product for ${item.product_name}`);
          return false;
        }
      }

      // Price difference warning
      const pricing = calculatePricing();
      if (pricing.difference > 5000) {
        setWarnings([`Large additional payment required: ₹${pricing.difference.toFixed(2)}`]);
      }
    }

    if (currentStep === 3) {
      if (!reason) {
        setError('Please select a reason for exchange');
        return false;
      }
    }

    return true;
  };

  // Calculate pricing
  const calculatePricing = () => {
    const originalTotal = selectedItems.reduce((sum, i) => sum + i.original_price * i.quantity, 0);
    const replacementTotal = replacementItems.reduce((sum, i) => {
      const price = i.current_price || i.original_price;
      return sum + price * i.quantity;
    }, 0);

    return {
      originalTotal,
      replacementTotal,
      difference: replacementTotal - originalTotal
    };
  };

  // Submit exchange request
  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/exchanges', {
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
          user_agent: navigator.userAgent
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to submit exchange request');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Exchange submission error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const pricing = calculatePricing();

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your exchange request has been submitted successfully. We'll review it and get back to you within 24-48 hours.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-6 shadow-xl">
        
        {/* Header */}
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

        {/* Step Indicator */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s === step ? 'bg-blue-600 text-white' : s < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
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

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mx-6 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            {warnings.map((warning, idx) => (
              <p key={idx} className="text-yellow-800 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{warning}</span>
              </p>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4 text-lg">Select Items to Exchange</h3>
                <div className="grid gap-3">
                  {order.items.map((item: any, idx: number) => {
                    const selected = selectedItems.find(i => i.order_item_id === item.id);

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
                          <div className="font-bold text-gray-900 mt-1">₹{item.price.toFixed(2)}</div>
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
                      { type: 'size' as ExchangeType, label: 'Size Exchange', desc: 'Change size only' },
                      { type: 'color' as ExchangeType, label: 'Color Exchange', desc: 'Change color only' },
                      { type: 'product' as ExchangeType, label: 'Product Exchange', desc: 'Exchange for different item' }
                    ].map(({ type, label, desc }) => (
                      <button
                        key={type}
                        onClick={() => setExchangeType(type)}
                        className={`border-2 p-4 rounded-lg text-left transition-all ${
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

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-4">
                Select your preferred replacement for each item. You can adjust the quantity if needed.
              </p>

              {loadingProducts ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : (
                selectedItems.map((item, idx) => {
                  const replacement = replacementItems.find(r => r.order_item_id === item.order_item_id);
                  const sourceProduct = availableProducts.find(p => p.id === item.product_id);
                  const isComplete = isReplacementComplete(item);

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
                      className={`border-2 rounded-lg p-5 space-y-4 transition-all ${
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
                        {isComplete && <CheckCircle className="w-6 h-6 text-green-600" />}
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="text-sm font-medium block mb-2">Quantity to Exchange</label>
                        <select
                          value={replacement?.quantity || item.quantity}
                          onChange={(e) => updateReplacement(item, { quantity: Number(e.target.value) })}
                          className="border rounded px-3 py-2 w-32"
                        >
                          {Array.from({ length: item.max_quantity }, (_, i) => i + 1).map(q => (
                            <option key={q} value={q}>{q}</option>
                          ))}
                        </select>
                      </div>

                      {/* Size Exchange */}
                      {exchangeType === 'size' && sourceProduct && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Select New Size *</label>
                          <div className="flex gap-2 flex-wrap">
                            {sourceProduct.sizes.map(size => {
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

                      {/* Color Exchange */}
                      {exchangeType === 'color' && sourceProduct && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Select New Color *</label>
                          <div className="flex gap-2 flex-wrap">
                            {sourceProduct.colors.map(color => {
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
                                  <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: color }} />
                                  {color} {isCurrent && '(Current)'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Product Exchange */}
                      {exchangeType === 'product' && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Choose Replacement Product *</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                            {availableProducts
                              .filter(p => p.id !== item.product_id)
                              .map(p => {
                                const isSelected = replacement?.product_id === p.id;

                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => replaceWithProduct(item, p)}
                                    className={`border-2 p-3 rounded-lg flex gap-3 text-left transition-all ${
                                      isSelected
                                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-gray-300 hover:border-blue-400'
                                    }`}
                                  >
                                    <img src={p.image_url} className="w-12 h-12 rounded object-cover" alt={p.name} />
                                    <div className="flex-1">
                                      <div className="font-semibold text-sm">{p.name}</div>
                                      <div className="text-sm text-gray-600">₹{p.price.toFixed(2)}</div>
                                      <div className="text-xs text-gray-500 mt-1">Stock: {p.stock}</div>
                                    </div>
                                  </button>
                                );
                              })}
                          </div>

                          {/* Size/Color for new product */}
                          {replacement?.product_id && replacement.product_id !== item.product_id && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3 border border-blue-200">
                              <p className="text-sm font-medium text-blue-900">Configure your replacement:</p>
                              {(() => {
                                const selectedProduct = availableProducts.find(p => p.id === replacement.product_id);
                                if (!selectedProduct) return null;

                                return (
                                  <>
                                    <div>
                                      <label className="text-xs font-medium block mb-2 text-gray-700">Size</label>
                                      <div className="flex gap-2 flex-wrap">
                                        {selectedProduct.sizes.map(size => (
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

                                    <div>
                                      <label className="text-xs font-medium block mb-2 text-gray-700">Color</label>
                                      <div className="flex gap-2 flex-wrap">
                                        {selectedProduct.colors.map(color => (
                                          <button
                                            key={color}
                                            onClick={() => updateReplacement(item, { color })}
                                            className={`px-3 py-1.5 text-sm border rounded flex items-center gap-2 transition-all ${
                                              replacement.color === color
                                                ? 'border-blue-600 bg-blue-100 font-semibold'
                                                : 'border-gray-300 hover:border-blue-400'
                                            }`}
                                          >
                                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }} />
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
                })
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4 text-lg">Exchange Summary</h3>
                {selectedItems.map((item, idx) => {
                  const replacement = replacementItems.find(r => r.order_item_id === item.order_item_id);

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
                  <span className="font-semibold">₹{pricing.originalTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Replacement Total</span>
                  <span className="font-semibold">₹{pricing.replacementTotal.toFixed(2)}</span>
                </div>
                {pricing.difference !== 0 && (
                  <div className="flex justify-between font-semibold border-t pt-3 text-lg">
                    <span>{pricing.difference < 0 ? 'Refund Amount' : 'Additional Payment'}</span>
                    <span className={pricing.difference < 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(pricing.difference).toFixed(2)}
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