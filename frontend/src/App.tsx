import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiAlertTriangle,
  FiBell,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiGrid,
  FiImage,
  FiLayers,
  FiMenu,
  FiMoon,
  FiMoreHorizontal,
  FiSearch,
  FiSettings,
  FiShield,
  FiSun,
  FiUpload,
  FiUsers,
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

import { scanImageMessage, scanTextMessage } from './services/api';

type Tab = 'overview' | 'scanner' | 'incidents' | 'intel';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const threatData = [
  { time: '08:00', threats: 18, blocked: 14 },
  { time: '09:00', threats: 26, blocked: 21 },
  { time: '10:00', threats: 19, blocked: 17 },
  { time: '11:00', threats: 42, blocked: 34 },
  { time: '12:00', threats: 37, blocked: 31 },
  { time: '13:00', threats: 58, blocked: 49 },
  { time: '14:00', threats: 46, blocked: 40 },
  { time: '15:00', threats: 71, blocked: 61 },
];

const recentIncidents = [
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
  {
    id: 'INC-4817',
    title: 'Suspicious identity verification request',
    source: 'Screenshot scan',
    time: '24 min ago',
    risk: 'MEDIUM' as RiskLevel,
    score: 64,
  },
  {
    id: 'INC-4812',
    title: 'Government agency impersonation signal',
    source: 'Email content',
    time: '42 min ago',
    risk: 'HIGH' as RiskLevel,
    score: 84,
  },
];

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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [liveThreats, setLiveThreats] = useState(128);
  const [blockedToday, setBlockedToday] = useState(114);
  const [systemPulse, setSystemPulse] = useState(98.7);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveThreats((prev) => Math.max(120, prev + (Math.random() > 0.65 ? 1 : 0)));
      setBlockedToday((prev) => Math.max(100, prev + (Math.random() > 0.72 ? 1 : 0)));
      setSystemPulse(Number((98.4 + Math.random() * 1.4).toFixed(1)));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const scanResult = useMemo(() => {
    if (!result) return null;

    const score =
      result.risk_score ??
      result.riskScore ??
      result.score ??
      result.confidence ??
      0;

    const normalizedScore =
      score <= 1 ? Math.round(score * 100) : Math.round(score);

    const risk =
      result.risk_level ??
      result.riskLevel ??
      result.verdict ??
      (normalizedScore >= 85
        ? 'CRITICAL'
        : normalizedScore >= 65
          ? 'HIGH'
          : normalizedScore >= 40
            ? 'MEDIUM'
            : 'LOW');

    const explanation =
      result.ai_explanation?.detailed_explanation ??
      result.ai_explanation ??
      result.explanation ??
      result.reason ??
      'The analysis has been completed successfully.';

    const signals =
      result.detected_signals ??
      result.signals ??
      result.reasons ??
      [];

    return {
      score: Math.min(100, normalizedScore),
      risk: String(risk).toUpperCase(),
      explanation:
        typeof explanation === 'string'
          ? explanation
          : JSON.stringify(explanation, null, 2),
      signals: Array.isArray(signals) ? signals : [],
    };
  }, [result]);

  const handleTextScan = async () => {
    if (!textInput.trim()) {
      setError('Please paste a suspicious message before starting the analysis.');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setError('');

      const data = await scanTextMessage(textInput);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the analysis engine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageScan = async () => {
    if (!selectedFile) {
      setError('Please select a screenshot before starting the analysis.');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setError('');

      const data = await scanImageMessage(selectedFile);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Unable to analyze the screenshot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSample = () => {
    setTextInput(
      `This is Inspector Rajesh from CBI. Your Aadhaar has been linked to a money laundering case. You are under digital arrest and cannot contact anyone. Join this video call immediately or police action will be taken.`
    );
    setActiveTab('scanner');
    setResult(null);
    setError('');
  };

  const bg = darkMode ? 'bg-[#07100f] text-[#e8eeea]' : 'bg-[#f4f7f6] text-[#17211f]';
  const panel = darkMode
    ? 'bg-[#0b1614] border-[#1d312d]'
    : 'bg-white border-[#dce7e3]';
  const panelSoft = darkMode
    ? 'bg-[#091210] border-[#172924]'
    : 'bg-[#f8faf9] border-[#e1ebe7]';
  const muted = darkMode ? 'text-[#82938e]' : 'text-[#72807b]';
  const title = darkMode ? 'text-[#eef5f1]' : 'text-[#15201d]';

  const navItems = [
    { id: 'overview' as Tab, label: 'Command Center', icon: FiGrid },
    { id: 'scanner' as Tab, label: 'Threat Scanner', icon: FiSearch },
    { id: 'incidents' as Tab, label: 'Incidents', icon: FiAlertTriangle },
    { id: 'intel' as Tab, label: 'Threat Intelligence', icon: FiLayers },
  ];

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.035] blur-3xl" />
        <div className="absolute top-[30%] right-[-180px] w-[420px] h-[420px] rounded-full bg-cyan-500/[0.025] blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={`${sidebarOpen ? 'w-[250px]' : 'w-[78px]'
            } hidden md:flex flex-col border-r ${darkMode ? 'bg-[#091310]/95 border-[#1a2b27]' : 'bg-white/95 border-[#dce7e3]'
            } backdrop-blur-xl transition-all duration-300 sticky top-0 h-screen`}
        >
          <div className="p-5 border-b border-inherit">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl border border-emerald-400/30 bg-emerald-500/10 flex items-center justify-center">
                <FiShield className="text-emerald-400 text-xl" />
                <span className="absolute -right-1 -bottom-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#091310]" />
              </div>

              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h1 className={`font-black tracking-[0.18em] text-sm ${title}`}>
                    NEXUS
                  </h1>
                  <p className="text-[9px] tracking-[0.22em] text-emerald-400 mt-0.5">
                    FOUR-DIMENSION DEFENSE
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="px-3 py-6 flex-1">
            {sidebarOpen && (
              <p className={`px-3 mb-3 text-[10px] font-bold tracking-[0.16em] ${muted}`}>
                WORKSPACE
              </p>
            )}

            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'
                      } py-3 rounded-xl text-sm transition-all ${active
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 shadow-[0_0_24px_rgba(16,185,129,0.05)]'
                        : `${muted} hover:bg-white/5 hover:text-emerald-200`
                      }`}
                  >
                    <Icon className="text-lg shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>

            {sidebarOpen && (
              <div className={`mt-8 p-4 rounded-2xl border ${panelSoft}`}>
                <div className="flex items-center gap-2 mb-3">
                  <FiZap className="text-amber-400" />
                  <span className={`text-xs font-bold ${title}`}>Defense Status</span>
                </div>

                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={muted}>System integrity</span>
                  <span className="text-emerald-400 font-mono">{systemPulse}%</span>
                </div>

                <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                    style={{ width: `${systemPulse}%` }}
                  />
                </div>

                <p className={`mt-3 text-[10px] leading-relaxed ${muted}`}>
                  All four analysis dimensions are operational.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-inherit space-y-1">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center'
                } py-3 rounded-xl ${muted} hover:bg-white/5 transition`}
            >
              {darkMode ? <FiSun /> : <FiMoon />}
              {sidebarOpen && <span className="text-sm">Appearance</span>}
            </button>

            <button
              className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center'
                } py-3 rounded-xl ${muted} hover:bg-white/5 transition`}
            >
              <FiSettings />
              {sidebarOpen && <span className="text-sm">Settings</span>}
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0">
          {/* HEADER */}
          <header
            className={`sticky top-0 z-30 h-[76px] px-5 md:px-8 flex items-center justify-between border-b ${darkMode
                ? 'bg-[#07100f]/90 border-[#1a2b27]'
                : 'bg-white/90 border-[#dce7e3]'
              } backdrop-blur-xl`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`hidden md:flex w-10 h-10 rounded-xl items-center justify-center border ${panelSoft} ${muted} hover:text-emerald-400 transition`}
              >
                <FiMenu />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] font-mono tracking-[0.16em] text-emerald-400">
                    LIVE DEFENSE NETWORK
                  </p>
                </div>

                <h2 className={`font-bold text-sm md:text-base mt-1 ${title}`}>
                  {activeTab === 'overview' && 'Command Center'}
                  {activeTab === 'scanner' && 'Threat Analysis Workspace'}
                  {activeTab === 'incidents' && 'Incident Registry'}
                  {activeTab === 'intel' && 'Threat Intelligence'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className={`hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border ${panelSoft}`}>
                <FiSearch className={muted} />
                <input
                  placeholder="Search incidents..."
                  className={`bg-transparent outline-none text-xs w-44 ${title}`}
                />
              </div>

              <button
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center border ${panelSoft} ${muted} hover:text-emerald-400 transition`}
              >
                <FiBell />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-400" />
              </button>

              <div className="hidden sm:flex items-center gap-2 pl-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-black text-[#06100d]">
                  RC
                </div>
              </div>
            </div>
          </header>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="max-w-[1500px] mx-auto p-5 md:p-8 space-y-6">
              {/* HERO */}
              <section
                className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 ${panel}`}
              >
                <div className="absolute right-0 top-0 w-[300px] h-full opacity-40 pointer-events-none">
                  <div className="absolute right-[-100px] top-[-100px] w-[300px] h-[300px] rounded-full border border-emerald-400/20" />
                  <div className="absolute right-[-30px] top-[-30px] w-[180px] h-[180px] rounded-full border border-cyan-400/10" />
                </div>

                <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-[10px] font-bold tracking-widest text-emerald-400">
                        CS-1 // ACTIVE
                      </span>
                      <span className={`text-[11px] ${muted}`}>
                        AI-Based Early Detection of Digital Arrest & Authority Impersonation Scams
                      </span>
                    </div>

                    <h1 className={`text-2xl md:text-4xl font-black tracking-tight ${title}`}>
                      Detect the pressure.
                      <br />
                      <span className="text-emerald-400">Break the deception chain.</span>
                    </h1>

                    <p className={`mt-4 max-w-2xl text-sm leading-relaxed ${muted}`}>
                      NEXUS analyzes suspicious communication across four connected dimensions:
                      content, claimed identity, contextual pressure, and recommended protective action.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('scanner')}
                    className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 text-[#06100d] font-bold text-sm hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/10"
                  >
                    Open Threat Scanner
                    <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </section>

              {/* METRICS */}
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Signals Analyzed',
                    value: '2,847',
                    note: '+12.4% this session',
                    icon: FiActivity,
                    accent: 'text-cyan-400',
                  },
                  {
                    label: 'Threats Flagged',
                    value: liveThreats.toString(),
                    note: 'Live detection counter',
                    icon: FiAlertTriangle,
                    accent: 'text-orange-400',
                  },
                  {
                    label: 'High-Risk Cases',
                    value: '27',
                    note: 'Require immediate review',
                    icon: FiAlertCircle,
                    accent: 'text-red-400',
                  },
                  {
                    label: 'Blocked / Warned',
                    value: blockedToday.toString(),
                    note: 'Protective actions triggered',
                    icon: FiShield,
                    accent: 'text-emerald-400',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className={`rounded-2xl border p-5 ${panel} hover:-translate-y-0.5 transition-transform`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-xs ${muted}`}>{item.label}</p>
                          <h3 className={`mt-2 text-3xl font-black ${title}`}>{item.value}</h3>
                        </div>

                        <div className={`p-2.5 rounded-xl bg-white/[0.035] ${item.accent}`}>
                          <Icon className="text-lg" />
                        </div>
                      </div>

                      <p className={`mt-4 text-[11px] ${muted}`}>{item.note}</p>
                    </div>
                  );
                })}
              </section>

              {/* MAIN GRID */}
              <section className="grid grid-cols-1 xl:grid-cols-[1.55fr_0.9fr] gap-6">
                {/* CHART */}
                <div className={`rounded-3xl border p-5 md:p-6 ${panel}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className={`text-xs font-semibold ${title}`}>Threat Activity</p>
                      <p className={`text-[11px] mt-1 ${muted}`}>
                        Detected scam signals versus completed protective actions
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
                    </div>
                  </div>

                  <div className="h-[290px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={threatData}>
                        <defs>
                          <linearGradient id="threatGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                          </linearGradient>

                          <linearGradient id="blockedGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          vertical={false}
                          stroke={darkMode ? '#1a2b27' : '#e4ece8'}
                        />

                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: darkMode ? '#71837d' : '#7a8883', fontSize: 11 }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: darkMode ? '#71837d' : '#7a8883', fontSize: 11 }}
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? '#0b1614' : '#ffffff',
                            border: darkMode ? '1px solid #1d312d' : '1px solid #dce7e3',
                            borderRadius: '14px',
                            color: darkMode ? '#eef5f1' : '#15201d',
                            fontSize: '12px',
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="threats"
                          stroke="#34d399"
                          strokeWidth={2.5}
                          fill="url(#threatGradient)"
                        />

                        <Area
                          type="monotone"
                          dataKey="blocked"
                          stroke="#22d3ee"
                          strokeWidth={2}
                          fill="url(#blockedGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4D ENGINE */}
                <div className={`rounded-3xl border p-5 md:p-6 ${panel}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-semibold ${title}`}>4D Analysis Engine</p>
                      <p className={`text-[11px] mt-1 ${muted}`}>
                        Four connected layers of reasoning
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400">
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
                    ].map((dimension) => (
                      <div
                        key={dimension.no}
                        className={`p-3.5 rounded-2xl border ${panelSoft}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 font-mono text-xs border border-emerald-400/10">
                            {dimension.no}
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-2">
                              <p className={`text-xs font-bold ${title}`}>
                                {dimension.title}
                              </p>
                              <span className="text-[10px] font-mono text-emerald-400">
                                {dimension.value}%
                              </span>
                            </div>

                            <p className={`text-[10px] mt-1 truncate ${muted}`}>
                              {dimension.desc}
                            </p>

                            <div className="mt-2 h-1 rounded-full bg-black/20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                                style={{ width: `${dimension.value}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* INCIDENTS */}
              <section className={`rounded-3xl border ${panel}`}>
                <div className="p-5 md:p-6 flex items-center justify-between border-b border-inherit">
                  <div>
                    <h3 className={`text-sm font-bold ${title}`}>Recent Threat Signals</h3>
                    <p className={`text-[11px] mt-1 ${muted}`}>
                      Latest activity requiring analysis or review
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('incidents')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    View registry
                  </button>
                </div>

                <div className="divide-y divide-white/[0.055]">
                  {recentIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/[0.018] transition"
                    >
                      <div
                        className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border"
                        style={{
                          borderColor: `${getRiskColor(incident.score)}33`,
                          backgroundColor: `${getRiskColor(incident.score)}10`,
                          color: getRiskColor(incident.score),
                        }}
                      >
                        <FiAlertTriangle />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${title}`}>{incident.title}</p>
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${getRiskStyle(
                              incident.risk
                            )}`}
                          >
                            {incident.risk}
                          </span>
                        </div>

                        <p className={`text-[11px] mt-1 ${muted}`}>
                          {incident.id} · {incident.source} · {incident.time}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[10px] text-[#82938e]">Risk score</p>
                          <p
                            className="font-mono text-sm font-bold"
                            style={{ color: getRiskColor(incident.score) }}
                          >
                            {incident.score}%
                          </p>
                        </div>

                        <button
                          onClick={() => setActiveTab('scanner')}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${panelSoft} ${muted} hover:text-emerald-400`}
                        >
                          <FiChevronRight />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* SCANNER */}
          {activeTab === 'scanner' && (
            <div className="max-w-[1300px] mx-auto p-5 md:p-8">
              <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
                {/* INPUT */}
                <section className={`rounded-3xl border overflow-hidden ${panel}`}>
                  <div className="p-6 border-b border-inherit">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <p className="text-[10px] font-mono tracking-[0.16em] text-emerald-400">
                            ANALYSIS SESSION
                          </p>
                        </div>

                        <h2 className={`mt-3 text-xl font-black ${title}`}>
                          Threat Scanner
                        </h2>

                        <p className={`mt-2 text-xs leading-relaxed max-w-xl ${muted}`}>
                          Paste a suspicious message or upload a screenshot. The engine will inspect
                          impersonation, coercion, urgency, authority claims and scam patterns.
                        </p>
                      </div>

                      <button
                        onClick={handleSample}
                        className={`hidden sm:inline-flex px-3 py-2 rounded-xl border text-xs ${panelSoft} text-emerald-400 hover:border-emerald-400/30 transition`}
                      >
                        Load demo
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className={`text-xs font-bold ${title}`}>
                          Suspicious message
                        </label>

                        <span className={`text-[10px] font-mono ${muted}`}>
                          {textInput.length} characters
                        </span>
                      </div>

                      <textarea
                        value={textInput}
                        onChange={(e) => {
                          setTextInput(e.target.value);
                          setError('');
                        }}
                        placeholder="Paste the suspicious SMS, WhatsApp message, email or chat content here..."
                        className={`w-full min-h-[250px] rounded-2xl border p-5 resize-none outline-none text-sm leading-relaxed transition ${darkMode
                            ? 'bg-[#07100f] border-[#1d312d] text-[#e8eeea] placeholder:text-[#53645e] focus:border-emerald-400/40'
                            : 'bg-[#f8faf9] border-[#dce7e3] text-[#17211f] placeholder:text-[#9aa8a2] focus:border-emerald-500/40'
                          }`}
                      />

                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleTextScan}
                          disabled={loading || !textInput.trim()}
                          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 text-[#06100d] font-bold text-sm hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          {loading ? (
                            <>
                              <FiActivity className="animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <FiShield />
                              Run threat analysis
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setTextInput('');
                            setResult(null);
                            setError('');
                          }}
                          className={`px-5 py-3 rounded-xl border text-sm ${panelSoft} ${muted} hover:text-red-400 transition`}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* UPLOAD */}
                    <div className={`rounded-2xl border border-dashed p-5 ${panelSoft}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                          <FiImage className="text-xl" />
                        </div>

                        <div className="flex-1">
                          <p className={`text-xs font-bold ${title}`}>
                            Screenshot / image analysis
                          </p>
                          <p className={`text-[11px] mt-1 ${muted}`}>
                            Upload suspicious chats, notices or authority impersonation screenshots.
                          </p>
                        </div>

                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-emerald-400 hover:bg-emerald-500/10 transition">
                            <FiUpload />
                            Select image
                          </span>

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              setSelectedFile(e.target.files?.[0] ?? null);
                              setError('');
                            }}
                          />
                        </label>
                      </div>

                      {selectedFile && (
                        <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-black/10">
                          <div className="min-w-0">
                            <p className={`text-xs truncate ${title}`}>{selectedFile.name}</p>
                            <p className={`text-[10px] mt-1 ${muted}`}>
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleImageScan}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg text-xs font-bold bg-cyan-400 text-[#06100d] disabled:opacity-50"
                            >
                              Scan image
                            </button>

                            <button
                              onClick={() => setSelectedFile(null)}
                              className={`w-9 h-9 rounded-lg border ${panelSoft} ${muted}`}
                            >
                              <FiX />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-300 text-xs">
                        <FiAlertCircle />
                        {error}
                      </div>
                    )}
                  </div>
                </section>

                {/* RESULT */}
                <section className={`rounded-3xl border overflow-hidden ${panel}`}>
                  <div className="p-6 border-b border-inherit flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-bold ${title}`}>Analysis verdict</p>
                      <p className={`text-[11px] mt-1 ${muted}`}>
                        Evidence and explainable risk reasoning
                      </p>
                    </div>

                    <FiMoreHorizontal className={muted} />
                  </div>

                  {!loading && !scanResult && (
                    <div className="p-6">
                      <div className={`min-h-[460px] rounded-2xl border border-dashed flex flex-col items-center justify-center text-center px-8 ${panelSoft}`}>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5">
                          <FiShield className="text-3xl" />
                        </div>

                        <h3 className={`font-bold ${title}`}>Awaiting input</h3>

                        <p className={`mt-3 text-xs leading-relaxed max-w-xs ${muted}`}>
                          Start a scan to generate a risk verdict, detected signals and explanation.
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-xs">
                          {['Content', 'Identity', 'Context', 'Defense'].map((item, index) => (
                            <div
                              key={item}
                              className={`p-3 rounded-xl border ${panelSoft} text-left`}
                            >
                              <p className="text-[9px] text-emerald-400 font-mono">0{index + 1}</p>
                              <p className={`text-[11px] mt-1 ${title}`}>{item}</p>
                              <p className={`text-[9px] mt-1 ${muted}`}>Waiting</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="p-6">
                      <div className={`min-h-[460px] rounded-2xl border flex flex-col items-center justify-center text-center ${panelSoft}`}>
                        <div className="relative w-20 h-20 mb-6">
                          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
                          <div className="absolute inset-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <FiActivity className="text-emerald-400 animate-pulse" />
                          </div>
                        </div>

                        <h3 className={`font-bold ${title}`}>Processing threat signals</h3>

                        <div className="mt-6 space-y-3 text-left">
                          {[
                            'Extracting communication signals',
                            'Checking impersonation indicators',
                            'Evaluating pressure and urgency',
                            'Generating explainable risk verdict',
                          ].map((step, index) => (
                            <div key={step} className="flex items-center gap-3 text-xs">
                              <FiCheck
                                className={index < 2 ? 'text-emerald-400' : 'text-[#53645e]'}
                              />
                              <span className={index < 2 ? title : muted}>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {!loading && scanResult && (
                    <div className="p-6 space-y-5">
                      <div
                        className="rounded-2xl border p-6"
                        style={{
                          borderColor: `${getRiskColor(scanResult.score)}33`,
                          backgroundColor: `${getRiskColor(scanResult.score)}08`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-[10px] font-mono tracking-[0.15em] ${muted}`}>
                              THREAT VERDICT
                            </p>

                            <h3
                              className="mt-2 text-xl font-black"
                              style={{ color: getRiskColor(scanResult.score) }}
                            >
                              {scanResult.risk}
                            </h3>
                          </div>

                          <FiShield
                            className="text-2xl"
                            style={{ color: getRiskColor(scanResult.score) }}
                          />
                        </div>

                        <div className="mt-6">
                          <div className="flex justify-between text-xs mb-2">
                            <span className={muted}>Risk score</span>
                            <span
                              className="font-mono font-bold"
                              style={{ color: getRiskColor(scanResult.score) }}
                            >
                              {scanResult.score}%
                            </span>
                          </div>

                          <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${scanResult.score}%`,
                                backgroundColor: getRiskColor(scanResult.score),
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-2xl border p-5 ${panelSoft}`}>
                        <div className="flex items-center gap-2">
                          <FiFileText className="text-cyan-400" />
                          <p className={`text-xs font-bold ${title}`}>AI explanation</p>
                        </div>

                        <p className={`mt-3 text-xs leading-relaxed whitespace-pre-wrap ${muted}`}>
                          {scanResult.explanation}
                        </p>
                      </div>

                      {scanResult.signals.length > 0 && (
                        <div>
                          <p className={`text-xs font-bold mb-3 ${title}`}>
                            Detected signals
                          </p>

                          <div className="space-y-2">
                            {scanResult.signals.map((signal: any, index: number) => (
                              <div
                                key={index}
                                className={`p-3 rounded-xl border flex items-start gap-3 ${panelSoft}`}
                              >
                                <span className="mt-0.5 text-emerald-400">
                                  <FiCheck />
                                </span>

                                <span className={`text-xs ${muted}`}>
                                  {typeof signal === 'string'
                                    ? signal
                                    : JSON.stringify(signal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setResult(null);
                            setTextInput('');
                            setSelectedFile(null);
                          }}
                          className={`px-4 py-3 rounded-xl border text-xs ${panelSoft} ${muted}`}
                        >
                          New scan
                        </button>

                        <button className="px-4 py-3 rounded-xl bg-emerald-400 text-[#06100d] text-xs font-bold">
                          Save report
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* INCIDENTS */}
          {activeTab === 'incidents' && (
            <div className="max-w-[1300px] mx-auto p-5 md:p-8">
              <section className={`rounded-3xl border overflow-hidden ${panel}`}>
                <div className="p-6 flex items-center justify-between border-b border-inherit">
                  <div>
                    <h2 className={`font-black text-xl ${title}`}>Incident Registry</h2>
                    <p className={`text-xs mt-2 ${muted}`}>
                      Recorded high-confidence threat detections
                    </p>
                  </div>

                  <button className={`px-4 py-2 rounded-xl border text-xs ${panelSoft} ${muted}`}>
                    <FiSearch />
                  </button>
                </div>

                <div className="divide-y divide-white/[0.055]">
                  {recentIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="p-5 md:p-6 flex items-center gap-4 hover:bg-white/[0.018]"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${getRiskColor(incident.score)}12`,
                          color: getRiskColor(incident.score),
                        }}
                      >
                        <FiAlertTriangle />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${title}`}>{incident.title}</p>
                        <p className={`text-[11px] mt-1 ${muted}`}>
                          {incident.id} · {incident.source} · {incident.time}
                        </p>
                      </div>

                      <span
                        className={`hidden sm:inline-flex px-3 py-1.5 rounded-lg border text-[10px] font-bold ${getRiskStyle(
                          incident.risk
                        )}`}
                      >
                        {incident.risk}
                      </span>

                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: getRiskColor(incident.score) }}
                      >
                        {incident.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* INTELLIGENCE */}
          {activeTab === 'intel' && (
            <div className="max-w-[1300px] mx-auto p-5 md:p-8">
              <section className={`rounded-3xl border p-6 md:p-8 ${panel}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <FiLayers className="text-xl" />
                  </div>

                  <div>
                    <h2 className={`font-black text-xl ${title}`}>Threat Intelligence Layer</h2>
                    <p className={`text-xs mt-1 ${muted}`}>
                      Research-backed scam patterns and detection signals
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  {[
                    {
                      title: 'Impersonation',
                      text: 'Claims involving police, CBI, ED, RBI, banks or government authorities.',
                    },
                    {
                      title: 'Psychological Pressure',
                      text: 'Fear, urgency, secrecy, isolation and threats used to control the victim.',
                    },
                    {
                      title: 'Digital Arrest Pattern',
                      text: 'False accusations followed by continuous monitoring or demands for immediate action.',
                    },
                  ].map((item, index) => (
                    <div key={item.title} className={`rounded-2xl border p-5 ${panelSoft}`}>
                      <span className="text-[10px] font-mono text-emerald-400">
                        INT-0{index + 1}
                      </span>
                      <h3 className={`mt-3 text-sm font-bold ${title}`}>{item.title}</h3>
                      <p className={`mt-2 text-xs leading-relaxed ${muted}`}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}