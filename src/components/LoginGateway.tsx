import React, { useState } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Sun,
  Moon,
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Send,
  Building2,
  KeyRound,
  User,
  ArrowLeft,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import {
  useAuth,
  validateEmailFormat,
  evaluatePasswordStrength,
} from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import buildingImage from '../assets/images/kgec_meghnad_saha_1792063140054.jpg';

const DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication Engineering (ECE)',
  'Mechanical Engineering (ME)',
  'Electrical Engineering (EE)',
  'Master of Computer Applications (MCA)',
  'All Departments / General Faculty',
];

const YEARS = [
  '1st Year (Semester 1 & 2)',
  '2nd Year (Semester 3 & 4)',
  '3rd Year (Semester 5 & 6)',
  '4th Year (Semester 7 & 8)',
  'M.Tech / Postgraduate',
  'Faculty / Administration Staff',
];

export const LoginGateway: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    requestPasswordReset,
    resetPasswordWithOtp,
    resendVerificationEmail,
  } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Mode: 'login' | 'register' | 'forgot_request' | 'forgot_verify' | 'awaiting_verification'
  const [mode, setMode] = useState<
    'login' | 'register' | 'forgot_request' | 'forgot_verify' | 'awaiting_verification'
  >('login');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [previewOtpCode, setPreviewOtpCode] = useState<string | null>(null);

  // Registration profile fields
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [year, setYear] = useState(YEARS[2]);
  const [rollNumber, setRollNumber] = useState('');

  // UI status
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isUnverifiedEmailError, setIsUnverifiedEmailError] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccessMsg, setResendSuccessMsg] = useState<string | null>(null);

  // Live validation
  const emailError = email.length > 0 ? validateEmailFormat(email) : null;
  const passwordEval = evaluatePasswordStrength(password);
  const newPasswordEval = evaluatePasswordStrength(newPassword);

  const mapFirebaseError = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/unverified-email':
        return error?.message || 'Email verification required. Please verify your email before logging in.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please log in or use Forgot Password.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password. Please verify your credentials or register an account.';
      case 'auth/invalid-email':
        return 'The email format entered is invalid.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Access is temporarily restricted. Please try again shortly.';
      case 'auth/network-request-failed':
        return 'Unable to reach Firebase backend. Please check your internet connection.';
      default:
        return error?.message || 'Authentication operation failed. Please check inputs and retry.';
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendSuccessMsg(null);
    setErrorMsg('');
    try {
      await resendVerificationEmail(email, password);
      setResendSuccessMsg(`Fresh verification link has been sent to ${email}. Check your inbox!`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend verification email. Please ensure your email and password are provided.');
    } finally {
      setIsResending(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsUnverifiedEmailError(false);
    setResendSuccessMsg(null);

    // Pre-flight client-side validation
    const mailCheck = validateEmailFormat(email);
    if (mailCheck) {
      setErrorMsg(mailCheck);
      return;
    }

    if (mode === 'register') {
      if (passwordEval.error) {
        setErrorMsg(passwordEval.error);
        return;
      }
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name for student verification.');
        return;
      }
    } else if (mode === 'login') {
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        setSyncStatus('Verifying credentials & checking email verification status...');
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        setSyncStatus('Registering account & dispatching Firebase email verification...');
        const result = await registerWithEmail(
          email,
          password,
          fullName,
          department,
          year,
          rollNumber
        );

        // Account is registered and verification email sent.
        // The site will NOT open until verified.
        setMode('awaiting_verification');
        setInfoMsg(`A verification link was dispatched via Firebase to ${email}. Check your inbox!`);
      }
    } catch (err: any) {
      console.warn('Auth Gateway error:', err);
      if (err?.code === 'auth/unverified-email') {
        setIsUnverifiedEmailError(true);
        setErrorMsg(err.message);
      } else {
        setIsUnverifiedEmailError(false);
        setErrorMsg(mapFirebaseError(err));
      }
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const mailCheck = validateEmailFormat(email);
    if (mailCheck) {
      setErrorMsg(mailCheck);
      return;
    }

    setIsLoading(true);
    setSyncStatus('Generating OTP & triggering password reset email via Firebase...');

    try {
      const res = await requestPasswordReset(email);
      setPreviewOtpCode(res.otp);
      setInfoMsg(
        `Password reset OTP dispatched to ${email}. Check your inbox, or enter the code below to reset.`
      );
      setMode('forgot_verify');
    } catch (err: any) {
      setErrorMsg(mapFirebaseError(err));
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  const handleVerifyOtpAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!resetOtp.trim()) {
      setErrorMsg('Please enter the 6-digit OTP received in your email.');
      return;
    }

    if (newPasswordEval.error) {
      setErrorMsg(newPasswordEval.error);
      return;
    }

    setIsLoading(true);
    setSyncStatus('Verifying OTP, checking password history & updating Firestore...');

    try {
      await resetPasswordWithOtp(email, resetOtp, newPassword);
      setInfoMsg('Password updated successfully! You can now sign in with your new password.');
      setPassword(newPassword);
      setMode('login');
    } catch (err: any) {
      setErrorMsg(mapFirebaseError(err));
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  const getStrengthBarColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'bg-rose-500';
      case 'fair':
        return 'bg-amber-500';
      case 'good':
        return 'bg-blue-500';
      case 'strong':
        return 'bg-emerald-500';
      default:
        return 'bg-stone-300';
    }
  };

  const getStrengthTextColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'text-rose-600';
      case 'fair':
        return 'text-amber-600';
      case 'good':
        return 'text-blue-600';
      case 'strong':
        return 'text-emerald-600';
      default:
        return 'text-stone-500';
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between relative overflow-hidden transition-colors">
      {/* Background Architectural Canvas with Visible Building */}
      <div className="absolute inset-0 z-0">
        <img
          src={buildingImage}
          alt="Meghnad Saha Bhawan, KGEC"
          className="w-full h-full object-cover opacity-35 filter contrast-105 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-white/80 to-white/95 dark:from-stone-950 dark:via-stone-950/80 dark:to-stone-900/90" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 p-4 sm:p-6 border-b border-stone-200/80 dark:border-stone-800/80 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md flex items-center justify-between max-w-7xl mx-auto w-full shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-md tracking-tighter">
            KG
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
              KGEC GENERAL ALERT SYSTEM
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Access Gateway
              </span>
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Kalyani Government Engineering College • Official Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs shadow-2xs">
            <span className="text-stone-500 dark:text-stone-400">Created by</span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-bold">UPASYO KUSHARI</strong>
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors border border-stone-300 dark:border-stone-700 shadow-2xs"
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-stone-700" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="max-w-md w-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-6 sm:p-8 relative">
          
          {/* Top Visual Indeterminate Progress Bar during Auth & Registration */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-100 dark:bg-emerald-950/80 overflow-hidden z-30">
              <div className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full animate-indeterminate" />
            </div>
          )}

          {/* Header Badge */}
          <div className="text-center mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs border transition-colors ${
              mode === 'awaiting_verification'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
            }`}>
              {mode === 'awaiting_verification' ? <Mail className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight mb-1">
              {mode === 'login'
                ? 'Portal Account Login'
                : mode === 'register'
                ? 'Student & Faculty Registration'
                : mode === 'awaiting_verification'
                ? 'Verify Email to Unlock Portal'
                : 'Reset Forgotten Password'}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
              {mode === 'login'
                ? 'Sign in with your verified email and password to access official circulars.'
                : mode === 'register'
                ? 'Register with your college email. Email verification through Firebase is required.'
                : mode === 'awaiting_verification'
                ? 'A verification link has been sent to your email. You must verify your email before logging in.'
                : 'Enter your registered email to receive a password reset OTP and email.'}
            </p>
          </div>

          {/* Mode Switcher Tabs (For Login & Register) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex rounded-2xl bg-stone-100 dark:bg-stone-800 p-1 mb-5 border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                  setIsUnverifiedEmailError(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setInfoMsg('');
                  setIsUnverifiedEmailError(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                New Registration
              </button>
            </div>
          )}

          {/* Feedback & Sync Status with Visual Spinner and Progress Feedback */}
          {errorMsg && (
            <div
              className={`mb-4 p-3.5 rounded-2xl border text-xs flex flex-col gap-2.5 animate-in fade-in ${
                isUnverifiedEmailError
                  ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isUnverifiedEmailError ? 'text-amber-600' : 'text-rose-600'
                  }`}
                />
                <div className="flex-1">
                  {isUnverifiedEmailError && (
                    <strong className="block text-amber-950 dark:text-amber-100 font-bold mb-0.5 uppercase tracking-wider text-[11px]">
                      Access Restricted: Email Unverified
                    </strong>
                  )}
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              </div>

              {isUnverifiedEmailError && (
                <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/80 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResendVerification}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend Verification Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleAuthSubmit(e)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-[11px] shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Check Verification & Log In</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {resendSuccessMsg && (
                <div className="p-2 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-[11px] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{resendSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          {syncStatus && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold flex-1 leading-snug">{syncStatus}</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full bg-emerald-200/60 dark:bg-emerald-900/60 rounded-full overflow-hidden relative">
                <div className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full animate-indeterminate" />
              </div>
            </div>
          )}

          {/* MODE 1 & 2: SIGN IN & REGISTRATION */}
          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {/* Email with Live Validation Indicator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Email Address *
                  </label>
                  {email.length > 0 && (
                    <span className={`text-[10px] font-medium ${emailError ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {emailError ? 'Invalid format' : 'Valid email format'}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-stone-400" />
                  <input
                    type="email"
                    required
                    autoFocus={mode === 'login'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@kgec.edu.in"
                    className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 transition-all ${
                      emailError && email.length > 0
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-stone-300 dark:border-stone-700 focus:ring-emerald-600'
                    }`}
                  />
                </div>
                {emailError && email.length > 0 && (
                  <p className="text-[11px] text-rose-600 mt-1">{emailError}</p>
                )}
              </div>

              {/* Password with Strength Evaluation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Password *
                  </label>
                  {mode === 'register' && password.length > 0 && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getStrengthTextColor(passwordEval.strength)}`}>
                      Strength: {passwordEval.strength}
                    </span>
                  )}
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_request');
                        setErrorMsg('');
                        setInfoMsg('');
                      }}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 absolute left-3.5 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Real-time Password Strength Meter Bar (Register Mode) */}
                {mode === 'register' && password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          password.length >= 6 ? getStrengthBarColor(passwordEval.strength) : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(20, (passwordEval.score / 4) * 100)}%` }}
                      />
                    </div>
                    {passwordEval.hints.length > 0 && (
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">
                        Tip: {passwordEval.hints[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Registration Additional Profile Setup */}
              {mode === 'register' && (
                <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 absolute left-3.5 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Sourav Mukherjee"
                        className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Department *
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
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
                      Academic Year / Designation *
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      College Roll No / University Reg No (Optional)
                    </label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 10200122045"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (mode === 'register' && (!!emailError || password.length < 6))}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-extrabold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>
                      {mode === 'login'
                        ? 'Signing In with Firebase...'
                        : 'Registering & Syncing to Firestore...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'login'
                        ? 'Sign In & Access Portal'
                        : 'Register & Send Verification'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: AWAITING EMAIL VERIFICATION */}
          {mode === 'awaiting_verification' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Verification Email Dispatched
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                  Firebase has dispatched a verification email to:
                </p>
                <div className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800 font-mono text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                  <span className="truncate">{email}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold shrink-0">
                    Pending
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-100/60 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                  <strong className="block font-bold">Campus Security Gate:</strong>
                  <p className="leading-relaxed">
                    Without verifying your email through Firebase, you cannot log in and the site will not open for you. Click the verification link in your email to activate access.
                  </p>
                </div>
              </div>

              {resendSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resendSuccessMsg}</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setInfoMsg('Enter your password to sign in once you have verified your email.');
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>I Have Verified — Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendVerification}
                  className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Resend Verification Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="w-full py-2 text-center text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                >
                  Need to change registration details?
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: FORGOT PASSWORD - STEP 1 REQUEST OTP */}
          {mode === 'forgot_request' && (
            <form onSubmit={handleRequestPasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Enter Your Registered Email *
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-stone-400" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@kgec.edu.in"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="w-1/3 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Dispatching OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset OTP</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: FORGOT PASSWORD - STEP 2 VERIFY OTP & ENTER NEW PASSWORD */}
          {mode === 'forgot_verify' && (
            <form onSubmit={handleVerifyOtpAndResetPassword} className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Resetting password for:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('forgot_request')}
                    className="text-[11px] underline text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  >
                    Change
                  </button>
                </div>
                <p className="font-mono text-emerald-800 dark:text-emerald-300 text-[11px] truncate">{email}</p>
                {previewOtpCode && (
                  <div className="mt-2 pt-1 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <span className="text-[11px] text-stone-600 dark:text-stone-400">Preview OTP:</span>
                    <button
                      type="button"
                      onClick={() => setResetOtp(previewOtpCode)}
                      className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                    >
                      {previewOtpCode} (Click to auto-fill)
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Enter 6-Digit Reset OTP *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••••"
                  className="w-full px-4 py-2.5 text-center text-lg font-mono tracking-widest rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    New Password *
                  </label>
                  {newPassword.length > 0 && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getStrengthTextColor(newPasswordEval.strength)}`}>
                      Strength: {newPasswordEval.strength}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 absolute left-3.5 text-stone-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Real-time Password Strength Meter Bar */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          newPassword.length >= 6 ? getStrengthBarColor(newPasswordEval.strength) : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(20, (newPasswordEval.score / 4) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  Enforced security rule: New password cannot be the same as any of your last 3 passwords.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('forgot_request')}
                  className="w-1/3 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !resetOtp || newPassword.length < 6}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Validating & Updating...</span>
                    </>
                  ) : (
                    <>
                      <span>Change Password</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footnote on Firestore synchronization */}
          <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 text-center text-[11px] text-stone-500 dark:text-stone-400">
            Firebase Auth Secured • Real-time Firestore onSync Listener Active
          </div>
        </div>
      </main>

      {/* Footer Attribution */}
      <footer className="relative z-10 p-4 text-center text-xs text-stone-600 dark:text-stone-400 border-t border-stone-200/80 dark:border-stone-800/80 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        <span>Kalyani Government Engineering College • Official Alert System</span>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px]">
          <span>WEB APP IS CREATED BY</span>
          <strong className="font-extrabold tracking-wide">UPASYO KUSHARI</strong>
        </div>
      </footer>
    </div>
  );
};
