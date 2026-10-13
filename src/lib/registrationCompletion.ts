type Result<T> = { data: T | null; error: unknown };

/** Reopening a completed registration must not create a profile or repeat notifications. */
export async function saveSpecialistProfileOnce(
  findExisting: () => PromiseLike<Result<{ id: string }>>,
  insertProfile: () => PromiseLike<{ error: unknown }>,
): Promise<boolean> {
  const existing = await findExisting();
  if (existing.error) throw existing.error;
  if (existing.data) return false;
  const result = await insertProfile();
  if (result.error) throw result.error;
  return true;
}