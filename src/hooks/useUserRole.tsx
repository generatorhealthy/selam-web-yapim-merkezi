
import { useState, useEffect, useRef } from "react";
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

export const useUserRole = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const updateProfileState = (profile: UserProfile | null) => {
      if (mounted) {
        setUserProfile(profile);
      }
    };

    const updateLoadingState = (value: boolean) => {
      if (mounted) {
        setLoading(value);
      }
    };

    const loadUserProfile = async (user?: User | null) => {
      updateLoadingState(true);

      try {
        const currentUser = user ?? (await supabase.auth.getSession()).data.session?.user ?? null;

        if (!currentUser) {
          lastLoadedUserIdRef.current = null;
          updateProfileState(null);
          return;
        }

        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("role, is_approved, name, email")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user profile:", error);
          updateProfileState(FALLBACK_PROFILE);
          return;
        }

        if (profile) {
          lastLoadedUserIdRef.current = currentUser.id;
          updateProfileState(profile);
          return;
        }

        // No user_profile row → check if this is a patient
        const { data: patient } = await supabase
          .from("patient_profiles")
          .select("id, full_name, email")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        lastLoadedUserIdRef.current = currentUser.id;
        if (patient) {
          updateProfileState({
            role: "patient" as UserRole,
            is_approved: true,
            name: patient.full_name ?? undefined,
            email: patient.email ?? undefined,
          });
        } else {
          updateProfileState(FALLBACK_PROFILE);
        }
      } catch (error) {
        console.error("Error in loadUserProfile:", error);
        updateProfileState(FALLBACK_PROFILE);
      } finally {
        updateLoadingState(false);
      }
    };

    void loadUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        lastLoadedUserIdRef.current = null;
        updateProfileState(null);
        updateLoadingState(false);
        return;
      }

      if (event === "TOKEN_REFRESHED" && lastLoadedUserIdRef.current === session.user.id) {
        return;
      }

      void loadUserProfile(session.user);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { userProfile, loading };
};
