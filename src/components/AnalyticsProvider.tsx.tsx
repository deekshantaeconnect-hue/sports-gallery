// src/components/AnalyticsProvider.tsx

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/services/analytics.service';

interface AnalyticsProviderProps {
  storeId: string; // This can be a slug or ID
  children: React.ReactNode;
}

export function AnalyticsProvider({ storeId, children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const previousPathRef = useRef<string | null>(null);

  // Initialize analytics on mount
  useEffect(() => {
    if (!initializedRef.current && storeId) {
      initializedRef.current = true;
      analytics.initialize(storeId);
    }
  }, [storeId]);

  // Track page views on route changes
  useEffect(() => {
    // Only track if pathname changed and analytics is initialized
    if (pathname && previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      
      if (analytics.isInitialized()) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          analytics.trackPageView(document.title, window.location.href);
        });
      }
    }
  }, [pathname]);

  return <>{children}</>;
}