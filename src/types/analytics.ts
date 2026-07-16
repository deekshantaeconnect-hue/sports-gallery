// src/types/analytics.ts

export interface AnalyticsConfig {
  enableGoogleAnalytics: boolean;
  googleAnalyticsMeasurementId: string | null;
  enableGoogleTagManager: boolean;
  googleTagManagerContainerId: string | null;
  enableMetaPixel: boolean;
  metaPixelId: string | null;
  enableMicrosoftClarity: boolean;
  microsoftClarityProjectId: string | null;
  enableDebugMode: boolean;
}

export interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
  items?: AnalyticsItem[];
}

export interface AnalyticsItem {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  price?: number;
  quantity?: number;
  variant?: string;
  currency?: string;
}

export interface PurchaseEvent extends AnalyticsEvent {
  params: {
    transaction_id: string;
    currency: string;
    value: number;
    tax?: number;
    shipping?: number;
    coupon?: string;
    discount?: number;
  };
  items: AnalyticsItem[];
}