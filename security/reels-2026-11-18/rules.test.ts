import { describe, test, expect } from 'bun:test';
import { reelsEligible, canUseReels, canDownloadReels, detectReelsVideo, REELS_MAX_BYTES, REELS_SENDER, REELS_RECIPIENT } from '../../supabase/functions/_shared/reelsRules';
describe('Reels business and security rules', () => {
 test('pending order is enough for active specialist', () => expect(reelsEligible(true,[{status:'pending'}])).toBe(true));
 test('inactive specialist is excluded', () => expect(reelsEligible(false,[{status:'approved'}])).toBe(false));
 test('no order means no job', () => expect(reelsEligible(true,[])).toBe(false));
 test('deleted order is excluded', () => expect(reelsEligible(true,[{status:'pending',deleted_at:'2026-11-18'}])).toBe(false));
 test('team and admin alone may enter', () => { expect(canUseReels(false,false)).toBe(false); expect(canUseReels(false,true)).toBe(true); expect(canUseReels(true,false)).toBe(true); });
 test('only admin may download', () => { expect(canDownloadReels(false)).toBe(false); expect(canDownloadReels(true)).toBe(true); });
 test('fixed sender', () => expect(REELS_SENDER).toBe('905313453014'));
 test('fixed Enes recipient', () => expect(REELS_RECIPIENT).toBe('905050082675'));
 const header = new Uint8Array(32); new DataView(header.buffer).setUint32(0,24); header.set(new TextEncoder().encode('ftypisom'),4);
 test('MP4 signature accepted', () => expect(detectReelsVideo(header,'video/mp4','reel.mp4',32)).toBe('mp4'));
 test('forged video rejected', () => expect(detectReelsVideo(new TextEncoder().encode('<html>not a video</html>'),'video/mp4','fake.mp4',32)).toBe(null));
 test('nonvideo extension rejected', () => expect(detectReelsVideo(header,'video/mp4','attack.html',32)).toBe(null));
 test('oversize video rejected', () => expect(detectReelsVideo(header,'video/mp4','reel.mp4',REELS_MAX_BYTES+1)).toBe(null));
});