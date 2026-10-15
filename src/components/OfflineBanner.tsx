import React, { useState, useEffect } from 'react';
import { WifiOff, BookmarkCheck } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 font-medium">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        You are currently offline. Full offline access is active: all previously loaded circulars & saved alerts are
        available.
      </span>
      <span className="hidden sm:inline-flex items-center gap-1 font-bold text-amber-100">
        <BookmarkCheck className="w-3.5 h-3.5" />
        Offline Storage Enabled
      </span>
    </div>
  );
};
