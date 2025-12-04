import { PAYMENT_METHODS } from '@/lib/constants';
import { PaymentMethod } from '@/types/deposit';

export function usePaymentMethods() {
  const getPaymentMethod = (value: PaymentMethod) => {
    return PAYMENT_METHODS.find((method) => method.value === value);
  };

  const getAllPaymentMethods = () => {
    return PAYMENT_METHODS;
  };

  return {
    getPaymentMethod,
    getAllPaymentMethods,
  };
}

