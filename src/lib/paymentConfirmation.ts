export function paymentConfirmed(order: { status?: string; payment_method?: string } | null): boolean {
  return order?.payment_method === 'credit_card' && (order.status === 'approved' || order.status === 'completed');
}