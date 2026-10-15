import React from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { Notice } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notices: Notice[];
  onOpenNotice: (notice: Notice) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notices,
  onOpenNotice,
}) => {
  const { markNoticeAsRead, isNoticeRead } = useAuth();
  const { themeConfig } = useTheme();

  if (!isOpen) return null;

  // Unread or recent notices from last 14 days
  const unreadNotices = notices.filter((n) => !isNoticeRead(n.id));
  const recentNotices = notices.slice(0, 15);

  const handleMarkAllRead = () => {
    unreadNotices.forEach((n) => markNoticeAsRead(n.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative max-w-lg w-full max-h-[85vh] bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden mt-12 sm:mt-0">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Notification Center</span>
                {unreadNotices.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                    {unreadNotices.length} Unread
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Timely alerts & official circular dispatches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {unreadNotices.length > 0 && (
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Unread Alerts</span>
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            </div>
          )}

          {/* List of circular alerts */}
          {recentNotices.length > 0 ? (
            <div className="space-y-2">
              {recentNotices.map((notice) => {
                const isRead = isNoticeRead(notice.id);
                return (
                  <div
                    key={notice.id}
                    onClick={() => {
                      onOpenNotice(notice);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3 ${
                      !isRead
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-2xs'
                        : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="pt-0.5">
                      {!isRead ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700 block" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {notice.category}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">{notice.publishDate}</span>
                        {notice.isUrgent && (
                          <span className="text-[10px] font-bold text-rose-600 animate-pulse">URGENT</span>
                        )}
                      </div>
                      <h5 className="text-xs font-semibold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 line-clamp-2">
                        {notice.title}
                      </h5>
                    </div>

                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          ) : (
            /* Explicit requirement: "IF NO NEW NOTIFICATION THEN SHOW nO RECENT NOTIFICATION UPDATES" */
            <div className="p-8 text-center bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 my-4">
              <Inbox className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h5 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-1">
                No recent notification updates
              </h5>
              <p className="text-xs text-stone-500">
                You are completely up-to-date with all official KGEC circulars and schedules.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium hover:bg-stone-300 dark:hover:bg-stone-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
