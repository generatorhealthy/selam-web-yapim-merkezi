import {test,expect} from 'bun:test';
import {reelsRouteAllowed} from '../../src/lib/reelsAccess';
test('cancelled social media workspace has no panel access',()=>{
 expect(reelsRouteAllowed('social_media','/divan_paneli/dashboard')).toBe(false);
 expect(reelsRouteAllowed('social_media','/divan_paneli/reels-videolari')).toBe(false);
 for(const path of ['users','orders','whatsapp','specialists','accounting','reels-videolari/other'])expect(reelsRouteAllowed('social_media',`/divan_paneli/${path}`)).toBe(false);
});