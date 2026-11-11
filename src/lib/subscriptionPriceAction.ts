interface SubscriptionPriceOrder {
  payment_method: string;
  subscription_reference_code?: string | null;
  subscription_month?: number | null;
  status: string;
}

export function getSubscriptionPriceAction(order: SubscriptionPriceOrder): 'iyzico' | 'order' | null {
  if (order.payment_method === 'credit_card' && order.subscription_reference_code) return 'iyzico';
  if (order.payment_method !== 'credit_card' && (order.subscription_month ?? 0) >= 13 && order.status === 'pending') return 'order';
  return null;
}