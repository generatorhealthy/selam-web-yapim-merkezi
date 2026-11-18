import { test, expect } from 'bun:test';
import { awaitsAdminReview, canNotifyReviewedAppointment } from '../../src/lib/appointmentReview';
test('site request pending admin approval cannot reach specialist notifications', () => {
  const row = { status: 'pending', admin_review_required: true, admin_released_at: null };
  expect(awaitsAdminReview(row)).toBe(true);
  expect(canNotifyReviewedAppointment(row)).toBe(false);
});
test('confirmed status alone is not admin approval', () => {
  expect(canNotifyReviewedAppointment({ status: 'confirmed', admin_review_required: true })).toBe(false);
});
test('admin approval releases confirmed appointment', () => {
  const row = { status: 'confirmed', admin_review_required: true, admin_released_at: '2026-11-18T22:00:00Z' };
  expect(awaitsAdminReview(row)).toBe(false);
  expect(canNotifyReviewedAppointment(row)).toBe(true);
});
test('cancelled reviewed request does not trigger specialist notification', () => {
  expect(canNotifyReviewedAppointment({ status: 'cancelled', admin_review_required: true, admin_released_at: '2026-11-18T22:00:00Z' })).toBe(false);
});
test('historical and specialist-created appointments retain existing behavior', () => {
  expect(canNotifyReviewedAppointment({ status: 'pending' })).toBe(true);
  expect(awaitsAdminReview({ status: 'pending', created_by_specialist: true, admin_review_required: false })).toBe(false);
});