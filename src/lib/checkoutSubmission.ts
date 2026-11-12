/** Payment initialization is never allowed if durable order insertion failed. */
export async function checkoutAfterOrder(
  save: () => Promise<boolean>,
  continuePayment: () => Promise<void>,
): Promise<boolean> {
  if (!(await save())) return false;
  await continuePayment();
  return true;
}