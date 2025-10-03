import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AnalyticsTracker = () => {
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getOrCreateSessionId = () => {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  };

  const trackPageVisit = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // Skip analytics if not authenticated
      
      const sessionId = getOrCreateSessionId();
      const pageUrl = window.location.pathname + window.location.search;
      const referrer = document.referrer || null;
      const userAgent = navigator.userAgent;

      await supabase
        .from('website_analytics')
        .upsert({
          session_id: sessionId,
          page_url: pageUrl,
          referrer: referrer,
          user_agent: userAgent,
          last_active: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        });
    } catch (error) {
      // Silently fail - don't log to console for better performance
    }
  }, []);

  const updateLastActive = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const sessionId = getOrCreateSessionId();
      await supabase
        .from('website_analytics')
        .update({ last_active: new Date().toISOString() })
        .eq('session_id', sessionId);
    } catch (error) {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    // Track initial page visit
    trackPageVisit();

    // Update last_active every 15 seconds
    const interval = setInterval(updateLastActive, 15000);

    // Track when user becomes active again (after being idle)
    const handleActivity = () => {
      updateLastActive();
    };

    // Listen for user activity
    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [trackPageVisit, updateLastActive]);

  // Track route changes
  useEffect(() => {
    trackPageVisit();
  }, [window.location.pathname, trackPageVisit]);

  return null; // This component doesn't render anything
};

export default AnalyticsTracker;