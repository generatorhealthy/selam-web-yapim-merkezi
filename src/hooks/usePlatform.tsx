import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'ios' | 'android';

export const usePlatform = () => {
  const initialPlatform = Capacitor.getPlatform() as Platform;
  const initialIsNative = Capacitor.isNativePlatform();

  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [isNative, setIsNative] = useState(initialIsNative);

  useEffect(() => {
    // Re-validate on mount in case environment changes
    setPlatform(Capacitor.getPlatform() as Platform);
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return { platform, isNative };
};
