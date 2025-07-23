
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export interface UserProfile {
  role: UserRole;
  is_approved: boolean;
}

export const useUserRole = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUserProfile = async () => {
      try {
        // First get the session to check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('No authenticated user found');
          setUserProfile(null);
          setLoading(false);
          return;
        }

        console.log('Current user ID:', session.user.id);

        // Query user profile with proper error handling
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, is_approved')
          .eq('user_id', session.user.id)
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
          console.log('No profile found for user, setting as basic user');
          setUserProfile({ role: 'user', is_approved: false });
        }
      } catch (error) {
        console.error('Error in getCurrentUserProfile:', error);
        setUserProfile({ role: 'user', is_approved: false });
      } finally {
        setLoading(false);
      }
    };

    // Add initial delay to ensure Supabase has time to restore session
    const timer = setTimeout(() => {
      getCurrentUserProfile();
    }, 100);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setLoading(true);
          await getCurrentUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  return { userProfile, loading };
};
