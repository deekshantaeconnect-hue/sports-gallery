// src\components\product\ProductInfo.tsx
"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Zap, Loader2 } from "lucide-react"; // Imported Loader2
import FeatureHighlights from "@/components/ui/FeatureHighlights";
import { useCartStore } from "@/store/useCartStore"; // 1. Import Zustand store
import { AddToCartButton } from "./AddToCartButton";
import StickyAddToCart from "./StickyAddToCart";
import { analytics } from "@/services/analytics.service";

import { removeGST, getGSTAmount } from "@/utils/gst";

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

   
    // ✅ Track variant selection
    useEffect(() => {
      if (selectedVariant && product) {
        analytics.trackCustomEvent("variant_selected", {
          product_id: product.id,
          product_name: product.name,
          variant_id: selectedVariant.id,
          variant_name: selectedVariant.name,
          price: selectedVariant.price,
          stock: selectedVariant.stock,
        });
      }
    }, [selectedVariant]);
  
    // ✅ Track quantity changes
    useEffect(() => {
      if (quantity > 0 && product) {
        analytics.trackCustomEvent("quantity_changed", {
          product_id: product.id,
          product_name: product.name,
          variant_id: selectedVariant?.id,
          quantity: quantity,
          price: activePrice,
        });
      }
    }, [quantity]);
  

 const activePrice = Number(selectedVariant?.price ?? 0); // GST Included
  const activeOldPrice = Number(selectedVariant?.oldPrice ?? 0);


  // ✅ Track product view when component mounts
    useEffect(() => {
      if (product) {
        analytics.trackProductView({
          id: product.id,
          name: product.name,
          category: product.category?.name || "Uncategorized",
          price: activePrice,
          brand: "Store",
        });
      }
    }, [product,activePrice]);
  
  
  // GST Breakdown
  const basePrice = removeGST(activePrice);
const gstAmount = getGSTAmount(activePrice);
  const oldBasePrice = activeOldPrice ? removeGST(activeOldPrice) : 0;
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

        {/* Subtitle */}
        {product.subtitle && (
          <p className="mt-2 text-sm md:text-base text-gray-500 font-normal leading-relaxed line-clamp-2 break-words max-w-2xl">
            {product.subtitle}
          </p>
        )}
        <div className="flex items-center space-x-2 mt-2">
          {renderStars(product.rating)}
          <span className="text-sm text-blue-600 hover:underline cursor-pointer font-medium">
            {product.rating || 0} ({product.reviewCount || 0} ratings)
          </span>
        </div>
      </div>

      {/* Price Block */}
      <div className="flex flex-col border-y border-gray-100 py-4 space-y-2">
        <div className="flex items-baseline space-x-3">
          <span className="text-3xl font-bold text-gray-900">
            ₹{basePrice.toLocaleString("en-IN")}
          </span>

          {discount > 0 && activeOldPrice && (
            <>
              <span className="text-lg text-gray-500 line-through">
                ₹{activeOldPrice.toLocaleString("en-IN")}
              </span>

              <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        
        <div className="text-sm text-gray-500">
          GST (18%): ₹{gstAmount.toLocaleString("en-IN")}
        </div>


        <div className="text-sm text-gray-500">
          Total Price: ₹{activeOldPrice.toLocaleString("en-IN")}
        </div>


        <div className="text-xs text-green-600 font-medium">
          Inclusive of all taxes
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
