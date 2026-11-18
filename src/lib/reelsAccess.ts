export type ReelsPanelRole = 'social_media';
export function reelsRouteAllowed(role: string, path: string) {
 return role !== 'social_media';
}