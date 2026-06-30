// src/components/product/VariantList.tsx
'use client';

import React, { useCallback, useMemo } from 'react';
import { ProductVariant } from '@/types/product';
import { VariantCard } from './VariantCard';

interface VariantListProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  disabled?: boolean;
}

export const VariantList: React.FC<VariantListProps> = ({
  variants,
  selectedVariantId,
  onSelect,
  disabled = false,
}) => {
  // Sort variants: in-stock first, then by price
  const sortedVariants = useMemo(() => {
    return [...variants].sort((a, b) => {
      // In-stock variants first
      if (a.stock > 0 && b.stock <= 0) return -1;
      if (a.stock <= 0 && b.stock > 0) return 1;
      // Then by price
      return a.price - b.price;
    });
  }, [variants]);

  const handleSelect = useCallback((variantId: string) => {
    if (!disabled) {
      onSelect(variantId);
    }
  }, [disabled, onSelect]);

  return (
    <div className="space-y-3">
      {sortedVariants.map((variant) => (
        <VariantCard
          key={variant.id}
          variant={variant}
          isSelected={selectedVariantId === variant.id}
          onSelect={handleSelect}
          disabled={disabled}
        />
      ))}
    </div>
  );
};