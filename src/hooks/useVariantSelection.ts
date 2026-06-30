// src/hooks/useVariantSelection.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ProductVariant } from '@/types/product';

interface UseVariantSelectionProps {
  variants: ProductVariant[];
  initialVariantId?: string;
  autoSelectSingle?: boolean;
}

interface UseVariantSelectionReturn {
  selectedVariant: ProductVariant | null;
  selectedVariantId: string | null;
  setSelectedVariantId: (id: string) => void;
  showModal: boolean;
  openModal: () => void;
  closeModal: () => void;
  isSingleVariant: boolean;
  hasVariants: boolean;
  activeVariants: ProductVariant[];
  purchasableVariants: ProductVariant[];
}

export function useVariantSelection({
  variants,
  initialVariantId,
  autoSelectSingle = true,
}: UseVariantSelectionProps): UseVariantSelectionReturn {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariantId || null
  );
  const [showModal, setShowModal] = useState<boolean>(false);

  // Filter active and purchasable variants
  const activeVariants = useMemo(
    () => variants.filter(v => v.isActive !== false),
    [variants]
  );

  const purchasableVariants = useMemo(
    () => activeVariants.filter(v => v.stock > 0),
    [activeVariants]
  );

  const isSingleVariant = useMemo(
    () => activeVariants.length === 1,
    [activeVariants]
  );

  const hasVariants = useMemo(
    () => activeVariants.length > 0,
    [activeVariants]
  );

  // Auto-select single variant if configured
  useEffect(() => {
    if (autoSelectSingle && isSingleVariant && !selectedVariantId) {
      setSelectedVariantId(activeVariants[0].id);
    }
  }, [autoSelectSingle, isSingleVariant, activeVariants, selectedVariantId]);

  // Get selected variant object
  const selectedVariant = useMemo(
    () => activeVariants.find(v => v.id === selectedVariantId) || null,
    [activeVariants, selectedVariantId]
  );

  const handleSetSelectedVariantId = useCallback((id: string) => {
    const variant = activeVariants.find(v => v.id === id);
    if (variant && variant.stock > 0) {
      setSelectedVariantId(id);
    }
  }, [activeVariants]);

  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return {
    selectedVariant,
    selectedVariantId,
    setSelectedVariantId: handleSetSelectedVariantId,
    showModal,
    openModal,
    closeModal,
    isSingleVariant,
    hasVariants,
    activeVariants,
    purchasableVariants,
  };
}