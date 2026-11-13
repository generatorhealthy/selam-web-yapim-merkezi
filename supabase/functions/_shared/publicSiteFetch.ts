const PUBLIC_HOSTS = new Set(["doktorumol.com.tr", "www.doktorumol.com.tr"]);

/** Only the platform's public website is eligible for server-side inspection. */
export function publicSiteUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || !PUBLIC_HOSTS.has(url.hostname) || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("Bu adres için sunucu erişimine izin verilmiyor");
  }
  return url;
}

/** Do not follow redirects; neither initial nor redirected private targets can be fetched. */
export async function fetchPublicSite(value: string, init: RequestInit = {}, http: typeof fetch = fetch): Promise<Response> {
  const url = publicSiteUrl(value);
  const response = await http(url.href, { ...init, redirect: "error", signal: AbortSignal.timeout(10000) });
  if (response.status >= 300 && response.status < 400) throw new Error("Yönlendirmeye izin verilmiyor");
  return response;
}