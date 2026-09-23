import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const PANEL_ROLES: UserRole[] = ["admin", "staff", "legal", "muhasebe"];

export interface UserProfile {
  role: UserRole;
  is_approved: boolean;
  name?: string;
  email?: string;
}

interface RoleState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

const FALLBACK_PROFILE: UserProfile = { role: "user", is_approved: false };
const CACHE_TTL = 60_000;
const MIN_RETRY_INTERVAL = 2_000;
const PROFILE_REQUEST_TIMEOUT = 15_000;

let state: RoleState = {
  user: null,
  userProfile: null,
  loading: true,
  error: null,
};
let cachedUserId: string | null = null;
let cachedAt = 0;
let lastAttemptAt = 0;
let initialized = false;
let profileRequest: Promise<void> | null = null;
let activeAbort: AbortController | null = null;
const listeners = new Set<() => void>();

const emit = (next: Partial<RoleState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

const withTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Oturum kontrolü zaman aşımına uğradı")), timeoutMs);
  });
  timeoutPromise.catch(() => undefined);

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const getSessionUser = async () => {
  const { data, error } = await withTimeout(supabase.auth.getSession(), 8_000);
  if (error) throw error;
  return data.session?.user ?? null;
};

const timedSignal = (timeoutMs: number, parent?: AbortSignal) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const onParentAbort = () => controller.abort();

  if (parent) {
    if (parent.aborted) controller.abort();
    else parent.addEventListener("abort", onParentAbort);
  }

  return {
    signal: controller.signal,
    release: () => {
      window.clearTimeout(timeoutId);
      parent?.removeEventListener("abort", onParentAbort);
    },
  };
};

const fetchProfile = async (user: User, parentSignal?: AbortSignal): Promise<UserProfile> => {
  const panel = timedSignal(PROFILE_REQUEST_TIMEOUT, parentSignal);

  const { data: panelProfiles, error } = await supabase
    .rpc("get_my_panel_access")
    .abortSignal(panel.signal);

  panel.release();

  if (error) throw error;
  const profile = panelProfiles?.[0];
  if (profile) return profile;

  const patientReq = timedSignal(PROFILE_REQUEST_TIMEOUT, parentSignal);
  const { data: patient, error: patientError } = await supabase
    .from("patient_profiles")
    .select("full_name, email")
    .eq("user_id", user.id)
    .abortSignal(patientReq.signal)
    .maybeSingle();

  patientReq.release();

  if (patientError) throw patientError;
  if (!patient) return FALLBACK_PROFILE;

  return {
    role: "patient",
    is_approved: true,
    name: patient.full_name ?? undefined,
    email: patient.email ?? undefined,
  };
};

const loadRole = async (providedUser?: User | null, force = false) => {
  // Never overlap permission requests. Safari reports aborted or competing
  // cross-origin requests as access-control failures; callers share this one
  // request. A forced reload (kullanıcı "Tekrar Dene") cancels the stuck one
  // first, so the panel can never stay in a permanent loading state.
  if (profileRequest) {
    if (!force) return profileRequest;
    activeAbort?.abort();
    profileRequest = null;
  }

  const abortController = new AbortController();
  activeAbort = abortController;


  const currentRequest = (async () => {
    if (!state.userProfile) emit({ loading: true, error: null });

    try {
      const user = providedUser === undefined ? await getSessionUser() : providedUser;

      if (!user) {
        cachedUserId = null;
        cachedAt = 0;
        emit({ user: null, userProfile: null, loading: false, error: null });
        return;
      }

      if (cachedUserId && cachedUserId !== user.id) {
        cachedUserId = null;
        cachedAt = 0;
        emit({ user, userProfile: null, loading: true, error: null });
      }

      if (!force && state.userProfile && cachedUserId === user.id && Date.now() - cachedAt < CACHE_TTL) {
        emit({ user, loading: false, error: null });
        return;
      }

      // Hızlı hata döngülerini engelle
      if (!force && !state.userProfile && state.error && Date.now() - lastAttemptAt < MIN_RETRY_INTERVAL) {
        return;
      }

      // Çevrimdışı isek deneme
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("İnternet bağlantısı yok");
      }

      lastAttemptAt = Date.now();
      // Do not retry this RPC inside the same load. Safari can leave the first
      // CORS request pending; retries then overlap and amplify the failure.
      const profile = await fetchProfile(user, abortController.signal);

      if (abortController.signal.aborted) return;

      cachedUserId = user.id;
      cachedAt = Date.now();
      emit({ user, userProfile: profile, loading: false, error: null });
    } catch (caught) {
      // A newer forced request replaced this one; let that one report state.
      if (abortController.signal.aborted) return;

      console.error("Yetki bilgileri alınamadı:", caught);

      if (state.userProfile && state.user && cachedUserId === state.user.id) {
        emit({ loading: false, error: null });
        return;
      }

      emit({
        loading: false,
        error: caught instanceof Error ? caught : new Error("Yetki bilgileri alınamadı"),
      });
    }

  })();

  profileRequest = currentRequest;
  
  try {
    await currentRequest;
  } finally {
    if (profileRequest === currentRequest) {
      profileRequest = null;
    }
  }

  return currentRequest;
};

const ensureInitialized = () => {
  if (initialized) return;
  initialized = true;

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session?.user) {
      cachedUserId = null;
      cachedAt = 0;
      emit({ user: null, userProfile: null, loading: false, error: null });
      return;
    }

    window.setTimeout(() => {
      const hasFreshProfile =
        cachedUserId === session.user.id &&
        Boolean(state.userProfile) &&
        Date.now() - cachedAt < CACHE_TTL;

      if (event === "SIGNED_IN" && hasFreshProfile) {
        emit({ user: session.user, loading: false, error: null });
        return;
      }

      void loadRole(session.user, event === "USER_UPDATED");
    }, 0);
  });

  void loadRole();
};

export const primeUserRoleCache = (userId: string, profile: UserProfile, user?: User) => {
  cachedUserId = userId;
  cachedAt = Date.now();
  emit({
    user: user ?? state.user,
    userProfile: profile,
    loading: false,
    error: null,
  });
};

export const useUserRole = () => {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    const listener = () => setSnapshot(state);
    listeners.add(listener);
    ensureInitialized();
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const retry = useCallback(() => {
    cachedAt = 0;
    emit({ loading: !state.userProfile, error: null });
    void loadRole(state.user, true);
  }, []);

  return { ...snapshot, retry };
};
