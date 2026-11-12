export function blockedHealthCall(action: unknown, enabled: unknown): boolean {
  return action === 'test_call' || (action === 'toggle' && enabled === true);
}