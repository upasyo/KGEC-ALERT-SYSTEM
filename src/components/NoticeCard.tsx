import React, { useState } from 'react';
import {
  FileText,
  Bookmark,
  Calendar,
  Clock,
  Download,
  Share2,
  AlertCircle,
  GraduationCap,
  FileCheck,
  UserPlus,
  Compass,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { Notice, NoticeCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NoticeCardProps {
  notice: Notice;
  onOpenDetail: (notice: Notice) => void;
}

const CATEGORY_STYLES: Record<NoticeCategory, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  academic: {
    label: 'Academic',
    bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: <GraduationCap className="w-3.5 h-3.5" />,
  },
  examination: {
    label: 'Examination',
    bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    icon: <FileCheck className="w-3.5 h-3.5" />,
  },
  admission: {
    label: 'Admission',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: <UserPlus className="w-3.5 h-3.5" />,
  },
  general: {
    label: 'General Notice',
    bg: 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
    text: 'text-stone-700 dark:text-stone-300',
    icon: <Compass className="w-3.5 h-3.5" />,
  },
};

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice, onOpenDetail }) => {
  const { toggleSaveNotice, isNoticeSaved, isNoticeRead } = useAuth();
  const { themeConfig } = useTheme();
  const [copied, setCopied] = useState(false);

  const isSaved = isNoticeSaved(notice.id);
  const isRead = isNoticeRead(notice.id);
  const catStyle = CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.general;

  // Calculate days remaining if deadline exists
  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Deadline Passed', color: 'text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-300' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today!', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-300 animate-pulse font-bold' };
    }
    if (diffDays <= 3) {
      return { text: `${diffDays} days left`, color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 border-amber-300 font-bold' };
    }
    return { text: `Due: ${deadline}`, color: 'text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 border-stone-200' };
  };

  const deadlineStatus = getDeadlineStatus(notice.deadlineDate);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `[KGEC Alert] ${notice.title} (Ref: ${notice.refNumber}) - Check on KGEC General Alert System`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: notice.title,
          text: shareText,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(`${notice.title}\n${notice.refNumber}\n${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article
      onClick={() => onOpenDetail(notice)}
      className={`group relative bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border transition-all duration-200 hover:shadow-lg cursor-pointer ${
        notice.isUrgent
          ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-200 dark:ring-rose-950'
          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
      }`}
    >
      {/* Top Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Category Chip */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${catStyle.bg} ${catStyle.text}`}
          >
            {catStyle.icon}
            {catStyle.label}
          </span>

          {/* Urgent Badge */}
          {notice.isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider animate-pulse">
              <AlertCircle className="w-3 h-3" />
              Urgent
            </span>
          )}

          {/* New update tag */}
          {notice.isNew && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-emerald-500 text-white text-[10px] font-bold">
              NEW
            </span>
          )}

          {/* Department badge */}
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-700">
            {notice.department}
          </span>
        </div>

        {/* Date and Read status */}
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {notice.publishDate}
          </span>
          {!isRead && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Unread Notice" />
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug mb-2">
        {notice.title}
      </h3>

      {/* Excerpt */}
      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 mb-3 leading-relaxed">
        {notice.content}
      </p>

      {/* Reference number and Deadline banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
        <div className="font-mono text-[11px] text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 px-2 py-1 rounded border border-stone-200 dark:border-stone-700/60 truncate max-w-[240px]">
          {notice.refNumber}
        </div>

        {deadlineStatus && (
          <div className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 ${deadlineStatus.color}`}>
            <Calendar className="w-3 h-3" />
            <span>{deadlineStatus.text}</span>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-1.5">
          {/* Bookmark for offline */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveNotice(notice.id);
            }}
            title={isSaved ? 'Remove from offline saved' : 'Save for offline access'}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              isSaved
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-600 text-emerald-600' : ''}`} />
            <span className="text-[11px] hidden sm:inline">{isSaved ? 'Saved Offline' : 'Save'}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            title="Share Alert"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          {/* Attachment download */}
          {notice.attachmentUrl && (
            <a
              href={notice.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Official Circular PDF"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 text-[11px] font-medium transition-colors border border-stone-200 dark:border-stone-700"
            >
              <FileText className="w-3 h-3 text-rose-500" />
              <span>PDF</span>
              <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
            </a>
          )}
        </div>

        <button
          onClick={() => onOpenDetail(notice)}
          className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          View Full Notice
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </article>
  );
};
