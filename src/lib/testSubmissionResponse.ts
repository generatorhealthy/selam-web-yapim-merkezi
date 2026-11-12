import { z } from 'zod';

export const submissionReceiptSchema = z.object({ resultId: z.string().uuid(), specialistId: z.string().uuid() });
export const withdrawalReceiptSchema = z.object({ withdrawn: z.literal(true) });

export function submissionReceipt(data: unknown) {
  return submissionReceiptSchema.parse(data);
}
export function withdrawalReceipt(data: unknown) {
  return withdrawalReceiptSchema.parse(data);
}