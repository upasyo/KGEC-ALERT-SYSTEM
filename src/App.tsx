import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BuildingHero } from './components/BuildingHero';
import { FilterBar, CategoryFilter } from './components/FilterBar';
import { NoticeCard } from './components/NoticeCard';
import { NoticeDetailModal } from './components/NoticeDetailModal';
import { CalendarView } from './components/CalendarView';
import { ProfileModal } from './components/ProfileModal';
import { AdminCMSModal } from './components/AdminCMSModal';
import { LoginGateway } from './components/LoginGateway';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { GeminiChatAssistant } from './components/GeminiChatAssistant';
import { ReloadToast } from './components/ReloadToast';
import { OfflineBanner } from './components/OfflineBanner';
import { Notice, SystemBroadcast } from './types';
import {
  subscribeToNotices,
  subscribeToBroadcast,
  addNoticeToFirestore,
  updateNoticeInFirestore,
  deleteNoticeFromFirestore,
  setBroadcastTicker,
  getCachedNotices,
} from './services/firestoreService';
import { fetchLiveKgecNotices, isDuplicateNotice } from './services/kgecScraper';
import { pushNotificationService } from './services/pushNotification';
import {
  Bell,
  Inbox,
  Sparkles,
  ExternalLink,
  Shield,
  RefreshCw,
  Heart,
  Calendar,
} from 'lucide-react';

function AlertSystemMain() {
  const { user, isAuthenticated, isNoticeSaved } = useAuth();

  // Notices state
  const [notices, setNotices] = useState<Notice[]>(() => getCachedNotices());
  const [broadcast, setBroadcast] = useState<SystemBroadcast | null>(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [filterDeadlines, setFilterDeadlines] = useState(false);
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);
  const [filterMyDeptOnly, setFilterMyDeptOnly] = useState(false);

  // Modals state
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);

  // Sync / New Updates detection state
  const [isSyncing, setIsSyncing] = useState(false);
  const [newUpdatesCount, setNewUpdatesCount] = useState(0);

  // Subscribe to real-time notices from Firestore
  useEffect(() => {
    const unsubscribeNotices = subscribeToNotices((updatedNotices) => {
      setNotices((prev) => {
        // Detect if new notices were added from remote
        if (prev.length > 0 && updatedNotices.length > prev.length) {
          const addedCount = updatedNotices.length - prev.length;
          setNewUpdatesCount(addedCount);
          // Play collegiate chime
          pushNotificationService.playAlertSound();
        }
        return updatedNotices;
      });
    });

    const unsubscribeBroadcast = subscribeToBroadcast((ticker) => {
      setBroadcast(ticker);
    });

    return () => {
      unsubscribeNotices();
      unsubscribeBroadcast();
    };
  }, []);

  // Category counts
  const counts = useMemo(() => {
    return {
      all: notices.length,
      general: notices.filter((n) => n.category === 'general').length,
      academic: notices.filter((n) => n.category === 'academic').length,
      examination: notices.filter((n) => n.category === 'examination').length,
      admission: notices.filter((n) => n.category === 'admission').length,
    };
  }, [notices]);

  // Filtered notices
  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      // Category filter
      if (selectedCategory !== 'all' && notice.category !== selectedCategory) {
        return false;
      }

      // Urgent filter
      if (filterUrgent && !notice.isUrgent) {
        return false;
      }

      // Deadline filter
      if (filterDeadlines && !notice.deadlineDate) {
        return false;
      }

      // Saved offline filter
      if (filterSavedOnly && !isNoticeSaved(notice.id)) {
        return false;
      }

      // My Department filter
      if (filterMyDeptOnly && user?.department) {
        const deptPrefix = user.department.split('(')[1]?.replace(')', '').trim() || user.department;
        const matchesDept =
          notice.department.toLowerCase().includes('all') ||
          notice.department.toLowerCase().includes(deptPrefix.toLowerCase());
        if (!matchesDept) return false;
      }

      // Search query filter (search anything)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          notice.title.toLowerCase().includes(q) ||
          notice.refNumber.toLowerCase().includes(q) ||
          notice.department.toLowerCase().includes(q) ||
          notice.content.toLowerCase().includes(q) ||
          notice.publishDate.toLowerCase().includes(q) ||
          (notice.deadlineDate && notice.deadlineDate.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [
    notices,
    selectedCategory,
    filterUrgent,
    filterDeadlines,
    filterSavedOnly,
    filterMyDeptOnly,
    searchQuery,
    user,
    isNoticeSaved,
  ]);

  // Unread count
  const unreadCount = useMemo(() => {
    if (!user) return notices.slice(0, 3).length;
    return notices.filter((n) => !user.readHistory?.includes(n.id)).length;
  }, [notices, user]);

  // Enforce zero access to the website without logging in with a verified email (after all hooks are called)
  if (!isAuthenticated || !user || !user.emailVerified) {
    return <LoginGateway />;
  }

  // Automated trigger fetch from kgec.edu.in
  const handleSyncNotices = async (): Promise<{ added: number; duplicates: number }> => {
    setIsSyncing(true);
    try {
      const result = await fetchLiveKgecNotices(notices);
      let addedCount = 0;

      for (const item of result.newNotices) {
        if (!isDuplicateNotice(item, notices)) {
          await addNoticeToFirestore(item);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        pushNotificationService.sendPushNotification(
          `KGEC: ${addedCount} New Circulars Synchronized`,
          { body: 'Official notices from kgec.edu.in have been updated.' }
        );
      }

      return { added: addedCount, duplicates: result.duplicateCount };
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      <OfflineBanner />

      {/* Header */}
      <Header
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unreadCount={unreadCount}
        onOpenNotifCenter={() => setIsNotifCenterOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Meghnad Saha Bhawan Building Showcase & Campus Hero */}
        <BuildingHero
          broadcast={broadcast}
          onSyncNotices={handleSyncNotices}
          isSyncing={isSyncing}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onFilterSaved={() => {
            setFilterSavedOnly(!filterSavedOnly);
            setSelectedCategory('all');
          }}
          savedCount={user?.savedNoticeIds.length || 0}
        />

        {/* Tabbed UI & Filter Chip Group */}
        <FilterBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          counts={counts}
          filterUrgent={filterUrgent}
          setFilterUrgent={setFilterUrgent}
          filterDeadlines={filterDeadlines}
          setFilterDeadlines={setFilterDeadlines}
          filterSavedOnly={filterSavedOnly}
          setFilterSavedOnly={setFilterSavedOnly}
          filterMyDeptOnly={filterMyDeptOnly}
          setFilterMyDeptOnly={setFilterMyDeptOnly}
        />

        {/* Notices Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>
                {selectedCategory === 'all'
                  ? 'All Official Circulars'
                  : `${selectedCategory.toUpperCase()} Circulars`}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
                {filteredNotices.length} items
              </span>
            </h3>
            {searchQuery && (
              <p className="text-xs text-stone-500">
                Showing search results matching &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="hidden sm:inline">Real-time sync enabled</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Main Feed: Grid of Notices */}
        {filteredNotices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onOpenDetail={(n) => setSelectedNotice(n)}
              />
            ))}
          </div>
        ) : (
          /* Requirement: "ENSURE ALL NOTIFICATIONS COME ON TIME AND IF NO NEW NOTIFICATION THEN SHOW nO RECENT NOTIFICATION UPDATES" */
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs my-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4 text-stone-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
              No recent notification updates
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
              There are currently no new notifications matching your filter criteria. All circulars are
              synchronized with the official college repository.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setFilterUrgent(false);
                  setFilterDeadlines(false);
                  setFilterSavedOnly(false);
                  setFilterMyDeptOnly(false);
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                Reset All Filters
              </button>
              <button
                onClick={handleSyncNotices}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync kgec.edu.in</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer with Upasyo Kushari Creator Credit */}
      <footer className="mt-12 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 text-xs py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-bold text-stone-900 dark:text-stone-100">
              KGEC GENERAL ALERT SYSTEM
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Kalyani Government Engineering College</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <span>WEB APP IS CREATED BY</span>
            <strong className="font-extrabold tracking-wide">UPASYO KUSHARI</strong>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-500">
            <a
              href="https://www.kgec.edu.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              kgec.edu.in <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="hover:underline flex items-center gap-1"
            >
              <Shield className="w-3 h-3" /> CMS Admin
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Reload Toast when new updates are detected */}
      <ReloadToast
        newCount={newUpdatesCount}
        onReload={() => {
          setNewUpdatesCount(0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDismiss={() => setNewUpdatesCount(0)}
      />

      {/* Notice Detail Modal */}
      <NoticeDetailModal
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />

      {/* Upcoming Deadlines Calendar View */}
      <CalendarView
        notices={notices}
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onSelectNotice={(n) => setSelectedNotice(n)}
      />

      {/* Personalized Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        notices={notices}
        onOpenNotice={(n) => setSelectedNotice(n)}
      />

      {/* CMS Admin Portal */}
      <AdminCMSModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        notices={notices}
        onAddNotice={addNoticeToFirestore}
        onUpdateNotice={updateNoticeInFirestore}
        onDeleteNotice={deleteNoticeFromFirestore}
        onTriggerScrape={handleSyncNotices}
        broadcast={broadcast}
        onSetBroadcast={setBroadcastTicker}
      />

      {/* Notification Center Panel */}
      <NotificationCenterModal
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        notices={notices}
        onOpenNotice={(n) => setSelectedNotice(n)}
      />

      {/* Gemini AI Notice Chat Assistant */}
      <GeminiChatAssistant notices={notices} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AlertSystemMain />
      </AuthProvider>
    </ThemeProvider>
  );
}
