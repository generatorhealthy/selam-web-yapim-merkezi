import { ownsOrderEmail } from './paymentOwnership.ts';
const eq = (actual: unknown, expected: unknown) => { if (actual !== expected) throw new Error(`${actual} != ${expected}`); };
Deno.test('another specialist order is denied even for identical names', () => eq(ownsOrderEmail('one@example.invalid','two@example.invalid'),false));
Deno.test('SQL wildcard in verified email does not widen ownership', () => eq(ownsOrderEmail('a_b@example.invalid','axb@example.invalid'),false));
Deno.test('exact server email is case and whitespace normalized', () => eq(ownsOrderEmail(' ONE@example.invalid ','one@example.invalid'),true));
Deno.test('missing server identity is never ownership', () => eq(ownsOrderEmail(null,'one@example.invalid'),false));