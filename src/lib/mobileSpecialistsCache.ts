const PUBLIC_SPECIALISTS_CACHE_KEY = "mobile-public-specialists-cache-v1";
const PUBLIC_SPECIALISTS_TTL = 1000 * 60 * 5;

type CacheShape<T> = {
  timestamp: number;
  data: T[];
};

export interface CachedPublicSpecialist {
  id: string;
  name: string;
  specialty: string;
  city: string | null;
  experience: number | null;
  rating: number | null;
  profile_picture: string | null;
  bio: string | null;
  online_consultation: boolean | null;
  face_to_face_consultation: boolean | null;
  slug?: string | null;
  reviews_count?: number | null;
}

let memoryCache: CacheShape<CachedPublicSpecialist> | null = null;

const readSessionCache = (): CacheShape<CachedPublicSpecialist> | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(PUBLIC_SPECIALISTS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheShape<CachedPublicSpecialist>;
    if (!Array.isArray(parsed?.data) || typeof parsed?.timestamp !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const getCache = (): CacheShape<CachedPublicSpecialist> | null => {
  if (memoryCache) return memoryCache;
  const sessionCache = readSessionCache();
  if (sessionCache) memoryCache = sessionCache;
  return sessionCache;
};

export const isPublicSpecialistsCacheStale = () => {
  const cache = getCache();
  if (!cache) return true;
  return Date.now() - cache.timestamp > PUBLIC_SPECIALISTS_TTL;
};

export const getCachedPublicSpecialists = () => getCache()?.data ?? null;

export const setCachedPublicSpecialists = (data: CachedPublicSpecialist[]) => {
  const next: CacheShape<CachedPublicSpecialist> = {
    timestamp: Date.now(),
    data,
  };

  memoryCache = next;

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(PUBLIC_SPECIALISTS_CACHE_KEY, JSON.stringify(next));
    } catch {
      // ignore session cache write failures
    }
  }
};

export const shuffleItems = <T,>(items: T[]) => {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
};

export const pickRandomItems = <T,>(items: T[], count: number) =>
  shuffleItems(items).slice(0, count);