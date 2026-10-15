import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  GraduationCap,
  Bell,
  Volume2,
  Bookmark,
  History,
  CheckCircle2,
  LogOut,
  Sparkles,
  Smartphone,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { pushNotificationService } from '../services/pushNotification';
import { Notice } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  notices: Notice[];
  onOpenNotice: (notice: Notice) => void;
}

const DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication Engineering (ECE)',
  'Mechanical Engineering (ME)',
  'Electrical Engineering (EE)',
  'Master of Computer Applications (MCA)',
  'All Departments / General',
];

const YEARS = [
  '1st Year (Semester 1 & 2)',
  '2nd Year (Semester 3 & 4)',
  '3rd Year (Semester 5 & 6)',
  '4th Year (Semester 7 & 8)',
  'M.Tech / Postgraduate',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  notices,
  onOpenNotice,
}) => {
  const { user, updateProfile, logout, toggleSaveNotice } = useAuth();
  const { themeConfig } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [department, setDepartment] = useState(user?.department || DEPARTMENTS[0]);
  const [year, setYear] = useState(user?.year || YEARS[2]);
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testPushSent, setTestPushSent] = useState(false);

  // Preference switches
  const [prefs, setPrefs] = useState(
    user?.preferences || {
      general: true,
      academic: true,
      examination: true,
      admission: true,
      pushAlerts: true,
      soundChime: true,
    }
  );

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      fullName,
      department,
      year,
      rollNumber,
      preferences: prefs,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestPushNotification = async () => {
    const perm = await pushNotificationService.requestPermission();
    pushNotificationService.sendPushNotification('KGEC Alert System Test', {
      body: `Notification chime test verified for ${user.fullName} (${user.department.split(' ')[0]}).`,
    });
    setTestPushSent(true);
    setTimeout(() => setTestPushSent(false), 3000);
  };

  // Find saved notices
  const savedNoticesList = notices.filter((n) => user.savedNoticeIds.includes(n.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative max-w-2xl w-full max-h-[92vh] bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Student Profile & Alerts</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700">
                  Firebase Synced
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {user.phoneNumber}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Feedback banner */}
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile details and alert preferences updated in Firestore!</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Registered Mobile Number
                </label>
                <input
                  type="text"
                  disabled
                  value={user.phoneNumber}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-stone-500 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Academic Year / Class
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  College Roll No / University Reg No (Optional)
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 10200122045"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Personalized Category Alert Preferences */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                Personalized Alert Subscriptions
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Choose which categories should trigger instant push alerts & sound chimes
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.examination}
                    onChange={(e) => setPrefs({ ...prefs, examination: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-stone-800 dark:text-stone-200">Examination</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.academic}
                    onChange={(e) => setPrefs({ ...prefs, academic: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-stone-800 dark:text-stone-200">Academic</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.admission}
                    onChange={(e) => setPrefs({ ...prefs, admission: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-stone-800 dark:text-stone-200">Admission</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.general}
                    onChange={(e) => setPrefs({ ...prefs, general: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-stone-800 dark:text-stone-200">General</span>
                </label>
              </div>

              {/* Push chime test */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-200 dark:border-stone-700">
                <span className="text-xs text-stone-500">Test browser notifications:</span>
                <button
                  type="button"
                  onClick={handleTestPushNotification}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{testPushSent ? 'Chime Fired!' : 'Test Push Chime'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className={`px-4 py-2 rounded-xl ${themeConfig.primaryClass} text-xs font-semibold shadow-xs flex items-center gap-1.5`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile to Firestore</span>
              </button>
            </div>
          </form>

          {/* Offline Saved Alerts Section */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                Offline Saved Alerts ({savedNoticesList.length})
              </h4>
              <span className="text-[11px] text-stone-400">Available offline without internet</span>
            </div>

            {savedNoticesList.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedNoticesList.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div
                      onClick={() => {
                        onOpenNotice(n);
                        onClose();
                      }}
                      className="cursor-pointer hover:text-emerald-600 flex-1 truncate"
                    >
                      <p className="font-semibold truncate">{n.title}</p>
                      <span className="text-[10px] text-stone-400 font-mono">{n.refNumber}</span>
                    </div>
                    <button
                      onClick={() => toggleSaveNotice(n.id)}
                      className="text-stone-400 hover:text-rose-500 text-xs px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No notices saved for offline reading yet.</p>
            )}
          </div>

          {/* Activity / Read History stats */}
          <div className="flex items-center justify-between text-xs text-stone-500 bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Notices Read in History: <strong>{user.readHistory?.length || 0}</strong>
            </span>
            <span>Mobile ID: {user.uid}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex items-center justify-between">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

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
