// src/components/product/QuantitySelector.tsx
'use client';

import React, { useCallback, useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChange,
  min = 1,
  max = 999,
  disabled = false,
  className,
  size = 'md',
}) => {
  const isAtMin = quantity <= min;
  const isAtMax = quantity >= max;

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg',
  };

  const buttonSizeClasses = {
    sm: 'w-8',
    md: 'w-10',
    lg: 'w-12',
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleIncrement = useCallback(() => {
    if (!disabled && !isAtMax) {
      onChange(Math.min(quantity + 1, max));
    }
  }, [disabled, isAtMax, onChange, quantity, max]);

  const handleDecrement = useCallback(() => {
    if (!disabled && !isAtMin) {
      onChange(Math.max(quantity - 1, min));
    }
  }, [disabled, isAtMin, onChange, quantity, min]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = parseInt(e.target.value);
    if (isNaN(value)) return;
    const clamped = Math.max(min, Math.min(max, value));
    onChange(clamped);
  }, [disabled, onChange, min, max]);

  return (
    <div className={cn('flex items-center', className)}>
      <button
        onClick={handleDecrement}
        disabled={disabled || isAtMin}
        className={cn(
          'flex items-center justify-center rounded-l-lg border border-gray-300',
          'text-gray-600 hover:bg-gray-50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[#006044] focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
          sizeClasses[size],
          buttonSizeClasses[size]
        )}
        aria-label="Decrease quantity"
        aria-disabled={disabled || isAtMin}
      >
        <Minus className={iconSizeClasses[size]} />
      </button>

      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(
          'w-12 text-center border-y border-gray-300',
          'bg-white text-gray-900 font-semibold',
          'focus:outline-none focus:ring-2 focus:ring-[#006044] focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        )}
        aria-label="Quantity"
      />

      <button
        onClick={handleIncrement}
        disabled={disabled || isAtMax}
        className={cn(
          'flex items-center justify-center rounded-r-lg border border-gray-300',
          'text-gray-600 hover:bg-gray-50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[#006044] focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
          sizeClasses[size],
          buttonSizeClasses[size]
        )}
        aria-label="Increase quantity"
        aria-disabled={disabled || isAtMax}
      >
        <Plus className={iconSizeClasses[size]} />
      </button>
    </div>
  );
};