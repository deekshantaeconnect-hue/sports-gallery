"use client";

import { useState } from "react";
import { ShoppingCart, Zap, Loader2 } from "lucide-react"; // Imported Loader2
import FeatureHighlights from "@/components/ui/FeatureHighlights";
import { useCartStore } from "@/store/useCartStore"; // 1. Import Zustand store
import { AddToCartButton } from "./AddToCartButton";
import StickyAddToCart from "./StickyAddToCart";

export default function ProductInfo({ product }: { product: any }) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false); // 2. Add loading state

  // 3. Variant state management to prevent API failures
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants?.length > 0 ? product.variants[0] : null,
  );

  const addItem = useCartStore((s) => s.addItem);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex text-[#FFA41C] text-lg leading-none">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`}>★</span>
        ))}
        {hasHalfStar && <span>⯪</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300">
            ★
          </span>
        ))}
      </div>
    );
  };

  // 4. Action Handler
  const handleAddToCart = async () => {
    if (product.variants?.length > 0 && !selectedVariant) return;

    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariant?.id,
        name: selectedVariant
          ? `${product.name} - ${selectedVariant.name}`
          : product.name,
        price: activePrice, // 🔥 FIX: Passed resolved activePrice instead of undefined product.price
        image: product.images?.[0] || "",
        quantity: quantity,
        isCodEnabled: product.isCodEnabled,
      });
    } finally {
      setIsAdding(false);
    }
  };

  // STRICT BACKWARD COMPATIBILITY RULE ON FRONTEND
  const activePrice = selectedVariant?.price ?? 0;
  const activeOldPrice = selectedVariant?.oldPrice ?? 0;

  const discount =
    activeOldPrice > activePrice
      ? Math.round(((activeOldPrice - activePrice) / activeOldPrice) * 100)
      : 0;

  return (
    <div className="flex flex-col space-y-6">
      {/* Title & Rating */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h1>
        <div className="flex items-center space-x-2 mt-2">
          {renderStars(product.rating)}
          <span className="text-sm text-blue-600 hover:underline cursor-pointer font-medium">
            {product.rating || 0} ({product.reviewCount || 0} ratings)
          </span>
        </div>
      </div>

      {/* Price Block */}
      <div className="flex flex-col border-y border-gray-100 py-4">
        <div className="flex items-baseline space-x-3">
          <span className="text-3xl font-bold text-gray-900">
            ₹{activePrice?.toLocaleString("en-IN") || 0}
          </span>
          {discount > 0 && activeOldPrice && (
            <>
              <span className="text-lg text-gray-500 line-through">
                ₹{activeOldPrice?.toLocaleString("en-IN")}
              </span>
              <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                {discount}% OFF
              </span>
            </>
          )}
        </div>
      </div>

      {/* Variants (Now Interactive) */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Available Options:</h3>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v: any) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`border rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedVariant?.id === v.id
                    ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" // Active state
                    : "border-gray-300 hover:border-orange-500 hover:bg-orange-50"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <FeatureHighlights productId={product?.id} />

      {/* Buy Actions */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
        <div id="main-add-to-cart">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: activePrice,
              images: product.images,
              variants: product.variants,
              stock: selectedVariant?.stock || 0,
              isCodEnabled: product.isCodEnabled,
            }}
            variantId={selectedVariant?.id}
            stock={selectedVariant?.stock || 0}
          />
        </div>
      </div>
      <StickyAddToCart product={product} selectedVariant={selectedVariant} />
    </div>
  );
}
