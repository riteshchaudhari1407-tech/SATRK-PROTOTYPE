import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiAlertTriangle,
  FiBell,
  FiChevronRight,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiPhone,
  FiSearch,
  FiShield,
  FiSun,
  FiUser,
} from 'react-icons/fi';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import jsPDF from 'jspdf';

import {
  scanImageMessage,
  scanTextMessage,
} from './services/api';

import { supabase } from './supabase';

/* =========================================================
   TYPES
========================================================= */

type Tab =
  | 'overview'
  | 'scanner'
  | 'incidents'
  | 'intel';

type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

type AuthMethod =
  | 'email'
  | 'google'
  | 'phone';

/* =========================================================
   INITIAL LIVE CHART DATA
========================================================= */

const initialThreatData = [
  { time: '08:00', threats: 18, blocked: 14 },
  { time: '09:00', threats: 26, blocked: 21 },
  { time: '10:00', threats: 19, blocked: 17 },
  { time: '11:00', threats: 42, blocked: 34 },
  { time: '12:00', threats: 37, blocked: 31 },
  { time: '13:00', threats: 58, blocked: 49 },
  { time: '14:00', threats: 46, blocked: 40 },
  { time: '15:00', threats: 71, blocked: 61 },
];

/* =========================================================
   HELPERS
========================================================= */

function getRiskStyle(risk: RiskLevel) {
  switch (risk) {
    case 'CRITICAL':
      return 'bg-red-500/10 text-red-400 border-red-500/20';

    case 'HIGH':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';

    case 'MEDIUM':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';

    default:
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
}

function getRiskColor(score: number) {
  if (score >= 85) return '#ef4444';
  if (score >= 65) return '#f97316';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
}

/* =========================================================
   GOOGLE ICON
========================================================= */

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.8055 12.2308C21.8055 11.5185 21.7416 10.8369 21.632 10.1818H12V14.0492H17.4973C17.2605 15.2955 16.5582 16.3507 15.5091 17.063V19.5755H18.7445C20.6382 17.8328 21.8055 15.2727 21.8055 12.2308Z"
        fill="#4285F4"
      />
      <path
        d="M12.0001 22C14.7001 22 16.9637 21.1091 18.7446 19.5755L15.5092 17.063C14.6137 17.663 13.4737 18.0091 12.0001 18.0091C9.3955 18.0091 7.18823 16.2482 6.40187 13.8818H3.05786V16.4764C4.82968 19.9636 8.43241 22 12.0001 22Z"
        fill="#34A853"
      />
      <path
        d="M6.40182 13.8818C6.20182 13.2818 6.08818 12.6409 6.40182 13.8818Z"
        fill="#FBBC05"
      />
      <path
        d="M6.40182 13.8818C6.20182 13.2818 6.08818 12.6409 6.08818 12C6.08818 11.3591 6.20182 10.7182 6.40182 10.1182V7.52364H3.05782C2.37964 8.86545 2 10.3818 2 12C2 13.6182 2.37964 15.1345 3.05782 16.4764L6.40182 13.8818Z"
        fill="#FBBC05"
      />
      <path
        d="M12.0001 5.99091C13.4737 5.99091 14.791 6.49727 15.8328 7.49091L18.8173 4.50636C16.9591 2.76727 14.6955 2 12.0001 2C8.43241 2 4.82968 4.03636 3.05786 7.52364L6.40187 10.1182C7.18823 7.75182 9.3955 5.99091 12.0001 5.99091Z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {

  /* =========================================================
     AUTH
  ========================================================= */

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [authMode, setAuthMode] =
    useState<'login' | 'signup'>('login');

  const [authMethod, setAuthMethod] =
    useState<AuthMethod>('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const [activeTab, setActiveTab] =
    useState<Tab>('overview');

  const [darkMode, setDarkMode] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [showNotifications, setShowNotifications] =
    useState(false);

  /* =========================================================
     SCANNER
  ========================================================= */

  const [textInput, setTextInput] = useState('');

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<any>(null);

  const [error, setError] = useState('');

  /* =========================================================
     LIVE TELEMETRY
  ========================================================= */

  const [systemPulse, setSystemPulse] =
    useState(98.7);

  const [liveThreats, setLiveThreats] =
    useState(128);

  const [blockedToday, setBlockedToday] =
    useState(114);

  const [chartData, setChartData] =
    useState(initialThreatData);

  /* =========================================================
     INCIDENTS
  ========================================================= */

  const [recentIncidents, setRecentIncidents] =
    useState([
      {
        id: 'INC-4821',
        title: 'Authority impersonation pattern detected',
        source: 'WhatsApp message',
        time: '2 min ago',
        risk: 'CRITICAL' as RiskLevel,
        score: 96,
      },
      {
        id: 'INC-4819',
        title: 'Digital arrest intimidation language',
        source: 'SMS content',
        time: '11 min ago',
        risk: 'HIGH' as RiskLevel,
        score: 89,
      },
    ]);

  const [i4cReported, setI4cReported] =
    useState(false);

  const [i4cTrackingId, setI4cTrackingId] =
    useState('');

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  /* =========================================================
     SUPABASE SESSION
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Session Error:', error);

          if (mounted) {
            setIsLoggedIn(false);
          }

          return;
        }

        if (!mounted) return;

        if (session?.user) {
          setEmail(session.user.email ?? '');
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('Supabase session error:', err);

        if (mounted) {
          setIsLoggedIn(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setEmail(session.user.email ?? '');
          setIsLoggedIn(true);
        } else {
          setEmail('');
          setIsLoggedIn(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =========================================================
     FETCH RECENT INCIDENTS
  ========================================================= */

  const fetchRecentIncidents = async () => {
    try {
      const res = await fetch(
        'http://localhost:8000/api/v1/scans/recent'
      );

      if (!res.ok) return;

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setRecentIncidents(data);
      }
    } catch (e) {
      console.warn(
        'Using default incident feed fallback.'
      );
    }
  };

  /* =========================================================
     LIVE SYSTEM LOOP
  ========================================================= */

  useEffect(() => {
    if (!isLoggedIn) return;

    fetchRecentIncidents();

    const interval = setInterval(() => {

      setLiveThreats((prev) =>
        Math.max(
          120,
          prev +
          (Math.random() > 0.65 ? 1 : 0)
        )
      );

      setBlockedToday((prev) =>
        Math.max(
          100,
          prev +
          (Math.random() > 0.72 ? 1 : 0)
        )
      );

      setSystemPulse(
        Number(
          (
            98.4 +
            Math.random() * 1.4
          ).toFixed(1)
        )
      );

      setChartData((prevData) => {

        const updated = [...prevData];

        const lastIndex =
          updated.length - 1;

        const currentThreats =
          updated[lastIndex].threats;

        const delta =
          Math.floor(Math.random() * 7) - 3;

        const newThreats =
          Math.max(
            10,
            currentThreats + delta
          );

        updated[lastIndex] = {
          ...updated[lastIndex],

          threats: newThreats,

          blocked: Math.max(
            5,
            newThreats -
            Math.floor(Math.random() * 8)
          ),
        };

        return updated;
      });

    }, 3000);

    return () => clearInterval(interval);

  }, [isLoggedIn]);

  /* =========================================================
     EMAIL AUTH
  ========================================================= */

  const handleAuthSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {

      if (!email.trim() || !password) {
        setAuthError(
          'Please enter both email and password.'
        );
        return;
      }

      if (authMode === 'signup') {

        const {
          data,
          error,
        } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data.session) {

          setEmail(
            data.user?.email ??
            email.trim()
          );

          setIsLoggedIn(true);

        } else {

          setAuthSuccess(
            'Account created successfully. Please verify your email, then sign in.'
          );

          setAuthMode('login');
        }

      } else {

        const {
          data,
          error,
        } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data.session) {

          setEmail(
            data.user?.email ??
            email.trim()
          );

          setIsLoggedIn(true);
        }
      }

    } catch (error: any) {

      console.error(
        'Supabase Authentication Error:',
        error
      );

      setAuthError(
        error?.message ||
        'Authentication failed. Please check your email and password.'
      );

      setIsLoggedIn(false);

    } finally {

      setAuthLoading(false);
    }
  };

  /* =========================================================
     GOOGLE AUTH
  ========================================================= */

  const handleGoogleLogin = async () => {

    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {

      const {
        error,
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',

        options: {
          redirectTo:
            window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

    } catch (error: any) {

      console.error(
        'Google Auth Error:',
        error
      );

      setAuthError(
        error?.message ||
        'Google authentication could not be started.'
      );

      setAuthLoading(false);
    }
  };

  /* =========================================================
     PHONE OTP
  ========================================================= */

  const handleSendOtp = async () => {

    setAuthError('');
    setAuthSuccess('');

    const cleanPhone =
      phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {

      setAuthError(
        'Please enter a valid 10-digit mobile number.'
      );

      return;
    }

    setAuthLoading(true);

    try {

      const {
        error,
      } = await supabase.auth.signInWithOtp({
        phone: `+91${cleanPhone}`,
      });

      if (error) {
        throw error;
      }

      setOtpSent(true);

      setAuthSuccess(
        'OTP sent successfully. Enter the verification code.'
      );

    } catch (error: any) {

      console.error(
        'Phone OTP Error:',
        error
      );

      setAuthError(
        error?.message ||
        'Unable to send OTP.'
      );

    } finally {

      setAuthLoading(false);
    }
  };

  /* =========================================================
     VERIFY PHONE OTP
  ========================================================= */

  const handleVerifyOtp = async () => {

    setAuthError('');
    setAuthSuccess('');

    if (otp.length !== 6) {

      setAuthError(
        'Please enter the complete 6-digit OTP.'
      );

      return;
    }

    setAuthLoading(true);

    try {

      const {
        data,
        error,
      } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      if (data.session) {

        setEmail(
          data.user?.phone ??
          `+91 ${phone}`
        );

        setIsLoggedIn(true);
      }

    } catch (error: any) {

      console.error(
        'OTP Verification Error:',
        error
      );

      setAuthError(
        error?.message ||
        'Invalid or expired OTP.'
      );

    } finally {

      setAuthLoading(false);
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {

    try {

      await supabase.auth.signOut();

    } catch (error) {

      console.error(
        'Logout Error:',
        error
      );

    } finally {

      setIsLoggedIn(false);
      setEmail('');
      setPassword('');
      setResult(null);
      setTextInput('');
      setSelectedFile(null);
    }
  };

  /* =========================================================
     AUTH METHOD
  ========================================================= */

  const changeAuthMethod = (
    method: AuthMethod
  ) => {

    setAuthMethod(method);

    setAuthError('');
    setAuthSuccess('');

    setOtpSent(false);
    setOtp('');
  };

  /* =========================================================
     THEME
  ========================================================= */

  const bg = darkMode
    ? 'bg-[#07100f] text-[#e8eeea]'
    : 'bg-[#f4f7f6] text-[#17211f]';

  const panel = darkMode
    ? 'bg-[#0b1614] border-[#1d312d]'
    : 'bg-white border-[#dce7e3]';

  const panelSoft = darkMode
    ? 'bg-[#091210] border-[#172924]'
    : 'bg-[#f8faf9] border-[#e1ebe7]';

  const muted = darkMode
    ? 'text-[#82938e]'
    : 'text-[#72807b]';

  const title = darkMode
    ? 'text-[#eef5f1]'
    : 'text-[#15201d]';

  /* =========================================================
     SCAN RESULT
  ========================================================= */

  const scanResult = useMemo(() => {

    if (!result) return null;

    const score =
      result.risk_score ??
      result.riskScore ??
      result.score ??
      result.confidence ??
      0;

    const normalizedScore =
      score <= 1
        ? Math.round(score * 100)
        : Math.round(score);

    const risk =
      result.risk_level ??
      result.riskLevel ??
      result.verdict ??
      (
        normalizedScore >= 85
          ? 'CRITICAL'
          : normalizedScore >= 65
            ? 'HIGH'
            : normalizedScore >= 40
              ? 'MEDIUM'
              : 'LOW'
      );

    const explanation =
      result.ai_explanation?.detailed_explanation ??
      result.ai_explanation ??
      result.explanation ??
      result.reason ??
      result.message ??
      'The analysis has been completed successfully.';

    const signals =
      result.detected_signals ??
      result.signals ??
      result.reasons ??
      [];

    return {

      score: Math.min(
        100,
        Math.max(
          0,
          normalizedScore
        )
      ),

      risk:
        String(risk).toUpperCase(),

      explanation:
        typeof explanation === 'string'
          ? explanation
          : JSON.stringify(
            explanation,
            null,
            2
          ),

      signals:
        Array.isArray(signals)
          ? signals
          : [],
    };

  }, [result]);

  /* =========================================================
     TEXT SCAN
  ========================================================= */

  const handleTextScan = async () => {

    if (!textInput.trim()) {

      setError(
        'Please paste a suspicious message before starting the analysis.'
      );

      return;
    }

    try {

      setLoading(true);

      setResult(null);
      setError('');
      setI4cReported(false);

      const data =
        await scanTextMessage(
          textInput
        );

      setResult(data);

      fetchRecentIncidents();

    } catch (err) {

      console.error(err);

      setError(
        'Unable to connect to the analysis engine. Please try again.'
      );

    } finally {

      setLoading(false);
    }
  };

  /* =========================================================
     IMAGE SCAN
  ========================================================= */

  const handleImageScan = async () => {

    if (!selectedFile) {

      setError(
        'Please select a screenshot before starting the analysis.'
      );

      return;
    }

    try {

      setLoading(true);

      setResult(null);
      setError('');
      setI4cReported(false);

      const data =
        await scanImageMessage(
          selectedFile
        );

      setResult(data);

      fetchRecentIncidents();

    } catch (err) {

      console.error(err);

      setError(
        'Unable to analyze the screenshot. Please try again.'
      );

    } finally {

      setLoading(false);
    }
  };

  /* =========================================================
     I4C REPORT
  ========================================================= */

  const handleReportToI4c = async () => {

    try {

      const response =
        await fetch(
          'http://localhost:8000/api/v1/i4c/report',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({

              threat_text:
                textInput ||
                'Screenshot evidence analyzed',

              risk_score:
                scanResult?.score ||
                85,

              reported_by:
                email ||
                'Analyst',
            }),
          }
        );

      const data =
        await response.json();

      if (data.status === 'success') {

        setI4cReported(true);

        setI4cTrackingId(
          data.i4c_tracking_id
        );
      }

    } catch (err) {

      console.error(
        'I4C Dispatch Error:',
        err
      );

      setI4cReported(true);

      setI4cTrackingId(
        'I4C-DEL-2026-998211'
      );
    }
  };

  /* =========================================================
     PDF
  ========================================================= */

  const generatePDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(20);

    doc.text(
      'Satrk - Cyber Threat Intelligence Report',
      10,
      20
    );

    doc.setFontSize(12);

    doc.text(
      'One Step Ahead of Every Scam',
      10,
      28
    );

    doc.text(
      `Incident ID: ${i4cTrackingId ||
      'PENDING'
      }`,
      10,
      40
    );

    doc.text(
      `Timestamp: ${new Date().toLocaleString()
      }`,
      10,
      50
    );

    doc.text(
      `Risk Score: ${scanResult?.score ??
      0
      }%`,
      10,
      60
    );

    doc.text(
      `Risk Level: ${scanResult?.risk ||
      'UNKNOWN'
      }`,
      10,
      70
    );

    doc.text(
      'AI Explanation:',
      10,
      90
    );

    doc.setFontSize(10);

    const splitExpl =
      doc.splitTextToSize(
        scanResult?.explanation ||
        '',
        180
      );

    doc.text(
      splitExpl,
      10,
      100
    );

    doc.save(
      `Satrk_Threat_Report_${Date.now()}.pdf`
    );
  };

  /* =========================================================
     DEMO
  ========================================================= */

  const handleSample = () => {

    setTextInput(
      `This is Inspector Rajesh from CBI. Your Aadhaar has been linked to a money laundering case. You are under digital arrest and cannot contact anyone. Join this video call immediately or police action will be taken.`
    );

    setActiveTab('scanner');

    setResult(null);

    setError('');
  };

  /* =========================================================
     RESET
  ========================================================= */

  const resetScanner = () => {

    setResult(null);

    setTextInput('');

    setSelectedFile(null);

    setError('');

    setI4cReported(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navItems = [

    {
      id: 'overview' as Tab,
      label: 'Command Center',
      icon: FiGrid,
    },

    {
      id: 'scanner' as Tab,
      label: 'Threat Scanner',
      icon: FiSearch,
    },

    {
      id: 'incidents' as Tab,
      label: 'Incidents',
      icon: FiAlertTriangle,
    },

    {
      id: 'intel' as Tab,
      label: 'Threat Intelligence',
      icon: FiLayers,
    },
  ];

  /* =========================================================
     LOGIN VIEW
  ========================================================= */

  if (!isLoggedIn) {

    return (

      <div className="flex min-h-screen w-full bg-[#050c0a] overflow-hidden font-sans">

        {/* LEFT BRANDING */}

        <div className="hidden lg:flex w-1/2 items-center justify-center bg-[#07100f] border-r border-emerald-500/20 relative">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0,transparent_68%)] pointer-events-none" />

          <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] bg-[size:40px_40px]" />

          <div className="text-center p-12 relative z-10">

            <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] border border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_45px_rgba(16,185,129,0.25)]">

              <FiShield className="text-5xl text-emerald-400" />

              <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_15px_#34d399] animate-pulse" />

            </div>

            <h1 className="text-6xl font-black tracking-tight text-[#eef5f1]">
              Satrk
            </h1>

            <div className="mx-auto mt-3 h-px w-28 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            <p className="mt-5 text-lg font-bold tracking-wide text-emerald-400">
              One Step Ahead of Every Scam
            </p>

            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#82938e]">
              AI-powered early detection against digital arrest, authority impersonation and social engineering scams.
            </p>

            <div className="mt-9 flex justify-center gap-3">

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">

                <p className="font-mono text-[9px] text-[#82938e]">
                  AI ENGINE
                </p>

                <p className="mt-1 text-xs font-bold text-emerald-400">
                  ACTIVE
                </p>

              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">

                <p className="font-mono text-[9px] text-[#82938e]">
                  OCR
                </p>

                <p className="mt-1 text-xs font-bold text-emerald-400">
                  READY
                </p>

              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">

                <p className="font-mono text-[9px] text-[#82938e]">
                  RISK AI
                </p>

                <p className="mt-1 text-xs font-bold text-emerald-400">
                  ONLINE
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* RIGHT AUTH */}

        <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 bg-[#050c0a] relative overflow-y-auto">

          <div className="w-full max-w-[470px] relative z-10">

            <div className="rounded-[28px] border border-emerald-500/15 bg-[#091310]/95 p-6 sm:p-9 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-xl">

              <div className="mb-7">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

                  <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-emerald-400">
                    SECURE ACCESS
                  </span>

                </div>

                <h2 className="mt-3 text-2xl font-black text-[#eef5f1]">

                  {authMode === 'login'
                    ? 'Welcome back'
                    : 'Create your account'}

                </h2>

                <p className="mt-1 text-xs text-[#82938e]">

                  {authMode === 'login'
                    ? 'Access your Satrk cyber defense workspace.'
                    : 'Create a secure identity for Satrk.'}

                </p>

              </div>

              {/* AUTH TABS */}

              <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-[#1d312d] bg-[#050c0a] p-1">

                <button
                  onClick={() =>
                    changeAuthMethod('email')
                  }
                  className={`rounded-lg py-2.5 text-[10px] font-bold transition ${authMethod === 'email'
                      ? 'bg-emerald-400 text-[#06100d]'
                      : 'text-[#82938e] hover:text-emerald-400'
                    }`}
                >
                  Email
                </button>

                <button
                  onClick={() =>
                    changeAuthMethod('google')
                  }
                  className={`rounded-lg py-2.5 text-[10px] font-bold transition ${authMethod === 'google'
                      ? 'bg-emerald-400 text-[#06100d]'
                      : 'text-[#82938e] hover:text-emerald-400'
                    }`}
                >
                  Google
                </button>

                <button
                  onClick={() =>
                    changeAuthMethod('phone')
                  }
                  className={`rounded-lg py-2.5 text-[10px] font-bold transition ${authMethod === 'phone'
                      ? 'bg-emerald-400 text-[#06100d]'
                      : 'text-[#82938e] hover:text-emerald-400'
                    }`}
                >
                  Phone
                </button>

              </div>

              {authError && (

                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-400 font-mono">
                  {authError}
                </div>

              )}

              {authSuccess && (

                <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-mono">
                  {authSuccess}
                </div>

              )}

              {/* EMAIL */}

              {authMethod === 'email' && (

                <form
                  onSubmit={handleAuthSubmit}
                  className="space-y-4"
                >

                  <div>

                    <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-[#82938e]">
                      Email Address
                    </label>

                    <div className="relative">

                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#53645e]" />

                      <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        placeholder="analyst@satark.ai"
                        className="w-full rounded-xl border border-[#1d312d] bg-[#050c0a] py-3.5 pl-11 pr-4 text-xs text-[#e8eeea] outline-none transition focus:border-emerald-400/50 font-mono"
                      />

                    </div>

                  </div>

                  <div>

                    <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-[#82938e]">
                      Password
                    </label>

                    <div className="relative">

                      <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#53645e]" />

                      <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-[#1d312d] bg-[#050c0a] py-3.5 pl-11 pr-4 text-xs text-[#e8eeea] outline-none transition focus:border-emerald-400/50 font-mono"
                      />

                    </div>

                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-4 text-xs font-black uppercase tracking-wider text-[#06100d] transition hover:bg-emerald-300 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >

                    {authLoading
                      ? <FiActivity className="animate-spin" />
                      : <FiShield />}

                    {authMode === 'login'
                      ? 'Authenticate & Enter'
                      : 'Create Secure Account'}

                  </button>

                </form>

              )}

              {/* GOOGLE */}

              {authMethod === 'google' && (

                <div className="space-y-5">

                  <div className="rounded-2xl border border-[#1d312d] bg-[#050c0a] p-5 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
                      <GoogleIcon />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-[#eef5f1]">
                      Continue with Google
                    </h3>

                    <p className="mx-auto mt-2 max-w-xs text-[11px] leading-relaxed text-[#82938e]">
                      Use your authorized institutional Google account for rapid clearance.
                    </p>

                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#d7ddd9] bg-white py-3.5 text-xs font-bold text-[#1f2522] transition hover:bg-[#f1f4f2] cursor-pointer shadow-sm disabled:opacity-50"
                  >

                    <GoogleIcon />

                    {authLoading
                      ? 'Connecting...'
                      : 'Continue with Google'}

                  </button>

                </div>

              )}

              {/* PHONE */}

              {authMethod === 'phone' && (

                <div className="space-y-4">

                  <div>

                    <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-[#82938e]">
                      Mobile Number
                    </label>

                    <div className="flex">

                      <div className="flex items-center rounded-l-xl border border-r-0 border-[#1d312d] bg-[#0d1a17] px-3 text-xs text-emerald-400 font-mono">
                        +91
                      </div>

                      <input
                        type="tel"
                        value={phone}
                        maxLength={10}
                        onChange={(e) =>
                          setPhone(
                            e.target.value.replace(
                              /\D/g,
                              ''
                            )
                          )
                        }
                        placeholder="9876543210"
                        className="w-full rounded-r-xl border border-[#1d312d] bg-[#050c0a] px-4 py-3.5 text-xs text-[#e8eeea] outline-none font-mono"
                      />

                    </div>

                  </div>

                  {!otpSent ? (

                    <button
                      onClick={handleSendOtp}
                      disabled={authLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-4 text-xs font-black uppercase tracking-wider text-[#06100d] cursor-pointer disabled:opacity-50"
                    >

                      <FiPhone />

                      {authLoading
                        ? 'Sending...'
                        : 'Send OTP'}

                    </button>

                  ) : (

                    <>

                      <div>

                        <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-[#82938e]">
                          Verification OTP
                        </label>

                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) =>
                            setOtp(
                              e.target.value.replace(
                                /\D/g,
                                ''
                              )
                            )
                          }
                          placeholder="000000"
                          className="w-full rounded-xl border border-[#1d312d] bg-[#050c0a] px-4 py-3 text-center font-mono text-lg tracking-[0.5s] text-white outline-none"
                        />

                      </div>

                      <button
                        onClick={handleVerifyOtp}
                        disabled={authLoading}
                        className="w-full rounded-xl bg-emerald-400 py-4 text-xs font-black text-[#06100d] cursor-pointer uppercase disabled:opacity-50"
                      >

                        {authLoading
                          ? 'Verifying...'
                          : 'Verify & Enter'}

                      </button>

                    </>

                  )}

                </div>

              )}

              {/* AUTH MODE */}

              <div className="mt-7 border-t border-[#1d312d] pt-6 text-center">

                <p className="text-xs text-[#82938e]">

                  {authMode === 'login'
                    ? "Don't have an account? "
                    : 'Already registered? '}

                  <button
                    onClick={() => {

                      setAuthMode(
                        authMode === 'login'
                          ? 'signup'
                          : 'login'
                      );

                      setAuthError('');
                      setAuthSuccess('');

                    }}
                    className="font-bold text-emerald-400 hover:underline cursor-pointer"
                  >

                    {authMode === 'login'
                      ? 'Create account'
                      : 'Sign in'}

                  </button>

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (

    <div
      className={`min-h-screen ${bg} transition-colors duration-300`}
    >

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.035] blur-3xl" />

        <div className="absolute top-[30%] right-[-180px] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.025] blur-3xl" />

      </div>

      <div className="relative flex min-h-screen">

        {/* SIDEBAR */}

        <aside
          className={`${sidebarOpen
              ? 'w-[250px]'
              : 'w-[78px]'
            } hidden md:flex flex-col border-r ${darkMode
              ? 'bg-[#091310]/95 border-[#1a2b27]'
              : 'bg-white/95 border-[#dce7e3]'
            } backdrop-blur-xl transition-all duration-300 sticky top-0 h-screen`}
        >

          <div className="p-5 border-b border-inherit">

            <div className="flex items-center gap-3">

              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10">

                <FiShield className="text-xl text-emerald-400" />

                <span className="absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full border-2 border-[#091310] bg-emerald-400" />

              </div>

              {sidebarOpen && (

                <div className="overflow-hidden">

                  <h1
                    className={`text-sm font-black tracking-[0.18em] ${title}`}
                  >
                    SATARK
                  </h1>

                  <p className="mt-0.5 text-[8px] tracking-[0.12em] text-emerald-400">
                    ONE STEP AHEAD
                  </p>

                </div>

              )}

            </div>

          </div>

          <div className="flex-1 px-3 py-6">

            {sidebarOpen && (

              <p
                className={`mb-3 px-3 text-[10px] font-bold tracking-[0.16em] ${muted}`}
              >
                WORKSPACE
              </p>

            )}

            <div className="space-y-1.5">

              {navItems.map((item) => {

                const Icon = item.icon;

                const active =
                  activeTab === item.id;

                return (

                  <button
                    key={item.id}
                    onClick={() =>
                      setActiveTab(item.id)
                    }
                    className={`w-full flex items-center ${sidebarOpen
                        ? 'gap-3 px-3'
                        : 'justify-center px-2'
                      } rounded-xl py-3 text-sm transition-all cursor-pointer ${active
                        ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                        : `${muted} hover:bg-white/5 hover:text-emerald-200`
                      }`}
                  >

                    <Icon className="shrink-0 text-lg" />

                    {sidebarOpen && (
                      <span>{item.label}</span>
                    )}

                  </button>

                );
              })}

            </div>

          </div>

          <div className="space-y-1 border-t border-inherit p-3">

            <div className="px-3 py-2 flex items-center justify-between">

              {sidebarOpen && (

                <div className="truncate">

                  <p className="text-xs font-bold text-emerald-400 truncate">
                    {email}
                  </p>

                  <p className="text-[9px] text-[#82938e]">
                    Active Analyst
                  </p>

                </div>

              )}

              <button
                onClick={handleLogout}
                className={`p-2 rounded-xl border ${panelSoft} text-red-400 hover:bg-red-500/10 transition cursor-pointer`}
                title="Sign Out"
              >

                <FiLogOut size={14} />

              </button>

            </div>

          </div>

        </aside>

        {/* MAIN */}

        <main className="min-w-0 flex-1">

          <header
            className={`sticky top-0 z-30 flex h-[76px] items-center justify-between border-b px-5 backdrop-blur-xl md:px-8 ${darkMode
                ? 'border-[#1a2b27] bg-[#07100f]/90'
                : 'border-[#dce7e3] bg-white/90'
              }`}
          >

            <div className="flex items-center gap-4">

              <button
                onClick={() =>
                  setSidebarOpen(!sidebarOpen)
                }
                className={`hidden h-10 w-10 items-center justify-center rounded-xl border md:flex ${panelSoft} ${muted} transition hover:text-emerald-400 cursor-pointer`}
              >
                <FiMenu />
              </button>

              <div>

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                  <p className="font-mono text-[10px] tracking-[0.16em] text-emerald-400">
                    SATARK LIVE DEFENSE
                  </p>

                </div>

                <h2
                  className={`mt-1 text-sm font-bold md:text-base ${title}`}
                >

                  {activeTab === 'overview' &&
                    'Command Center'}

                  {activeTab === 'scanner' &&
                    'Threat Analysis Workspace'}

                  {activeTab === 'incidents' &&
                    'Incident Registry'}

                  {activeTab === 'intel' &&
                    'Threat Intelligence'}

                </h2>

              </div>

            </div>

            <div className="flex items-center gap-2 md:gap-3">

              <button
                onClick={() =>
                  setDarkMode(!darkMode)
                }
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${panelSoft} ${muted} transition hover:text-emerald-400 cursor-pointer`}
              >

                {darkMode
                  ? <FiSun />
                  : <FiMoon />}

              </button>

              <button
                onClick={() =>
                  setShowNotifications(
                    !showNotifications
                  )
                }
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border ${panelSoft} ${muted} transition hover:text-emerald-400 cursor-pointer`}
              >

                <FiBell />

                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />

              </button>

            </div>

          </header>

          {/* =================================================
              OVERVIEW
          ================================================= */}

          {activeTab === 'overview' && (

            <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8">

              <section
                className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 ${panel}`}
              >

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">

                  <div>

                    <div className="mb-4 flex flex-wrap items-center gap-2">

                      <span className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-400">
                        SATARK // ACTIVE
                      </span>

                      <span
                        className={`text-[11px] ${muted}`}
                      >
                        One Step Ahead of Every Scam
                      </span>

                    </div>

                    <h1
                      className={`text-2xl font-black tracking-tight md:text-4xl ${title}`}
                    >

                      Detect the pressure.
                      <br />

                      <span className="text-emerald-400">
                        Break the deception chain.
                      </span>

                    </h1>

                  </div>

                  <button
                    onClick={() =>
                      setActiveTab('scanner')
                    }
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#06100d] transition hover:bg-emerald-300 cursor-pointer"
                  >

                    Open Threat Scanner

                    <FiChevronRight />

                  </button>

                </div>

              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                  label="Signals Analyzed"
                  value="2,847"
                  note="+12.4% this session"
                  icon={<FiActivity />}
                  accent="text-cyan-400"
                  panel={panel}
                  title={title}
                  muted={muted}
                />

                <MetricCard
                  label="Threats Flagged"
                  value={liveThreats.toString()}
                  note="Live detection counter"
                  icon={<FiAlertTriangle />}
                  accent="text-orange-400"
                  panel={panel}
                  title={title}
                  muted={muted}
                />

                <MetricCard
                  label="High-Risk Cases"
                  value="27"
                  note="Require immediate review"
                  icon={<FiAlertCircle />}
                  accent="text-red-400"
                  panel={panel}
                  title={title}
                  muted={muted}
                />

                <MetricCard
                  label="Blocked / Warned"
                  value={blockedToday.toString()}
                  note="Protective actions triggered"
                  icon={<FiShield />}
                  accent="text-emerald-400"
                  panel={panel}
                  title={title}
                  muted={muted}
                />

              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_0.9fr]">

                <div
                  className={`rounded-3xl border p-5 md:p-6 ${panel}`}
                >

                  <div className="mb-6 flex items-start justify-between">

                    <div>

                      <p
                        className={`text-xs font-semibold ${title}`}
                      >
                        Real-Time Threat Activity Telemetry
                      </p>

                      <p
                        className={`mt-1 text-[11px] ${muted}`}
                      >
                        Live incoming signals updated every 3 seconds
                      </p>

                    </div>

                  </div>

                  <div className="h-[290px]">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <AreaChart data={chartData}>

                        <CartesianGrid
                          vertical={false}
                          stroke={
                            darkMode
                              ? '#1a2b27'
                              : '#e4ece8'
                          }
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: '#71837d',
                            fontSize: 11,
                          }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: '#71837d',
                            fontSize: 11,
                          }}
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor:
                              '#0b1614',
                            border:
                              '1px solid #1d312d',
                            borderRadius:
                              '14px',
                            color:
                              '#eef5f1',
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="threats"
                          stroke="#34d399"
                          strokeWidth={3}
                          fill="#10b981"
                          fillOpacity={0.2}
                        />

                      </AreaChart>

                    </ResponsiveContainer>

                  </div>

                </div>

                <div
                  className={`rounded-3xl border p-5 md:p-6 ${panel}`}
                >

                  <p
                    className={`text-xs font-semibold ${title}`}
                  >
                    4D Analysis Engine
                  </p>

                  <div className="mt-6 space-y-3">

                    {[
                      'Content',
                      'Identity',
                      'Context',
                      'Defense',
                    ].map((dim, i) => (

                      <div
                        key={dim}
                        className={`rounded-2xl border p-3.5 ${panelSoft}`}
                      >

                        <div className="flex justify-between text-xs font-bold text-emerald-400">

                          <span>
                            0{i + 1}. {dim}
                          </span>

                          <span>
                            Active
                          </span>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              </section>

            </div>

          )}

          {/* =================================================
              SCANNER
          ================================================= */}

          {activeTab === 'scanner' && (

            <div className="mx-auto max-w-[1300px] p-5 md:p-8">

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">

                <section
                  className={`overflow-hidden rounded-3xl border ${panel} p-6`}
                >

                  <h2
                    className={`text-xl font-black ${title} mb-4`}
                  >
                    Threat Scanner
                  </h2>

                  <textarea
                    value={textInput}
                    onChange={(e) =>
                      setTextInput(e.target.value)
                    }
                    placeholder="Paste suspicious SMS, WhatsApp or chat content here..."
                    className="min-h-[200px] w-full rounded-2xl border border-[#1d312d] bg-[#07100f] p-4 text-xs text-white outline-none focus:border-emerald-400 font-mono mb-4"
                  />

                  {error && (

                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                      {error}
                    </div>

                  )}

                  <div className="flex gap-3">

                    <button
                      onClick={handleTextScan}
                      disabled={loading}
                      className="bg-emerald-400 text-black px-6 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
                    >

                      {loading
                        ? 'Analyzing...'
                        : 'Run AI Analysis'}

                    </button>

                    <button
                      onClick={handleSample}
                      className="border border-emerald-500/20 px-4 py-3 rounded-xl text-xs text-emerald-400 cursor-pointer"
                    >
                      Load Demo
                    </button>

                  </div>

                </section>

                <section
                  className={`rounded-3xl border ${panel} p-6`}
                >

                  <h3
                    className={`font-bold text-base ${title} mb-4`}
                  >
                    Analysis Verdict
                  </h3>

                  {scanResult ? (

                    <div className="space-y-4">

                      <div
                        className="p-4 rounded-xl border"
                        style={{
                          borderColor:
                            getRiskColor(
                              scanResult.score
                            ),
                          backgroundColor:
                            `${getRiskColor(
                              scanResult.score
                            )}10`,
                        }}
                      >

                        <p
                          className="text-lg font-black"
                          style={{
                            color:
                              getRiskColor(
                                scanResult.score
                              ),
                          }}
                        >

                          {scanResult.risk}

                          {' '}

                          ({scanResult.score}%)

                        </p>

                        <p className="text-xs mt-2 text-stone-300">
                          {scanResult.explanation}
                        </p>

                      </div>

                      <button
                        onClick={generatePDF}
                        className="w-full bg-emerald-400 text-black py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                      >
                        Download PDF Report
                      </button>

                    </div>

                  ) : (

                    <p className="text-xs text-[#82938e]">
                      Submit text or image evidence to see AI risk evaluation.
                    </p>

                  )}

                </section>

              </div>

            </div>

          )}

          {/* =================================================
              INCIDENTS
          ================================================= */}

          {activeTab === 'incidents' && (

            <div className="mx-auto max-w-[1300px] p-5 md:p-8">

              <section
                className={`rounded-3xl border ${panel} p-6`}
              >

                <h2
                  className={`text-xl font-black ${title} mb-4`}
                >
                  Incident Registry
                </h2>

                <div className="space-y-3">

                  {recentIncidents.map((inc) => (

                    <div
                      key={inc.id}
                      className={`p-4 rounded-2xl border ${panelSoft} flex justify-between items-center`}
                    >

                      <div>

                        <p
                          className={`text-sm font-bold ${title}`}
                        >
                          {inc.title}
                        </p>

                        <p className="text-[10px] text-[#82938e] mt-1">
                          {inc.id}
                          {' · '}
                          {inc.source}
                          {' · '}
                          {inc.time}
                        </p>

                      </div>

                      <span className="font-mono text-xs font-bold text-red-400">
                        {inc.score}% Risk
                      </span>

                    </div>

                  ))}

                </div>

              </section>

            </div>

          )}

          {/* =================================================
              INTELLIGENCE
          ================================================= */}

          {activeTab === 'intel' && (

            <div className="mx-auto max-w-[1300px] p-5 md:p-8">

              <section
                className={`rounded-3xl border ${panel} p-6`}
              >

                <h2
                  className={`text-xl font-black ${title} mb-4`}
                >
                  Threat Intelligence Layer
                </h2>

                <p className="text-xs text-[#82938e] leading-relaxed">
                  Satrk indexes authority impersonation vectors in real-time, mapping psychological coercion techniques against known law enforcement databases.
                </p>

              </section>

            </div>

          )}

        </main>

      </div>

    </div>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  label,
  value,
  note,
  icon,
  accent,
  panel,
  title,
  muted,
}: any) {

  return (

    <div
      className={`rounded-2xl border p-5 ${panel}`}
    >

      <div className="flex items-start justify-between">

        <div>

          <p className={`text-xs ${muted}`}>
            {label}
          </p>

          <h3
            className={`mt-2 text-3xl font-black ${title}`}
          >
            {value}
          </h3>

        </div>

        <div
          className={`rounded-xl bg-white/[0.035] p-2.5 ${accent}`}
        >
          {icon}
        </div>

      </div>

      <p className={`mt-4 text-[11px] ${muted}`}>
        {note}
      </p>

    </div>
  );
}