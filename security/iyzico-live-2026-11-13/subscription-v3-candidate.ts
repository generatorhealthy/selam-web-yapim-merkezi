/** Offline candidate; not imported by deployed handlers. Subscription format only. */
export async function verifySubscriptionV3(secret: string, merchantId: string,
  body: Record<string, unknown>, supplied: string): Promise<boolean> {
  const fields = ['iyziEventType', 'subscriptionReferenceCode', 'orderReferenceCode', 'customerReferenceCode'];
  if (!secret || !merchantId || !/^[a-f0-9]{64}$/i.test(supplied)
    || fields.some(k => typeof body[k] !== 'string' || !body[k])) return false;
  // Official subscription example: merchantId BEFORE secretKey (not the other way around).
  const data = merchantId + secret + fields.map(k => String(body[k])).join('');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const expected = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= expected.charCodeAt(i) ^ supplied.toLowerCase().charCodeAt(i);
  return difference === 0;
}