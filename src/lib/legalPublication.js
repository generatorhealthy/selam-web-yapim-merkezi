// Both the browser and prerender use this fail-closed, per-document release rule.
export function isLegalPublished(document) {
  return [document?.legal_approved_at, document?.publication_authorized_at, document?.published_at]
    .every(value => typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value)));
}
export function isLegalPreviewHost(hostname) {
  return hostname === 'localhost' || /^id-preview--[a-z0-9-]+\.lovable\.app$/.test(hostname);
}
export function canShowLegalCandidate(document, hostname) {
  return isLegalPublished(document) || isLegalPreviewHost(hostname);
}