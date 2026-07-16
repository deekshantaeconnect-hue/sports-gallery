// src/services/analytics.service.ts

import { apiClient } from "@/lib/api-client";
import { AnalyticsConfig, AnalyticsItem, PurchaseEvent } from '@/types/analytics';

declare global {
  interface FbqFunction {
    (...args: any[]): void;
    callMethod?: (...args: any[]) => void;
    queue?: any[];
  }

  interface ClarityFunction {
    (...args: any[]): void;
    q?: any[];
  }

  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: FbqFunction;
    clarity: ClarityFunction;
  }
}

class AnalyticsService {
  private config: AnalyticsConfig | null = null;
  private initialized = false;
  private eventQueue: { name: string; params?: any; items?: any[] }[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';
  private storeSlug: string | null = null;

  /**
   * Initialize the analytics service with store configuration
   * @param storeId - Can be a store slug or ID
   */
  async initialize(storeId: string): Promise<void> {
    try {
      this.storeSlug = storeId;

      // Fetch configuration using apiClient
      // The backend will resolve the store ID from the x-store-slug header
      // or from the x-store-id header if provided
      const response = await apiClient.get('/store/settings/analytics/public', {
        headers: {
          'x-store-id': storeId, // This can be a slug or ID
        },
      });

      const result = response.data;

      if (result.success && result.data) {
        this.config = result.data;
        this.initialized = true;

        // Inject scripts
        await this.injectScripts();

        // Process queued events
        this.processQueue();

        // Log initialization
      
      } else {
        // No analytics configuration found - graceful degradation
        if (this.isDevelopment) {
          console.log('[Analytics] No analytics configuration found for store:', storeId);
        }
      }
    } catch (error) {
      // Graceful degradation - analytics will be disabled
      if (this.isDevelopment) {
        console.warn('[Analytics] Failed to initialize:', error);
      }
    }
  }

  /**
   * Inject analytics scripts dynamically
   */
  private async injectScripts(): Promise<void> {
    if (!this.config) return;

    const promises: Promise<void>[] = [];

    // Google Tag Manager (injected first as it manages other tags)
    if (this.config.enableGoogleTagManager && this.config.googleTagManagerContainerId) {
      promises.push(this.injectGTM(this.config.googleTagManagerContainerId));
    }

    // Google Analytics 4
    if (this.config.enableGoogleAnalytics && this.config.googleAnalyticsMeasurementId) {
      promises.push(this.injectGA4(this.config.googleAnalyticsMeasurementId));
    }

    // Meta Pixel
    if (this.config.enableMetaPixel && this.config.metaPixelId) {
      promises.push(this.injectMetaPixel(this.config.metaPixelId));
    }

    // Microsoft Clarity
    if (this.config.enableMicrosoftClarity && this.config.microsoftClarityProjectId) {
      promises.push(this.injectClarity(this.config.microsoftClarityProjectId));
    }

    await Promise.all(promises);

    if (this.isDevelopment || this.config.enableDebugMode) {
      console.log('[Analytics] Scripts injected successfully');
    }
  }

  /**
   * Inject Google Tag Manager
   */
  private injectGTM(containerId: string): Promise<void> {
    return new Promise((resolve) => {
      // Check if already injected
      if (document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${containerId}"]`)) {
        resolve();
        return;
      }

      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];

      // GTM script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
      script.onload = () => {
        if (this.isDevelopment || this.config?.enableDebugMode) {
          console.log('[Analytics] GTM loaded:', containerId);
        }
        resolve();
      };
      script.onerror = () => {
        console.error('[Analytics] Failed to load GTM:', containerId);
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Inject Google Analytics 4
   */
  private injectGA4(measurementId: string): Promise<void> {
    return new Promise((resolve) => {
      // Check if already injected
      if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
        resolve();
        return;
      }

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(...args: any[]) {
        window.dataLayer.push(args);
      };
      window.gtag('js', new Date());
      window.gtag('config', measurementId);

      // GA4 script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.onload = () => {
        if (this.isDevelopment || this.config?.enableDebugMode) {
          console.log('[Analytics] GA4 loaded:', measurementId);
        }
        resolve();
      };
      script.onerror = () => {
        console.error('[Analytics] Failed to load GA4:', measurementId);
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Inject Meta Pixel
   */
  private injectMetaPixel(pixelId: string): Promise<void> {
    return new Promise((resolve) => {
      // Check if already injected
      if (document.querySelector(`script[src*="connect.facebook.net/en_US/fbevents.js"]`)) {
        resolve();
        return;
      }

      // Initialize fbq
      window.fbq = window.fbq || function(...args: any[]) {
        if (window.fbq.callMethod) {
          window.fbq.callMethod.apply(window.fbq, args);
        } else {
          window.fbq.queue?.push(args);
        }
      };
      window.fbq.queue = window.fbq.queue || [];
      window.fbq('init', pixelId);

      // Meta Pixel script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.onload = () => {
        if (this.isDevelopment || this.config?.enableDebugMode) {
          console.log('[Analytics] Meta Pixel loaded:', pixelId);
        }
        resolve();
      };
      script.onerror = () => {
        console.error('[Analytics] Failed to load Meta Pixel:', pixelId);
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Inject Microsoft Clarity
   */
  private injectClarity(projectId: string): Promise<void> {
    return new Promise((resolve) => {
      // Check if already injected
      if (document.querySelector(`script[src*="clarity.microsoft.com/tag/${projectId}"]`)) {
        resolve();
        return;
      }

      // Initialize clarity
      window.clarity = window.clarity || function(...args: any[]) {
        (window.clarity.q = window.clarity.q || []).push(args);
      };

      // Clarity script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.clarity.ms/tag/${projectId}`;
      script.onload = () => {
        if (this.isDevelopment || this.config?.enableDebugMode) {
          console.log('[Analytics] Clarity loaded:', projectId);
        }
        resolve();
      };
      script.onerror = () => {
        console.error('[Analytics] Failed to load Clarity:', projectId);
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Process queued events after initialization
   */
  private processQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.trackEvent(event.name, event.params, event.items);
      }
    }
  }

  /**
   * Track an event across all enabled providers
   */
  private trackEvent(name: string, params?: Record<string, any>, items?: AnalyticsItem[]): void {
    // If not initialized, queue the event
    if (!this.initialized) {
      this.eventQueue.push({ name, params, items });
      return;
    }

    if (!this.config) return;

    // Log in development or debug mode
    if (this.isDevelopment || this.config.enableDebugMode) {
      console.log('[Analytics] Event:', name, { params, items });
    }

    // Track with each enabled provider
    if (this.config.enableGoogleAnalytics && this.config.googleAnalyticsMeasurementId) {
      this.trackGA4(name, params, items);
    }

    if (this.config.enableGoogleTagManager && this.config.googleTagManagerContainerId) {
      this.trackGTM(name, params, items);
    }

    if (this.config.enableMetaPixel && this.config.metaPixelId) {
      this.trackMetaPixel(name, params, items);
    }
  }

  /**
   * Track with GA4
   */
  private trackGA4(name: string, params?: Record<string, any>, items?: AnalyticsItem[]): void {
    if (typeof window.gtag !== 'function') return;

    try {
      // For ecommerce events, use GA4's event structure
      if (items && items.length > 0) {
        window.gtag('event', name, {
          ...params,
          items: items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            item_brand: item.brand,
            price: item.price,
            quantity: item.quantity,
            item_variant: item.variant,
          })),
        });
      } else {
        window.gtag('event', name, params || {});
      }
    } catch (error) {
      if (this.isDevelopment) {
        console.error('[Analytics] GA4 error:', error);
      }
    }
  }

  /**
   * Track with GTM dataLayer
   */
  private trackGTM(name: string, params?: Record<string, any>, items?: AnalyticsItem[]): void {
    if (!window.dataLayer) return;

    try {
      const eventData: any = {
        event: name,
        ...params,
      };

      if (items && items.length > 0) {
        eventData.ecommerce = {
          items: items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            item_brand: item.brand,
            price: item.price,
            quantity: item.quantity,
            item_variant: item.variant,
          })),
        };
      }

      window.dataLayer.push(eventData);
    } catch (error) {
      if (this.isDevelopment) {
        console.error('[Analytics] GTM error:', error);
      }
    }
  }

  /**
   * Track with Meta Pixel
   */
  private trackMetaPixel(name: string, params?: Record<string, any>, items?: AnalyticsItem[]): void {
    if (typeof window.fbq !== 'function') return;

    try {
      // Map standard events to Meta Pixel events
      const metaEventMap: Record<string, string> = {
        'view_item': 'ViewContent',
        'view_item_list': 'ViewContent',
        'add_to_cart': 'AddToCart',
        'remove_from_cart': 'RemoveFromCart',
        'add_to_wishlist': 'AddToWishlist',
        'begin_checkout': 'InitiateCheckout',
        'add_shipping_info': 'AddShippingInfo',
        'add_payment_info': 'AddPaymentInfo',
        'purchase': 'Purchase',
        'search': 'Search',
        'contact': 'Contact',
        'newsletter': 'Subscribe',
        'login': 'CompleteRegistration',
        'register': 'CompleteRegistration',
      };

      const metaEvent = metaEventMap[name] || 'CustomEvent';

      // For purchase events, include value and currency
      if (name === 'purchase' && params) {
        window.fbq('track', metaEvent, {
          value: params.value,
          currency: params.currency || 'INR',
          content_ids: items?.map(i => i.id) || [],
          content_name: items?.[0]?.name || '',
          content_type: 'product',
          order_id: params.transaction_id,
        });
      } else if (items && items.length > 0) {
        // For product events
        const contentIds = items.map(i => i.id);
        const contentName = items.map(i => i.name).join(', ');

        window.fbq('track', metaEvent, {
          content_ids: contentIds,
          content_name: contentName,
          content_type: 'product',
          ...params,
        });
      } else {
        window.fbq('track', metaEvent, params || {});
      }
    } catch (error) {
      if (this.isDevelopment) {
        console.error('[Analytics] Meta Pixel error:', error);
      }
    }
  }

  // ==========================================
  // PUBLIC API METHODS
  // ==========================================

  /**
   * Track a page view
   */
  trackPageView(title?: string, location?: string): void {
    this.trackEvent('page_view', {
      page_title: title || document.title,
      page_location: location || window.location.href,
    });
  }

  /**
   * Track a product view
   */
  trackProductView(product: AnalyticsItem): void {
    this.trackEvent('view_item', {
      currency: 'INR',
      value: product.price,
    }, [product]);
  }

  /**
   * Track a category view
   */
  trackCategoryView(category: string, products: AnalyticsItem[]): void {
    this.trackEvent('view_item_list', {
      item_list_name: category,
    }, products);
  }

  /**
   * Track a search
   */
  trackSearch(searchTerm: string, results?: AnalyticsItem[]): void {
    this.trackEvent('search', {
      search_term: searchTerm,
      ...(results ? { results: results.length } : {}),
    }, results);
  }

  /**
   * Track a login
   */
  trackLogin(method?: string): void {
    this.trackEvent('login', { method });
  }

  /**
   * Track a registration
   */
  trackRegister(method?: string): void {
    this.trackEvent('register', { method });
  }

  /**
   * Track wishlist action
   */
  trackWishlist(product: AnalyticsItem, action: 'add' | 'remove'): void {
    this.trackEvent(
      action === 'add' ? 'add_to_wishlist' : 'remove_from_wishlist',
      {},
      [product]
    );
  }

  /**
   * Track add to cart
   */
  trackAddToCart(product: AnalyticsItem): void {
    this.trackEvent('add_to_cart', {
      currency: 'INR',
      value: product.price! * (product.quantity || 1),
    }, [product]);
  }

  /**
   * Track remove from cart
   */
  trackRemoveFromCart(product: AnalyticsItem): void {
    this.trackEvent('remove_from_cart', {
      currency: 'INR',
      value: product.price! * (product.quantity || 1),
    }, [product]);
  }

  /**
   * Track view cart
   */
  trackViewCart(items: AnalyticsItem[], total: number): void {
    this.trackEvent('view_cart', {
      currency: 'INR',
      value: total,
    }, items);
  }

  /**
   * Track begin checkout
   */
  trackBeginCheckout(items: AnalyticsItem[], total: number): void {
    this.trackEvent('begin_checkout', {
      currency: 'INR',
      value: total,
    }, items);
  }

  /**
   * Track add shipping info
   */
  trackAddShipping(method?: string): void {
    this.trackEvent('add_shipping_info', { shipping_method: method });
  }

  /**
   * Track add payment info
   */
  trackAddPayment(method?: string): void {
    this.trackEvent('add_payment_info', { payment_method: method });
  }

  /**
   * Track a purchase
   */
  trackPurchase(event: PurchaseEvent): void {
    this.trackEvent('purchase', event.params, event.items);
  }

  /**
   * Track a refund
   */
  trackRefund(orderId: string, amount: number, reason?: string): void {
    this.trackEvent('refund', {
      transaction_id: orderId,
      value: amount,
      reason,
    });
  }

  /**
   * Track order cancellation
   */
  trackOrderCancelled(orderId: string, reason?: string): void {
    this.trackEvent('order_cancelled', {
      order_id: orderId,
      reason,
    });
  }

  /**
   * Track contact form submission
   */
  trackContact(): void {
    this.trackEvent('contact');
  }

  /**
   * Track newsletter signup
   */
  trackNewsletter(): void {
    this.trackEvent('newsletter');
  }

  /**
   * Track a custom event
   */
  trackCustomEvent(name: string, params?: Record<string, any>): void {
    this.trackEvent(name, params);
  }

  /**
   * Set user ID for cross-device tracking
   */
  setUserId(userId: string): void {
    if (!this.initialized || !this.config) return;

    // GA4
    if (this.config.enableGoogleAnalytics && typeof window.gtag === 'function') {
      window.gtag('set', { user_id: userId });
    }

    // GTM
    if (this.config.enableGoogleTagManager && window.dataLayer) {
      window.dataLayer.push({ user_id: userId });
    }

    // Clarity
    if (this.config.enableMicrosoftClarity && typeof window.clarity === 'function') {
      window.clarity('identify', userId);
    }
  }

  /**
   * Check if analytics is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyticsConfig | null {
    return this.config;
  }

  /**
   * Track a server-side purchase (for Meta Conversions API / GA4 Measurement Protocol)
   */
  async trackServerPurchase(event: PurchaseEvent): Promise<void> {
    try {
      await apiClient.post('/analytics/server/purchase', {
        ...event,
        storeSlug: this.storeSlug,
      });
      
      if (this.isDevelopment || this.config?.enableDebugMode) {
        console.log('[Analytics] Server-side purchase tracked:', event.params.transaction_id);
      }
    } catch (error) {
      console.error('[Analytics] Failed to track server-side purchase:', error);
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();