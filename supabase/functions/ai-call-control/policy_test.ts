import { blockedHealthCall } from './policy.ts';
function assert(value: boolean) { if (!value) throw new Error('assertion failed'); }
Deno.test('closed AI cannot restart via admin toggle', () => assert(blockedHealthCall('toggle', true)));
Deno.test('test call cannot bypass closed AI', () => assert(blockedHealthCall('test_call', false)));
Deno.test('turn off remains available', () => assert(!blockedHealthCall('toggle', false)));
Deno.test('metadata status remains available', () => assert(!blockedHealthCall('status', undefined)));