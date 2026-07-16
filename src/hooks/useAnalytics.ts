// src/hooks/useAnalytics.ts

import { analytics } from '@/services/analytics.service';
import { AnalyticsItem, PurchaseEvent } from '@/types/analytics';
import { useCallback } from 'react';


export function useAnalytics() {
  const trackPageView = useCallback((title?: string, location?: string) => {
    analytics.trackPageView(title, location);
  }, []);

  const trackProductView = useCallback((product: AnalyticsItem) => {
    analytics.trackProductView(product);
  }, []);

  const trackCategoryView = useCallback((category: string, products: AnalyticsItem[]) => {
    analytics.trackCategoryView(category, products);
  }, []);

  const trackSearch = useCallback((searchTerm: string, results?: AnalyticsItem[]) => {
    analytics.trackSearch(searchTerm, results);
  }, []);

  const trackLogin = useCallback((method?: string) => {
    analytics.trackLogin(method);
  }, []);

  const trackRegister = useCallback((method?: string) => {
    analytics.trackRegister(method);
  }, []);

  const trackWishlist = useCallback((product: AnalyticsItem, action: 'add' | 'remove') => {
    analytics.trackWishlist(product, action);
  }, []);

  const trackAddToCart = useCallback((product: AnalyticsItem) => {
    analytics.trackAddToCart(product);
  }, []);

  const trackRemoveFromCart = useCallback((product: AnalyticsItem) => {
    analytics.trackRemoveFromCart(product);
  }, []);

  const trackViewCart = useCallback((items: AnalyticsItem[], total: number) => {
    analytics.trackViewCart(items, total);
  }, []);

  const trackBeginCheckout = useCallback((items: AnalyticsItem[], total: number) => {
    analytics.trackBeginCheckout(items, total);
  }, []);

  const trackAddShipping = useCallback((method?: string) => {
    analytics.trackAddShipping(method);
  }, []);

  const trackAddPayment = useCallback((method?: string) => {
    analytics.trackAddPayment(method);
  }, []);

  const trackPurchase = useCallback((event: PurchaseEvent) => {
    analytics.trackPurchase(event);
  }, []);

  const trackRefund = useCallback((orderId: string, amount: number, reason?: string) => {
    analytics.trackRefund(orderId, amount, reason);
  }, []);

  const trackOrderCancelled = useCallback((orderId: string, reason?: string) => {
    analytics.trackOrderCancelled(orderId, reason);
  }, []);

  const trackContact = useCallback(() => {
    analytics.trackContact();
  }, []);

  const trackNewsletter = useCallback(() => {
    analytics.trackNewsletter();
  }, []);

  const trackCustomEvent = useCallback((name: string, params?: Record<string, any>) => {
    analytics.trackCustomEvent(name, params);
  }, []);

  const setUserId = useCallback((userId: string) => {
    analytics.setUserId(userId);
  }, []);

  const isInitialized = useCallback(() => {
    return analytics.isInitialized();
  }, []);

  return {
    trackPageView,
    trackProductView,
    trackCategoryView,
    trackSearch,
    trackLogin,
    trackRegister,
    trackWishlist,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewCart,
    trackBeginCheckout,
    trackAddShipping,
    trackAddPayment,
    trackPurchase,
    trackRefund,
    trackOrderCancelled,
    trackContact,
    trackNewsletter,
    trackCustomEvent,
    setUserId,
    isInitialized,
  };
}