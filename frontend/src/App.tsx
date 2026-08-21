import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiAlertTriangle,
  FiBell,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiGrid,
  FiImage,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiPhone,
  FiSearch,
  FiShield,
  FiShieldOff,
  FiSun,
  FiUploadCloud,
  FiUser,
  FiX,
  FiZap,
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
  /* =========================
     AUTH
  ========================= */

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

  /* =========================
     DASHBOARD
  ========================= */

  const [activeTab, setActiveTab] =
    useState<Tab>('overview');

  const [darkMode, setDarkMode] =
    useState(true);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [showNotifications, setShowNotifications] =
    useState(false);

  /* =========================
     SCANNER
  ========================= */

  const [textInput, setTextInput] =
    useState('');

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<any>(null);

  const [error, setError] =
    useState('');

  /* =========================
     LIVE SYSTEM
  ========================= */

  const [systemPulse, setSystemPulse] =
    useState(98.7);

  const [liveThreats, setLiveThreats] =
    useState(128);

  const [blockedToday, setBlockedToday] =
    useState(114);

  const [chartData, setChartData] =
    useState(initialThreatData);

  /* =========================
     INCIDENTS
  ========================= */

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
     FETCH RECENT INCIDENTS
  ========================================================= */

  const fetchRecentIncidents = async () => {
    try {
      const res = await fetch(
        'http://localhost:8000/api/v1/scans/recent'
      );

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
            Math.floor(
              Math.random() * 8
            )
          ),
        };

        return updated;
      });
    }, 3000);

    return () =>
      clearInterval(interval);
  }, [isLoggedIn]);

  /* =========================================================
     AUTH SUBMIT
  ========================================================= */

  const handleAuthSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setAuthError('');
    setAuthSuccess('');

    if (!email || !password) {
      setAuthError(
        'Please enter both email and password.'
      );
      return;
    }

    setAuthLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    setAuthLoading(false);
    setIsLoggedIn(true);
  };

  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 900)
    );

    setAuthLoading(false);

    /*
      FRONTEND DEMO FLOW

      Real Google OAuth can later be connected
      using Firebase / Supabase / Google Identity.
    */

    setEmail('google.analyst@satrk.ai');
    setIsLoggedIn(true);
  };

  /* =========================================================
     SEND OTP
  ========================================================= */

  const handleSendOtp = async () => {
    setAuthError('');
    setAuthSuccess('');

    const cleanPhone =
      phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      setAuthError(
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    setAuthLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 900)
    );

    setAuthLoading(false);
    setOtpSent(true);

    setAuthSuccess(
      'OTP sent successfully. Enter the 6-digit OTP to continue.'
    );
  };

  /* =========================================================
     VERIFY OTP
  ========================================================= */

  const handleVerifyOtp = async () => {
    setAuthError('');
    setAuthSuccess('');

    if (otp.length !== 6) {
      setAuthError(
        'Please enter the 6-digit OTP.'
      );
      return;
    }

    setAuthLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 800)
    );

    setAuthLoading(false);

    setEmail(
      `+91 ${phone.slice(-10)}`
    );

    setIsLoggedIn(true);
  };

  /* =========================================================
     AUTH METHOD SWITCH
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
      result.ai_explanation
        ?.detailed_explanation ??
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
        Math.max(0, normalizedScore)
      ),

      risk: String(risk).toUpperCase(),

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

      if (
        data.status ===
        'success'
      ) {
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
    const doc =
      new jsPDF();

    doc.setFontSize(20);

    doc.text(
      'Satrk - Cyber Threat Intelligence Report',
      10,
      20
    );

    doc.setFontSize(12);

    doc.text(
      `One Step Ahead of Every Scam`,
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
      `Timestamp: ${new Date().toLocaleString()}`,
      10,
      50
    );

    doc.text(
      `Risk Score: ${scanResult?.score ?? 0
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

    setActiveTab(
      'scanner'
    );

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

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
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
     LOGIN PAGE
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
              AI-powered early detection against
              digital arrest, authority impersonation
              and social engineering scams.
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

            <p className="mt-12 font-mono text-[9px] tracking-[0.25em] text-[#53645e]">
              SATRK // SIH 2026 // CYBER DEFENSE
            </p>

          </div>
        </div>

        {/* RIGHT AUTH */}

        <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 bg-[#050c0a] relative overflow-y-auto">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.06),transparent_45%)] pointer-events-none" />

          <div className="w-full max-w-[470px] relative z-10">

            {/* MOBILE LOGO */}

            <div className="flex lg:hidden items-center gap-3 mb-7">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10">
                <FiShield className="text-xl text-emerald-400" />
              </div>

              <div>
                <p className="text-lg font-black text-[#eef5f1]">
                  Satrk
                </p>

                <p className="text-[9px] tracking-widest text-emerald-400">
                  ONE STEP AHEAD OF EVERY SCAM
                </p>
              </div>

            </div>

            <div className="rounded-[28px] border border-emerald-500/15 bg-[#091310]/95 p-6 sm:p-9 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-xl">

              {/* HEADER */}

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

              {/* AUTH METHOD TABS */}

              <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-[#1d312d] bg-[#050c0a] p-1">

                <button
                  onClick={() =>
                    changeAuthMethod(
                      'email'
                    )
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
                    changeAuthMethod(
                      'google'
                    )
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
                    changeAuthMethod(
                      'phone'
                    )
                  }
                  className={`rounded-lg py-2.5 text-[10px] font-bold transition ${authMethod === 'phone'
                      ? 'bg-emerald-400 text-[#06100d]'
                      : 'text-[#82938e] hover:text-emerald-400'
                    }`}
                >
                  Phone
                </button>

              </div>

              {/* ERROR */}

              {authError && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-400">
                  {authError}
                </div>
              )}

              {/* SUCCESS */}

              {authSuccess && (
                <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                  {authSuccess}
                </div>
              )}

              {/* EMAIL AUTH */}

              {authMethod === 'email' && (
                <form
                  onSubmit={
                    handleAuthSubmit
                  }
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
                          setEmail(
                            e.target.value
                          )
                        }
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-[#1d312d] bg-[#050c0a] py-3.5 pl-11 pr-4 text-xs text-[#e8eeea] outline-none transition focus:border-emerald-400/50"
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
                          setPassword(
                            e.target.value
                          )
                        }
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-[#1d312d] bg-[#050c0a] py-3.5 pl-11 pr-4 text-xs text-[#e8eeea] outline-none transition focus:border-emerald-400/50"
                      />

                    </div>

                  </div>

                  <button
                    type="submit"
                    disabled={
                      authLoading
                    }
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-4 text-xs font-black uppercase tracking-wider text-[#06100d] transition hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {authLoading ? (
                      <>
                        <FiActivity className="animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <FiShield />
                        {authMode ===
                          'login'
                          ? 'Authenticate & Enter'
                          : 'Create Account'}
                      </>
                    )}
                  </button>

                </form>
              )}

              {/* GOOGLE AUTH */}

              {authMethod === 'google' && (
                <div className="space-y-5">

                  <div className="rounded-2xl border border-[#1d312d] bg-[#050c0a] p-5 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
                      <GoogleIcon />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-[#eef5f1]">
                      Continue with Google
                    </h3>

                    <p className="mx-auto mt-2 max-w-xs text-[11px] leading-relaxed text-[#82938e]">
                      Use your Google account to securely access your Satrk workspace.
                    </p>

                  </div>

                  <button
                    onClick={
                      handleGoogleLogin
                    }
                    disabled={
                      authLoading
                    }
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#d7ddd9] bg-white py-3.5 text-xs font-bold text-[#1f2522] transition hover:bg-[#f1f4f2] disabled:opacity-50"
                  >
                    <GoogleIcon />

                    {authLoading
                      ? 'Connecting...'
                      : 'Continue with Google'}
                  </button>

                  <p className="text-center text-[9px] leading-relaxed text-[#53645e]">
                    Secure authentication powered by your identity provider.
                  </p>

                </div>
              )}

              {/* PHONE AUTH */}

              {authMethod === 'phone' && (
                <div className="space-y-4">

                  <div>

                    <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-[#82938e]">
                      Mobile Number
                    </label>

                    <div className="flex">

                      <div className="flex items-center rounded-l-xl border border-r-0 border-[#1d312d] bg-[#0d1a17] px-3 text-xs text-emerald-400">
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
                        className="w-full rounded-r-xl border border-[#1d312d] bg-[#050c0a] px-4 py-3.5 text-xs text-[#e8eeea] outline-none transition focus:border-emerald-400/50"
                      />

                    </div>

                  </div>

                  {!otpSent ? (
                    <button
                      onClick={
                        handleSendOtp
                      }
                      disabled={
                        authLoading
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-4 text-xs font-black uppercase tracking-wider text-[#06100d] transition hover:bg-emerald-300 disabled:opacity-50"
                    >
                      <FiPhone />

                      {authLoading
                        ? 'Sending OTP...'
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
                          inputMode="numeric"
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
                          className="w-full rounded-xl border border-[#1d312d] bg-[#050c0a] px-4 py-4 text-center font-mono text-lg tracking-[0.5em] text-[#e8eeea] outline-none transition focus:border-emerald-400/50"
                        />

                      </div>

                      <button
                        onClick={
                          handleVerifyOtp
                        }
                        disabled={
                          authLoading
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-4 text-xs font-black uppercase tracking-wider text-[#06100d] transition hover:bg-emerald-300 disabled:opacity-50"
                      >
                        <FiShield />

                        {authLoading
                          ? 'Verifying...'
                          : 'Verify & Continue'}
                      </button>

                      <button
                        onClick={() => {
                          setOtpSent(
                            false
                          );
                          setOtp('');
                        }}
                        className="w-full text-[10px] text-[#82938e] hover:text-emerald-400"
                      >
                        Change mobile number
                      </button>
                    </>
                  )}

                  <div className="flex items-start gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-3">
                    <FiZap className="mt-0.5 shrink-0 text-cyan-400" />

                    <p className="text-[10px] leading-relaxed text-[#82938e]">
                      Phone verification helps protect your Satrk account from unauthorized access.
                    </p>
                  </div>

                </div>
              )}

              {/* SWITCH LOGIN/SIGNUP */}

              <div className="mt-7 border-t border-[#1d312d] pt-6 text-center">

                <p className="text-xs text-[#82938e]">

                  {authMode === 'login'
                    ? "Don't have an account? "
                    : 'Already have an account? '}

                  <button
                    onClick={() => {
                      setAuthMode(
                        authMode ===
                          'login'
                          ? 'signup'
                          : 'login'
                      );

                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className="font-bold text-emerald-400 hover:underline"
                  >
                    {authMode ===
                      'login'
                      ? 'Create account'
                      : 'Sign in'}
                  </button>

                </p>

              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-[9px] text-[#53645e]">
                <FiShield className="text-emerald-500" />
                Satrk Secure Access
              </div>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN DASHBOARD
  ========================================================= */

  return (
    <div
      className={`min-h-screen ${bg} transition-colors duration-300`}
    >

      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.035] blur-3xl" />

        <div className="absolute top-[30%] right-[-180px] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.025] blur-3xl" />

      </div>

      <div className="relative flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside
          className={`${sidebarOpen
              ? 'w-[250px]'
              : 'w-[78px]'
            } hidden md:flex flex-col border-r ${darkMode
              ? 'bg-[#091310]/95 border-[#1a2b27]'
              : 'bg-white/95 border-[#dce7e3]'
            } backdrop-blur-xl transition-all duration-300 sticky top-0 h-screen`}
        >

          {/* BRAND */}

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
                    SATRK
                  </h1>

                  <p className="mt-0.5 text-[8px] tracking-[0.12em] text-emerald-400 whitespace-nowrap">
                    ONE STEP AHEAD OF EVERY SCAM
                  </p>

                </div>
              )}

            </div>

          </div>

          {/* NAV */}

          <div className="flex-1 px-3 py-6">

            {sidebarOpen && (
              <p
                className={`mb-3 px-3 text-[10px] font-bold tracking-[0.16em] ${muted}`}
              >
                WORKSPACE
              </p>
            )}

            <div className="space-y-1.5">

              {navItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    activeTab ===
                    item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        setActiveTab(
                          item.id
                        )
                      }
                      className={`w-full flex items-center ${sidebarOpen
                          ? 'gap-3 px-3'
                          : 'justify-center px-2'
                        } rounded-xl py-3 text-sm transition-all ${active
                          ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.05)]'
                          : `${muted} hover:bg-white/5 hover:text-emerald-200`
                        }`}
                    >

                      <Icon className="shrink-0 text-lg" />

                      {sidebarOpen && (
                        <span>
                          {item.label}
                        </span>
                      )}

                      {active &&
                        sidebarOpen && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                        )}

                    </button>
                  );
                }
              )}

            </div>

            {/* DEFENSE STATUS */}

            {sidebarOpen && (
              <div
                className={`mt-8 rounded-3xl border p-5 ${panel}`}
              >

                <div className="flex justify-center mb-4">

                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-[6px] border-emerald-500/20">

                    <div className="absolute inset-[-6px] rounded-full border-t-[6px] border-emerald-400 rotate-[35deg]" />

                    <div className="text-center">

                      <p className="font-mono text-3xl font-black text-emerald-400">
                        94%
                      </p>

                      <p className="mt-1 text-[9px] font-bold tracking-widest text-[#82938e] font-mono">
                        SYSTEM READY
                      </p>

                    </div>

                  </div>

                </div>

                <div className="space-y-2 mt-4">

                  {[
                    'NLP Detection Engine',
                    'Risk Reasoning Module',
                    'OCR Screenshot Analysis',
                    'Explainable AI Layer',
                  ].map(
                    (item, index) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] px-3 py-2"
                      >

                        <span className="text-[10px] text-[#82938e]">
                          {item}
                        </span>

                        <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 font-mono">

                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />

                          {index === 2
                            ? 'READY'
                            : 'ACTIVE'}

                        </span>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

          </div>

          {/* ACCOUNT */}

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
                onClick={() => {
                  setIsLoggedIn(
                    false
                  );
                  setOtpSent(false);
                  setOtp('');
                }}
                className={`p-2 rounded-xl border ${panelSoft} text-red-400 hover:bg-red-500/10 transition`}
                title="Sign Out"
              >
                <FiLogOut
                  size={14}
                />
              </button>

            </div>

          </div>

        </aside>

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main className="min-w-0 flex-1">

          {/* HEADER */}

          <header
            className={`sticky top-0 z-30 flex h-[76px] items-center justify-between border-b px-5 backdrop-blur-xl md:px-8 ${darkMode
                ? 'border-[#1a2b27] bg-[#07100f]/90'
                : 'border-[#dce7e3] bg-white/90'
              }`}
          >

            <div className="flex items-center gap-4">

              <button
                onClick={() =>
                  setSidebarOpen(
                    !sidebarOpen
                  )
                }
                className={`hidden h-10 w-10 items-center justify-center rounded-xl border md:flex ${panelSoft} ${muted} transition hover:text-emerald-400`}
              >
                <FiMenu />
              </button>

              <div>

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                  <p className="font-mono text-[10px] tracking-[0.16em] text-emerald-400">
                    SATRK LIVE DEFENSE NETWORK
                  </p>

                </div>

                <h2
                  className={`mt-1 text-sm font-bold md:text-base ${title}`}
                >
                  {activeTab ===
                    'overview' &&
                    'Command Center'}

                  {activeTab ===
                    'scanner' &&
                    'Threat Analysis Workspace'}

                  {activeTab ===
                    'incidents' &&
                    'Incident Registry'}

                  {activeTab ===
                    'intel' &&
                    'Threat Intelligence'}
                </h2>

              </div>

            </div>

            <div className="flex items-center gap-2 md:gap-3 relative">

              {/* SYSTEM PULSE */}

              <div className="hidden lg:flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />

                <span className="font-mono text-[9px] text-emerald-400">
                  {systemPulse}%
                </span>

              </div>

              {/* THEME */}

              <button
                onClick={() =>
                  setDarkMode(
                    !darkMode
                  )
                }
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${panelSoft} ${muted} transition hover:text-emerald-400`}
                title="Toggle Theme"
              >
                {darkMode ? (
                  <FiSun />
                ) : (
                  <FiMoon />
                )}
              </button>

              {/* NOTIFICATIONS */}

              <button
                onClick={() =>
                  setShowNotifications(
                    !showNotifications
                  )
                }
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border ${panelSoft} ${muted} transition hover:text-emerald-400`}
                title="System Notifications"
              >

                <FiBell />

                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />

              </button>

              {showNotifications && (
                <div
                  className={`absolute right-0 top-14 w-80 rounded-2xl border p-4 shadow-2xl z-50 ${panel}`}
                >

                  <div className="flex items-center justify-between border-b border-inherit pb-3 mb-3">

                    <p
                      className={`text-xs font-bold ${title}`}
                    >
                      System Alerts
                    </p>

                    <button
                      onClick={() =>
                        setShowNotifications(
                          false
                        )
                      }
                      className="text-xs text-stone-400 hover:text-white"
                    >
                      <FiX />
                    </button>

                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto">

                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-300">

                      <p className="font-bold">
                        🚨 Critical Threat Flagged
                      </p>

                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Digital arrest pattern detected via scanner.
                      </p>

                    </div>

                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">

                      <p className="font-bold">
                        ✅ I4C Gateway Synced
                      </p>

                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Database nodes connected successfully.
                      </p>

                    </div>

                  </div>

                </div>
              )}

            </div>

          </header>

          {/* =====================================================
              OVERVIEW
          ===================================================== */}

          {activeTab ===
            'overview' && (
              <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8">

                <section
                  className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 ${panel}`}
                >

                  <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">

                    <div>

                      <div className="mb-4 flex flex-wrap items-center gap-2">

                        <span className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-400">
                          SATRK // CS-1
                        </span>

                        <span
                          className={`text-[11px] ${muted}`}
                        >
                          AI-Based Early Detection of Digital Arrest & Authority Impersonation Scams
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

                      <p
                        className={`mt-4 max-w-2xl text-sm leading-relaxed ${muted}`}
                      >
                        Satrk analyzes suspicious communication across four connected dimensions: content, claimed identity, contextual pressure, and recommended protective action.
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        setActiveTab(
                          'scanner'
                        )
                      }
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#06100d] shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-300"
                    >
                      Open Threat Scanner

                      <FiChevronRight className="transition-transform group-hover:translate-x-1" />
                    </button>

                  </div>

                </section>

                {/* METRICS */}

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <MetricCard
                    label="Signals Analyzed"
                    value="2,847"
                    note="+12.4% this session"
                    icon={
                      <FiActivity />
                    }
                    accent="text-cyan-400"
                    panel={panel}
                    title={title}
                    muted={muted}
                  />

                  <MetricCard
                    label="Threats Flagged"
                    value={liveThreats.toString()}
                    note="Live detection counter"
                    icon={
                      <FiAlertTriangle />
                    }
                    accent="text-orange-400"
                    panel={panel}
                    title={title}
                    muted={muted}
                  />

                  <MetricCard
                    label="High-Risk Cases"
                    value="27"
                    note="Require immediate review"
                    icon={
                      <FiAlertCircle />
                    }
                    accent="text-red-400"
                    panel={panel}
                    title={title}
                    muted={muted}
                  />

                  <MetricCard
                    label="Blocked / Warned"
                    value={blockedToday.toString()}
                    note="Protective actions triggered"
                    icon={
                      <FiShield />
                    }
                    accent="text-emerald-400"
                    panel={panel}
                    title={title}
                    muted={muted}
                  />

                </section>

                {/* GRAPH + ENGINE */}

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_0.9fr]">

                  {/* LINE GRAPH */}

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
                          Live incoming signal fluctuations updated every 3 seconds
                        </p>

                      </div>

                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">

                        <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />

                        <span className="font-mono text-[10px] font-bold text-emerald-400">
                          STREAMING ACTIVE
                        </span>

                      </div>

                    </div>

                    <div className="h-[290px]">

                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >

                        <AreaChart
                          data={
                            chartData
                          }
                        >

                          <defs>

                            <linearGradient
                              id="liveThreatGradient"
                              x1="0"
                              x2="0"
                              y1="0"
                              y2="1"
                            >

                              <stop
                                offset="5%"
                                stopColor="#10b981"
                                stopOpacity={
                                  0.45
                                }
                              />

                              <stop
                                offset="95%"
                                stopColor="#10b981"
                                stopOpacity={
                                  0
                                }
                              />

                            </linearGradient>

                          </defs>

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
                            axisLine={
                              false
                            }
                            tickLine={
                              false
                            }
                            tick={{
                              fill: darkMode
                                ? '#71837d'
                                : '#7a8883',
                              fontSize: 11,
                            }}
                          />

                          <YAxis
                            axisLine={
                              false
                            }
                            tickLine={
                              false
                            }
                            tick={{
                              fill: darkMode
                                ? '#71837d'
                                : '#7a8883',
                              fontSize: 11,
                            }}
                          />

                          <Tooltip
                            contentStyle={{
                              backgroundColor:
                                darkMode
                                  ? '#0b1614'
                                  : '#ffffff',
                              border:
                                darkMode
                                  ? '1px solid #1d312d'
                                  : '1px solid #dce7e3',
                              borderRadius:
                                '14px',
                              color:
                                darkMode
                                  ? '#eef5f1'
                                  : '#15201d',
                              fontSize:
                                '12px',
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="threats"
                            stroke="#34d399"
                            strokeWidth={
                              3
                            }
                            fill="url(#liveThreatGradient)"
                            isAnimationActive={
                              false
                            }
                          />

                        </AreaChart>

                      </ResponsiveContainer>

                    </div>

                  </div>

                  {/* 4D ENGINE */}

                  <div
                    className={`rounded-3xl border p-5 md:p-6 ${panel}`}
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <p
                          className={`text-xs font-semibold ${title}`}
                        >
                          4D Analysis Engine
                        </p>

                        <p
                          className={`mt-1 text-[11px] ${muted}`}
                        >
                          Four connected layers of reasoning
                        </p>

                      </div>

                      <span className="font-mono text-[10px] text-emerald-400">
                        04 / 04 ONLINE
                      </span>

                    </div>

                    <div className="mt-6 space-y-3">

                      {[
                        {
                          no: '01',
                          title: 'Content',
                          desc: 'Language, urgency, threats & coercion',
                          value: 98,
                        },
                        {
                          no: '02',
                          title: 'Identity',
                          desc: 'Authority claims & impersonation cues',
                          value: 94,
                        },
                        {
                          no: '03',
                          title: 'Context',
                          desc: 'Pressure patterns & scam sequence',
                          value: 91,
                        },
                        {
                          no: '04',
                          title: 'Defense',
                          desc: 'Risk reasoning & protective guidance',
                          value: 96,
                        },
                      ].map(
                        (
                          dimension
                        ) => (
                          <div
                            key={
                              dimension.no
                            }
                            className={`rounded-2xl border p-3.5 ${panelSoft}`}
                          >

                            <div className="flex items-center gap-3">

                              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-500/10 font-mono text-xs text-emerald-400">
                                {
                                  dimension.no
                                }
                              </span>

                              <div className="min-w-0 flex-1">

                                <div className="flex justify-between gap-2">

                                  <p
                                    className={`text-xs font-bold ${title}`}
                                  >
                                    {
                                      dimension.title
                                    }
                                  </p>

                                  <span className="font-mono text-[10px] text-emerald-400">
                                    {
                                      dimension.value
                                    }
                                    %
                                  </span>

                                </div>

                                <p
                                  className={`mt-1 truncate text-[10px] ${muted}`}
                                >
                                  {
                                    dimension.desc
                                  }
                                </p>

                                <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/20">

                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                                    style={{
                                      width: `${dimension.value}%`,
                                    }}
                                  />

                                </div>

                              </div>

                            </div>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                </section>

                {/* RECENT INCIDENTS */}

                <section
                  className={`rounded-3xl border ${panel}`}
                >

                  <div className="flex items-center justify-between border-b border-inherit p-5 md:p-6">

                    <div>

                      <h3
                        className={`text-sm font-bold ${title}`}
                      >
                        Recent Threat Signals
                      </h3>

                      <p
                        className={`mt-1 text-[11px] ${muted}`}
                      >
                        Latest activity from Satrk threat database
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        setActiveTab(
                          'incidents'
                        )
                      }
                      className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                    >
                      View registry
                    </button>

                  </div>

                  <div className="divide-y divide-white/[0.055]">

                    {recentIncidents.map(
                      (
                        incident: any
                      ) => (
                        <div
                          key={
                            incident.id
                          }
                          className="flex flex-col gap-4 p-4 transition hover:bg-white/[0.018] md:flex-row md:items-center md:p-5"
                        >

                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                            style={{
                              borderColor: `${getRiskColor(
                                incident.score
                              )}33`,
                              backgroundColor: `${getRiskColor(
                                incident.score
                              )}10`,
                              color:
                                getRiskColor(
                                  incident.score
                                ),
                            }}
                          >
                            <FiAlertTriangle />
                          </div>

                          <div className="flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <p
                                className={`text-sm font-semibold ${title}`}
                              >
                                {
                                  incident.title
                                }
                              </p>

                              <span
                                className={`rounded-md border px-2 py-0.5 text-[9px] font-bold ${getRiskStyle(
                                  incident.risk
                                )}`}
                              >
                                {
                                  incident.risk
                                }
                              </span>

                            </div>

                            <p
                              className={`mt-1 text-[11px] ${muted}`}
                            >
                              {
                                incident.id
                              }{' '}
                              ·{' '}
                              {
                                incident.source
                              }{' '}
                              ·{' '}
                              {
                                incident.time
                              }
                            </p>

                          </div>

                          <div className="flex items-center gap-3">

                            <div className="text-right">

                              <p
                                className={`text-[10px] ${muted}`}
                              >
                                Risk score
                              </p>

                              <p
                                className="font-mono text-sm font-bold"
                                style={{
                                  color:
                                    getRiskColor(
                                      incident.score
                                    ),
                                }}
                              >
                                {
                                  incident.score
                                }
                                %
                              </p>

                            </div>

                            <button
                              onClick={() =>
                                setActiveTab(
                                  'scanner'
                                )
                              }
                              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${panelSoft} ${muted} hover:text-emerald-400`}
                            >
                              <FiChevronRight />
                            </button>

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </section>

              </div>
            )}

          {/* =====================================================
              SCANNER
          ===================================================== */}

          {activeTab ===
            'scanner' && (
              <div className="mx-auto max-w-[1300px] p-5 md:p-8">

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">

                  {/* INPUT */}

                  <section
                    className={`overflow-hidden rounded-3xl border ${panel}`}
                  >

                    <div className="border-b border-inherit p-6">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <div className="flex items-center gap-2">

                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                            <p className="font-mono text-[10px] tracking-[0.16em] text-emerald-400">
                              SATRK AI INVESTIGATION CONSOLE
                            </p>

                          </div>

                          <h2
                            className={`mt-3 text-xl font-black ${title}`}
                          >
                            Threat Scanner
                          </h2>

                          <p
                            className={`mt-2 max-w-xl text-xs leading-relaxed ${muted}`}
                          >
                            Paste a suspicious message or upload a screenshot. Satrk will inspect impersonation, coercion, urgency, and digital arrest patterns.
                          </p>

                        </div>

                        <button
                          onClick={
                            handleSample
                          }
                          className={`hidden rounded-xl border px-3 py-2 text-xs text-emerald-400 transition hover:border-emerald-400/30 sm:inline-flex ${panelSoft}`}
                        >
                          Load demo
                        </button>

                      </div>

                    </div>

                    <div className="space-y-6 p-6">

                      {/* TEXT */}

                      <div>

                        <div className="mb-2 flex items-center justify-between">

                          <label
                            className={`text-xs font-bold ${title}`}
                          >
                            Suspicious message
                          </label>

                          <span
                            className={`font-mono text-[10px] ${muted}`}
                          >
                            {
                              textInput.length
                            }{' '}
                            characters
                          </span>

                        </div>

                        <textarea
                          value={
                            textInput
                          }
                          onChange={(e) => {
                            setTextInput(
                              e.target
                                .value
                            );

                            setResult(
                              null
                            );

                            setError('');
                          }}
                          placeholder="Paste the suspicious SMS, WhatsApp message, email or chat content here..."
                          className={`min-h-[220px] w-full resize-none rounded-2xl border p-5 text-sm leading-relaxed outline-none transition ${darkMode
                              ? 'border-[#1d312d] bg-[#07100f] text-[#e8eeea] placeholder:text-[#53645e] focus:border-emerald-400/40'
                              : 'border-[#dce7e3] bg-[#f8faf9] text-[#17211f] placeholder:text-[#9aa8a2] focus:border-emerald-500/40'
                            }`}
                        />

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                          <button
                            onClick={
                              handleTextScan
                            }
                            disabled={
                              loading ||
                              !textInput.trim()
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#06100d] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >

                            {loading ? (
                              <>
                                <FiActivity className="animate-spin" />
                                ANALYZING...
                              </>
                            ) : (
                              <>
                                <FiShield />
                                RUN AI ANALYSIS
                              </>
                            )}

                          </button>

                          <button
                            onClick={
                              resetScanner
                            }
                            className={`rounded-xl border px-5 py-3 text-sm ${panelSoft} ${muted} transition hover:text-red-400`}
                          >
                            CLEAR
                          </button>

                        </div>

                      </div>

                      {/* IMAGE */}

                      <div
                        className={`rounded-2xl border border-dashed p-5 ${panelSoft}`}
                      >

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">

                            <FiImage className="text-xl" />

                          </div>

                          <div className="flex-1">

                            <p
                              className={`text-xs font-bold ${title}`}
                            >
                              Screenshot / image analysis
                            </p>

                            <p
                              className={`mt-1 text-[11px] ${muted}`}
                            >
                              Upload suspicious chats, notices or authority impersonation screenshots.
                            </p>

                          </div>

                          <input
                            ref={
                              fileInputRef
                            }
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file =
                                e.target
                                  .files?.[0] ??
                                null;

                              setSelectedFile(
                                file
                              );

                              setResult(
                                null
                              );

                              setError('');
                            }}
                          />

                          <button
                            onClick={() =>
                              fileInputRef.current?.click()
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs text-emerald-400 transition hover:bg-emerald-500/10"
                          >
                            <FiUploadCloud />
                            Select image
                          </button>

                        </div>

                        {selectedFile && (
                          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-black/10 p-3">

                            <div className="min-w-0">

                              <p
                                className={`truncate text-xs ${title}`}
                              >
                                {
                                  selectedFile.name
                                }
                              </p>

                              <p
                                className={`mt-1 text-[10px] ${muted}`}
                              >
                                {(
                                  selectedFile.size /
                                  1024 /
                                  1024
                                ).toFixed(
                                  2
                                )}{' '}
                                MB
                              </p>

                            </div>

                            <div className="flex gap-2">

                              <button
                                onClick={
                                  handleImageScan
                                }
                                disabled={
                                  loading
                                }
                                className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-[#06100d] disabled:opacity-50"
                              >
                                {loading
                                  ? 'Scanning...'
                                  : 'Scan image'}
                              </button>

                              <button
                                onClick={() =>
                                  setSelectedFile(
                                    null
                                  )
                                }
                                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${panelSoft} ${muted}`}
                              >
                                <FiX />
                              </button>

                            </div>

                          </div>
                        )}

                      </div>

                      {error && (
                        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-300">

                          <FiAlertCircle />

                          {error}

                        </div>
                      )}

                    </div>

                  </section>

                  {/* RESULT */}

                  <section
                    className={`overflow-hidden rounded-3xl border ${panel}`}
                  >

                    <div className="flex items-center justify-between border-b border-inherit p-6">

                      <div>

                        <p
                          className={`text-[10px] font-bold tracking-[0.15em] ${muted} font-mono`}
                        >
                          ANALYSIS STATUS
                        </p>

                        <h3
                          className={`mt-1 font-bold text-base ${title}`}
                        >
                          {loading
                            ? 'Investigation in progress'
                            : scanResult
                              ? 'Analysis completed'
                              : 'Waiting for evidence'}
                        </h3>

                      </div>

                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border ${panelSoft} ${muted}`}
                      >
                        {loading ? (
                          <FiActivity className="animate-spin text-amber-400" />
                        ) : scanResult ? (
                          <FiCheckCircle className="text-emerald-400" />
                        ) : (
                          <FiClock />
                        )}
                      </div>

                    </div>

                    {/* EMPTY */}

                    {!loading &&
                      !scanResult && (
                        <div className="p-6 space-y-6">

                          <div className="space-y-4">

                            {[
                              'Text & OCR extraction',
                              'Scam pattern detection',
                              'Risk scoring & reasoning',
                              'Explainable AI report',
                            ].map(
                              (item) => (
                                <div
                                  key={item}
                                  className="flex items-center gap-3"
                                >

                                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-700 text-stone-600 text-[9px]">
                                    •
                                  </div>

                                  <span className="text-xs text-stone-500">
                                    {item}
                                  </span>

                                </div>
                              )
                            )}

                          </div>

                          <div
                            className={`flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed px-8 text-center ${panelSoft}`}
                          >

                            <FiShieldOff className="mx-auto text-3xl text-stone-600" />

                            <h3
                              className={`mt-4 text-sm font-bold ${title}`}
                            >
                              No active investigation
                            </h3>

                            <p
                              className={`mt-2 text-xs leading-relaxed ${muted}`}
                            >
                              Submit suspicious text or a screenshot to generate an AI threat assessment.
                            </p>

                          </div>

                        </div>
                      )}

                    {/* LOADING */}

                    {loading && (
                      <div className="p-6 space-y-6">

                        <div className="space-y-4">

                          {[
                            {
                              text: 'Text & OCR extraction',
                              done: true,
                            },
                            {
                              text: 'Scam pattern detection',
                              done: true,
                            },
                            {
                              text: 'Risk scoring & reasoning...',
                              active: true,
                            },
                            {
                              text: 'Explainable AI report',
                            },
                          ].map(
                            (
                              item
                            ) => (
                              <div
                                key={
                                  item.text
                                }
                                className="flex items-center gap-3"
                              >

                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-full border ${item.done ||
                                      item.active
                                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-400'
                                      : 'border-stone-700 text-stone-600'
                                    }`}
                                >
                                  {item.done ||
                                    item.active ? (
                                    item.active ? (
                                      <FiActivity className="animate-spin" size={13} />
                                    ) : (
                                      <FiCheckCircle size={13} />
                                    )
                                  ) : (
                                    '•'
                                  )}
                                </div>

                                <span
                                  className={`text-xs ${item.active
                                      ? 'text-emerald-400 font-bold'
                                      : item.done
                                        ? 'text-stone-200'
                                        : 'text-stone-500'
                                    }`}
                                >
                                  {
                                    item.text
                                  }
                                </span>

                              </div>
                            )
                          )}

                        </div>

                      </div>
                    )}

                    {/* RESULT */}

                    {!loading &&
                      scanResult && (
                        <div className="space-y-5 p-6">

                          {/* STEPS */}

                          <div className="space-y-4 mb-6">

                            {[
                              'Text & OCR extraction',
                              'Scam pattern detection',
                              'Risk scoring & reasoning',
                              'Explainable AI report',
                            ].map(
                              (item) => (
                                <div
                                  key={item}
                                  className="flex items-center gap-3"
                                >

                                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-400">
                                    <FiCheckCircle size={13} />
                                  </div>

                                  <span className="text-xs text-stone-200">
                                    {item}
                                  </span>

                                </div>
                              )
                            )}

                          </div>

                          {/* VERDICT */}

                          <div
                            className="rounded-2xl border p-6"
                            style={{
                              borderColor: `${getRiskColor(
                                scanResult.score
                              )}33`,
                              backgroundColor: `${getRiskColor(
                                scanResult.score
                              )}08`,
                            }}
                          >

                            <div className="flex items-start justify-between">

                              <div>

                                <p
                                  className={`font-mono text-[10px] tracking-[0.15em] ${muted}`}
                                >
                                  THREAT VERDICT
                                </p>

                                <h3
                                  className="mt-2 text-xl font-black"
                                  style={{
                                    color:
                                      getRiskColor(
                                        scanResult.score
                                      ),
                                  }}
                                >
                                  {
                                    scanResult.risk
                                  }
                                </h3>

                              </div>

                              <FiShield
                                className="text-2xl"
                                style={{
                                  color:
                                    getRiskColor(
                                      scanResult.score
                                    ),
                                }}
                              />

                            </div>

                            <div className="mt-6">

                              <div className="mb-2 flex justify-between text-xs">

                                <span
                                  className={muted}
                                >
                                  Risk score
                                </span>

                                <span
                                  className="font-mono font-bold"
                                  style={{
                                    color:
                                      getRiskColor(
                                        scanResult.score
                                      ),
                                  }}
                                >
                                  {
                                    scanResult.score
                                  }
                                  %
                                </span>

                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-black/20">

                                <div
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${scanResult.score}%`,
                                    backgroundColor:
                                      getRiskColor(
                                        scanResult.score
                                      ),
                                  }}
                                />

                              </div>

                            </div>

                          </div>

                          {/* SIGNALS */}

                          {scanResult.signals.length >
                            0 && (
                              <div
                                className={`rounded-2xl border p-5 ${panelSoft}`}
                              >

                                <div className="flex items-center gap-2">

                                  <FiAlertTriangle className="text-orange-400" />

                                  <p
                                    className={`text-xs font-bold ${title}`}
                                  >
                                    Detected Signals
                                  </p>

                                </div>

                                <div className="mt-4 space-y-2">

                                  {scanResult.signals.map(
                                    (
                                      signal: any,
                                      index: number
                                    ) => (
                                      <div
                                        key={
                                          index
                                        }
                                        className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-3 text-xs text-[#c8d3ce]"
                                      >
                                        {typeof signal ===
                                          'string'
                                          ? signal
                                          : JSON.stringify(
                                            signal
                                          )}
                                      </div>
                                    )
                                  )}

                                </div>

                              </div>
                            )}

                          {/* EXPLANATION */}

                          <div
                            className={`rounded-2xl border p-5 ${panelSoft}`}
                          >

                            <div className="flex items-center gap-2">

                              <FiFileText className="text-cyan-400" />

                              <p
                                className={`text-xs font-bold ${title}`}
                              >
                                AI Explanation
                              </p>

                            </div>

                            <p
                              className={`mt-3 whitespace-pre-wrap text-xs leading-relaxed ${muted}`}
                            >
                              {
                                scanResult.explanation
                              }
                            </p>

                          </div>

                          {/* I4C */}

                          {scanResult.score >=
                            70 && (
                              <div className="pt-2">

                                {i4cReported ? (
                                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center space-y-1">

                                    <p>
                                      ✅ Successfully Dispatched to I4C Portal!
                                    </p>

                                    <p className="text-[10px] font-mono text-[#82938e]">
                                      Tracking ID:{' '}
                                      {
                                        i4cTrackingId
                                      }
                                    </p>

                                  </div>
                                ) : (
                                  <button
                                    onClick={
                                      handleReportToI4c
                                    }
                                    className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
                                  >
                                    🚨 Report Threat to I4C Portal
                                  </button>
                                )}

                              </div>
                            )}

                          {/* ACTIONS */}

                          <div className="grid grid-cols-2 gap-3">

                            <button
                              onClick={
                                resetScanner
                              }
                              className={`rounded-xl border px-4 py-3 text-xs ${panelSoft} ${muted}`}
                            >
                              New scan
                            </button>

                            <button
                              onClick={
                                generatePDF
                              }
                              className="rounded-xl bg-emerald-400 px-4 py-3 text-xs font-bold text-[#06100d]"
                            >
                              Download PDF
                            </button>

                          </div>

                        </div>
                      )}

                  </section>

                </div>

              </div>
            )}

          {/* =====================================================
              INCIDENTS
          ===================================================== */}

          {activeTab ===
            'incidents' && (
              <div className="mx-auto max-w-[1300px] p-5 md:p-8">

                <section
                  className={`overflow-hidden rounded-3xl border ${panel}`}
                >

                  <div className="flex items-center justify-between border-b border-inherit p-6">

                    <div>

                      <h2
                        className={`text-xl font-black ${title}`}
                      >
                        Incident Registry
                      </h2>

                      <p
                        className={`mt-2 text-xs ${muted}`}
                      >
                        Recorded high-confidence threat detections
                      </p>

                    </div>

                  </div>

                  <div className="divide-y divide-white/[0.055]">

                    {recentIncidents.map(
                      (
                        incident: any
                      ) => (
                        <div
                          key={
                            incident.id
                          }
                          className="flex items-center gap-4 p-5 transition hover:bg-white/[0.018] md:p-6"
                        >

                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `${getRiskColor(
                                incident.score
                              )}12`,
                              color:
                                getRiskColor(
                                  incident.score
                                ),
                            }}
                          >
                            <FiAlertTriangle />
                          </div>

                          <div className="min-w-0 flex-1">

                            <p
                              className={`text-sm font-semibold ${title}`}
                            >
                              {
                                incident.title
                              }
                            </p>

                            <p
                              className={`mt-1 text-[11px] ${muted}`}
                            >
                              {
                                incident.id
                              }{' '}
                              ·{' '}
                              {
                                incident.source
                              }{' '}
                              ·{' '}
                              {
                                incident.time
                              }
                            </p>

                          </div>

                          <span
                            className={`hidden rounded-lg border px-3 py-1.5 text-[10px] font-bold sm:inline-flex ${getRiskStyle(
                              incident.risk
                            )}`}
                          >
                            {
                              incident.risk
                            }
                          </span>

                          <span
                            className="font-mono text-sm font-bold"
                            style={{
                              color:
                                getRiskColor(
                                  incident.score
                                ),
                            }}
                          >
                            {
                              incident.score
                            }
                            %
                          </span>

                        </div>
                      )
                    )}

                  </div>

                </section>

              </div>
            )}

          {/* =====================================================
              INTELLIGENCE
          ===================================================== */}

          {activeTab ===
            'intel' && (
              <div className="mx-auto max-w-[1300px] p-5 md:p-8">

                <section
                  className={`rounded-3xl border p-6 md:p-8 ${panel}`}
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">

                      <FiLayers className="text-xl" />

                    </div>

                    <div>

                      <h2
                        className={`text-xl font-black ${title}`}
                      >
                        Threat Intelligence Layer
                      </h2>

                      <p
                        className={`mt-1 text-xs ${muted}`}
                      >
                        Research-backed scam patterns and detection signals
                      </p>

                    </div>

                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">

                    {[
                      {
                        title:
                          'Impersonation',

                        text:
                          'Claims involving police, CBI, ED, RBI, banks or government authorities.',
                      },

                      {
                        title:
                          'Psychological Pressure',

                        text:
                          'Fear, urgency, secrecy, isolation and threats used to control the victim.',
                      },

                      {
                        title:
                          'Digital Arrest Pattern',

                        text:
                          'False accusations followed by continuous monitoring or demands for immediate action.',
                      },
                    ].map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            item.title
                          }
                          className={`rounded-2xl border p-5 ${panelSoft}`}
                        >

                          <span className="font-mono text-[10px] text-emerald-400">
                            INT-0
                            {index + 1}
                          </span>

                          <h3
                            className={`mt-3 text-sm font-bold ${title}`}
                          >
                            {
                              item.title
                            }
                          </h3>

                          <p
                            className={`mt-2 text-xs leading-relaxed ${muted}`}
                          >
                            {
                              item.text
                            }
                          </p>

                        </div>
                      )
                    )}

                  </div>

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
      className={`rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 ${panel}`}
    >

      <div className="flex items-start justify-between">

        <div>

          <p
            className={`text-xs ${muted}`}
          >
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

      <p
        className={`mt-4 text-[11px] ${muted}`}
      >
        {note}
      </p>

    </div>
  );
}