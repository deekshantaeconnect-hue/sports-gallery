// src/components/product/VariantSelectionModal.tsx (FIXED)
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Star, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { VariantList } from './VariantList';
import { QuantitySelector } from './QuantitySelector';
import { ModalProduct, Product, ProductVariant } from '@/types/product';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { 
  normalizeMediaCollection, 
  resolveFirstProductImage 
} from '@/utils/media-normalization';

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ModalProduct;
  variants: ProductVariant[];
  onAddToCart: (variantId: string, quantity: number) => Promise<void>;
  isProcessing?: boolean;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  isOpen,
  onClose,
  product,
  variants,
  onAddToCart,
  isProcessing: externalProcessing = false,
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [internalProcessing, setInternalProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const isProcessing = externalProcessing || internalProcessing;

  // Get selected variant
  const selectedVariant = useMemo(
    () => variants.find(v => v.id === selectedVariantId) || null,
    [variants, selectedVariantId]
  );

  // Check if variant is out of stock
  const isOutOfStock = useMemo(
    () => selectedVariant ? selectedVariant.stock <= 0 : false,
    [selectedVariant]
  );

  // Max quantity available
  const maxQuantity = useMemo(
    () => selectedVariant?.stock || 0,
    [selectedVariant]
  );

  // Price calculations
  const { price, oldPrice, discount, totalPrice } = useMemo(() => {
    if (!selectedVariant) {
      return { price: 0, oldPrice: 0, discount: 0, totalPrice: 0 };
    }

    const p = selectedVariant.price || 0;
    const op = selectedVariant.oldPrice || 0;
    const disc = op > p ? Math.round(((op - p) / op) * 100) : 0;
    const total = p * quantity;

    return { price: p, oldPrice: op, discount: disc, totalPrice: total };
  }, [selectedVariant, quantity]);

  // Formatted prices
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  }, [price]);

  const formattedTotal = useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(totalPrice);
  }, [totalPrice]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setQuantity(1);
      
      // Auto-select first in-stock variant if none selected
      if (!selectedVariantId) {
        const firstInStock = variants.find(v => v.stock > 0);
        if (firstInStock) {
          setSelectedVariantId(firstInStock.id);
        }
      }
    }
  }, [isOpen, variants, selectedVariantId]);

  // Handle variant selection
  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
    setError(null);
    setQuantity(1);
  }, []);

  // Handle quantity change
  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
    setError(null);
  }, []);

  // Handle add to cart
  const handleAddToCart = useCallback(async () => {
    if (!selectedVariantId) {
      setError('Please select a variant');
      return;
    }

    if (isOutOfStock) {
      setError('This variant is out of stock');
      return;
    }

    if (quantity > maxQuantity) {
      setError(`Only ${maxQuantity} items available in stock`);
      return;
    }

    setInternalProcessing(true);
    setError(null);

    try {
      await onAddToCart(selectedVariantId, quantity);
      showToast(`${product.name} added to cart`, 'success');
      onClose();
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Failed to add to cart');
    } finally {
      setInternalProcessing(false);
    }
  }, [
    selectedVariantId,
    quantity,
    maxQuantity,
    isOutOfStock,
    onAddToCart,
    product.name,
    showToast,
    onClose,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Enter' && !isProcessing && !isOutOfStock && selectedVariantId) {
        handleAddToCart();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, isOutOfStock, selectedVariantId, handleAddToCart]);

 const normalizedMedia = useMemo(() => {
  return normalizeMediaCollection(product.images);
}, [product.images]);

const productImage = useMemo(() => {
  return resolveFirstProductImage(normalizedMedia);
}, [normalizedMedia]);

const safeImageUrl =
  productImage ||
  "/placeholder-product.png";


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl"
      ariaLabelledBy="variant-modal-title"
      returnFocus={false}
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 p-4 md:p-6 border-b border-gray-100">
          <h2 id="variant-modal-title" className="text-xl font-bold text-gray-900">
            Select Product Variant
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Product Info */}
          <div className="flex gap-4">
            <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={safeImageUrl}
                alt={product.name}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback on error
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-product.png';
                }}
                unoptimized={safeImageUrl.startsWith('data:')}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {product.name}
              </h3>
              {product.subtitle && (
                <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                  {product.subtitle}
                </p>
              )}
              {product.rating && product.rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {product.rating.toFixed(1)}
                  </span>
                  {product.reviewCount && product.reviewCount > 0 && (
                    <span className="text-sm text-gray-500">
                      ({product.reviewCount} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Variant List */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Available Variants
              </h4>
              <VariantList
                variants={variants}
                selectedVariantId={selectedVariantId}
                onSelect={handleVariantSelect}
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Quantity
              </span>
              <QuantitySelector
                quantity={quantity}
                onChange={handleQuantityChange}
                min={1}
                max={maxQuantity}
                disabled={isProcessing || isOutOfStock || !selectedVariantId}
                size="md"
              />
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={
                isProcessing ||
                isOutOfStock ||
                !selectedVariantId ||
                quantity > maxQuantity
              }
              className={cn(
                'w-full sm:flex-1 py-3 px-6 rounded-xl font-bold text-white',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006044]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isOutOfStock || !selectedVariantId
                  ? 'bg-gray-400 hover:bg-gray-400'
                  : 'bg-[#006044] hover:bg-[#004d36] active:scale-[0.98]'
              )}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </div>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : !selectedVariantId ? (
                'Select a Variant'
              ) : (
                <span>
                  Add {quantity} Item{quantity > 1 ? 's' : ''} • {formattedTotal}
                </span>
              )}
            </button>
          </div>

          {/* Stock info */}
          {selectedVariant && selectedVariant.stock > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {selectedVariant.stock > 10
                ? `${selectedVariant.stock} items in stock`
                : `Only ${selectedVariant.stock} items left`}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};