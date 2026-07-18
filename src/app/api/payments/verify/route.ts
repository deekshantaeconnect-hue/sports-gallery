// src/app/api/payments/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function POST(req: NextRequest) {
  
  try {
    const body = await req.json();

    const { provider, orderId, paymentData } = body;

    // Use apiClient to forward to backend
    // apiClient already has the baseURL from NEXT_PUBLIC_API_URL

    const response = await apiClient.post('/payments/verify', {
      provider,
      orderId,
      paymentData,
    });


    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error('[API-DEBUG] Verification error:', error);
    
    // Extract error from axios response if available
    const errorMessage = error?.response?.data?.message || error.message || 'Internal server error';
    const statusCode = error?.response?.status || 500;
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
  }
}