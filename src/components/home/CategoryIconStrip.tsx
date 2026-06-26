// src/components/sections/CategoryIconStrip.tsx

"use client";

import React, { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryIconStripProps {
  settings: {
    title?: string;
    subtitle?: string;
    categoryIds?: string[];
    layout?: 'grid' | 'scrollable';
    columns?: string;
    showProductCount?: boolean;
    imageSize?: 'small' | 'medium' | 'large';
    showCategoryNames?: boolean;
    imageShape?: 'circle' | 'square' | 'rounded';
    displayCount?: number;
  };
  data?: {
    categories?: Array<{
      id: string;
      name: string;
      slug: string;
      image?: string | null;
      icon?: string | null;
      color?: string | null;
      productCount?: number;
    }>;
  };
  previewMode?: boolean;
}

const getImageSize = (size: 'small' | 'medium' | 'large' = 'medium') => {
  switch (size) {
    case 'small':
      return { container: 'w-16 h-16' };
    case 'large':
      return { container: 'w-24 h-24' };
    default:
      return { container: 'w-20 h-20' };
  }
};

const getImageShape = (shape: 'circle' | 'square' | 'rounded' = 'circle') => {
  switch (shape) {
    case 'square':
      return 'rounded-none';
    case 'rounded':
      return 'rounded-2xl';
    default:
      return 'rounded-full';
  }
};

export function CategoryIconStrip({
  settings,
  data,
  previewMode = false,
}: CategoryIconStripProps) {
  const {
    title = 'Shop by Category',
    subtitle,
    categoryIds = [],
    layout = 'grid',
    columns = '5',
    showProductCount = true,
    imageSize = 'medium',
    showCategoryNames = true,
    imageShape = 'circle',
    displayCount = 12,
  } = settings;

  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Process categories from data prop
  useEffect(() => {
    setIsLoading(true);

    if (data?.categories && data.categories.length > 0) {
      const filtered = data.categories.filter((cat: any) =>
        categoryIds.includes(cat.id)
      );
      
      if (filtered.length > 0) {
        setCategories(filtered);
        setIsLoading(false);
        return;
      }
      
      if (categoryIds.length > 0) {
        const foundCategories = categoryIds
          .map(id => data.categories?.find((cat: any) => cat.id === id))
          .filter(Boolean);
        
        if (foundCategories.length > 0) {
          setCategories(foundCategories);
          setIsLoading(false);
          return;
        }
      }
      
      setCategories([]);
      setIsLoading(false);
      return;
    }

    if (categoryIds.length > 0 && !data?.categories) {
      setIsLoading(true);
      return;
    }

    setCategories([]);
    setIsLoading(false);
  }, [data?.categories, categoryIds]);

  const displayCategories = useMemo(() => {
    if (isLoading) return [];
    return categories
      .filter(cat => cat !== undefined && cat !== null)
      .slice(0, displayCount);
  }, [categories, displayCount, isLoading]);

  // Empty state
  if (previewMode && categoryIds.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-3xl">🏷️</span>
          </div>
          <p className="text-gray-600 font-semibold">Category Icon Strip</p>
          <p className="text-sm text-gray-400">No categories selected</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            {title && <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4" />}
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-gray-200 rounded-full" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (previewMode && categoryIds.length > 0 && displayCategories.length === 0) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-amber-700 font-medium">No categories found</p>
          <p className="text-sm text-amber-600">
            Selected categories ({categoryIds.length}) could not be found.
          </p>
        </div>
      </div>
    );
  }

  if (!previewMode && displayCategories.length === 0) {
    return null;
  }

  const imageDimensions = getImageSize(imageSize);
  const shapeClass = getImageShape(imageShape);
  const numColumns = parseInt(columns);

  const GridLayout = () => (
    <div className={cn(
      'grid gap-4 md:gap-6',
      {
        'grid-cols-4': numColumns === 4,
        'grid-cols-5': numColumns === 5,
        'grid-cols-6': numColumns === 6,
      }
    )}>
      {displayCategories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          imageSize={imageDimensions}
          showProductCount={showProductCount}
          previewMode={previewMode}
          shapeClass={shapeClass}
          showCategoryName={showCategoryNames}
        />
      ))}
    </div>
  );

  const ScrollableLayout = () => (
    <div className="relative overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max px-1">
        {displayCategories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            imageSize={imageDimensions}
            showProductCount={showProductCount}
            previewMode={previewMode}
            shapeClass={shapeClass}
            showCategoryName={showCategoryNames}
            isScrollable={true}
          />
        ))}
      </div>
    </div>
  );

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-500 mt-2 text-sm md:text-base">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {layout === 'scrollable' ? <ScrollableLayout /> : <GridLayout />}

        {previewMode && displayCategories.length > 0 && (
          <div className="mt-6 text-center">
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              ⚡ Preview - {displayCategories.length} categories
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

// Category Item Component
interface CategoryItemProps {
  category: {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
    icon?: string | null;
    color?: string | null;
    productCount?: number;
  };
  imageSize: { container: string };
  showProductCount: boolean;
  previewMode: boolean;
  shapeClass: string;
  showCategoryName: boolean;
  isScrollable?: boolean;
}

function CategoryItem({
  category,
  imageSize,
  showProductCount,
  previewMode,
  shapeClass,
  showCategoryName,
  isScrollable = false,
}: CategoryItemProps) {
  const imageUrl = category.image || category.icon;
  const hasImage = imageUrl && imageUrl.startsWith('http');
  const initial = category.name?.charAt(0)?.toUpperCase() || '?';
  const bgColor = category.color || '#006044';

  const content = (
    <div className="flex flex-col items-center group cursor-pointer transition-all duration-200 hover:scale-105">
      <div
        className={cn(
          'relative overflow-hidden border-2 border-gray-100',
          shapeClass,
          imageSize.container,
          'transition-all duration-300 group-hover:shadow-lg group-hover:border-[#006044]/30'
        )}
        style={{
          backgroundColor: hasImage ? undefined : bgColor,
        }}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full flex items-center justify-center text-2xl font-bold text-white';
                fallback.textContent = initial;
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
            {initial}
          </div>
        )}
      </div>

      {showCategoryName && (
        <p className={cn(
          'font-medium text-gray-800 mt-2 text-center line-clamp-2',
          isScrollable ? 'text-sm' : 'text-xs md:text-sm'
        )}>
          {category.name}
        </p>
      )}

      {showProductCount && category.productCount !== undefined && category.productCount > 0 && (
        <p className="text-xs text-gray-400 mt-0.5">
          {category.productCount} product{category.productCount !== 1 ? 's' : ''}
        </p>
      )}

      {!previewMode && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
          <ChevronRight className="w-4 h-4 text-[#006044] rotate-0 group-hover:rotate-90 transition-transform" />
        </div>
      )}
    </div>
  );

  if (previewMode) {
    return content;
  }

  return (
    <Link
      href={`/collections/${category.slug}`}
      className="focus:outline-none focus:ring-2 focus:ring-[#006044] focus:ring-offset-2 rounded-lg"
    >
      {content}
    </Link>
  );
}