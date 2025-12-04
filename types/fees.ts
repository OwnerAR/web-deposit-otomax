export type FeeType = 'static' | 'percentage';

export interface FeeConfig {
  type: FeeType;
  value: number;
  formatted: string;
}

export interface FeesResponse {
  va_bank: FeeConfig;
  retail: FeeConfig;
  qris: FeeConfig;
  ewallet: FeeConfig;
}

