import React from 'react';
import {
  Layers,
  GraduationCap,
  FileCheck,
  UserPlus,
  Compass,
  AlertCircle,
  Calendar,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { NoticeCategory } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export type CategoryFilter = 'all' | NoticeCategory;

interface FilterBarProps {
  selectedCategory: CategoryFilter;
  onSelectCategory: (cat: CategoryFilter) => void;
  counts: {
    all: number;
    general: number;
    academic: number;
    examination: number;
    admission: number;
  };
  filterUrgent: boolean;
  setFilterUrgent: (val: boolean) => void;
  filterDeadlines: boolean;
  setFilterDeadlines: (val: boolean) => void;
  filterSavedOnly: boolean;
  setFilterSavedOnly: (val: boolean) => void;
  filterMyDeptOnly: boolean;
  setFilterMyDeptOnly: (val: boolean) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  counts,
  filterUrgent,
  setFilterUrgent,
  filterDeadlines,
  setFilterDeadlines,
  filterSavedOnly,
  setFilterSavedOnly,
  filterMyDeptOnly,
  setFilterMyDeptOnly,
}) => {
  const { themeConfig } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const tabs: { id: CategoryFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All Notices', icon: <Layers className="w-3.5 h-3.5" />, count: counts.all },
    { id: 'general', label: 'General', icon: <Compass className="w-3.5 h-3.5" />, count: counts.general },
    { id: 'academic', label: 'Academic', icon: <GraduationCap className="w-3.5 h-3.5" />, count: counts.academic },
    { id: 'examination', label: 'Examination', icon: <FileCheck className="w-3.5 h-3.5" />, count: counts.examination },
    { id: 'admission', label: 'Admission', icon: <UserPlus className="w-3.5 h-3.5" />, count: counts.admission },
  ];

  return (
    <div className="space-y-3 mb-6">
      {/* Primary Category Tab Group */}
      <div className="bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
          {tabs.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onSelectCategory(tab.id);
                  if (filterSavedOnly) setFilterSavedOnly(false);
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? `${themeConfig.primaryClass} shadow-xs scale-100`
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Fast Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider pl-1 shrink-0">
          Filters:
        </span>

        {/* Urgent Alerts Chip */}
        <button
          onClick={() => setFilterUrgent(!filterUrgent)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
            filterUrgent
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-semibold'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-300'
          }`}
        >
          <AlertCircle className={`w-3.5 h-3.5 ${filterUrgent ? 'text-rose-600' : 'text-stone-400'}`} />
          <span>Urgent Only</span>
        </button>

        {/* Has Deadline Chip */}
        <button
          onClick={() => setFilterDeadlines(!filterDeadlines)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
            filterDeadlines
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-semibold'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-300'
          }`}
        >
          <Calendar className={`w-3.5 h-3.5 ${filterDeadlines ? 'text-amber-600' : 'text-stone-400'}`} />
          <span>Active Deadlines</span>
        </button>

        {/* Saved / Offline Alerts Chip */}
        <button
          onClick={() => setFilterSavedOnly(!filterSavedOnly)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
            filterSavedOnly
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-semibold'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-300'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${filterSavedOnly ? 'text-emerald-600 fill-emerald-600' : 'text-stone-400'}`} />
          <span>Saved Offline</span>
        </button>

        {/* Personalized "My Department" Filter Chip */}
        {isAuthenticated && user?.department && (
          <button
            onClick={() => setFilterMyDeptOnly(!filterMyDeptOnly)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
              filterMyDeptOnly
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300 font-semibold'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>My Dept ({user.department.split(' ')[0]})</span>
          </button>
        )}
      </div>
    </div>
  );
};
