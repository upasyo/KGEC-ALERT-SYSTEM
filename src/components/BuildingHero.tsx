import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  RefreshCw,
  Sparkles,
  MapPin,
  Maximize2,
  X,
  Radio,
  BookmarkCheck,
  ChevronRight,
  Video,
} from 'lucide-react';
import { SystemBroadcast } from '../types';
import { useTheme } from '../context/ThemeContext';
import buildingImage from '../assets/images/kgec_meghnad_saha_1792063140054.jpg';

interface BuildingHeroProps {
  broadcast: SystemBroadcast | null;
  onSyncNotices: () => void;
  isSyncing: boolean;
  onOpenCalendar: () => void;
  onFilterSaved: () => void;
  savedCount: number;
}

export const BuildingHero: React.FC<BuildingHeroProps> = ({
  broadcast,
  onSyncNotices,
  isSyncing,
  onOpenCalendar,
  onFilterSaved,
  savedCount,
}) => {
  const { themeConfig } = useTheme();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  return (
    <div className="relative mb-6">
      {/* Live Campus Emergency Broadcast Marquee / Alert Ticker */}
      {broadcast && broadcast.isActive && (
        <div
          className={`mb-4 px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-3 rounded-2xl shadow-lg border transition-colors overflow-hidden ${
            broadcast.severity === 'critical'
              ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
              : broadcast.severity === 'warning'
              ? 'bg-amber-500 text-stone-950 border-amber-600'
              : 'bg-emerald-700 text-white border-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2 shrink-0 bg-black/20 px-2.5 py-1 rounded-xl">
            <Radio className="w-4 h-4 shrink-0 animate-ping" />
            <span className="uppercase tracking-wider font-extrabold text-[11px]">LIVE BROADCAST:</span>
          </div>
          <div className="flex-1 overflow-hidden whitespace-nowrap relative">
            <div className="inline-block animate-marquee font-medium">
              {broadcast.message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {broadcast.message}
            </div>
          </div>
        </div>
      )}

      {/* Hero Showcase Card */}
      <div className="relative rounded-2xl overflow-hidden bg-stone-900 text-white shadow-xl border border-stone-800">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0">
          <img
            src={buildingImage}
            alt="KGEC Meghnad Saha Bhawan Building"
            className="w-full h-full object-cover object-center opacity-40 hover:opacity-50 transition-opacity duration-700 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-900/40" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 p-5 sm:p-8 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold backdrop-blur-xs">
              <Building2 className="w-3.5 h-3.5" />
              Meghnad Saha Bhawan • Main Academic Campus
            </span>
            <span className="inline-flex items-center gap-1 text-stone-300 text-xs">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Kalyani, Nadia, West Bengal 741235
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            Kalyani Government Engineering College
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed mb-6">
            Official automated alert & circular intelligence system. Stay informed on semester examinations,
            admission counseling, MAKAUT registration deadlines, and academic announcements in real-time.
          </p>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onSyncNotices}
              disabled={isSyncing}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${themeConfig.primaryClass} text-xs font-semibold shadow-md active:scale-95 transition-all`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Checking kgec.edu.in...' : 'Sync Live Notices'}</span>
            </button>

            <button
              onClick={onOpenCalendar}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs border border-white/20 transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Deadlines Calendar</span>
            </button>

            <button
              onClick={onFilterSaved}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs border border-white/20 transition-all"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saved Offline ({savedCount})</span>
            </button>

            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 text-xs font-medium border border-stone-700 transition-all"
            >
              <Maximize2 className="w-3 h-3" />
              <span>View Building</span>
            </button>
            
            <a
              href={broadcast?.meetingUrl || 'https://meet.google.com/new'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium border border-blue-500 transition-all"
            >
              <Video className="w-3 h-3" />
              <span>{broadcast?.meetingUrl ? 'Join Live Class' : 'Start Meeting'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Building Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-stone-900 text-stone-100 rounded-2xl overflow-hidden border border-stone-700 shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Meghnad Saha Bhawan (Main Administrative & Academic Wing)</h3>
                  <p className="text-xs text-stone-400">Kalyani Government Engineering College, West Bengal</p>
                </div>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative max-h-[70vh] overflow-hidden bg-black flex items-center justify-center">
              <img
                src={buildingImage}
                alt="Meghnad Saha Bhawan Campus Building"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            <div className="p-4 bg-stone-950 text-xs text-stone-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-800">
              <p>
                Named after legendary astrophysicist Dr. Meghnad Saha, this building houses the Principal&apos;s
                Chambers, Controller of Examinations (COE) wing, Central Library, and core engineering classrooms.
              </p>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-stone-800 text-white font-medium hover:bg-stone-700 text-xs shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
