import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'ios' | 'android';

export const usePlatform = () => {
  const [platform, setPlatform] = useState<Platform>('web');
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const currentPlatform = Capacitor.getPlatform() as Platform;
    setPlatform(currentPlatform);
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return { platform, isNative };
};
