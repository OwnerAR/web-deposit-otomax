export type PaymentMethod = 'VA_BANK' | 'RETAIL' | 'QRIS' | 'EWALLET' | 'ALL';

export interface CreateDepositRequest {
  amount: number;
  phone_number?: string;
  payment_method: PaymentMethod;
  auth_token?: string; // Optional: Token injected automatically, not shown in form
}

export interface PaymentMethodInfo {
  invoice_id: string;
  invoice_url: string;
  amount: number;
  status: string;
}

export interface CreateDepositResponse {
  ticket_id: number;
  invoice_url: string;
  payment_method: PaymentMethod;
  amount: number;
  payment_methods?: Record<string, PaymentMethodInfo>;
}

