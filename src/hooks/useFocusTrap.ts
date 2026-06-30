// src/hooks/useFocusTrap.ts (FIXED)
import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  enabled: boolean;
  initialFocus?: string | HTMLElement;
  returnFocus?: boolean;
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  { enabled, initialFocus, returnFocus = true }: UseFocusTrapOptions
) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const focusableElements = useRef<HTMLElement[]>([]);

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled'));
  };

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    // Save previous focus
    if (returnFocus) {
      previousFocus.current = document.activeElement as HTMLElement;
    }

    // Get focusable elements
    focusableElements.current = getFocusableElements(container);

    // Set initial focus
    if (initialFocus) {
      const element = typeof initialFocus === 'string'
        ? container.querySelector<HTMLElement>(initialFocus)
        : initialFocus;
      
      if (element && focusableElements.current.includes(element)) {
        setTimeout(() => element.focus(), 50);
        return;
      }
    }

    // Fallback to first focusable element
    if (focusableElements.current.length > 0) {
      setTimeout(() => focusableElements.current[0].focus(), 50);
    }

    // Focus trap handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (!focusable.length) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore previous focus
      if (returnFocus && previousFocus.current) {
        setTimeout(() => previousFocus.current?.focus(), 50);
      }
    };
  }, [enabled, containerRef, initialFocus, returnFocus]);

  return {
    refreshFocusableElements: () => {
      if (containerRef.current) {
        focusableElements.current = getFocusableElements(containerRef.current);
      }
    },
  };
}