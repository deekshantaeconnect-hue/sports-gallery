// src/components/product/AddToCartButton.tsx (FIXED)
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ShoppingCart, Loader2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useVariantSelection } from '@/hooks/useVariantSelection';
import { VariantSelectionModal } from './VariantSelectionModal';
import { ProductVariant, ModalProduct } from '@/types/product';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    variants?: ProductVariant[];
    stock?: number;
    isCodEnabled: boolean;
    subtitle?: string;
    rating?: number;
    reviewCount?: number;
  };
  variantId?: string;
  stock?: number;
  showModal?: boolean;
}

// Helper to convert product to ModalProduct
const toModalProduct = (product: AddToCartButtonProps['product']): ModalProduct => {
  return {
    id: product.id,
    name: product.name,
    subtitle: product.subtitle,
    images: product.images,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isCodEnabled: product.isCodEnabled,
    variants: product.variants,
  };
};

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  variantId: initialVariantId,
  stock: propStock,
  showModal: showModalProp = true,
}) => {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get variants or create placeholder
  const variants = useMemo(() => product.variants || [], [product.variants]);

  // Variant selection logic
  const {
    selectedVariant,
    selectedVariantId,
    setSelectedVariantId,
    showModal,
    openModal,
    closeModal,
    isSingleVariant,
    hasVariants,
    purchasableVariants,
  } = useVariantSelection({
    variants: variants,
    initialVariantId: initialVariantId,
    autoSelectSingle: true,
  });

  // Calculate available stock
  const availableStock = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.stock || 0;
    }
    if (variants.length > 0) {
      return 0;
    }
    return propStock || product.stock || 0;
  }, [selectedVariant, variants, propStock, product.stock]);

  // Check if in cart
  const cartItem = useMemo(() => {
    return items.find(
      (item) =>
        item.productId === product.id &&
        (item.variantId || undefined) === (selectedVariantId || undefined)
    );
  }, [items, product.id, selectedVariantId]);

  const currentQuantity = cartItem?.quantity || 0;

  // Determine if we need to show modal
  const shouldShowModal = useMemo(() => {
    if (!showModalProp) return false;
    if (!hasVariants) return false;
    if (isSingleVariant) return false;
    
    // Multiple active variants - need modal
    const activeVariants = variants.filter(v => v.isActive !== false);
    return activeVariants.length > 1;
  }, [hasVariants, isSingleVariant, showModalProp, variants]);

  // Handle add to cart via modal
  const handleModalAddToCart = useCallback(
    async (variantId: string, quantity: number) => {
      setIsProcessing(true);
      setError(null);

      try {
        const variant = variants.find(v => v.id === variantId);
        if (!variant) {
          throw new Error('Variant not found');
        }

        await addItem({
          productId: product.id,
          variantId: variantId,
          name: product.name,
          price: variant.price,
          image: product.images?.[0] || '',
          quantity: quantity,
          isCodEnabled: product.isCodEnabled,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to add to cart');
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [addItem, product, variants]
  );

  // Handle add initial (for no variants or single variant)
  const handleAddInitial = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (shouldShowModal) {
        openModal();
        return;
      }

      if (availableStock <= 0) return;

      if (variants.length > 0 && !selectedVariant) {
        const firstActive = variants.find(v => v.isActive !== false);
        if (!firstActive) return;
        setSelectedVariantId(firstActive.id);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        await addItem({
          productId: product.id,
          variantId: selectedVariantId || undefined,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || '',
          quantity: 1,
          isCodEnabled: product.isCodEnabled,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to add to cart');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      shouldShowModal,
      openModal,
      availableStock,
      variants,
      selectedVariant,
      selectedVariantId,
      setSelectedVariantId,
      addItem,
      product,
    ]
  );

  const handleIncrease = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentQuantity >= availableStock) return;
      setIsProcessing(true);
      try {
        await updateQuantity(product.id, currentQuantity + 1, selectedVariantId || undefined);
      } catch (err: any) {
        setError(err.message || 'Failed to update quantity');
      } finally {
        setIsProcessing(false);
      }
    },
    [currentQuantity, availableStock, updateQuantity, product.id, selectedVariantId]
  );

  const handleDecrease = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsProcessing(true);
      try {
        if (currentQuantity === 1) {
          await removeItem(product.id, selectedVariantId || undefined);
        } else {
          await updateQuantity(product.id, currentQuantity - 1, selectedVariantId || undefined);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to update quantity');
      } finally {
        setIsProcessing(false);
      }
    },
    [currentQuantity, removeItem, updateQuantity, product.id, selectedVariantId]
  );

  const btnBase =
    'w-full rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center overflow-hidden';
  const heightClass = 'h-9 sm:h-12';

  // Out of Stock
  if (availableStock <= 0 && !shouldShowModal) {
    return (
      <button
        disabled
        className={cn(
          btnBase,
          heightClass,
          'bg-zinc-100 text-zinc-400 text-[10px] sm:text-xs font-bold border border-zinc-200 cursor-not-allowed'
        )}
      >
        OUT OF STOCK
      </button>
    );
  }

  // In Cart with Quantity
  if (currentQuantity > 0) {
    return (
      <>
        <div
          className={cn(
            btnBase,
            heightClass,
            'border-2 border-[#006044] bg-white px-0.5 sm:px-1'
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            onClick={handleDecrease}
            disabled={isProcessing}
            className="h-full w-8 sm:w-12 flex items-center justify-center text-[#006044] hover:bg-zinc-50 shrink-0"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[3px]" />
          </button>

          <span className="flex-1 text-sm sm:text-lg font-black text-[#006044] text-center min-w-[20px]">
            {isProcessing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
            ) : (
              currentQuantity
            )}
          </span>

          <button
            onClick={handleIncrease}
            disabled={isProcessing || currentQuantity >= availableStock}
            className="h-full w-8 sm:w-12 flex items-center justify-center text-[#006044] hover:bg-zinc-50 shrink-0 disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[3px]" />
          </button>
        </div>

        {/* Variant Modal */}
        {shouldShowModal && (
          <VariantSelectionModal
            isOpen={showModal}
            onClose={closeModal}
            product={toModalProduct(product)}
            variants={purchasableVariants.length > 0 ? purchasableVariants : variants}
            onAddToCart={handleModalAddToCart}
            isProcessing={isProcessing}
          />
        )}
      </>
    );
  }

  // Add to Cart
  return (
    <>
      <button
        onClick={handleAddInitial}
        disabled={isProcessing || (hasVariants && !selectedVariant && !shouldShowModal)}
        className={cn(
          btnBase,
          heightClass,
          'bg-[#006044] text-white hover:bg-[#004d36] shadow-md shadow-green-100/50 gap-1.5 sm:gap-3',
          (isProcessing || (hasVariants && !selectedVariant && !shouldShowModal)) &&
            'opacity-70 cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
        ) : shouldShowModal ? (
          <>
            <ShoppingCart className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-sm font-black tracking-wider sm:tracking-widest uppercase">
              Select Variant
            </span>
          </>
        ) : hasVariants && !selectedVariant ? (
          <span className="text-[10px] sm:text-sm font-black tracking-wider sm:tracking-widest uppercase">
            Loading...
          </span>
        ) : (
          <>
            <ShoppingCart className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-sm font-black tracking-wider sm:tracking-widest uppercase">
              Add to Cart
            </span>
          </>
        )}
      </button>

      {/* Variant Modal */}
      {shouldShowModal && (
        <VariantSelectionModal
          isOpen={showModal}
          onClose={closeModal}
          product={toModalProduct(product)}
          variants={purchasableVariants.length > 0 ? purchasableVariants : variants}
          onAddToCart={handleModalAddToCart}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
};