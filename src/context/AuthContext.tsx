import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import {
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  subscribeToUserProfile,
  getOfflineSavedIds,
  setOfflineSavedIds,
} from '../services/firestoreService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithPhone: (
    phone: string,
    fullName: string,
    department: string,
    year: string,
    rollNumber: string
  ) => Promise<void>;
  logout: () => void;
  toggleSaveNotice: (noticeId: string) => Promise<void>;
  markNoticeAsRead: (noticeId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isNoticeSaved: (noticeId: string) => boolean;
  isNoticeRead: (noticeId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('kgec_user_profile');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Real-time listener for profile changes from Firestore
  useEffect(() => {
    if (user?.phoneNumber) {
      const unsubscribe = subscribeToUserProfile(user.phoneNumber, (remoteProfile) => {
        setUser((prev) => {
          const mergedSaved = Array.from(new Set([...(prev?.savedNoticeIds || []), ...remoteProfile.savedNoticeIds]));
          const mergedHistory = Array.from(new Set([...(prev?.readHistory || []), ...remoteProfile.readHistory]));
          const updated = {
            ...remoteProfile,
            savedNoticeIds: mergedSaved,
            readHistory: mergedHistory,
          };
          localStorage.setItem('kgec_user_profile', JSON.stringify(updated));
          setOfflineSavedIds(mergedSaved);
          return updated;
        });
      });
      return () => unsubscribe();
    }
  }, [user?.phoneNumber]);

  const loginWithPhone = async (
    phone: string,
    fullName: string,
    department: string,
    year: string,
    rollNumber: string
  ) => {
    const sanitized = phone.replace(/[^0-9]/g, '');
    const existing = await getUserProfileFromFirestore(sanitized);

    const offlineSaved = getOfflineSavedIds();

    const profile: UserProfile = {
      uid: sanitized,
      phoneNumber: phone,
      fullName: fullName || existing?.fullName || 'KGEC Scholar',
      department: department || existing?.department || 'Computer Science & Engineering',
      year: year || existing?.year || '3rd Year',
      rollNumber: rollNumber || existing?.rollNumber || '',
      savedNoticeIds: Array.from(new Set([...offlineSaved, ...(existing?.savedNoticeIds || [])])),
      readHistory: existing?.readHistory || [],
      preferences: existing?.preferences || {
        general: true,
        academic: true,
        examination: true,
        admission: true,
        pushAlerts: true,
        soundChime: true,
      },
      lastLoginAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUser(profile);
    localStorage.setItem('kgec_user_profile', JSON.stringify(profile));
    setOfflineSavedIds(profile.savedNoticeIds);
    await saveUserProfileToFirestore(profile);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kgec_user_profile');
  };

  const toggleSaveNotice = async (noticeId: string) => {
    const currentSaved = user ? [...user.savedNoticeIds] : getOfflineSavedIds();
    const index = currentSaved.indexOf(noticeId);
    let newSaved: string[];

    if (index > -1) {
      newSaved = currentSaved.filter((id) => id !== noticeId);
    } else {
      newSaved = [...currentSaved, noticeId];
    }

    setOfflineSavedIds(newSaved);

    if (user) {
      const updatedUser: UserProfile = {
        ...user,
        savedNoticeIds: newSaved,
        updatedAt: new Date().toISOString(),
      };
      setUser(updatedUser);
      localStorage.setItem('kgec_user_profile', JSON.stringify(updatedUser));
      await saveUserProfileToFirestore(updatedUser);
    }
  };

  const markNoticeAsRead = async (noticeId: string) => {
    if (!user) return;
    if (user.readHistory.includes(noticeId)) return;

    const newHistory = [noticeId, ...user.readHistory];
    const updatedUser: UserProfile = {
      ...user,
      readHistory: newHistory,
      updatedAt: new Date().toISOString(),
    };

    setUser(updatedUser);
    localStorage.setItem('kgec_user_profile', JSON.stringify(updatedUser));
    await saveUserProfileToFirestore(updatedUser);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUser(updatedUser);
    localStorage.setItem('kgec_user_profile', JSON.stringify(updatedUser));
    await saveUserProfileToFirestore(updatedUser);
  };

  const isNoticeSaved = (noticeId: string): boolean => {
    if (user) {
      return user.savedNoticeIds.includes(noticeId);
    }
    return getOfflineSavedIds().includes(noticeId);
  };

  const isNoticeRead = (noticeId: string): boolean => {
    return !!user?.readHistory.includes(noticeId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        loginWithPhone,
        logout,
        toggleSaveNotice,
        markNoticeAsRead,
        updateProfile,
        isNoticeSaved,
        isNoticeRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
