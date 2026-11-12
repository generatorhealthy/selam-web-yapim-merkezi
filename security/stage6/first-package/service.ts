import { appointmentData, healthAllowed, latestConsent, validActor, type Actor, type ConsentEvent, type LegalBasis, type Operation } from './policy.ts';
type Document = { published: boolean; version: string; hash: string };
export type RequestInput = { operationId: string; resourceId: string; kind: 'test' | 'appointment'; base: Record<string,unknown>; answers?: Record<string,unknown>; notes?: string; topic?: string; includeHealth: boolean };
export type Commit = { operation: Operation; actor: Actor; payload: Record<string,unknown>; expectedConsentSequence: number | null };
export interface Ports {
  now(): number;
  // These ports MUST read trusted server state; never map client IDs into Actor.
  authenticate(): Promise<Actor | null>;
  operation(id: string): Promise<Operation | null>;
  legal(kind: RequestInput['kind']): Promise<{ general: LegalBasis; health: LegalBasis; document: Document }>;
  events(actor: Actor, operation: Operation): Promise<ConsentEvent[]>;
  // DB transaction must recheck consent, owner, resource and expiry under lock;
  // compare canonical payload hash, insert once and consume operation atomically.
  commit(value: Commit): Promise<{ id: string; duplicate: boolean }>;
}
export async function submit(input: RequestInput, ports: Ports) {
  const actor = await ports.authenticate();
  if (!validActor(actor, ports.now())) throw new Error('verified_identity_required');
  const op = await ports.operation(input.operationId);
  if (!op || op.subject !== actor.id || op.kind !== input.kind || op.resource !== input.resourceId || op.expiresAt <= ports.now()) throw new Error('operation_mismatch_or_expired');
  const legal = await ports.legal(input.kind);
  if (!legal.general.approved || legal.general.article !== '5' || !legal.general.condition.trim()) throw new Error('general_basis_not_approved');
  const purpose = input.kind === 'test' ? 'health_test' : 'health_appointment';
  const event = latestConsent(await ports.events(actor,op),actor.id,op.id,purpose);
  const requiresHealth = input.kind === 'test' || input.includeHealth === true;
  if (requiresHealth && !healthAllowed(legal.health,event,legal.document)) throw new Error('health_basis_or_consent_required');
  const payload = input.kind === 'test'
    ? { answers: input.answers ?? {}, test_id: op.resource }
    : appointmentData(input.base,{ notes: input.notes, topic: input.topic },requiresHealth);
  // Specialist assignment and ownership must be resolved from op.resource in transaction.
  return ports.commit({ operation: op, actor, payload, expectedConsentSequence: requiresHealth ? event?.sequence ?? null : null });
}