// src/components/sections/CategoryIconStrip.tsx

"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  memo,
  useRef,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronLeft, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { migrateCategoryIconStripSettings } from "@/lib/validators/storefront";


// ============================================================
// 1. TYPES
// ============================================================

interface CategoryIconStripProps {
  settings: any;
  data?: { categories?: any[]; collections?: any[] };
  previewMode?: boolean;
  className?: string;
}

interface ResolvedItem {
  id: string;
  type: "category" | "collection" | "custom-link";
  targetId: string;
  isEnabled: boolean;
  title: string;
  imageUrl: string | null;
  badge: "new" | "sale" | "trending" | "hot" | null;
  order: number;
  href: string;
  customLinkConfig?: {
    url: string;
    openInNewTab: boolean;
  };
  resolvedData: {
    name: string;
    slug: string;
    imageUrl: string | null;
    productCount: number;
    color: string | null;
  };
}

// ============================================================
// 2. CONSTANTS & HELPERS
// ============================================================

// Legacy (non-Zepto) circular bubble sizing — kept for backward compatibility
// when zeptoMode is explicitly disabled from the builder.
const IMAGE_SIZES = {
  small: { width: 56, height: 56, container: "w-14 h-14" },
  medium: { width: 72, height: 72, container: "w-[72px] h-[72px]" },
  large: { width: 88, height: 88, container: "w-[88px] h-[88px]" },
};

const SHAPE_CLASSES = {
  circle: "rounded-full",
  square: "rounded-none",
  rounded: "rounded-2xl",
} as const;

const BADGE_COLORS = {
  new: "bg-blue-500",
  sale: "bg-red-500",
  trending: "bg-orange-500",
  hot: "bg-pink-500",
} as const;

const GRID_COLUMNS = {
  4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
} as const;

// Zepto-mode card widths (px) — desktop / tablet / mobile.
const ZEPTO_CARD_WIDTH = { desktop: 112, tablet: 102, mobile: 92 };
// Zepto-mode image tile sizes (px) — desktop / tablet / mobile.
const ZEPTO_IMAGE_SIZE = { desktop: 90, tablet: 82, mobile: 74 };
// Zepto-mode gaps (px) — desktop / tablet / mobile.
const ZEPTO_GAP = { desktop: 18, tablet: 16, mobile: 14 };

const getImageSize = (size: keyof typeof IMAGE_SIZES = "medium") =>
  IMAGE_SIZES[size];
const getShapeClass = (shape: keyof typeof SHAPE_CLASSES = "circle") =>
  SHAPE_CLASSES[shape];
const getBadgeColor = (badge: keyof typeof BADGE_COLORS) =>
  BADGE_COLORS[badge] || "bg-gray-500";

// ============================================================
// 3. ITEM RESOLVER (unchanged business logic)
// ============================================================

function resolveItem(
  item: any,
  categories: any[],
  collections: any[],
): ResolvedItem | null {
  let resolvedData = null;
  let href = "#";

  if (item.type === "category") {
    if (!item.targetId) return null;
    const cat = categories.find((c) => c.id === item.targetId);
    if (!cat) return null;
    resolvedData = cat;
    href = `/collections/${cat.slug}`;
  } else if (item.type === "collection") {
    if (!item.targetId) return null;
    const col = collections.find((c) => c.id === item.targetId);
    if (!col) return null;
    resolvedData = col;
    href = `/collections/${col.slug}`;
  } else if (item.type === "custom-link") {
    resolvedData = { name: item.title || "Custom Link", slug: "" };
    href = item.customLinkConfig?.url || "#";
  }

  if (!resolvedData) return null;

  return {
    id: item.id,
    type: item.type,
    targetId: item.targetId,
    isEnabled: item.isEnabled !== false,
    title: item.title || resolvedData.name || "",
    imageUrl: item.imageUrl || resolvedData.image || resolvedData.icon || null,
    badge: item.badge || null,
    order: item.order || 0,
    href,
    customLinkConfig: item.customLinkConfig,
    resolvedData: {
      name: resolvedData.name || "",
      slug: resolvedData.slug || "",
      imageUrl: resolvedData.image || resolvedData.icon || null,
      productCount: resolvedData.productCount || 0,
      color: resolvedData.color || null,
    },
  };
}

// ============================================================
// 4. SKELETON LOADER (redesigned to match Zepto card layout)
// ============================================================

const SkeletonLoader = memo(
  ({ title, zeptoMode }: { title?: string; zeptoMode: boolean }) => (
    <div className={cn(zeptoMode ? "py-3 md:py-[18px]" : "py-8 md:py-12")}>
      <div className="container mx-auto px-4">
        <div className="animate-pulse">
          {title && (
            <div className="h-7 w-48 bg-gray-200 rounded mx-auto mb-4" />
          )}
          <div
            className="flex overflow-x-hidden"
            style={{ gap: zeptoMode ? ZEPTO_GAP.desktop : 16 }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 flex-shrink-0"
                style={{
                  width: zeptoMode ? ZEPTO_CARD_WIDTH.desktop : 120,
                }}
              >
                <div
                  className={cn(
                    "bg-gray-200",
                    zeptoMode ? "rounded-[18px]" : "rounded-full",
                  )}
                  style={{
                    width: zeptoMode ? ZEPTO_IMAGE_SIZE.desktop : 80,
                    height: zeptoMode ? ZEPTO_IMAGE_SIZE.desktop : 80,
                  }}
                />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
);

SkeletonLoader.displayName = "SkeletonLoader";

// ============================================================
// 5. EMPTY STATE (restyled, same logic/props)
// ============================================================

const EmptyState = memo(
  ({
    previewMode,
    hasItems,
    itemsCount,
    categoriesCount,
    categories,
  }: {
    previewMode: boolean;
    hasItems: boolean;
    itemsCount: number;
    categoriesCount: number;
    categories: any[];
  }) => {
    if (!previewMode) return null;

    return (
      <div className="bg-[#FAFAFA] border border-[#ECECEC] rounded-2xl p-10 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#ECECEC] flex items-center justify-center mx-auto mb-4">
          <ImageOff className="w-7 h-7 text-gray-300" />
        </div>
        <p className="text-gray-700 font-semibold">
          {hasItems ? "Items configured but not found" : "No items configured"}
        </p>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          {hasItems ? (
            <>
              You have {itemsCount} items configured, but they couldn't be found
              in the store data.
              {categoriesCount === 0 && (
                <span className="block mt-1 text-xs font-semibold text-amber-600">
                  No categories found in store data. Please add categories to
                  your store.
                </span>
              )}
            </>
          ) : (
            "Add categories, collections, or custom links in the builder."
          )}
        </p>
        {categoriesCount > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            Available categories: {categoriesCount}
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {categories.slice(0, 5).map((cat: any) => (
                <span
                  key={cat.id}
                  className="bg-white border border-[#ECECEC] px-2 py-0.5 rounded-full"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {previewMode && (
          <div className="mt-4 text-[10px] text-gray-400">
            Click "Publish Changes" to apply your configuration
          </div>
        )}
      </div>
    );
  },
);

EmptyState.displayName = "EmptyState";

// ============================================================
// 6. ITEM COMPONENT (Memoized) — Zepto card + legacy bubble
// ============================================================

interface CategoryItemProps {
  item: ResolvedItem;
  index: number;
  imageSize: { width: number; height: number; container: string };
  shapeClass: string;
  showCount: boolean;
  showNames: boolean;
  previewMode: boolean;
  isScrollable?: boolean;
  zeptoMode: boolean;
  cardRadius: number;
  cardBg: string;
  cardShadow: boolean;
  imageFit: "contain" | "cover";
  imagePadding: number;
  hideChevron: boolean;
  hideProductCount: boolean;
  enableActiveCategory: boolean;
  isActive?: boolean;
}

const CategoryItem = memo(
  ({
    item,
    index,
    imageSize,
    shapeClass,
    showCount,
    showNames,
    previewMode,
    isScrollable = false,
    zeptoMode,
    cardRadius,
    cardBg,
    cardShadow,
    imageFit,
    imagePadding,
    hideChevron,
    hideProductCount,
    enableActiveCategory,
    isActive = false,
  }: CategoryItemProps) => {
    const imageUrl = item.imageUrl || item.resolvedData?.imageUrl;
    const hasImage = imageUrl?.startsWith("http");
    const initial = (item.title || item.resolvedData?.name || "?")
      .charAt(0)
      .toUpperCase();
    const bgColor = item.resolvedData?.color || "#006044";
    const [imgError, setImgError] = useState(false);

    const showChevron = !hideChevron && !zeptoMode;
    const showCountFinal = showCount && !hideProductCount;

    const content = zeptoMode ? (
      // ---------------- Zepto-style card ----------------
      <div
        className={cn(
          "flex flex-col items-center group transition-colors duration-[220ms] ease-out",
          !item.isEnabled && "opacity-40 pointer-events-none",
          isScrollable && "cursor-pointer",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden transition-shadow duration-[220ms] ease-out",
          )}
          style={{
            width: imageSize.width,
            height: imageSize.height,
            borderRadius: cardRadius,
            backgroundColor: !hasImage || imgError ? bgColor : cardBg,
            boxShadow: cardShadow
              ? "0 2px 10px rgba(0,0,0,.05)"
              : undefined,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-[220ms] ease-out group-hover:scale-[1.04]"
            style={{ padding: hasImage && !imgError ? imagePadding : 0 }}
          >
            {hasImage && !imgError ? (
              <div className="relative w-full h-full">
                <Image
                  src={imageUrl || "/images/placeholder.png"}
                  alt={item.title || item.resolvedData?.name || "Category"}
                  fill
                  className={cn(
                    imageFit === "contain" ? "object-contain" : "object-cover",
                  )}
                  sizes={`${imageSize.width}px`}
                  priority={index < 4}
                  loading={index < 4 ? "eager" : "lazy"}
                  onError={() => setImgError(true)}
                  quality={85}
                />
              </div>
            ) : (
              <span className="text-2xl font-bold text-white select-none">
                {initial}
              </span>
            )}
          </div>
          {item.badge && (
            <span
              className={cn(
                "absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full shadow text-white",
                getBadgeColor(item.badge as keyof typeof BADGE_COLORS),
              )}
            >
              {item.badge}
            </span>
          )}
        </div>

        {showNames && (
          <p
            className={cn(
              "mt-2 text-center line-clamp-2 transition-colors duration-[220ms] ease-out",
              "text-[12px] md:text-[13px] font-semibold leading-[18px]",
              "text-[#2E2E2E] group-hover:text-[#006044]",
            )}
          >
            {item.title || item.resolvedData?.name || "Unnamed"}
          </p>
        )}

        {enableActiveCategory && isActive && (
          <span className="mt-1 block h-[3px] w-6 rounded-full bg-[#006044]" />
        )}
      </div>
    ) : (
      // ---------------- Legacy bubble style (kept for zeptoMode=false) ----------------
      <div
        className={cn(
          "flex flex-col items-center group transition-all duration-300",
          !previewMode && "hover:-translate-y-1 hover:scale-[1.03]",
          !item.isEnabled && "opacity-40 pointer-events-none",
          isScrollable && "cursor-pointer",
        )}
      >
        <div className="relative">
          <div
            className={cn(
              "relative overflow-hidden border border-gray-200 transition-all duration-300",
              shapeClass,
              imageSize.container,
              !previewMode &&
                "group-hover:shadow-xl group-hover:border-[#006044]/30",
            )}
            style={{
              backgroundColor: !hasImage || imgError ? bgColor : undefined,
            }}
          >
            {hasImage && !imgError ? (
              <Image
                src={imageUrl || "/images/placeholder.png"}
                alt={item.title || item.resolvedData?.name || "Category"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes={`${imageSize.width}px`}
                priority={index < 4}
                loading={index < 4 ? "eager" : "lazy"}
                onError={() => setImgError(true)}
                quality={85}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-bold text-white select-none">
                {initial}
              </div>
            )}
          </div>
          {item.badge && (
            <span
              className={cn(
                "absolute -top-1 -right-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full shadow-lg text-white",
                getBadgeColor(item.badge as keyof typeof BADGE_COLORS),
              )}
            >
              {item.badge}
            </span>
          )}
        </div>
        {showNames && (
          <p
            className={cn(
              "font-medium text-gray-800 mt-1 text-center line-clamp-1 transition-colors duration-300",
              "text-xs md:text-[13px]",
              !previewMode && "group-hover:text-[#006044]",
            )}
          >
            {item.title || item.resolvedData?.name || "Unnamed"}
          </p>
        )}
        {showCountFinal &&
          item.type !== "custom-link" &&
          item.resolvedData?.productCount !== undefined &&
          item.resolvedData.productCount > 0 && (
            <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
              {item.resolvedData.productCount} product
              {item.resolvedData.productCount !== 1 ? "s" : ""}
            </p>
          )}
        {showChevron && !previewMode && item.isEnabled && (
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 mt-0.5 transform group-hover:translate-x-1">
            <ChevronRight className="w-4 h-4 text-[#006044]" />
          </div>
        )}
      </div>
    );

    // Preview mode or disabled
    if (previewMode || !item.isEnabled) {
      return content;
    }

    const focusRing =
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006044] focus-visible:ring-offset-2 rounded-lg transition-all";

    // Custom link
    if (item.type === "custom-link" && item.customLinkConfig) {
      const isInternal = item.customLinkConfig.url?.startsWith("/");
      const isExternal = !isInternal && item.customLinkConfig.openInNewTab;

      if (isExternal) {
        return (
          <a
            href={item.customLinkConfig.url}
            target="_blank"
            rel="noopener noreferrer"
            className={focusRing}
            aria-label={`Browse ${item.title || item.resolvedData?.name || "Custom Link"}`}
          >
            {content}
          </a>
        );
      }

      return (
        <Link
          href={item.customLinkConfig.url || "#"}
          className={focusRing}
          target={isInternal ? undefined : "_blank"}
          rel={isInternal ? undefined : "noopener noreferrer"}
          aria-label={`Browse ${item.title || item.resolvedData?.name || "Custom Link"}`}
        >
          {content}
        </Link>
      );
    }

    // Category or Collection
    return (
      <Link
        href={item.href || "#"}
        className={focusRing}
        aria-label={`Browse ${item.title || item.resolvedData?.name || "Category"}`}
        aria-current={enableActiveCategory && isActive ? "page" : undefined}
      >
        {content}
      </Link>
    );
  },
);

CategoryItem.displayName = "CategoryItem";

// ============================================================
// 7. SCROLLABLE CONTAINER WITH ENHANCED FEATURES
// ============================================================

interface ScrollableContainerProps {
  children: React.ReactNode;
  itemsCount: number;
  itemWidth?: number;
  gap?: number;
  snapScroll?: boolean;
  showArrows?: boolean;
  autoScroll?: boolean;
  autoScrollSpeed?: number;
  previewMode?: boolean;
  centered?: boolean;
  zeptoMode: boolean;
  edgeGradient: boolean;
  navigationStyle: "floating" | "inline" | "none";
}

const ScrollableContainer = memo(
  ({
    children,
    itemsCount,
    itemWidth = 120,
    gap = 16,
    snapScroll = true,
    showArrows = true,
    autoScroll = false,
    autoScrollSpeed = 3000,
    previewMode = false,
    centered = false,
    zeptoMode,
    edgeGradient,
    navigationStyle,
  }: ScrollableContainerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isOverflowing = itemsCount > 4;

    // Check scroll position for arrows / edge fade
    const checkScrollButtons = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }, []);

    // Scroll to direction — Zepto mode moves by ~4 items, legacy by 0.8 viewport
    const scrollTo = useCallback(
      (direction: "left" | "right") => {
        const container = containerRef.current;
        if (!container) return;

        const scrollAmount = zeptoMode
          ? (itemWidth + gap) * 4
          : container.clientWidth * 0.8;
        const targetScroll =
          direction === "left"
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;

        container.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });
      },
      [zeptoMode, itemWidth, gap],
    );

    // Mouse wheel horizontal scroll
    const handleWheel = useCallback(
      (e: React.WheelEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container || !isOverflowing) return;

        const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);

        if (isHorizontalScroll) {
          e.preventDefault();
          container.scrollLeft += e.deltaX;
        } else {
          // Convert vertical scroll to horizontal for better UX
          e.preventDefault();
          container.scrollLeft += e.deltaY;
        }
      },
      [isOverflowing],
    );

    // Drag to scroll
    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container || !isOverflowing) return;

        setIsDragging(true);
        setStartX(e.pageX - container.offsetLeft);
        setScrollLeft(container.scrollLeft);
        container.style.cursor = "grabbing";
        container.style.userSelect = "none";
      },
      [isOverflowing],
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const container = containerRef.current;
        if (!container) return;

        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5;
        container.scrollLeft = scrollLeft - walk;
      },
      [isDragging, startX, scrollLeft],
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
      const container = containerRef.current;
      if (container) {
        container.style.cursor = "grab";
        container.style.userSelect = "auto";
      }
    }, []);

    const handleMouseLeave = useCallback(() => {
      if (isDragging) {
        setIsDragging(false);
        const container = containerRef.current;
        if (container) {
          container.style.cursor = "grab";
          container.style.userSelect = "auto";
        }
      }
    }, [isDragging]);

    // Touch scroll with snap
    const handleTouchStart = useCallback(
      (e: React.TouchEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container || !isOverflowing) return;

        setIsDragging(true);
        setStartX(e.touches[0].pageX - container.offsetLeft);
        setScrollLeft(container.scrollLeft);
      },
      [isOverflowing],
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const container = containerRef.current;
        if (!container) return;

        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5;
        container.scrollLeft = scrollLeft - walk;
      },
      [isDragging, startX, scrollLeft],
    );

    const handleTouchEnd = useCallback(() => {
      setIsDragging(false);

      if (snapScroll && isOverflowing) {
        const container = containerRef.current;
        if (!container) return;

        const itemWidthWithGap = itemWidth + gap;
        const currentScroll = container.scrollLeft;
        const nearestItem = Math.round(currentScroll / itemWidthWithGap);
        const targetScroll = nearestItem * itemWidthWithGap;

        container.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });
      }
    }, [snapScroll, isOverflowing, itemWidth, gap]);

    // Auto scroll
    useEffect(() => {
      if (!autoScroll || previewMode || !isOverflowing) return;

      const startAutoScroll = () => {
        autoScrollTimerRef.current = setInterval(() => {
          const container = containerRef.current;
          if (!container) return;

          const { scrollLeft, scrollWidth, clientWidth } = container;
          const maxScroll = scrollWidth - clientWidth;

          if (scrollLeft >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            const nextScroll = scrollLeft + container.clientWidth * 0.6;
            container.scrollTo({ left: nextScroll, behavior: "smooth" });
          }
        }, autoScrollSpeed);
      };

      startAutoScroll();

      return () => {
        if (autoScrollTimerRef.current) {
          clearInterval(autoScrollTimerRef.current);
          autoScrollTimerRef.current = null;
        }
      };
    }, [autoScroll, previewMode, isOverflowing, autoScrollSpeed]);

    // Pause auto scroll on hover
    const handleMouseEnter = useCallback(() => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    }, []);

    const handleMouseLeaveContainer = useCallback(() => {
      if (autoScroll && !previewMode && isOverflowing) {
        if (autoScrollTimerRef.current) {
          clearInterval(autoScrollTimerRef.current);
          autoScrollTimerRef.current = null;
        }

        autoScrollTimerRef.current = setInterval(() => {
          const container = containerRef.current;
          if (!container) return;

          const { scrollLeft, scrollWidth, clientWidth } = container;
          const maxScroll = scrollWidth - clientWidth;

          if (scrollLeft >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            const nextScroll = scrollLeft + container.clientWidth * 0.6;
            container.scrollTo({ left: nextScroll, behavior: "smooth" });
          }
        }, autoScrollSpeed);
      }
    }, [autoScroll, previewMode, isOverflowing, autoScrollSpeed]);

    // Check scroll buttons on mount and resize
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      checkScrollButtons();

      const resizeObserver = new ResizeObserver(() => {
        checkScrollButtons();
      });
      resizeObserver.observe(container);

      return () => resizeObserver.disconnect();
    }, [checkScrollButtons]);

    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          scrollTo("left");
          e.preventDefault();
        } else if (e.key === "ArrowRight") {
          scrollTo("right");
          e.preventDefault();
        }
      };

      const container = containerRef.current;
      if (container && isOverflowing) {
        container.addEventListener("keydown", handleKeyDown);
        return () => container.removeEventListener("keydown", handleKeyDown);
      }
    }, [scrollTo, isOverflowing]);

    const arrowsEnabled = showArrows && navigationStyle !== "none";

    // Even when items fit without overflow, keep a single horizontal row
    // (never wrap into a grid) — matches the Zepto one-line strip behavior.
    if (!isOverflowing) {
      return (
        <div className="flex justify-center">
          <div
            className="flex flex-nowrap items-start overflow-x-auto scrollbar-hide"
            style={{
              gap: `${gap}px`,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {children}
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {/* Left Arrow */}
        {arrowsEnabled && showLeftArrow && (
          <button
            onClick={() => scrollTo("left")}
            className={cn(
              "absolute left-0.5 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center transition-transform duration-200 hover:scale-105",
              zeptoMode
                ? "w-11 h-11 rounded-full bg-white border border-[#ECECEC]"
                : "bg-white/90 hover:bg-white shadow-lg rounded-full p-2 md:p-3 border border-gray-100 backdrop-blur-sm",
            )}
            style={
              zeptoMode
                ? { boxShadow: "0 8px 30px rgba(0,0,0,.12)" }
                : undefined
            }
            aria-label="Scroll left"
          >
            <ChevronLeft
              className={cn(
                zeptoMode ? "w-5 h-5 text-gray-700" : "w-4 h-4 md:w-5 md:h-5 text-gray-700",
              )}
            />
          </button>
        )}

        {/* Left edge fade */}
        {edgeGradient && showLeftArrow && (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 z-[5] w-9 bg-gradient-to-r from-white to-transparent"
            aria-hidden="true"
          />
        )}

        {/* Scrollable Container */}
        <div
          ref={containerRef}
          className={cn(
            "flex flex-nowrap overflow-x-auto overflow-y-visible scrollbar-hide",
            zeptoMode ? "px-4 lg:px-8" : "pb-2 px-4 lg:px-8",
            isDragging && "cursor-grabbing",
          )}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            gap: `${gap}px`,
            cursor: isDragging ? "grabbing" : "grab",
            scrollSnapType: snapScroll
              ? zeptoMode
                ? "x proximity"
                : "x mandatory"
              : "none",
            scrollPadding: "0 32px",
            scrollBehavior: "smooth",
          }}
          onScroll={checkScrollButtons}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={handleMouseEnter}
          onMouseMoveCapture={handleMouseLeaveContainer}
          role="region"
          aria-label="Category navigation"
          tabIndex={0}
        >
          {React.Children.map(children, (child) => (
            <div
              className="flex-shrink-0 will-change-transform"
              style={{
                width: `${itemWidth}px`,
                minWidth: `${itemWidth}px`,
                maxWidth: `${itemWidth}px`,
                scrollSnapAlign: snapScroll ? "start" : "none",
              }}
            >
              {child}
            </div>
          ))}
        </div>

        {/* Right edge fade */}
        {edgeGradient && showRightArrow && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 z-[5] w-9 bg-gradient-to-l from-white to-transparent"
            aria-hidden="true"
          />
        )}

        {/* Right Arrow */}
        {arrowsEnabled && showRightArrow && (
          <button
            onClick={() => scrollTo("right")}
            className={cn(
              "absolute right-0.5 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center transition-transform duration-200 hover:scale-105",
              zeptoMode
                ? "w-11 h-11 rounded-full bg-white border border-[#ECECEC]"
                : "bg-white/90 hover:bg-white shadow-lg rounded-full p-2 md:p-3 border border-gray-100 backdrop-blur-sm",
            )}
            style={
              zeptoMode
                ? { boxShadow: "0 8px 30px rgba(0,0,0,.12)" }
                : undefined
            }
            aria-label="Scroll right"
          >
            <ChevronRight
              className={cn(
                zeptoMode ? "w-5 h-5 text-gray-700" : "w-4 h-4 md:w-5 md:h-5 text-gray-700",
              )}
            />
          </button>
        )}

        {/* Legacy dot pagination — never shown in Zepto mode */}
        {!zeptoMode && (
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: Math.min(itemsCount, 10) }).map((_, index) => {
              const container = containerRef.current;
              const isActive = container
                ? Math.abs(container.scrollLeft / (itemWidth + gap) - index) < 0.5
                : index === 0;

              return (
                <button
                  key={index}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    isActive
                      ? "w-6 bg-[#006044]"
                      : "w-2 bg-gray-300 hover:bg-gray-400",
                  )}
                  onClick={() => {
                    const container = containerRef.current;
                    if (!container) return;
                    container.scrollTo({
                      left: index * (itemWidth + gap),
                      behavior: "smooth",
                    });
                  }}
                  aria-label={`Scroll to item ${index + 1}`}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

ScrollableContainer.displayName = "ScrollableContainer";

// ============================================================
// 8. MAIN COMPONENT
// ============================================================

export function CategoryIconStrip({
  settings: rawSettings,
  data = {},
  previewMode = false,
  className,
}: CategoryIconStripProps) {
  const pathname = usePathname?.() || "";
  // Normalize settings
  const settings = useMemo(() => {
    const migrated = migrateCategoryIconStripSettings(rawSettings) as any;
    return {
      title: migrated.title ?? "Shop by Category",
      subtitle: migrated.subtitle ?? "",
      items: migrated.items || [],
      displayCount: migrated.displayCount ?? 12,
      layout: migrated.layout ?? "scrollable",
      columns: migrated.columns ?? "5",
      showProductCount: migrated.showProductCount ?? true,
      imageSize: (migrated.imageSize ?? "medium") as keyof typeof IMAGE_SIZES,
      showCategoryNames: migrated.showCategoryNames ?? true,
      imageShape: (migrated.imageShape ??
        "circle") as keyof typeof SHAPE_CLASSES,
      itemWidth:
        typeof window !== "undefined" && window.innerWidth >= 1024
          ? 92
          : migrated.itemWidth ?? 96,
      gap: migrated.gap ?? 10,
      snapScroll: migrated.snapScroll ?? true,
      showArrows: migrated.showArrows ?? true,
      autoScroll: migrated.autoScroll ?? false,
      autoScrollSpeed: migrated.autoScrollSpeed ?? 3000,
      _legacy: migrated._legacy || false,
      _legacyCategoryIds: migrated._legacyCategoryIds || [],

      // ---------------- New Zepto-mode builder options ----------------
      zeptoMode: migrated.zeptoMode ?? true,
      cardBackgroundColor: migrated.cardBackgroundColor ?? "#F8F8F8",
      cardRadius: migrated.cardRadius ?? 18,
      cardShadow: migrated.cardShadow ?? true,
      imagePaddingPct: migrated.imagePaddingPct ?? 0.08, // 92% image fill
      imageFit: (migrated.imageFit ?? "contain") as "contain" | "cover",
      edgeGradient: migrated.edgeGradient ?? true,
      navigationStyle: (migrated.navigationStyle ?? "floating") as
        | "floating"
        | "inline"
        | "none",
      categoryWidth: migrated.categoryWidth ?? ZEPTO_CARD_WIDTH.desktop,
      categoryGap: migrated.categoryGap ?? ZEPTO_GAP.desktop,
      desktopVisibleCount: migrated.desktopVisibleCount ?? 12,
      tabletVisibleCount: migrated.tabletVisibleCount ?? 8,
      mobileVisibleCount: migrated.mobileVisibleCount ?? 5,
      enableActiveCategory: migrated.enableActiveCategory ?? true,
      hideProductCount: migrated.hideProductCount ?? true,
      hideChevron: migrated.hideChevron ?? true,
    };
  }, [rawSettings]);

  const categories = data?.categories || [];
  const collections = data?.collections || [];
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Resolve items
  const resolvedItems = useMemo(() => {
    // Legacy mode
    if (settings._legacy && settings._legacyCategoryIds.length > 0) {
      return settings._legacyCategoryIds
        .map((id: string) => {
          const cat = categories.find((c) => c.id === id);
          if (!cat) return null;
          return {
            id: `legacy-${id}`,
            type: "category" as const,
            targetId: id,
            isEnabled: true,
            title: cat.name,
            imageUrl: cat.image || cat.icon || null,
            badge: null,
            order: 0,
            href: `/collections/${cat.slug}`,
            resolvedData: {
              name: cat.name,
              slug: cat.slug,
              imageUrl: cat.image || cat.icon || null,
              productCount: cat.productCount || 0,
              color: cat.color || null,
            },
          };
        })
        .filter(Boolean) as ResolvedItem[];
    }

    // New mode
    if (!settings.items || settings.items.length === 0) {
      return [];
    }

    return settings.items
      .map((item: any) => resolveItem(item, categories, collections))
      .filter(Boolean)
      .filter((item: ResolvedItem) => item.isEnabled)
      .sort((a: ResolvedItem, b: ResolvedItem) => a.order - b.order)
      .slice(0, settings.displayCount);
  }, [settings, categories, collections]);

  // Loading
  if (isLoading) {
    return (
      <SkeletonLoader
        title={settings.title || undefined}
        zeptoMode={settings.zeptoMode}
      />
    );
  }

  // Empty
  if (resolvedItems.length === 0) {
    return (
      <EmptyState
        previewMode={previewMode}
        hasItems={
          (settings.items?.length || 0) > 0 ||
          (settings._legacyCategoryIds?.length || 0) > 0
        }
        itemsCount={
          settings.items?.length || settings._legacyCategoryIds?.length || 0
        }
        categoriesCount={categories.length}
        categories={categories}
      />
    );
  }

  // Render
  const zeptoMode = settings.zeptoMode;
  const imageSize = zeptoMode
    ? {
        width: ZEPTO_IMAGE_SIZE.desktop,
        height: ZEPTO_IMAGE_SIZE.desktop,
        container: "",
      }
    : getImageSize(settings.imageSize);
  const shapeClass = getShapeClass(settings.imageShape);
  const showCount = settings.showProductCount !== false;
  const showNames = settings.showCategoryNames !== false;
  const shouldCenterItems = resolvedItems.length <= 4;
  const imagePadding = Math.round(
    ZEPTO_IMAGE_SIZE.desktop * settings.imagePaddingPct,
  );

  const isItemActive = (item: ResolvedItem) =>
    !!pathname && !!item.href && item.href !== "#" && pathname === item.href;

  // Grid layout
  if (settings.layout === "grid" && !zeptoMode) {
    const columns = parseInt(settings.columns) || 5;
    const gridClass =
      GRID_COLUMNS[columns as keyof typeof GRID_COLUMNS] || GRID_COLUMNS[5];

    return (
      <section
        className={cn(
          "bg-white",
          zeptoMode ? "py-3 md:py-[18px]" : "py-4 md:py-6",
        )}
      >
        <div className="container mx-auto px-4">
          {/* Header */}
          {(settings.title || settings.subtitle) && (
            <div className="text-center mb-8">
              {settings.title && (
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  {settings.title}
                </h2>
              )}
              {settings.subtitle && (
                <p className="text-gray-500 mt-1 text-sm md:text-base">
                  {settings.subtitle}
                </p>
              )}
            </div>
          )}

          {/* Grid */}
          <div className={cn("grid gap-4 md:gap-6", gridClass, className)}>
            {resolvedItems.map((item: ResolvedItem, index: number) => (
              <div key={item.id} className="flex justify-center">
                <CategoryItem
                  item={item}
                  index={index}
                  imageSize={imageSize}
                  shapeClass={shapeClass}
                  showCount={showCount}
                  showNames={showNames}
                  previewMode={previewMode}
                  isScrollable={false}
                  zeptoMode={zeptoMode}
                  cardRadius={settings.cardRadius}
                  cardBg={settings.cardBackgroundColor}
                  cardShadow={settings.cardShadow}
                  imageFit={settings.imageFit}
                  imagePadding={imagePadding}
                  hideChevron={settings.hideChevron}
                  hideProductCount={settings.hideProductCount}
                  enableActiveCategory={settings.enableActiveCategory}
                  isActive={isItemActive(item)}
                />
              </div>
            ))}
          </div>

          {/* Preview indicator */}
          {previewMode && (
            <div className="mt-6 text-center">
              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                Preview - {resolvedItems.length} items displayed
              </span>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Scrollable layout (default) with premium features
  return (
    <section
      className={cn(
        "bg-white",
        zeptoMode ? "py-3 md:py-[18px]" : "py-4 md:py-6",
      )}
    >
      <div className={cn(zeptoMode ? "w-full" : "container mx-auto px-4")}>
        {/* Header */}
        {(settings.title || settings.subtitle) && (
          <div
            className={cn(
              "text-center",
              zeptoMode ? "mb-3 px-4" : "mb-8",
            )}
          >
            {settings.title && (
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                {settings.title}
              </h2>
            )}
            {settings.subtitle && (
              <p className="text-gray-500 mt-1 text-sm md:text-base">
                {settings.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Scrollable Items with Premium Features */}
        <ScrollableContainer
          itemsCount={resolvedItems.length}
          itemWidth={zeptoMode ? settings.categoryWidth : settings.itemWidth}
          gap={zeptoMode ? settings.categoryGap : settings.gap}
          snapScroll={settings.snapScroll}
          showArrows={settings.showArrows}
          autoScroll={settings.autoScroll}
          autoScrollSpeed={settings.autoScrollSpeed}
          previewMode={previewMode}
          centered={shouldCenterItems}
          zeptoMode={zeptoMode}
          edgeGradient={settings.edgeGradient}
          navigationStyle={settings.navigationStyle}
        >
          {resolvedItems.map((item: ResolvedItem, index: number) => (
            <CategoryItem
              key={item.id}
              item={item}
              index={index}
              imageSize={imageSize}
              shapeClass={shapeClass}
              showCount={showCount}
              showNames={showNames}
              previewMode={previewMode}
              isScrollable={true}
              zeptoMode={zeptoMode}
              cardRadius={settings.cardRadius}
              cardBg={settings.cardBackgroundColor}
              cardShadow={settings.cardShadow}
              imageFit={settings.imageFit}
              imagePadding={imagePadding}
              hideChevron={settings.hideChevron}
              hideProductCount={settings.hideProductCount}
              enableActiveCategory={settings.enableActiveCategory}
              isActive={isItemActive(item)}
            />
          ))}
        </ScrollableContainer>

        {/* Preview indicator */}
        {previewMode && (
          <div className="mt-6 text-center">
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              Preview - {resolvedItems.length} items displayed
            </span>
          </div>
        )}
      </div>
    </section>
  );
}