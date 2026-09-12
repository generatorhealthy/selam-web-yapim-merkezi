import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

const AnalyticsTracker = () => {
  const { user } = useUserRole();
  const lastHeartbeatRef = useRef(0);
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
      if (!user) return;
      
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
  }, [user]);

  const updateLastActive = useCallback(async () => {
    try {
      if (!user || document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastHeartbeatRef.current < HEARTBEAT_INTERVAL_MS) return;
      lastHeartbeatRef.current = now;
      
      const sessionId = getOrCreateSessionId();
      await supabase
        .from('website_analytics')
        .update({ last_active: new Date().toISOString() })
        .eq('session_id', sessionId);
    } catch (error) {
      // Silently fail
    }
  }, [user]);

  useEffect(() => {
    // Track initial page visit
    trackPageVisit();

    // A low-frequency heartbeat is enough. Per-click/scroll writes overloaded
    // the shared database and delayed authentication and panel queries.
    const interval = window.setInterval(() => {
      void updateLastActive();
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void updateLastActive();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [trackPageVisit, updateLastActive]);

  // Track route changes
  useEffect(() => {
    trackPageVisit();
  }, [trackPageVisit]);

  return null; // This component doesn't render anything
};

export default AnalyticsTracker;