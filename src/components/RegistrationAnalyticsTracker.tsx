import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationAnalyticsTrackerProps {
  currentStep: number;
  completed?: boolean;
}

const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_content: params.get('utm_content') || null,
    utm_term: params.get('utm_term') || null,
  };
};

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

const getSessionId = () => {
  let id = sessionStorage.getItem('reg_analytics_session');
  if (!id) {
    id = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('reg_analytics_session', id);
  }
  return id;
};

const getVisitorId = () => {
  let id = localStorage.getItem('reg_visitor_id');
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    localStorage.setItem('reg_visitor_id', id);
  }
  return id;
};

const RegistrationAnalyticsTracker = ({ currentStep, completed = false }: RegistrationAnalyticsTrackerProps) => {
  const sessionId = useRef(getSessionId());
  const startTime = useRef(Date.now());
  const initialized = useRef(false);
  const clickEvents = useRef<any[]>([]);
  const stepTimestamps = useRef<Record<string, string>>({});

  const trackClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const text = target.textContent?.slice(0, 50) || '';
    const tag = target.tagName;
    const className = target.className?.toString().slice(0, 100) || '';
    
    clickEvents.current.push({
      text,
      tag,
      className,
      timestamp: new Date().toISOString(),
      x: e.clientX,
      y: e.clientY,
    });

    // Batch update every 5 clicks
    if (clickEvents.current.length % 5 === 0) {
      updateAnalytics();
    }
  }, []);

  const updateAnalytics = useCallback(async () => {
    try {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      const SUPABASE_URL = 'https://irnfwewabogveofwemvg.supabase.co';
      const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs';
      await fetch(`${SUPABASE_URL}/rest/v1/registration_analytics?session_id=eq.${sessionId.current}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          'x-session-id': sessionId.current,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          current_step: currentStep,
          max_step_reached: currentStep,
          step_timestamps: stepTimestamps.current,
          click_events: clickEvents.current.slice(-50),
          time_on_page: timeOnPage,
          last_activity_at: new Date().toISOString(),
          completed,
        }),
        keepalive: true,
      });
    } catch {}
  }, [currentStep, completed]);

  // Initialize session
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const utm = getUTMParams();
    const init = async () => {
      try {
        await supabase.from('registration_analytics').insert({
          session_id: sessionId.current,
          visitor_id: getVisitorId(),
          referrer: document.referrer || null,
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          utm_content: utm.utm_content,
          utm_term: utm.utm_term,
          landing_url: window.location.href,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          current_step: 1,
          max_step_reached: 1,
          step_timestamps: { '1': new Date().toISOString() },
        });
      } catch {}
    };
    init();

    stepTimestamps.current = { '1': new Date().toISOString() };

    // Click tracking
    document.addEventListener('click', trackClick);

    // Activity updates every 10 seconds
    const interval = setInterval(updateAnalytics, 10000);

    // Track page leave
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      const SUPABASE_URL = 'https://irnfwewabogveofwemvg.supabase.co';
      const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs';
      try {
        fetch(`${SUPABASE_URL}/rest/v1/registration_analytics?session_id=eq.${sessionId.current}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${SUPABASE_ANON}`,
            'x-session-id': sessionId.current,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            time_on_page: timeOnPage,
            left_at: new Date().toISOString(),
            click_events: clickEvents.current.slice(-50),
          }),
          keepalive: true,
        });
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', trackClick);
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateAnalytics();
    };
  }, []);

  // Track step changes
  useEffect(() => {
    stepTimestamps.current[String(currentStep)] = new Date().toISOString();
    updateAnalytics();
  }, [currentStep, updateAnalytics]);

  // Track completion
  useEffect(() => {
    if (completed) {
      updateAnalytics();
    }
  }, [completed, updateAnalytics]);

  return null;
};

export default RegistrationAnalyticsTracker;
