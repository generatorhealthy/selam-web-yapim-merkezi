import {test,expect} from 'bun:test';
import {canAddProfileVideo,ownsProfileVideo,hasVideoTrack} from '../../supabase/functions/_shared/profileVideoRules';
test('six videos maximum: sixth allowed, seventh denied',()=>{expect(canAddProfileVideo(5)).toBe(true);expect(canAddProfileVideo(6)).toBe(false);});
test('only the owning specialist can modify videos',()=>{expect(ownsProfileVideo('owner','owner')).toBe(true);expect(ownsProfileVideo('owner','other')).toBe(false);});
test('audio-only container is rejected',()=>{expect(hasVideoTrack(new TextEncoder().encode('ftypisom audio'),'video/mp4')).toBe(false);});
test('video track is required',()=>{const bytes=new Uint8Array(32);bytes.set(new TextEncoder().encode('hdlr'),0);bytes.set(new TextEncoder().encode('vide'),12);expect(hasVideoTrack(bytes,'video/mp4')).toBe(true);});