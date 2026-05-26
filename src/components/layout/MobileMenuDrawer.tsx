// src/components/layout/MobileMenuDrawer.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/store/useUIStore";
import { BRAND } from "@/config/brand.config";
import { motion, AnimatePresence } from "framer-motion";

export function MobileMenuDrawer({ groups }: { groups: any[] }) {
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Clean background scroll lock without shifting layout coordinates
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    // Capture original document overflow styles
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    // Lock both root layers smoothly to protect mobile viewports
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    // Re-verify inner drawer is container-scrolled to top
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    });

    return () => {
      // Revert cleanly to default document scroll styles
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [isMobileMenuOpen]);

  const toggleGroup = (id: string) => {
    setExpandedGroup(expandedGroup === id ? null : id);
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        /* FIX: Absolute view framing using z-[9999] to clear header contexts completely */
        <div 
          className="fixed inset-0 z-[9999] flex lg:hidden overflow-hidden overscroll-none"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Overlay Mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            /* FIX: Swapped dvh utilities for ultra-stable h-screen with absolute box constraints */
            className="relative w-[85%] max-w-[360px] bg-white h-screen shadow-2xl flex flex-col overflow-hidden"
            style={{
              height: "100vh",
              maxHeight: "100%",
            }}
          >
            {/* Drawer Header Area */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-[#217A6E] tracking-tight">
                  Menu
                </span>
              </div>

              <button
                onClick={closeMobileMenu}
                className="p-2 bg-white rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm border border-gray-100 outline-none"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Viewport Link List */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto py-2 px-4 overscroll-contain touch-auto select-text"
              style={{
                WebkitOverflowScrolling: "touch",
              }}
            >
              <ul className="space-y-1">
                {groups.map((group) => {
                  const isLink = group.type === "link";
                  const isExpanded = expandedGroup === group.id;

                  return (
                    <li
                      key={group.id}
                      className="border-b border-gray-50 last:border-0 pb-1 pt-1"
                    >
                      {isLink ? (
                        <Link
                          href={group.navLink || "#"}
                          onClick={closeMobileMenu}
                          className="block py-3 text-[15px] font-black text-gray-800 uppercase tracking-wide"
                        >
                          {group.title}
                        </Link>
                      ) : (
                        <div>
                          <button
                            onClick={() => toggleGroup(group.id)}
                            className="w-full flex items-center justify-between py-3 text-[15px] font-black text-gray-800 uppercase tracking-wide text-left outline-none"
                          >
                            <span>{group.title}</span>
                            <ChevronDown
                              size={18}
                              className={`transition-transform duration-200 ${
                                isExpanded
                                  ? "rotate-180 text-[#217A6E]"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>

                          {/* Nested Accordion Panel */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="pl-3 pb-4 space-y-5 pt-1 border-l-2 border-[#217A6E]/20 ml-2 mb-2 mt-1">
                                  {group.columns?.map((col: any) => (
                                    <div key={col.id}>
                                      {col.title && (
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 ml-2">
                                          {col.title}
                                        </h4>
                                      )}

                                      <ul className="space-y-3">
                                        {col.items?.map((item: any) => (
                                          <li key={item.id}>
                                            <Link
                                              onClick={closeMobileMenu}
                                              href={
                                                item.type === "COLLECTION"
                                                  ? `/collections/${item.slug}`
                                                  : item.type === "PRODUCT"
                                                  ? `/product/${item.slug}`
                                                  : `/${item.slug}`
                                              }
                                              className="text-[14px] font-semibold text-gray-600 hover:text-[#217A6E] flex items-center gap-3 py-1"
                                            >
                                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                                              <span>{item.label}</span>
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-3 shrink-0 pb-safe">
              <a
                href={`tel:${BRAND.phone}`}
                className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-[#217A6E]"
              >
                <span className="p-2 bg-white rounded-full shadow-sm text-[#217A6E] shrink-0">
                  <Phone size={16} />
                </span>
                <span>{BRAND.phone}</span>
              </a>

              <a
                href={`mailto:${BRAND.email}`}
                className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-[#217A6E] break-all"
              >
                <span className="p-2 bg-white rounded-full shadow-sm text-[#217A6E] shrink-0">
                  <Mail size={16} />
                </span>
                <span>{BRAND.email}</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}