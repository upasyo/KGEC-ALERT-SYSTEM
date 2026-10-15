import React from 'react';
import { RefreshCw, Bell, ArrowUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ReloadToastProps {
  newCount: number;
  onReload: () => void;
  onDismiss: () => void;
}

export const ReloadToast: React.FC<ReloadToastProps> = ({ newCount, onReload, onDismiss }) => {
  const { themeConfig } = useTheme();

  if (newCount <= 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-stone-900 text-white shadow-2xl border border-stone-700 backdrop-blur-md">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
        <span className="text-xs font-semibold">
          {newCount === 1 ? '1 new KGEC update detected!' : `${newCount} new KGEC updates detected!`}
        </span>
        <button
          onClick={onReload}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl ${themeConfig.primaryClass} text-xs font-bold shadow-xs active:scale-95 transition-transform`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Feed</span>
        </button>
        <button
          onClick={onDismiss}
          className="text-stone-400 hover:text-white text-xs px-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
