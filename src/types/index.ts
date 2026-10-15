export type NoticeCategory = 'general' | 'academic' | 'examination' | 'admission';

export interface Notice {
  id: string;
  title: string;
  category: NoticeCategory;
  refNumber: string;
  department: string; // e.g. "All", "CSE", "ECE", "IT", "ME", "EE", "MCA"
  publishDate: string; // ISO or YYYY-MM-DD
  deadlineDate?: string; // ISO or YYYY-MM-DD
  content: string;
  attachmentUrl?: string;
  isUrgent?: boolean;
  sourceUrl?: string;
  createdAt: string;
  updatedAt?: string;
  isNew?: boolean;
}

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  fullName: string;
  department: string;
  year: string;
  rollNumber: string;
  savedNoticeIds: string[];
  readHistory: string[];
  preferences: {
    general: boolean;
    academic: boolean;
    examination: boolean;
    admission: boolean;
    pushAlerts: boolean;
    soundChime: boolean;
  };
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemBroadcast {
  id?: string;
  message: string;
  isActive: boolean;
  severity: 'info' | 'warning' | 'critical';
  updatedAt: string;
}

export type ThemeName = 'emerald' | 'indigo' | 'crimson' | 'amber';

export interface DeadlineEvent {
  date: string;
  title: string;
  category: NoticeCategory;
  noticeId: string;
  refNumber: string;
  department: string;
}
