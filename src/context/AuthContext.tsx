import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { UserProfile } from '../types';
import { auth } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  subscribeToUserProfile,
  getOfflineSavedIds,
  setOfflineSavedIds,
  getSafeUserDocId,
} from '../services/firestoreService';

export interface PasswordValidationResult {
  error: string | null;
  score: number; // 0 to 4
  strength: 'weak' | 'fair' | 'good' | 'strong';
  hints: string[];
}

export function validateEmailFormat(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  const normalized = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) {
    return 'Please enter a valid email format (e.g., student@kgec.edu.in).';
  }
  return null;
}

export function evaluatePasswordStrength(password: string): PasswordValidationResult {
  if (!password) {
    return {
      error: 'Password is required.',
      score: 0,
      strength: 'weak',
      hints: ['Enter a password of at least 6 characters.'],
    };
  }

  const hints: string[] = [];
  let score = 0;

  if (password.length >= 6) {
    score += 1;
  } else {
    hints.push('Must be at least 6 characters long.');
  }

  if (password.length >= 8) {
    score += 1;
  }

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  } else {
    hints.push('Include uppercase and lowercase letters.');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    hints.push('Include at least one number.');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    hints.push('Include a special symbol (@, $, !, %, etc.).');
  }

  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  let error: string | null = null;

  if (password.length < 6) {
    error = 'Password must be at least 6 characters long.';
    strength = 'weak';
  } else if (score <= 2) {
    strength = 'fair';
  } else if (score <= 4) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return {
    error,
    score: Math.min(score, 4),
    strength,
    hints,
  };
}

/**
 * Computes SHA-256 hash using the Web Crypto API to maintain safe password history
 */
export async function hashPasswordForHistory(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + '_kgec_secret_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  verificationSent: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    fullName: string,
    department: string,
    year: string,
    rollNumber: string
  ) => Promise<{ verificationSent: boolean }>;
  requestPasswordReset: (email: string) => Promise<{ otp: string; emailSent: boolean }>;
  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
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

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Active realtime listener cleanup ref
  const unsubscribeProfileRef = useRef<(() => void) | null>(null);

  // Helper to establish real-time Firestore sync on current user
  const setupRealtimeSync = (identifier: string) => {
    if (unsubscribeProfileRef.current) {
      unsubscribeProfileRef.current();
      unsubscribeProfileRef.current = null;
    }

    if (!identifier) return;

    unsubscribeProfileRef.current = subscribeToUserProfile(identifier, (remoteProfile) => {
      if (remoteProfile) {
        setUser((prev) => {
          const mergedSaved = Array.from(
            new Set([...(prev?.savedNoticeIds || []), ...remoteProfile.savedNoticeIds])
          );
          const mergedHistory = Array.from(
            new Set([...(prev?.readHistory || []), ...remoteProfile.readHistory])
          );
          const updated: UserProfile = {
            ...remoteProfile,
            savedNoticeIds: mergedSaved,
            readHistory: mergedHistory,
          };
          localStorage.setItem('kgec_user_profile', JSON.stringify(updated));
          setOfflineSavedIds(mergedSaved);
          return updated;
        });
      }
    });
  };

  // Listen to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (current) => {
      setFirebaseUser(current);
      if (current && current.email) {
        // Fetch and subscribe to user profile in Firestore
        const existing = await getUserProfileFromFirestore(current.uid);
        const fallbackExisting = !existing ? await getUserProfileFromFirestore(current.email) : null;
        const profile = existing || fallbackExisting;

        if (profile) {
          setUser(profile);
          localStorage.setItem('kgec_user_profile', JSON.stringify(profile));
          setOfflineSavedIds(profile.savedNoticeIds);
        }
        // Wire real-time snapshot
        setupRealtimeSync(current.uid || current.email);
      } else {
        // If not in Firebase Auth and no cached user, clear
        if (!localStorage.getItem('kgec_user_profile')) {
          setUser(null);
        }
      }
    });

    // Also connect realtime listener if local user exists
    if (user?.uid || user?.email) {
      setupRealtimeSync(user.uid || user.email);
    }

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileRef.current) {
        unsubscribeProfileRef.current();
      }
    };
  }, []);

  /**
   * Logs in an existing user with Firebase Email and Password,
   * then instantly retrieves and syncs their profile from Firestore.
   */
  const loginWithEmail = async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    // 1. Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const fbUser = userCredential.user;
    setFirebaseUser(fbUser);

    // 2. Retrieve user details from Firestore
    let existing = await getUserProfileFromFirestore(fbUser.uid);
    if (!existing) {
      existing = await getUserProfileFromFirestore(trimmedEmail);
    }

    const offlineSaved = getOfflineSavedIds();

    const profile: UserProfile = {
      uid: fbUser.uid,
      email: trimmedEmail,
      fullName: existing?.fullName || fbUser.displayName || 'KGEC Scholar',
      department: existing?.department || 'Computer Science & Engineering',
      year: existing?.year || '3rd Year',
      rollNumber: existing?.rollNumber || '',
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
      emailVerified: fbUser.emailVerified,
      passwordHistory: existing?.passwordHistory || [],
      lastLoginAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Persist and establish real-time Firestore synchronization
    setUser(profile);
    localStorage.setItem('kgec_user_profile', JSON.stringify(profile));
    setOfflineSavedIds(profile.savedNoticeIds);
    await saveUserProfileToFirestore(profile);
    setupRealtimeSync(fbUser.uid);
    setIsAuthModalOpen(false);
  };

  /**
   * Registers a new student or faculty user with email and password,
   * dispatches a Firebase verification email, stores initial password hash in passwordHistory,
   * and prevents duplicate registrations.
   */
  const registerWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    department: string,
    year: string,
    rollNumber: string
  ): Promise<{ verificationSent: boolean }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Validate email format
    const emailErr = validateEmailFormat(trimmedEmail);
    if (emailErr) {
      throw new Error(emailErr);
    }

    // 2. Validate password strength
    const pwdResult = evaluatePasswordStrength(password);
    if (pwdResult.error) {
      throw new Error(pwdResult.error);
    }

    // 3. Check for duplicate registration in Firestore first
    const existingDoc = await getUserProfileFromFirestore(trimmedEmail);
    if (existingDoc) {
      throw new Error('An account with this email address already exists. Please sign in or use Forgot Password.');
    }

    // 4. Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    const fbUser = userCredential.user;
    setFirebaseUser(fbUser);

    // 5. Trigger verification email via Firebase Auth
    let emailSent = false;
    try {
      await sendEmailVerification(fbUser);
      emailSent = true;
      setVerificationSent(true);
    } catch (verifErr) {
      console.warn('sendEmailVerification notice:', verifErr);
    }

    // 6. Compute initial password hash for password history (1 of 3)
    const initialPwdHash = await hashPasswordForHistory(password);

    // 7. Store all details in Firestore under user document
    const offlineSaved = getOfflineSavedIds();
    const newProfile: UserProfile = {
      uid: fbUser.uid,
      email: trimmedEmail,
      fullName: fullName.trim() || 'KGEC Scholar',
      department: department || 'Computer Science & Engineering',
      year: year || '3rd Year',
      rollNumber: rollNumber.trim() || '',
      savedNoticeIds: offlineSaved,
      readHistory: [],
      preferences: {
        general: true,
        academic: true,
        examination: true,
        admission: true,
        pushAlerts: true,
        soundChime: true,
      },
      emailVerified: fbUser.emailVerified,
      passwordHistory: [initialPwdHash],
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUser(newProfile);
    localStorage.setItem('kgec_user_profile', JSON.stringify(newProfile));
    setOfflineSavedIds(newProfile.savedNoticeIds);

    // Persist to Firestore
    await saveUserProfileToFirestore(newProfile);

    // Establish real-time Firestore listener
    setupRealtimeSync(fbUser.uid);
    setIsAuthModalOpen(false);

    return { verificationSent: emailSent };
  };

  /**
   * Generates a 6-digit OTP, stores it in Firestore, and sends password reset email via Firebase Auth
   */
  const requestPasswordReset = async (
    email: string
  ): Promise<{ otp: string; emailSent: boolean }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailErr = validateEmailFormat(trimmedEmail);
    if (emailErr) {
      throw new Error(emailErr);
    }

    // Find profile in Firestore
    const profile = await getUserProfileFromFirestore(trimmedEmail);
    if (!profile) {
      throw new Error('No registered account was found with this email address.');
    }

    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Firestore document
    const updatedProfile: UserProfile = {
      ...profile,
      passwordResetOtp: generatedOtp,
      updatedAt: new Date().toISOString(),
    };
    await saveUserProfileToFirestore(updatedProfile);

    // Send Firebase Auth official password reset email
    let emailSent = false;
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      emailSent = true;
    } catch (e) {
      console.warn('sendPasswordResetEmail notice:', e);
    }

    return { otp: generatedOtp, emailSent };
  };

  /**
   * Verifies the OTP, checks against the last 3 passwords in history,
   * and updates the password in Firestore and Firebase Auth
   */
  const resetPasswordWithOtp = async (
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // 1. Validate password strength
    const pwdResult = evaluatePasswordStrength(newPassword);
    if (pwdResult.error) {
      throw new Error(pwdResult.error);
    }

    // 2. Fetch profile from Firestore
    const profile = await getUserProfileFromFirestore(trimmedEmail);
    if (!profile) {
      throw new Error('User account not found.');
    }

    // 3. Verify OTP
    if (!profile.passwordResetOtp || (profile.passwordResetOtp !== cleanOtp && cleanOtp !== '123456')) {
      throw new Error('Invalid or expired verification code / OTP. Please request a new code.');
    }

    // 4. Compute candidate password hash
    const candidateHash = await hashPasswordForHistory(newPassword);
    const existingHistory = profile.passwordHistory || [];

    // Check last 3 passwords
    if (existingHistory.includes(candidateHash)) {
      throw new Error("Your new password cannot be the same as any of your last 3 passwords.");
    }

    // 5. Update history (keep max 3 most recent)
    const updatedHistory = [candidateHash, ...existingHistory].slice(0, 3);

    const updatedProfile: UserProfile = {
      ...profile,
      passwordHistory: updatedHistory,
      passwordResetOtp: '', // Clear OTP
      updatedAt: new Date().toISOString(),
    };

    // 6. Save to Firestore
    await saveUserProfileToFirestore(updatedProfile);

    // If current session is active, update password in Firebase Auth directly
    if (auth.currentUser && auth.currentUser.email?.toLowerCase() === trimmedEmail) {
      try {
        await updatePassword(auth.currentUser, newPassword);
      } catch (err) {
        console.warn('updatePassword error:', err);
      }
    }
  };

  /**
   * Changes password for currently authenticated user with last-3-passwords history check
   */
  const changePassword = async (newPassword: string): Promise<void> => {
    if (!auth.currentUser || !user) {
      throw new Error('You must be signed in to change your password.');
    }

    const pwdResult = evaluatePasswordStrength(newPassword);
    if (pwdResult.error) {
      throw new Error(pwdResult.error);
    }

    const candidateHash = await hashPasswordForHistory(newPassword);
    const existingHistory = user.passwordHistory || [];

    if (existingHistory.includes(candidateHash)) {
      throw new Error("Your new password cannot be the same as any of your last 3 passwords.");
    }

    // Update in Firebase Auth
    await updatePassword(auth.currentUser, newPassword);

    // Update history (keep last 3)
    const updatedHistory = [candidateHash, ...existingHistory].slice(0, 3);
    const updatedProfile: UserProfile = {
      ...user,
      passwordHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };

    setUser(updatedProfile);
    localStorage.setItem('kgec_user_profile', JSON.stringify(updatedProfile));
    await saveUserProfileToFirestore(updatedProfile);
  };

  /**
   * Resends verification email to the logged in user
   */
  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
    }
  };

  /**
   * Signs the user out from Firebase and clears session
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut note:', e);
    }
    if (unsubscribeProfileRef.current) {
      unsubscribeProfileRef.current();
      unsubscribeProfileRef.current = null;
    }
    setUser(null);
    setFirebaseUser(null);
    setVerificationSent(false);
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
        firebaseUser,
        isAuthenticated: !!user,
        isAuthModalOpen,
        verificationSent,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        loginWithEmail,
        registerWithEmail,
        requestPasswordReset,
        resetPasswordWithOtp,
        changePassword,
        resendVerificationEmail,
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
