
import { useState, useRef } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export const useRateLimit = (config: RateLimitConfig) => {
  const [attempts, setAttempts] = useState<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const isRateLimited = (): boolean => {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Filter out old attempts
    const recentAttempts = attempts.filter(time => time > windowStart);
    
    return recentAttempts.length >= config.maxAttempts;
  };

  const recordAttempt = (): boolean => {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean old attempts
    const recentAttempts = attempts.filter(time => time > windowStart);
    
    if (recentAttempts.length >= config.maxAttempts) {
      return false; // Rate limited
    }
    
    // Add new attempt
    const newAttempts = [...recentAttempts, now];
    setAttempts(newAttempts);
    
    // Clean up after window expires
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setAttempts(prev => prev.filter(time => time > Date.now() - config.windowMs));
    }, config.windowMs);
    
    return true; // Not rate limited
  };

  const reset = () => {
    setAttempts([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return {
    isRateLimited,
    recordAttempt,
    reset,
    remainingAttempts: Math.max(0, config.maxAttempts - attempts.length)
  };
};
