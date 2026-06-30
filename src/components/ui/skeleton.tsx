// src/components/ui/Skeleton.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseStyles = 'bg-gray-200';
  
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      aria-hidden="true"
    />
  );
};

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 bg-white p-4">
      <Skeleton className="aspect-square w-full" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full mt-2" />
      </div>
    </div>
  );
};