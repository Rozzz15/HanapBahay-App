/**
 * PayMongo Payment Links API
 * Functions for creating and managing payment links
 */

import { API_BASE_URL } from '../constants';

interface PaymentLinkParams {
  amount: number;
  description: string;
  metadata?: any;
}

interface PaymentLinkResponse {
  success: boolean;
  data?: any;
  checkout_url?: string;
  error?: string;
}

/**
 * Create a payment link for checkout
 */
export async function createPaymentLink(params: PaymentLinkParams): Promise<PaymentLinkResponse> {
  try {
    console.log('🔗 Creating payment link:', params);
    
    const response = await fetch(`${API_BASE_URL}/api/paymongo/create-payment-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    console.log('✅ Payment link created:', result.checkout_url);
    return result;
  } catch (error) {
    console.error('❌ Error creating payment link:', error);
    throw error;
  }
}
