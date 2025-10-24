
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export interface UserProfile {
  role: UserRole;
  is_approved: boolean;
  name?: string;
  email?: string;
}

export const useUserRole = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserProfile(null);
          setLoading(false);
          return;
        }

        console.log('Current user ID:', user.id);

        // Direct query to avoid RLS issues
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, is_approved, name, email')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('Profile query result:', { profile, error });

        if (error) {
          console.error('Error fetching user profile:', error);
          // Fallback: create a basic profile if none exists
          setUserProfile({ role: 'user', is_approved: false });
        } else if (profile) {
          setUserProfile(profile);
        } else {
          // No profile found, set as basic user
          console.log('No profile found, setting as basic user');
          setUserProfile({ role: 'user', is_approved: false });
        }
      } catch (error) {
        console.error('Error in getCurrentUserProfile:', error);
        setUserProfile({ role: 'user', is_approved: false });
      } finally {
        setLoading(false);
      }
    };

    getCurrentUserProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          getCurrentUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { userProfile, loading };
};
