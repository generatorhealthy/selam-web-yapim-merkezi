export interface AppointmentReview {
  admin_review_required?: boolean;
  admin_released_at?: string | null;
  status: string;
  created_by_specialist?: boolean | null;
}

export function awaitsAdminReview(appointment: AppointmentReview): boolean {
  return appointment.status === 'pending' && appointment.created_by_specialist !== true &&
    appointment.admin_review_required === true && !appointment.admin_released_at;
}

export function canNotifyReviewedAppointment(appointment: AppointmentReview): boolean {
  if (appointment.admin_review_required !== true) return true;
  return !!appointment.admin_released_at && appointment.status === 'confirmed';
}

export function canNotifySpecialistRequest(appointment: AppointmentReview): boolean {
  if (appointment.admin_review_required !== true) return true;
  return !!appointment.admin_released_at && ['pending', 'confirmed'].includes(appointment.status);
}