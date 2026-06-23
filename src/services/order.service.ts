// src/services/order.service.ts
import { apiClient } from '@/lib/api-client';


export interface CancelOrderRequest {
  reason: string;
  notes?: string;
}

export interface ReturnRequest {
  reason: string;
  comments?: string;
}

export interface RefundStatusResponse {
  orderStatus: string;
  orderTotal: number;
  hasRefund: boolean;
  refundStatus: string;
  refundAmount: number | null;
  refundProcessedAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationSource: string | null;
  refundDetails: {
    refundId: string;
    amount: number;
    reason: string;
    status: string;
    gatewayRefundId: string | null;
    processedBy: string | null;
    createdAt: string;
    updatedAt: string;
    statusDisplay: string;
    amountDisplay: string;
  } | null;
  messages: string[];
}




export const orderService = {
 async createOrder(
    storeId: string, 
    addressId: string,
    shippingCost: string,
    courierId?: string // 🔥 NEW: Add courierId here
  ) {
    const { data } = await apiClient.post('/orders/create', { 
      storeId,
      addressId,
      shippingCost,
      courierId // 🔥 NEW: Send it in the payload
    });
    
    return data;
  },

  async getMyOrders() {
    const { data } = await apiClient.get('/orders/my-orders');
    return data;
  },
  async getOrderById(orderId: string) {
    const { data } = await apiClient.get(`/orders/${orderId}/status`);
    return data;
  },

   // Cancel order
  cancelOrder: (id: string, data: CancelOrderRequest) => 
    apiClient.post(`/orders/${id}/cancel`, data),
  
  // Request return
  requestReturn: (id: string, data: ReturnRequest) => 
    apiClient.post(`/orders/${id}/return-request`, data),
  
  // Get refund status
  getRefundStatus: (id: string) => 
    apiClient.get(`/orders/${id}/refund-status`),
  
  // Check cancellation eligibility
  checkCancellationEligibility: (id: string) => 
    apiClient.get(`/orders/${id}/cancellation-eligibility`),
  
  // Check return eligibility
  checkReturnEligibility: (id: string) => 
    apiClient.get(`/orders/${id}/return-eligibility`),
};