import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Notice, UserProfile, SystemBroadcast } from '../types';
import { INITIAL_KGEC_NOTICES, deduplicateNotices } from './kgecScraper';

const NOTICES_COLLECTION = 'notices';
const USERS_COLLECTION = 'users';
const BROADCASTS_COLLECTION = 'broadcasts';

const LOCAL_STORAGE_NOTICES_KEY = 'kgec_cached_notices';
const LOCAL_STORAGE_OFFLINE_SAVED_KEY = 'kgec_offline_saved_notices';
const LOCAL_STORAGE_USER_KEY = 'kgec_user_profile';
const LOCAL_STORAGE_BROADCAST_KEY = 'kgec_system_broadcast';

// Offline cache getters & setters
export function getCachedNotices(): Notice[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTICES_KEY);
    if (raw) {
      const parsed: Notice[] = JSON.parse(raw);
      // Filter out any previous placeholder or simulated items to guarantee 100% authenticity
      const authenticOnly = parsed.filter(
        (n) => n.sourceUrl?.includes('kgec.edu.in/notices') && !n.id.startsWith('kgec-exam-2026')
      );
      if (authenticOnly.length > 0) {
        return authenticOnly;
      }
    }
  } catch (e) {
    console.warn('Error reading local notice cache:', e);
  }
  return INITIAL_KGEC_NOTICES;
}

export function setCachedNotices(notices: Notice[]) {
  try {
    // Only cache genuine notices
    const authentic = notices.filter(
      (n) => !n.id.startsWith('kgec-exam-2026') && !n.id.startsWith('kgec-gen-2026')
    );
    localStorage.setItem(LOCAL_STORAGE_NOTICES_KEY, JSON.stringify(authentic));
  } catch (e) {
    console.warn('Error setting local notice cache:', e);
  }
}

export function getOfflineSavedIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_OFFLINE_SAVED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function setOfflineSavedIds(ids: string[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_OFFLINE_SAVED_KEY, JSON.stringify(ids));
  } catch {
    // fallback
  }
}

/**
 * Initializes notices with authentic KGEC notices
 */
export async function seedNoticesIfEmpty() {
  try {
    const snap = await getDocs(collection(db, NOTICES_COLLECTION));
    // If empty or contains old placeholders, synchronize authentic records
    const existingIds = snap.docs.map((d) => d.id);
    const hasOldData = existingIds.some((id) => id.startsWith('kgec-exam-2026') || id.startsWith('kgec-gen-2026'));

    if (snap.empty || hasOldData) {
      // Clean up old placeholders if any
      if (hasOldData) {
        for (const docSnap of snap.docs) {
          if (docSnap.id.startsWith('kgec-exam-2026') || docSnap.id.startsWith('kgec-gen-2026')) {
            await deleteDoc(doc(db, NOTICES_COLLECTION, docSnap.id)).catch(() => null);
          }
        }
      }

      for (const notice of INITIAL_KGEC_NOTICES) {
        await setDoc(doc(db, NOTICES_COLLECTION, notice.id), {
          title: notice.title,
          category: notice.category,
          refNumber: notice.refNumber,
          department: notice.department,
          publishDate: notice.publishDate,
          deadlineDate: notice.deadlineDate || '',
          content: notice.content,
          attachmentUrl: notice.attachmentUrl || '',
          isUrgent: notice.isUrgent || false,
          sourceUrl: notice.sourceUrl || '',
          createdAt: notice.createdAt,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Notice sync note:', err);
  }
}

/**
 * Subscribes to real-time notices from Firestore with local fallback
 */
export function subscribeToNotices(callback: (notices: Notice[]) => void): () => void {
  // First emit cached or initial notices immediately so user has zero wait time
  const initialCache = getCachedNotices();
  if (initialCache.length > 0) {
    callback(initialCache);
  }

  const q = query(collection(db, NOTICES_COLLECTION), orderBy('publishDate', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        // If empty on remote, attempt seed or emit initial
        seedNoticesIfEmpty();
        callback(INITIAL_KGEC_NOTICES);
        return;
      }

      const notices: Notice[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notices.push({
          id: docSnap.id,
          title: data.title || 'Untitled Circular',
          category: data.category || 'general',
          refNumber: data.refNumber || 'KGEC/NOTICES',
          department: data.department || 'All Departments',
          publishDate: data.publishDate || new Date().toISOString().split('T')[0],
          deadlineDate: data.deadlineDate || undefined,
          content: data.content || '',
          attachmentUrl: data.attachmentUrl || undefined,
          isUrgent: !!data.isUrgent,
          sourceUrl: data.sourceUrl || undefined,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || undefined,
        });
      });

      const unique = deduplicateNotices(notices);
      setCachedNotices(unique);
      callback(unique);
    },
    (error) => {
      console.warn('Firestore onSnapshot notices notice/offline fallback:', error.message);
      // Fallback to local cache gracefully
      callback(getCachedNotices());
      handleFirestoreError(error, OperationType.GET, NOTICES_COLLECTION);
    }
  );

  return unsubscribe;
}

/**
 * Adds a new notice to Firestore
 */
export async function addNoticeToFirestore(notice: Notice): Promise<void> {
  const noticeDocId = notice.id || `kgec-notice-${Date.now()}`;
  try {
    await setDoc(doc(db, NOTICES_COLLECTION, noticeDocId), {
      title: notice.title,
      category: notice.category,
      refNumber: notice.refNumber,
      department: notice.department,
      publishDate: notice.publishDate,
      deadlineDate: notice.deadlineDate || '',
      content: notice.content,
      attachmentUrl: notice.attachmentUrl || '',
      isUrgent: !!notice.isUrgent,
      sourceUrl: notice.sourceUrl || '',
      createdAt: notice.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${NOTICES_COLLECTION}/${noticeDocId}`);
  }
}

/**
 * Updates an existing notice in Firestore
 */
export async function updateNoticeInFirestore(id: string, updates: Partial<Notice>): Promise<void> {
  try {
    const ref = doc(db, NOTICES_COLLECTION, id);
    const existingSnap = await getDoc(ref);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};
    
    await setDoc(
      ref,
      {
        ...existingData,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${NOTICES_COLLECTION}/${id}`);
  }
}

/**
 * Deletes a notice from Firestore
 */
export async function deleteNoticeFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, NOTICES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${NOTICES_COLLECTION}/${id}`);
  }
}

/**
 * Saves/updates a user's details and history indexed by mobile number
 */
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  // Save locally first for instant offline readiness
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
  } catch {}

  const sanitizedPhone = profile.phoneNumber.replace(/[^0-9]/g, '');
  const userDocId = sanitizedPhone || profile.uid || 'guest';

  try {
    await setDoc(
      doc(db, USERS_COLLECTION, userDocId),
      {
        phoneNumber: profile.phoneNumber,
        fullName: profile.fullName,
        department: profile.department,
        year: profile.year,
        rollNumber: profile.rollNumber || '',
        savedNoticeIds: JSON.stringify(profile.savedNoticeIds || []),
        readHistory: JSON.stringify(profile.readHistory || []),
        preferences: JSON.stringify(profile.preferences || {}),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Profile sync to Firestore deferred (offline or permission):', error);
  }
}

/**
 * Fetches user profile by mobile phone number
 */
export async function getUserProfileFromFirestore(phone: string): Promise<UserProfile | null> {
  const sanitizedPhone = phone.replace(/[^0-9]/g, '');
  if (!sanitizedPhone) return null;

  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, sanitizedPhone));
    if (snap.exists()) {
      const data = snap.data();
      let savedIds: string[] = [];
      let readHistory: string[] = [];
      let preferences = {
        general: true,
        academic: true,
        examination: true,
        admission: true,
        pushAlerts: true,
        soundChime: true,
      };

      try {
        if (data.savedNoticeIds) savedIds = JSON.parse(data.savedNoticeIds);
        if (data.readHistory) readHistory = JSON.parse(data.readHistory);
        if (data.preferences) preferences = { ...preferences, ...JSON.parse(data.preferences) };
      } catch {}

      return {
        uid: sanitizedPhone,
        phoneNumber: data.phoneNumber || phone,
        fullName: data.fullName || 'KGEC Student',
        department: data.department || 'CSE',
        year: data.year || '3rd Year',
        rollNumber: data.rollNumber || '',
        savedNoticeIds: savedIds,
        readHistory: readHistory,
        preferences: preferences,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Error fetching profile from Firestore:', err);
  }
  return null;
}

/**
 * Live Campus Broadcast Ticker
 */
export function subscribeToBroadcast(callback: (broadcast: SystemBroadcast | null) => void): () => void {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BROADCAST_KEY);
    if (raw) callback(JSON.parse(raw));
  } catch {}

  const broadcastDoc = doc(db, BROADCASTS_COLLECTION, 'active_ticker');
  const unsubscribe = onSnapshot(
    broadcastDoc,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const broadcast: SystemBroadcast = {
          id: snap.id,
          message: data.message || '',
          isActive: !!data.isActive,
          severity: data.severity || 'info',
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_BROADCAST_KEY, JSON.stringify(broadcast));
        } catch {}
        callback(broadcast);
      } else {
        callback(null);
      }
    },
    () => {
      // quiet fallback
    }
  );

  return unsubscribe;
}

export async function setBroadcastTicker(broadcast: SystemBroadcast): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_BROADCAST_KEY, JSON.stringify(broadcast));
    await setDoc(doc(db, BROADCASTS_COLLECTION, 'active_ticker'), {
      message: broadcast.message,
      isActive: broadcast.isActive,
      severity: broadcast.severity,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${BROADCASTS_COLLECTION}/active_ticker`);
  }
}
