import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  FileCheck,
  GraduationCap,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Notice, NoticeCategory } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CalendarViewProps {
  notices: Notice[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNotice: (notice: Notice) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  notices,
  isOpen,
  onClose,
  onSelectNotice,
}) => {
  const { themeConfig } = useTheme();

  // Current viewed month state
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 1)); // October 2026
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Filter only notices with deadlines
  const deadlineNotices = useMemo(() => {
    return notices
      .filter((n) => !!n.deadlineDate)
      .sort((a, b) => (a.deadlineDate! > b.deadlineDate! ? 1 : -1));
  }, [notices]);

  // Map deadlines by date key (YYYY-MM-DD)
  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, Notice[]>();
    for (const n of deadlineNotices) {
      if (n.deadlineDate) {
        const key = n.deadlineDate.trim();
        const existing = map.get(key) || [];
        existing.push(n);
        map.set(key, existing);
      }
    }
    return map;
  }, [deadlineNotices]);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const formatDateKey = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Days array with leading empty cells
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const activeDeadlinesForSelected = selectedDay ? deadlinesByDate.get(selectedDay) || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative max-w-4xl w-full max-h-[92vh] bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                KGEC Academic & Examination Deadlines Calendar
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Track MAKAUT form submissions, fee payment dates, and document verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Calendar Grid Section */}
          <div className="md:col-span-7 bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                {monthNames[month]} {year}
              </h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-400 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
                }

                const dateKey = formatDateKey(day);
                const hasDeadlines = deadlinesByDate.has(dateKey);
                const isSelected = selectedDay === dateKey;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                    className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center p-1 relative text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? `${themeConfig.primaryClass} shadow-md scale-105 z-10`
                        : hasDeadlines
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:scale-105'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-transparent'
                    }`}
                  >
                    <span>{day}</span>
                    {hasDeadlines && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-amber-600 dark:bg-amber-400 animate-pulse'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Date with active deadline</span>
              </div>
              <span>Click any date to filter</span>
            </div>
          </div>

          {/* Deadlines List Section */}
          <div className="md:col-span-5 flex flex-col">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-3 flex items-center justify-between">
              <span>
                {selectedDay ? `Deadlines on ${selectedDay}` : 'All Upcoming Deadlines'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                {selectedDay ? activeDeadlinesForSelected.length : deadlineNotices.length} items
              </span>
            </h4>

            <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
              {(selectedDay ? activeDeadlinesForSelected : deadlineNotices).map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => {
                    onSelectNotice(notice);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {notice.deadlineDate}
                    </span>
                    <span className="font-mono text-stone-400 text-[10px] truncate max-w-[120px]">
                      {notice.refNumber}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 line-clamp-2 mb-1">
                    {notice.title}
                  </h5>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-700/50">
                    <span>{notice.department}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}

              {(selectedDay ? activeDeadlinesForSelected : deadlineNotices).length === 0 && (
                <div className="p-8 text-center bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
                  <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                  <p className="text-xs text-stone-500 font-medium">No deadlines recorded for this date</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
