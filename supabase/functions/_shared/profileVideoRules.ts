export const PROFILE_VIDEO_LIMIT = 6;
export const PROFILE_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export function canAddProfileVideo(count: number) { return Number.isInteger(count) && count >= 0 && count < PROFILE_VIDEO_LIMIT; }
export function ownsProfileVideo(owner: string, actor: string) { return Boolean(owner) && owner === actor; }
export function hasVideoTrack(bytes: Uint8Array, mime: string) {
 if (mime === 'video/webm') { const text = new TextDecoder().decode(bytes); return ['V_VP8','V_VP9','V_AV1'].some(codec => text.includes(codec)); }
 for (let i=0;i+16<=bytes.length;i++) {
  if (bytes[i]===0x68&&bytes[i+1]===0x64&&bytes[i+2]===0x6c&&bytes[i+3]===0x72&&bytes[i+12]===0x76&&bytes[i+13]===0x69&&bytes[i+14]===0x64&&bytes[i+15]===0x65) return true;
 }
 return false;
}