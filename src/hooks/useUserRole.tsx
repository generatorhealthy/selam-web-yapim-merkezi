
import { useState, useEffect, useCallback } from "react";
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

const FALLBACK_PROFILE: UserProfile = {
  role: "user",
  is_approved: false,
};

const withTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs = 18_000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Oturum kontrolü zaman aşımına uğradı")), timeoutMs);
  });
  timeoutPromise.catch(() => {});

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

// Oturum boyunca profili hafızada tut: sekme değişiminde / token yenilenmesinde
// panelin tekrar "Yükleniyor" ekranına dönmesini engeller.
let cachedUserId: string | null = null;
let cachedProfile: UserProfile | null = null;
let cachedAt = 0;
let profileRequest: Promise<UserProfile | null> | null = null;
let profileRequestUserId: string | null = null;
const CACHE_TTL = 60_000;

export const primeUserRoleCache = (userId: string, profile: UserProfile) => {
  cachedUserId = userId;
  cachedProfile = profile;
  cachedAt = Date.now();
};

const fetchProfile = async (user: User): Promise<UserProfile | null> => {
  if (profileRequest && profileRequestUserId === user.id) return profileRequest;

  profileRequestUserId = user.id;
  profileRequest = (async () => {
    const { data: profile, error } = await withTimeout(
      supabase
        .from("user_profiles")
        .select("role, is_approved, name, email")
        .eq("user_id", user.id)
        .maybeSingle(),
      8_000
    );

    if (error) throw error;
    if (profile) return profile;

    const { data: patient, error: patientError } = await withTimeout(
      supabase
        .from("patient_profiles")
        .select("id, full_name, email")
        .eq("user_id", user.id)
        .maybeSingle(),
      8_000
    );

    if (patientError) throw patientError;
    if (!patient) return FALLBACK_PROFILE;

    return {
      role: "patient" as UserRole,
      is_approved: true,
      name: patient.full_name ?? undefined,
      email: patient.email ?? undefined,
    };
  })().finally(() => {
    profileRequest = null;
    profileRequestUserId = null;
  });

  return profileRequest;
};

export const useUserRole = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    cachedAt = 0;
    setError(null);
    setLoading(true);
    setRetryCount((value) => value + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    const updateProfileState = (profile: UserProfile | null) => {
      cachedProfile = profile;
      cachedAt = profile ? Date.now() : 0;
      if (mounted) {
        setUserProfile(profile);
      }
    };

    const updateLoadingState = (value: boolean) => {
      if (mounted) {
        setLoading(value);
      }
    };

    const loadUserProfile = async (user?: User | null, force = false) => {
      // Elimizde profil varsa arka planda yenile, ekranı bloklamadan.
      if (!cachedProfile) {
        updateLoadingState(true);
      }

      try {
        const currentUser = user ?? (await withTimeout(supabase.auth.getSession(), 5_000)).data.session?.user ?? null;


        if (!currentUser) {
          cachedUserId = null;
          updateProfileState(null);
          if (mounted) setError(null);
          return;
        }

        if (!force && cachedProfile && cachedUserId === currentUser.id && Date.now() - cachedAt < CACHE_TTL) {
          if (mounted) {
            setUserProfile(cachedProfile);
            setError(null);
          }
          return;
        }

        const profile = await fetchProfile(currentUser);
        cachedUserId = currentUser.id;
        updateProfileState(profile);
        if (mounted) setError(null);
      } catch (error) {
        console.error("Error in loadUserProfile:", error);
        if (mounted && !cachedProfile) {
          setError(error instanceof Error ? error : new Error("Yetki bilgileri alınamadı"));
        }
      } finally {
        updateLoadingState(false);
      }
    };

    void loadUserProfile(undefined, retryCount > 0);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        cachedUserId = null;
        updateProfileState(null);
        setError(null);
        updateLoadingState(false);
        return;
      }

      const forceRefresh = event === "SIGNED_IN" || event === "USER_UPDATED";
      void loadUserProfile(session.user, forceRefresh);
    });


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [retryCount]);

  return { userProfile, loading, error, retry };
};
