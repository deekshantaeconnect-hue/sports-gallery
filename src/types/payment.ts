// src/types/payment.ts

export type PaymentFlowType = 'REDIRECT' | 'FORM' | 'NONE' | 'RAZORPAY_SDK';

export interface PaymentInitiateResponse {
  provider: string;
  flow?: PaymentFlowType;
  url?: string;
  method?: 'GET' | 'POST';
  params?: Record<string, any>;
  message?: string;
  formPayload?: any;
  paymentSessionId?: string;
}