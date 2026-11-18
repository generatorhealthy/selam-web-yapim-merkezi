import {test,expect} from 'bun:test';
import {reelsRouteAllowed} from '../../src/lib/reelsAccess';
test('social media only dashboard and Reels',()=>{
 expect(reelsRouteAllowed('social_media','/divan_paneli/dashboard')).toBe(true);
 expect(reelsRouteAllowed('social_media','/divan_paneli/reels-videolari')).toBe(true);
 for(const path of ['users','orders','whatsapp','specialists','accounting','reels-videolari/other'])expect(reelsRouteAllowed('social_media',`/divan_paneli/${path}`)).toBe(false);
});