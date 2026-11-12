// Isolated release policy; no production imports, reads, writes or implicit legal approval.
export type HealthEvidence = {
  purpose: 'health_test' | 'health_appointment' | 'health_transcript';
  source: 'separate_health_consent' | 'legacy_membership';
  subject: string; operation: string; action: 'grant' | 'withdraw';
  documentVersion: string; documentHash: string; serverRecordedAt: string;
};
export function permitsHealth(evidence: HealthEvidence | undefined, scope: {
  subject: string; operation: string; purpose: HealthEvidence['purpose'];
  documentVersion: string; documentHash: string; documentPublished: boolean;
  legalBasisValidated: boolean;
}): boolean {
  return scope.legalBasisValidated && scope.documentPublished && evidence?.source === 'separate_health_consent'
    && evidence.action === 'grant' && evidence.subject === scope.subject
    && evidence.operation === scope.operation && evidence.purpose === scope.purpose
    && evidence.documentVersion === scope.documentVersion && evidence.documentHash === scope.documentHash
    && /^[a-f0-9]{64}$/.test(evidence.documentHash)
    && Number.isFinite(Date.parse(evidence.serverRecordedAt));
}
export function transcriptView(input: {
  authenticated: boolean; authorizedForRecord: boolean;
  legalBasisValidated: boolean; transcript: string; createdAt: string;
}) {
  if (!input.authenticated || !input.authorizedForRecord) return null;
  // Metadata-only read while health retention/access has no established basis.
  return { createdAt: input.createdAt, transcript: input.legalBasisValidated ? input.transcript : null };
}