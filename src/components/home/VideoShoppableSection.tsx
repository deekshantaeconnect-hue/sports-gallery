"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import Link from "next/link";
import { Play, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoShoppableProps {
  data: any[];
  settings: any;
}

const SECTION_SPACING = "py-8 md:py-12 lg:py-16";
const CONTAINER_SPACING = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

/**
 * Validate image URL
 */
const isValidImageUrl = (url?: string) => {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/")) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const VideoShoppableSection: React.FC<VideoShoppableProps> = ({
  data,
  settings,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const title = settings?.title || "Quick Tutorials for Best Results";
  const subtitle =
    settings?.subtitle || "Watch, learn, and shop our expert recommendations";
  const isMuted = settings?.muted !== false;

  const items = useMemo(
    () => data?.filter((slide) => slide?.videoUrl && slide?.product) || [],
    [data],
  );

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const card = scrollRef.current.querySelector(
      "[data-video-card]",
    ) as HTMLElement;

    const width = card?.offsetWidth || 300;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -width - 24 : width + 24,
      behavior: "smooth",
    });
  };

  /**
   * Monitor scroll position to show/hide navigation arrows dynamically
   */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !items.length) return;

    const checkScrollPosition = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      // Using a 4px buffer to safeguard against fractional pixel precision variations
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    };

    // Run initial evaluation
    checkScrollPosition();

    container.addEventListener("scroll", checkScrollPosition, {
      passive: true,
    });
    window.addEventListener("resize", checkScrollPosition);

    // Re-verify after elements complete initialization layout
    const timeoutId = setTimeout(checkScrollPosition, 400);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
      clearTimeout(timeoutId);
    };
  }, [items]);

  /**
   * Auto play/pause on viewport visibility
   */
  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;

          if (entry.isIntersecting) {
            video.play().catch((err) => {
              if (err.name !== "NotSupportedError") {
                console.warn(
                  "[VideoShoppable] Autoplay prevented:",
                  err.message,
                );
              }
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 },
    );

    const videos = containerRef.current?.querySelectorAll("video");
    videos?.forEach((video) => observer.observe(video));

    return () => observer.disconnect();
  }, [items]);

  if (!items.length) {
    return (
      <section className={`w-full bg-zinc-50 ${SECTION_SPACING}`}>
        <div className={CONTAINER_SPACING}>
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-8 text-center md:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
              <Play className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">
              Shoppable Video Section
            </h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Add video reels and link products from the configuration panel to
              preview them here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("overflow-hidden bg-white", SECTION_SPACING)}>
      <div className={CONTAINER_SPACING}>
        {/* Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14 lg:mb-16">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl lg:text-5xl">
            {title}
          </h2>

          <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-[#006044]" />

          {subtitle && (
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 sm:text-base md:text-lg">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel Wrapper */}
        <div className="relative">
          {/* Left Navigation Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className={cn(`absolute
                top-1/2
                z-30
                hidden
                h-11
                w-11
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-zinc-200
                bg-white
                lg:flex
                hover:bg-zinc-50
                transition-all
                shadow-md
                lg:-left-6
                xl:-left-12`)}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Right Navigation Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className={cn(`absolute
                top-1/2
                z-30
                hidden
                h-11
                w-11
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-zinc-200
                bg-white
                lg:flex
                hover:bg-zinc-50
                transition-all
                shadow-md
                lg:-right-6
                xl:-right-12
              `)}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          )}

          {/* Carousel Track */}
          <div
            ref={(node) => {
              scrollRef.current = node;
              containerRef.current = node;
            }}
            className={cn(` flex
              gap-4
              overflow-x-auto
              snap-x
              snap-mandatory
              scroll-smooth
              pb-2

              [-ms-overflow-style:none]
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden`)}
          >
            {items.map((slide, index) => {
              const safeImageSrc = isValidImageUrl(slide.product?.image)
                ? slide.product.image
                : "/placeholder.png";

              const isVideo =
                slide.videoUrl.match(/\.(mp4|webm|mov|ogg)$/i) ||
                slide.videoUrl.includes("/video/");

              return (
                <div
                  key={index}
                  data-video-card
                  className={cn(`group
                    relative
                    flex-shrink-0
                    snap-start
                    overflow-hidden
                    rounded-[28px]
                    bg-zinc-900

                    w-[180px]
                    sm:w-[220px]
                    md:w-[260px]
                    lg:w-[280px]
                    xl:w-[300px]

                    transition-transform
                    duration-300
                    hover:-translate-y-1`)}
                    
              
                >
                  <div className="relative aspect-[9/16]">
                    {isVideo ? (
                      <video
                        src={slide.videoUrl}
                        loop
                        muted={isMuted}
                        playsInline
                        poster={safeImageSrc}
                        className={cn(`absolute
                          inset-0
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-700
                          group-hover:scale-105
                        `)}
                          
                      />
                    ) : (
                      <img
                        src={slide.videoUrl}
                        alt="Video"
                        className={cn(`
                          absolute
                          inset-0
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-700
                          group-hover:scale-105
                        `)}
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90" />

                    <div className="absolute left-3 top-3 z-20">
                      <div className="rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
                        <span className="text-[10px] font-semibold text-white">
                          TRENDING
                        </span>
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 z-20">
                      <Link href={`/product/${slide.product.slug}`}>
                        <div
                          className={cn(`flex
                            items-center
                            gap-3
                            rounded-2xl
                            border
                            border-white/20
                            bg-white/15
                            p-3
                            backdrop-blur-xl
                            transition-all
                            duration-300
                            hover:bg-white/25`)}
                            
                        >
                          <img
                            src={safeImageSrc}
                            alt={slide.product.name}
                            className={cn(` h-12
                              w-12
                              flex-shrink-0
                              rounded-xl
                              bg-white
                              object-cover
                            `)}
                             
                            onError={(e) => {
                              if (
                                !e.currentTarget.src.includes(
                                  "/placeholder.png",
                                )
                              ) {
                                e.currentTarget.src = "/placeholder.png";
                              }
                            }}
                          />

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-xs font-semibold text-white md:text-sm">
                              {slide.product.name}
                            </h3>

                            <p className="mt-1 text-xs font-medium text-white/80">
                              ₹{slide.product.price}
                            </p>
                          </div>

                          <div
                            className={cn(`
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-xl
                              bg-white
                              text-black
                            `)}
                          >
                            <ShoppingBag size={16} />
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
