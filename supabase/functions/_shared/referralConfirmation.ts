/** Stable session-bound primary key prevents two callback requests creating
 * separate referrals. Duplicate recovery verifies the existing assignment. */
export async function confirmReferralOnce(
  sessionId: string, specialistId: string, phone: string,
  ports: {
    insert: (id: string) => Promise<{ error: { code?: string } | null }>;
    read: (id: string) => Promise<{ specialist_id: string; client_contact: string | null } | null>;
  },
): Promise<'created' | 'duplicate'> {
  const result=await ports.insert(sessionId);
  if (!result.error) return 'created';
  if (result.error.code!=='23505') throw new Error('referral_save_failed');
  const previous=await ports.read(sessionId);
  if (!previous || previous.specialist_id!==specialistId || previous.client_contact!==phone) throw new Error('referral_assignment_conflict');
  return 'duplicate';
}