import React from 'react';
import {
  X,
  Calendar,
  Clock,
  Printer,
  Share2,
  Bookmark,
  FileText,
  Building,
  CheckCircle2,
  ExternalLink,
  Download,
} from 'lucide-react';
import { Notice } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NoticeDetailModalProps {
  notice: Notice | null;
  onClose: () => void;
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({ notice, onClose }) => {
  const { toggleSaveNotice, isNoticeSaved, markNoticeAsRead } = useAuth();
  const { themeConfig } = useTheme();

  if (!notice) return null;

  // Mark as read immediately upon opening
  markNoticeAsRead(notice.id);

  const isSaved = isNoticeSaved(notice.id);

  // Generate iCal (.ics) for deadlines
  const handleExportIcs = () => {
    const deadline = notice.deadlineDate || notice.publishDate;
    const cleanDate = deadline.replace(/-/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KGEC Alert System//Upasyo Kushari//EN',
      'BEGIN:VEVENT',
      `SUMMARY:[KGEC Deadline] ${notice.title}`,
      `DESCRIPTION:Reference: ${notice.refNumber}\\nDepartment: ${notice.department}\\n${notice.content}`,
      `DTSTART;VALUE=DATE:${cleanDate}`,
      `DTEND;VALUE=DATE:${cleanDate}`,
      'LOCATION:Kalyani Government Engineering College, Meghnad Saha Bhawan',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `KGEC_Deadline_${notice.refNumber.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative max-w-2xl w-full max-h-[90vh] bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Official KGEC Circular
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSaveNotice(notice.id)}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isSaved
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-600 text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved Offline' : 'Save'}</span>
            </button>

            <button
              onClick={handlePrint}
              title="Print Circular"
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Circular Body (Printable Academic Style) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Institutional Memorandum Seal */}
          <div className="text-center border-b border-stone-200 dark:border-stone-800 pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-lg mb-2 border border-emerald-200 dark:border-emerald-800">
              KGEC
            </div>
            <h4 className="text-xs uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400">
              Government of West Bengal
            </h4>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              KALYANI GOVERNMENT ENGINEERING COLLEGE
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Meghnad Saha Bhawan, Kalyani, Nadia, West Bengal - 741235
            </p>
          </div>

          {/* Reference & Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
            <div>
              <span className="text-stone-400">MEMO NO: </span>
              <strong className="text-stone-900 dark:text-stone-100">{notice.refNumber}</strong>
            </div>
            <div>
              <span className="text-stone-400">DATE: </span>
              <strong className="text-stone-900 dark:text-stone-100">{notice.publishDate}</strong>
            </div>
          </div>

          {/* Category & Department Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {notice.category}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              Department: {notice.department}
            </span>
            {notice.deadlineDate && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Submission Deadline: {notice.deadlineDate}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {notice.title}
            </h3>
          </div>

          {/* Detailed Content */}
          <div className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line bg-stone-50/50 dark:bg-stone-800/30 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
            {notice.content}
          </div>

          {/* Official Sign-off block */}
          <div className="pt-4 flex justify-end">
            <div className="text-right text-xs">
              <p className="font-semibold text-stone-900 dark:text-stone-100">By Order of the Principal</p>
              <p className="text-stone-500 dark:text-stone-400">Kalyani Government Engineering College</p>
              <p className="text-[11px] text-stone-400 mt-1">Meghnad Saha Bhawan, Kalyani</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {notice.attachmentUrl && (
              <a
                href={notice.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Official PDF</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {notice.deadlineDate && (
              <button
                onClick={handleExportIcs}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-medium hover:bg-amber-200 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Add Deadline to Calendar (.ics)</span>
              </button>
            )}
            
            <a
              href={notice.meetingUrl || 'https://meet.google.com/new'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{notice.meetingUrl ? 'Join Meeting' : 'Start Meeting'}</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
