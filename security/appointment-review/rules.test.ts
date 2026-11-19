import { test, expect } from 'bun:test';
import { awaitsAdminReview, canNotifyReviewedAppointment, canNotifySpecialistRequest } from '../../src/lib/appointmentReview';
import { canNotifyReviewedAppointment as canNotifyServer } from '../../supabase/functions/_shared/appointmentReview';
import { handleConfirmation, type ConfirmationPorts } from '../../supabase/functions/send-patient-appointment-confirmation/handler';
test('deployed server gate blocks pending and releases only admin-confirmed requests', () => {
  expect(canNotifyServer({status: 'pending', admin_review_required: true, admin_released_at: null})).toBe(false);
  expect(canNotifyServer({status: 'confirmed', admin_review_required: true, admin_released_at: null})).toBe(false);
  expect(canNotifyServer({status: 'confirmed', admin_review_required: true, admin_released_at: '2026-11-18T22:00:00Z'})).toBe(true);
});
test('pending site appointment cannot claim or deliver patient confirmation', async () => {
  let claims = 0, deliveries = 0;
  const id = '11111111-1111-4111-8111-111111111111';
  const ports: ConfirmationPorts = {
    identity: async () => ({id: 'owner'}),
    appointment: async () => ({id, specialist_id: 'spec', patient_name: 'Synthetic', patient_email: 'test@example.invalid', appointment_date: '2026-11-19', appointment_time: '10:00', status: 'pending', admin_review_required: true, admin_released_at: null}),
    ownsSpecialist: async () => true,
    claim: async () => { claims++; return true; },
    deliver: async () => { deliveries++; return true; },
    mark: async () => {},
  };
  const response = await handleConfirmation(new Request('https://synthetic.invalid', {method: 'POST', body: JSON.stringify({appointmentId: id})}), ports, {});
  expect(response.status).toBe(409);
  expect(claims).toBe(0);
  expect(deliveries).toBe(0);
});
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
test('administrative release leaves pending request for specialist, not patient confirmation', () => {
  const row = { status: 'pending', admin_review_required: true, admin_released_at: '2026-11-19T07:30:00Z' };
  expect(awaitsAdminReview(row)).toBe(false);
  expect(canNotifySpecialistRequest(row)).toBe(true);
  expect(canNotifyReviewedAppointment(row)).toBe(false);
});
test('unreleased or rejected requests never notify specialists', () => {
  expect(canNotifySpecialistRequest({ status: 'pending', admin_review_required: true })).toBe(false);
  expect(canNotifySpecialistRequest({ status: 'cancelled', admin_review_required: true, admin_released_at: '2026-11-19T07:30:00Z' })).toBe(false);
});