// src\components\product\StickyAddToCart.tsx



"use client";

import { useEffect, useState } from "react";
import { AddToCartButton } from "./AddToCartButton";
import { cn } from "@/lib/utils";

interface StickyAddToCartProps {
  product: any;
  selectedVariant?: any;
}

export default function StickyAddToCart({
  product,
  selectedVariant,
}: StickyAddToCartProps) {
  const [showSticky, setShowSticky] = useState(false);

  const variants = product?.variants || [];

  const cheapestVariant =
    variants.length > 0
      ? variants.reduce((prev: any, curr: any) =>
          prev.price < curr.price ? prev : curr
        )
      : null;

  const currentPrice =
    selectedVariant?.price || cheapestVariant?.price || 0;

  const oldPrice =
    selectedVariant?.oldPrice || cheapestVariant?.oldPrice;

  useEffect(() => {
    const handleScroll = () => {
      const addToCartSection = document.getElementById(
        "main-add-to-cart"
      );

      if (!addToCartSection) return;

      const rect = addToCartSection.getBoundingClientRect();

      // visible inside viewport
      const isVisible =
        rect.top < window.innerHeight &&
        rect.bottom > 0;

      // mobile always sticky
      if (window.innerWidth < 768) {
        setShowSticky(true);
      } else {
        // desktop sticky only when original button hidden
        setShowSticky(!isVisible);
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
        showSticky
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="border-t right bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          
          {/* PRICE */}
          <div className="flex flex-col min-w-fit">
            <span className="text-lg md:text-xl font-bold text-gray-900 leading-none">
              ₹{currentPrice.toLocaleString("en-IN")}
            </span>

            {oldPrice && oldPrice > currentPrice && (
              <span className="text-xs text-green-600 font-medium mt-1">
                Save ₹
                {(oldPrice - currentPrice).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* BUTTON */}
          <div className="flex-1 max-w-md ml-auto">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: currentPrice,
                images: product.images,
                variants: variants,
                stock: selectedVariant?.stock || 0,
                isCodEnabled: product.isCodEnabled,
              }}
              variantId={selectedVariant?.id}
              stock={selectedVariant?.stock || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}