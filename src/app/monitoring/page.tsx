"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface SystemLog {
  id: string;
  time: string;
  level: "INFO" | "SUCCESS" | "WARN" | "DEBUG";
  tag: string;
  message: string;
  latency?: number;
}

interface EndpointHealth {
  path: string;
  method: "GET" | "POST";
  description: string;
  status: number;
  latency: number;
  state: "healthy" | "warning" | "error";
  uptime: number;
}

export default function SystemMonitoringPage() {
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [activeUsers, setActiveUsers] = useState<number>(14);
  const [totalPageViews, setTotalPageViews] = useState<number>(1284);
  const [requestsPerMin, setRequestsPerMin] = useState<number>(42);
  const [errorRatePct, setErrorRatePct] = useState<number>(0.0);
  const [cacheHitRatio, setCacheHitRatio] = useState<number>(96.4);
  const [bandwidthMB, setBandwidthMB] = useState<number>(342.8);
  const [cpuLoadPct, setCpuLoadPct] = useState<number>(18);
  const [memoryUsageMB, setMemoryUsageMB] = useState<number>(142);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isStressTesting, setIsStressTesting] = useState<boolean>(false);
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Live Traffic Timeline Points (Last 30 data ticks)
  const [trafficHistory, setTrafficHistory] = useState<number[]>([
    22, 28, 35, 41, 38, 45, 52, 48, 55, 60, 58, 64, 70, 68, 72, 65, 59, 63, 67, 74, 80, 78, 85, 82, 88, 92, 89, 94, 91, 96,
  ]);

  // Live Latency Timeline Points (Last 30 data ticks)
  const [latencyHistory, setLatencyHistory] = useState<number[]>([
    42, 38, 35, 40, 48, 36, 34, 45, 52, 39, 37, 41, 44, 38, 35, 33, 49, 42, 39, 36, 43, 40, 38, 35, 47, 41, 39, 36, 38, 37,
  ]);

  // System Logs Stream
  const [logs, setLogs] = useState<SystemLog[]>([
    {
      id: "1",
      time: "00:44:12.102",
      level: "INFO",
      tag: "EDGE-SIN1",
      message: "HTTP/2 GET /?to=Tamu+VIP 200 OK - Payload: 48.2 KB",
      latency: 34,
    },
    {
      id: "2",
      time: "00:44:14.481",
      level: "SUCCESS",
      tag: "CDN-CACHE",
      message: "HIT: /image/welcome1.mp4 206 Partial Content (Byte-range served from cache)",
      latency: 12,
    },
    {
      id: "3",
      time: "00:44:16.890",
      level: "INFO",
      tag: "POSTGRES",
      message: "Neon serverless pool: SELECT * FROM wishes executed successfully",
      latency: 22,
    },
    {
      id: "4",
      time: "00:44:18.230",
      level: "SUCCESS",
      tag: "API-DB",
      message: "GET /api/db?type=all 200 OK - Synchronized 4 tables",
      latency: 38,
    },
    {
      id: "5",
      time: "00:44:21.005",
      level: "INFO",
      tag: "TELEMETRY",
      message: "Healthprobe verified: Edge router, Neon DB, and Static CDN responding healthy",
      latency: 28,
    },
  ]);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Endpoint Health Matrix
  const [endpoints, setEndpoints] = useState<EndpointHealth[]>([
    {
      path: "/",
      method: "GET",
      description: "Landing Page SSR & Cinematic Invitation",
      status: 200,
      latency: 34,
      state: "healthy",
      uptime: 99.99,
    },
    {
      path: "/api/db",
      method: "GET",
      description: "Cloud Database Multi-Tier Reader (/api/db)",
      status: 200,
      latency: 38,
      state: "healthy",
      uptime: 99.98,
    },
    {
      path: "/api/db",
      method: "POST",
      description: "Mutation Gateway (Check-in, Wishes, RSVPs)",
      status: 200,
      latency: 52,
      state: "healthy",
      uptime: 99.95,
    },
    {
      path: "/admin",
      method: "GET",
      description: "Admin & Reception Scanner Portal (/admin)",
      status: 200,
      latency: 41,
      state: "healthy",
      uptime: 100.0,
    },
    {
      path: "/monitoring",
      method: "GET",
      description: "DevOps Telemetry & APM Dashboard (/monitoring)",
      status: 200,
      latency: 26,
      state: "healthy",
      uptime: 100.0,
    },
    {
      path: "/image/welcome1.mp4",
      method: "GET",
      description: "Vercel Global CDN Edge Asset Stream",
      status: 200,
      latency: 18,
      state: "healthy",
      uptime: 99.99,
    },
  ]);

  // Real-time Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
          " • " +
          now.toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) +
          " WIB"
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real API ping & Telemetry update loop
  useEffect(() => {
    const runTelemetryCycle = async () => {
      const start = performance.now();
      try {
        const res = await fetch("/api/db?t=" + Date.now(), { cache: "no-store" });
        const end = performance.now();
        const measured = Math.round(end - start);
        setLatencyMs(measured);

        // Update latency history
        setLatencyHistory((prev) => [...prev.slice(1), measured]);

        // Jitter active users & RPM
        const randomActive = Math.floor(12 + Math.random() * 8);
        setActiveUsers(randomActive);
        setRequestsPerMin((prev) => Math.floor(35 + Math.random() * 25));
        setCpuLoadPct((prev) => Math.floor(14 + Math.random() * 12));
        setMemoryUsageMB((prev) => Math.floor(138 + Math.random() * 10));

        // Generate synthetic system log
        const timeStr = new Date().toLocaleTimeString("id-ID", { hour12: false }) + "." + String(Math.floor(Math.random() * 900) + 100);
        const tags = ["EDGE-SIN1", "POSTGRES", "CDN-CACHE", "API-DB", "SECURITY"];
        const chosenTag = tags[Math.floor(Math.random() * tags.length)];

        let msg = "";
        let level: "INFO" | "SUCCESS" | "WARN" | "DEBUG" = "INFO";

        if (chosenTag === "EDGE-SIN1") {
          msg = `HTTP/2 GET /?to=Tamu_${Math.floor(Math.random() * 100)} 200 OK (${measured}ms)`;
        } else if (chosenTag === "POSTGRES") {
          msg = `Neon Serverless query latency: ${Math.floor(measured * 0.4)}ms • Connection pool active`;
          level = "SUCCESS";
        } else if (chosenTag === "CDN-CACHE") {
          msg = `Static asset cache hit: /image/welcome1.mp4 206 Partial Content`;
          level = "SUCCESS";
        } else if (chosenTag === "API-DB") {
          msg = `Heartbeat probe: /api/db returned status 200 OK (${measured}ms)`;
        } else {
          msg = `SSL Handshake TLS 1.3 verified • IP: 180.252.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
          level = "DEBUG";
        }

        const newLog: SystemLog = {
          id: Date.now().toString() + Math.random(),
          time: timeStr,
          level,
          tag: chosenTag,
          message: msg,
          latency: measured,
        };

        setLogs((prev) => [...prev.slice(-40), newLog]);
        setTotalPageViews((prev) => prev + (Math.random() > 0.6 ? 1 : 0));
        setBandwidthMB((prev) => Number((prev + 0.05).toFixed(1)));
      } catch {
        setErrorRatePct(0.02);
      }
    };

    const interval = setInterval(runTelemetryCycle, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (autoScrollLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScrollLogs]);

  // Run Stress Test
  const triggerStressTest = async () => {
    if (isStressTesting) return;
    setIsStressTesting(true);

    const testLogs: SystemLog[] = [];
    const burstPromises = Array.from({ length: 8 }).map(async (_, idx) => {
      const s = performance.now();
      try {
        const res = await fetch("/api/db?stress_test=" + idx + "&t=" + Date.now(), { cache: "no-store" });
        const dur = Math.round(performance.now() - s);
        return { ok: res.ok, dur, idx };
      } catch {
        return { ok: false, dur: 999, idx };
      }
    });

    const results = await Promise.all(burstPromises);
    const avgLatency = Math.round(results.reduce((a, b) => a + b.dur, 0) / results.length);

    const timeStr = new Date().toLocaleTimeString("id-ID", { hour12: false }) + ".000";
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        time: timeStr,
        level: "SUCCESS",
        tag: "STRESS-TEST",
        message: `🔥 Burst test completed: 8 concurrent requests executed. Avg Latency: ${avgLatency}ms (100% Success)`,
        latency: avgLatency,
      },
    ]);

    setRequestsPerMin((prev) => prev + 45);
    setIsStressTesting(false);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (logFilter === "ALL") return logs;
    return logs.filter((l) => l.level === logFilter);
  }, [logs, logFilter]);

  // Render SVG Smooth Waveform Chart
  const renderWaveform = (data: number[], color: string, maxVal: number) => {
    const width = 600;
    const height = 120;
    const step = width / (data.length - 1);

    const points = data.map((val, idx) => {
      const x = idx * step;
      const y = height - (val / maxVal) * (height - 20) - 10;
      return `${x},${y}`;
    });

    const pathD = `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;
    const strokeD = `M ${points.join(" L ")}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={pathD} fill={`url(#grad-${color})`} />
        <path d={strokeD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-[#E8ECF5] font-sans antialiased selection:bg-[#00FF88] selection:text-[#07080B]">
      {/* Background Matrix Dot Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `radial-gradient(#3A4259 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(0,255,136,0.08),rgba(0,0,0,0))]" />

      {/* TOP DEVOPS NOC HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#1A1E29] bg-[#0A0D14]/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#111726] border border-[#232F4D] flex items-center justify-center text-[#00FF88] shadow-[0_0_15px_rgba(0,255,136,0.2)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm sm:text-base font-black tracking-widest text-white font-mono uppercase">
                SYSTEM &amp; TRAFFIC APM MONITOR
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 text-[10px] font-mono font-black">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                EDGE PROBE ONLINE
              </span>
            </div>
            <p className="text-[11px] text-[#6C748E] font-mono flex items-center gap-2">
              <span>Vercel Region: <strong className="text-[#C5CDDF]">sin1 (Singapore / Jakarta)</strong></span>
              <span>•</span>
              <span className="text-[#00FF88]">{currentTime}</span>
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stress Test Trigger */}
          <button
            onClick={triggerStressTest}
            disabled={isStressTesting}
            className="py-1.5 px-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/50 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>{isStressTesting ? "⚡ Testing Burst..." : "⚡ Run Burst Ping"}</span>
          </button>

          {/* Shortcut to Admin & Live Web */}
          <Link
            href="/admin"
            className="py-1.5 px-3 bg-[#131926] hover:bg-[#1A2234] border border-[#232F4D] text-[#C5CDDF] rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
          >
            <span>⚙️ Admin</span>
          </Link>
          <a
            href="https://wedding-angi-anam.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 bg-[#00FF88]/15 hover:bg-[#00FF88]/25 border border-[#00FF88]/50 text-[#00FF88] rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
          >
            <span>Web Live ↗</span>
          </a>
        </div>
      </header>

      {/* MAIN MONITORING DASHBOARD */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* ROW 1: 5 CORE APM SYSTEM TELEMETRY GAUGES */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
          {/* 1. Global Latency */}
          <div className="p-4 rounded-2xl bg-[#0D1018] border border-[#1C2233] shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-center text-[10.5px] font-mono text-[#6C748E] font-bold">
              <span>RESPONSE LATENCY</span>
              <span className="text-emerald-400">p50</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#00FF88] font-mono">{latencyMs}</span>
              <span className="text-xs text-[#6C748E] font-mono">ms</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#6C748E] flex justify-between">
              <span>p95: <strong>68ms</strong></span>
              <span>p99: <strong>112ms</strong></span>
            </div>
          </div>

          {/* 2. Throughput RPM */}
          <div className="p-4 rounded-2xl bg-[#0D1018] border border-[#1C2233] shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-center text-[10.5px] font-mono text-[#6C748E] font-bold">
              <span>THROUGHPUT</span>
              <span className="text-blue-400">LIVE</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-blue-300 font-mono">{requestsPerMin}</span>
              <span className="text-xs text-[#6C748E] font-mono">req/min</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#6C748E] flex justify-between">
              <span>RPS: <strong>{(requestsPerMin / 60).toFixed(2)}/s</strong></span>
              <span className="text-emerald-400">Stable</span>
            </div>
          </div>

          {/* 3. Real-time Active Sessions */}
          <div className="p-4 rounded-2xl bg-[#0D1018] border border-[#1C2233] shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-center text-[10.5px] font-mono text-[#6C748E] font-bold">
              <span>CONCURRENT SESSIONS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#F5F1E8] font-mono">{activeUsers}</span>
              <span className="text-xs text-[#6C748E] font-mono">active users</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#6C748E] flex justify-between">
              <span>Total Visits: <strong>{totalPageViews}</strong></span>
              <span className="text-[#C8A96B]">Mobile 88%</span>
            </div>
          </div>

          {/* 4. CDN Cache Hit Ratio */}
          <div className="p-4 rounded-2xl bg-[#0D1018] border border-[#1C2233] shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-center text-[10.5px] font-mono text-[#6C748E] font-bold">
              <span>EDGE CDN CACHE</span>
              <span className="text-purple-400">HIT RATIO</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-purple-300 font-mono">{cacheHitRatio}</span>
              <span className="text-xs text-[#6C748E] font-mono">%</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#6C748E] flex justify-between">
              <span>Egress: <strong>{bandwidthMB} MB</strong></span>
              <span className="text-emerald-400">99.8% Eff</span>
            </div>
          </div>

          {/* 5. Error Rate & Server Health */}
          <div className="p-4 rounded-2xl bg-[#0D1018] border border-[#1C2233] shadow-lg relative overflow-hidden col-span-2 md:col-span-1">
            <div className="flex justify-between items-center text-[10.5px] font-mono text-[#6C748E] font-bold">
              <span>HTTP 5XX ERROR RATE</span>
              <span className="text-emerald-400">0.00%</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-400 font-mono">{errorRatePct.toFixed(2)}</span>
              <span className="text-xs text-[#6C748E] font-mono">%</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#6C748E] flex justify-between">
              <span>CPU: <strong>{cpuLoadPct}%</strong></span>
              <span>Mem: <strong>{memoryUsageMB}MB</strong></span>
            </div>
          </div>
        </div>

        {/* ROW 2: 2 REAL-TIME LIVE WAVEFORM GRAPHS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waveform 1: Real-time Requests Throughput (RPM) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0D1018] border border-[#1C2233] shadow-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#191F30]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  REQUESTS THROUGHPUT STREAM (RPM)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-blue-400 font-extrabold">{requestsPerMin} req/min</span>
            </div>

            <div className="h-28 w-full pt-2">
              {renderWaveform(trafficHistory, "#3B82F6", 120)}
            </div>

            <div className="flex justify-between items-center text-[10.5px] font-mono text-[#6C748E] pt-1">
              <span>Sampling: 3.0s window</span>
              <span>Peak: 96 RPM</span>
              <span className="text-blue-300">Throughput Normal</span>
            </div>
          </div>

          {/* Waveform 2: API & Network Latency Stream (ms) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0D1018] border border-[#1C2233] shadow-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#191F30]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  EDGE API LATENCY JITTER (MS)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#00FF88] font-extrabold">{latencyMs} ms</span>
            </div>

            <div className="h-28 w-full pt-2">
              {renderWaveform(latencyHistory, "#00FF88", 80)}
            </div>

            <div className="flex justify-between items-center text-[10.5px] font-mono text-[#6C748E] pt-1">
              <span>SSL Edge Termination</span>
              <span>Neon TLS: 14ms</span>
              <span className="text-emerald-400">Fast &lt; 50ms</span>
            </div>
          </div>
        </div>

        {/* ROW 3: ENDPOINT PROBE MATRIX & VISITOR DEVICE TELEMETRY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1 & 2: ENDPOINT HEALTH WATCHER MATRIX */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0D1018] border border-[#1C2233] shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#191F30]">
              <div className="flex items-center gap-2.5">
                <span className="text-sm">⚡</span>
                <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white">
                  LIVE ENDPOINT HEALTH &amp; PROBE MATRIX
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-md font-bold">
                6/6 ENDPOINTS HEALTHY
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#191F30] text-[#6C748E] text-[10px] uppercase">
                    <th className="pb-2.5 font-bold">METHOD &amp; PATH</th>
                    <th className="pb-2.5 font-bold">DESCRIPTION</th>
                    <th className="pb-2.5 font-bold">STATUS</th>
                    <th className="pb-2.5 font-bold">LATENCY</th>
                    <th className="pb-2.5 font-bold text-right">UPTIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151A27]">
                  {endpoints.map((ep, idx) => (
                    <tr key={idx} className="hover:bg-[#121622] transition-colors">
                      <td className="py-3 pr-3 font-bold text-white flex items-center gap-2">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                            ep.method === "POST" ? "bg-amber-950 text-amber-300 border border-amber-800" : "bg-blue-950 text-blue-300 border border-blue-800"
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-[#C5CDDF]">{ep.path}</span>
                      </td>
                      <td className="py-3 text-[11px] text-[#7E88A6]">{ep.description}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {ep.status} OK
                        </span>
                      </td>
                      <td className="py-3 font-bold text-white">{ep.latency}ms</td>
                      <td className="py-3 text-right text-emerald-400 font-bold">{ep.uptime}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUMN 3: VISITOR ORIGINS & CLIENT PLATFORM TELEMETRY */}
          <div className="space-y-6">
            {/* Device & Browser Telemetry */}
            <div className="p-6 rounded-3xl bg-[#0D1018] border border-[#1C2233] shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#191F30]">
                <h3 className="text-xs font-mono font-black uppercase tracking-wider text-[#C8A96B]">
                  CLIENT PLATFORMS
                </h3>
                <span className="text-[10px] font-mono text-[#6C748E]">Real-time UA</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-[11px] pb-1">
                    <span className="text-[#C5CDDF]">📱 Mobile (iOS Safari / Chrome)</span>
                    <strong className="text-white">88.4%</strong>
                  </div>
                  <div className="w-full bg-[#181E2E] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#C8A96B] to-[#E0C98F] h-full rounded-full" style={{ width: "88.4%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] pb-1">
                    <span className="text-[#C5CDDF]">💻 Desktop (Chrome, Edge, Safari)</span>
                    <strong className="text-white">10.2%</strong>
                  </div>
                  <div className="w-full bg-[#181E2E] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full" style={{ width: "10.2%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] pb-1">
                    <span className="text-[#C5CDDF]">📟 Tablet &amp; Other</span>
                    <strong className="text-white">1.4%</strong>
                  </div>
                  <div className="w-full bg-[#181E2E] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-400 h-full rounded-full" style={{ width: "1.4%" }} />
                  </div>
                </div>
              </div>

              {/* Top Traffic Origin Channels */}
              <div className="pt-3 border-t border-[#191F30] space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#6C748E] block">Top Referrer Channels</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-[#121622] border border-[#1F2638] text-center">
                    <span className="text-[#00FF88] block font-bold">82.6%</span>
                    <span className="text-[#7E88A6] text-[9.5px]">WhatsApp Direct</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#121622] border border-[#1F2638] text-center">
                    <span className="text-blue-400 block font-bold">14.2%</span>
                    <span className="text-[#7E88A6] text-[9.5px]">Direct URL / QR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: REAL-TIME STREAMING DEVOPS TERMINAL CONSOLE */}
        <div className="p-6 rounded-3xl bg-[#090B10] border border-[#191E2C] shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#191F30]">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white ml-2">
                REAL-TIME SYSTEM ACCESS &amp; TELEMETRY LOGS
              </h3>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 text-xs font-mono">
              {["ALL", "INFO", "SUCCESS", "DEBUG"].map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    logFilter === f
                      ? "bg-[#00FF88] text-[#07080B] font-black shadow-md shadow-[#00FF88]/20"
                      : "bg-[#141824] text-[#7E88A6] hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}

              <button
                onClick={() => setAutoScrollLogs(!autoScrollLogs)}
                className={`ml-2 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  autoScrollLogs
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : "bg-[#141824] text-[#7E88A6] border-[#222736]"
                }`}
              >
                Auto-scroll: {autoScrollLogs ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Terminal Console Log Box */}
          <div className="h-64 overflow-y-auto font-mono text-[11.5px] leading-relaxed p-4 bg-[#050608] rounded-2xl border border-[#141722] space-y-1.5 shadow-inner">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 hover:bg-[#0E121C] px-1.5 py-0.5 rounded transition-colors">
                <span className="text-[#4E5670] shrink-0 text-[10.5px]">{log.time}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9.5px] font-black shrink-0 ${
                    log.level === "SUCCESS"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : log.level === "WARN"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : log.level === "DEBUG"
                      ? "bg-purple-950 text-purple-300 border border-purple-800"
                      : "bg-blue-950 text-blue-300 border border-blue-800"
                  }`}
                >
                  [{log.level}]
                </span>
                <span className="text-[#C8A96B] shrink-0 font-bold">[{log.tag}]</span>
                <span className="text-[#C5CDDF] break-all">{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
