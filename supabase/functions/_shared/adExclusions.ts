// Doktorum Ol performans/AI hesaplarına girmeyen kampanyalar.
// "Bihter" kampanyaları aynı reklam hesabındaki ayrı bir projeye aittir (kullanıcı kararı).
// Test trafiği ayrıca SQL tarafında is_test + test kimlikleri (111111/222222/333333, TEST_ kampanya) ile dışlanır.
export const OTHER_PROJECT_CAMPAIGN_RE = /bihter/i;

export const isOtherProjectRow = (row: { entity_name?: string | null; campaign_id?: string | null; entity_id?: string | null }, otherCampaignIds: Set<string>, level: string) =>
  OTHER_PROJECT_CAMPAIGN_RE.test(row.entity_name || "") ||
  otherCampaignIds.has(String(row.campaign_id ?? "")) ||
  (level === "campaign" && otherCampaignIds.has(String(row.entity_id ?? "")));
