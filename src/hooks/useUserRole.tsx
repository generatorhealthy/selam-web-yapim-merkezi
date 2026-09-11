import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

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

let state: RoleState = {
  user: null,
  userProfile: null,
  loading: true,
  error: null,
};
let cachedUserId: string | null = null;
let cachedAt = 0;
let initialized = false;
let profileRequest: Promise<void> | null = null;
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

const fetchProfile = async (user: User): Promise<UserProfile> => {
  const { data: profile, error } = await withTimeout(
    supabase
      .from("user_profiles")
      .select("role, is_approved, name, email")
      .eq("user_id", user.id)
      .maybeSingle(),
    8_000,
  );

  if (error) throw error;
  if (profile) return profile;

  const { data: patient, error: patientError } = await withTimeout(
    supabase
      .from("patient_profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .maybeSingle(),
    8_000,
  );

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
  if (profileRequest) return profileRequest;

  profileRequest = (async () => {
    if (!state.userProfile) emit({ loading: true, error: null });

    try {
      const user = providedUser === undefined
        ? (await withTimeout(supabase.auth.getSession(), 5_000)).data.session?.user ?? null
        : providedUser;

      if (!user) {
        cachedUserId = null;
        cachedAt = 0;
        emit({ user: null, userProfile: null, loading: false, error: null });
        return;
      }

      if (!force && state.userProfile && cachedUserId === user.id && Date.now() - cachedAt < CACHE_TTL) {
        emit({ user, loading: false, error: null });
        return;
      }

      const profile = await fetchProfile(user);
      cachedUserId = user.id;
      cachedAt = Date.now();
      emit({ user, userProfile: profile, loading: false, error: null });
    } catch (caught) {
      console.error("Yetki bilgileri alınamadı:", caught);
      emit({
        loading: false,
        error: caught instanceof Error ? caught : new Error("Yetki bilgileri alınamadı"),
      });
    }
  })().finally(() => {
    profileRequest = null;
  });

  return profileRequest;
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

    // Supabase çağrısını auth callback tamamlandıktan sonra başlatmak gerekir;
    // callback içinde sorgu çalıştırmak istemci kilidini bekletebilir.
    window.setTimeout(() => {
      void loadRole(session.user, event === "SIGNED_IN" || event === "USER_UPDATED");
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