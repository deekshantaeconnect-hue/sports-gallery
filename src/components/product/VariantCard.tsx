// src/components/product/VariantCard.tsx
"use client";

import React, { useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ProductVariant } from "@/types/product";
import { removeGST, getGSTAmount } from "@/utils/gst";

interface VariantCardProps {
  variant: ProductVariant;
  isSelected: boolean;
  onSelect: (variantId: string) => void;
  disabled?: boolean;
}

export const VariantCard = memo<VariantCardProps>(
  ({ variant, isSelected, onSelect, disabled = false }) => {
    const isOutOfStock = variant.stock <= 0;
    const isDisabled = disabled || isOutOfStock;

    const discount = useMemo(() => {
      if (variant.oldPrice && variant.oldPrice > variant.price) {
        return Math.round(
          ((variant.oldPrice - variant.price) / variant.oldPrice) * 100,
        );
      }
      return 0;
    }, [variant.oldPrice, variant.price]);

    const formattedPrice = useMemo(() => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(removeGST(variant.price));
    }, [variant.price]);

    const formattedOldPrice = useMemo(() => {
      if (!variant.oldPrice) return null;
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(removeGST(variant.oldPrice));
    }, [variant.oldPrice]);

    const handleSelect = () => {
      if (!isDisabled) {
        onSelect(variant.id);
      }
    };

    return (
      <button
        onClick={handleSelect}
        disabled={isDisabled}
        className={cn(
          "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[#006044] focus:ring-offset-2",
          isSelected
            ? "border-[#006044] bg-[#006044]/5 ring-2 ring-[#006044]/20"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
          isDisabled && "opacity-60 cursor-not-allowed hover:bg-transparent",
          "touch:active:scale-[0.98]",
        )}
        role="radio"
        aria-checked={isSelected}
        aria-label={`Select ${variant.name}`}
        aria-disabled={isDisabled}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <h4
                  className={cn(
                    "text-sm font-medium text-gray-900",
                    isDisabled && "text-gray-500",
                  )}
                >
                  {variant.name}
                </h4>
                {variant.optionValue && variant.optionType && (
                  <p className="text-xs text-gray-500">
                    {variant.optionType}: {variant.optionValue}
                  </p>
                )}
                {variant.sku && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    SKU: {variant.sku}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <span
                className={cn(
                  "text-lg font-bold text-gray-900",
                  isDisabled && "text-gray-500",
                )}
              >
                {formattedPrice}
              </span>
              {formattedOldPrice && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    {formattedOldPrice}
                  </span>

                  {discount > 0 && (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      {discount}% OFF
                    </span>
                  )}
                </>
              )}
            </div>

            {isSelected && (
              <div className="mt-1 text-xs font-medium text-[#006044]">
                ✓ Selected
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {isOutOfStock ? (
              <span className="inline-block px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded">
                Out of Stock
              </span>
            ) : (
              <span className="inline-block px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded">
                {variant.stock > 10 ? "In Stock" : `Only ${variant.stock} left`}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  },
);

VariantCard.displayName = "VariantCard";
