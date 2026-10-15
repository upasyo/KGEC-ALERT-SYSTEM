import React, { useState } from 'react';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Shield,
  User,
  Palette,
  Volume2,
  VolumeX,
  ExternalLink,
  Flame,
  Check,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemeName } from '../types';
import { pushNotificationService } from '../services/pushNotification';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenCalendar: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  unreadCount: number;
  onOpenNotifCenter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdmin,
  onOpenProfile,
  onOpenCalendar,
  searchQuery,
  setSearchQuery,
  unreadCount,
  onOpenNotifCenter,
}) => {
  const { theme, setTheme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  const themeOptions: { id: ThemeName; name: string; color: string }[] = [
    { id: 'emerald', name: 'KGEC Emerald & Gold', color: 'bg-emerald-600' },
    { id: 'indigo', name: 'Royal Indigo', color: 'bg-indigo-600' },
    { id: 'crimson', name: 'Heritage Crimson', color: 'bg-rose-600' },
    { id: 'amber', name: 'Campus Sunset Amber', color: 'bg-amber-600' },
  ];

  const handleSoundTest = () => {
    if (!isSoundMuted) {
      pushNotificationService.playAlertSound();
    }
    setIsSoundMuted(!isSoundMuted);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xs transition-colors">
      {/* Top institution bar with creator credit */}
      <div className="bg-stone-900 text-stone-200 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Kalyani Government Engineering College
          </span>
          <span className="hidden sm:inline text-stone-500">•</span>
          <span className="hidden sm:inline text-stone-400">Established 1995 • AICTE Approved • MAKAUT Affiliated</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 text-[11px]">
            <span>Web App Created by</span>
            <strong className="text-emerald-300 font-semibold tracking-wide">UPASYO KUSHARI</strong>
          </div>
          <a
            href="https://www.kgec.edu.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-stone-400 hover:text-white transition-colors"
          >
            kgec.edu.in
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${themeConfig.primaryClass} flex items-center justify-center font-bold text-lg sm:text-xl shadow-md tracking-tighter shrink-0`}>
            KG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                KGEC GENERAL ALERT SYSTEM
                <span className="hidden lg:inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Real-Time
                </span>
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
              Official circulars, exam notifications & campus alerts
            </p>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, ref no, exam date, department..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 px-1 py-0.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Calendar View Quick Button */}
          <button
            onClick={onOpenCalendar}
            title="Deadlines Calendar"
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 transition-colors"
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Deadlines</span>
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={handleSoundTest}
            title={isSoundMuted ? 'Unmute alert chime' : 'Mute alert chime'}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Notification Center Trigger */}
          <button
            onClick={onOpenNotifCenter}
            title="Notification Center"
            className="relative p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Theme Palette Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              title="Change Theme Palette"
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Palette className="w-4 h-4" />
            </button>
            {showThemePicker && (
              <div className="absolute right-0 mt-2 w-48 p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl z-50">
                <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 px-2 py-1 uppercase tracking-wider">
                  Campus Theme
                </p>
                <div className="space-y-1">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTheme(opt.id);
                        setShowThemePicker(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-800 dark:text-stone-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${opt.color}`} />
                        <span>{opt.name}</span>
                      </div>
                      {theme === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile / Mobile Login */}
          {isAuthenticated && user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline max-w-[90px] truncate">{user.fullName.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${themeConfig.primaryClass} text-xs font-medium shadow-xs transition-colors`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* CMS Admin Portal Trigger (Clean, no password hint anywhere) */}
          <button
            onClick={onOpenAdmin}
            title="CMS Admin Portal"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Search Input Row */}
      <div className="px-4 pb-2.5 md:hidden">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars, exams, admissions..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 border border-stone-200 dark:border-stone-700 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
