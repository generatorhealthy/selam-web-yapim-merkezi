import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const folder = fileURLToPath(new URL('./health-catalog/', import.meta.url));
export const catalogVersion = 'health-test-2026-11-12-v1';
export const catalogTexts = {
  disclosure: readFileSync(`${folder}disclosure.md`, 'utf8'),
  consent: readFileSync(`${folder}consent.md`, 'utf8'),
};
export const catalogHashes = Object.fromEntries(Object.entries(catalogTexts).map(([k, v]) => [k, createHash('sha256').update(v).digest('hex')]));
const validTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const literal = value => `'${value.replaceAll("'", "''")}'`;

// Pure packaging only: no credentials, connections, network, or automatic execution.
export function catalogSql(acceptance) {
  if (!validTime(acceptance?.legalApprovedAt) || !validTime(acceptance?.publishedAt)
    || acceptance?.approvedDisclosureHash !== catalogHashes.disclosure
    || acceptance?.approvedConsentHash !== catalogHashes.consent
    || acceptance?.healthTransferBasisVerified !== true) {
    throw new Error('Exact document approval and health transfer basis required');
  }
  if (Date.parse(acceptance.publishedAt) < Date.parse(acceptance.legalApprovedAt)) throw new Error('Publication precedes approval');
  return `BEGIN;
INSERT INTO public.health_test_documents(version,disclosure,consent,legal_approved_at,published_at)
VALUES (${literal(catalogVersion)},${literal(catalogTexts.disclosure)},${literal(catalogTexts.consent)},${literal(acceptance.legalApprovedAt)}::timestamptz,${literal(acceptance.publishedAt)}::timestamptz);
-- Catalog insertion does not enable the release, revoke legacy INSERT, or change old consent.
COMMIT;\n`;
}