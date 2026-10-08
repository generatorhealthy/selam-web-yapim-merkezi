export interface LocalBranch { slug: string; name: string; about: string; match: (l: string) => boolean }
export interface LocalCity { slug: string; name: string }
export interface LocalPage<T = any> { slug: string; kind: "city" | "online"; branch: LocalBranch; city: LocalCity | null; list: T[] }
export const LOCAL_BRANCHES: LocalBranch[];
export function slugifyTr(s?: string): string;
export function branchOf(specialty: string): LocalBranch | null;
export function cityOf(raw: string): LocalCity | null;
export function buildLocalPages<T = any>(specialists: T[]): LocalPage<T>[];
export function parseLocalSlug(slug: string): { kind: "city" | "online"; branch: LocalBranch; citySlug: string | null } | null;
export function localTitle(p: LocalPage): string;
export function localHeading(p: LocalPage): string;
export function localDescription(p: LocalPage): string;
export function localFaq(p: LocalPage): [string, string][];
