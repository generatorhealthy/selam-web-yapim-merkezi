// Keep the deadline active while reading the response body, not just headers.
export async function releaseJson(url, options = {}, { timeoutMs = 45000, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`SEO data HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (controller.signal.aborted) throw new Error('SEO data request timed out; publication stopped');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}