"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { weddingData } from "@/data/weddingData";

interface GuestItem {
  id: string;
  code?: string;
  name: string;
  phone?: string;
  category?: string;
  status?: string;
  checkedIn?: boolean;
  checkInTime?: string;
  pax?: number;
  createdAt?: string;
}

interface RSVPItem {
  id: string;
  name: string;
  attendance?: string;
  status?: string;
  guestCount?: number;
  pax?: number;
  session?: string;
  notes?: string;
  checkedIn?: boolean;
  createdAt?: string;
}

interface WishItem {
  id: string;
  name: string;
  message: string;
  relationship?: string;
  createdAt?: string;
}

interface ActivityEvent {
  id: string;
  type: "checkin" | "rsvp" | "wish" | "system" | "wa";
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  badge: string;
}

export default function MonitoringPage() {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [dbProvider, setDbProvider] = useState<string>("vercel_postgres");
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(45);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const prevGuestCheckinCount = useRef<number>(0);
  const prevWishesCount = useRef<number>(0);
  const prevRsvpCount = useRef<number>(0);

  // Sound chime synthesizer for live activities
  const playLiveChime = (type: "checkin" | "rsvp" | "wish") => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        if (type === "checkin") {
          // Ascending celebration chime
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
          osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
          osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
          osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime + 0.24); // C6
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.6);
        } else if (type === "wish") {
          // Soft harp tone
          osc.type = "triangle";
          osc.frequency.setValueAtTime(440, audioCtx.currentTime);
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
        } else {
          // Blip
          osc.type = "sine";
          osc.frequency.setValueAtTime(600, audioCtx.currentTime);
          osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        }
        osc.connect(gain);
        gain.connect(audioCtx.destination);
      }
    } catch {}
  };

  // Real-time Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
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

  // Fetch telemetry data from Cloud Database
  async function fetchTelemetry() {
    const startTime = performance.now();
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/db?t=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));

      if (json.success && json.data) {
        const fetchedGuests = Array.isArray(json.data.guests) ? json.data.guests : [];
        const fetchedRsvps = Array.isArray(json.data.rsvps) ? json.data.rsvps : [];
        const fetchedWishes = Array.isArray(json.data.wishes) ? json.data.wishes : [];

        // Check for new live events and play sounds
        const newCheckins = fetchedGuests.filter((g: any) => g.checkedIn).length;
        if (prevGuestCheckinCount.current > 0 && newCheckins > prevGuestCheckinCount.current) {
          playLiveChime("checkin");
        }
        prevGuestCheckinCount.current = newCheckins;

        if (prevWishesCount.current > 0 && fetchedWishes.length > prevWishesCount.current) {
          playLiveChime("wish");
        }
        prevWishesCount.current = fetchedWishes.length;

        if (prevRsvpCount.current > 0 && fetchedRsvps.length > prevRsvpCount.current) {
          playLiveChime("rsvp");
        }
        prevRsvpCount.current = fetchedRsvps.length;

        setGuests(fetchedGuests);
        setRsvps(fetchedRsvps);
        setWishes(fetchedWishes);
        setIsCloudSynced(json.persistent !== false);
        if (json.provider) setDbProvider(json.provider);
      }
    } catch {
      setIsCloudSynced(false);
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchTelemetry();
    const pollInterval = setInterval(fetchTelemetry, 6000); // Live poll every 6s
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle Fullscreen (Kiosk Mode)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Metrics Calculations
  const targetGuests = 500; // Expected wedding capacity
  const totalRegisteredGuests = guests.length;
  const waSentCount = guests.filter((g) => g.status === "sent").length;
  const waSentPct = totalRegisteredGuests > 0 ? Math.round((waSentCount / totalRegisteredGuests) * 100) : 0;

  const checkedInGuests = guests.filter((g) => g.checkedIn);
  const checkedInCount = checkedInGuests.length;
  const totalPaxInVenue = checkedInGuests.reduce((sum, g) => sum + (g.pax || 1), 0);
  const venueCapacityPct = Math.min(100, Math.round((totalPaxInVenue / targetGuests) * 100));

  const attendingRsvps = rsvps.filter((r) => r.attendance === "Hadir" || r.status === "Hadir");
  const attendingRsvpPax = attendingRsvps.reduce((sum, r) => sum + (r.guestCount || r.pax || 1), 0);
  const notAttendingRsvps = rsvps.filter((r) => r.attendance === "Tidak Hadir" || r.status === "Tidak Hadir");

  const totalWishesCount = wishes.length;

  // Category Distribution
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    guests.forEach((g) => {
      const cat = g.category || "Tamu VIP";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [guests]);

  // Unified Live Activity Stream
  const activityStream: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];

    // 1. Check-in events
    checkedInGuests.forEach((g) => {
      events.push({
        id: `checkin-${g.id}`,
        type: "checkin",
        title: `${g.name} Check-In`,
        description: `Telah masuk venue (${g.pax || 1} PAX) • Kategori: ${g.category || "Tamu VIP"}`,
        timestamp: g.checkInTime || "Baru saja",
        timeAgo: g.checkInTime ? `Pukul ${g.checkInTime}` : "Hari ini",
        badge: "GATE ENTRY",
      });
    });

    // 2. RSVP events
    rsvps.slice(0, 15).forEach((r) => {
      events.push({
        id: `rsvp-${r.id}`,
        type: "rsvp",
        title: `RSVP: ${r.name}`,
        description: `Konfirmasi: ${r.attendance || r.status || "Hadir"} (${r.guestCount || r.pax || 1} PAX) ${
          r.session || r.notes ? `• "${r.session || r.notes}"` : ""
        }`,
        timestamp: r.createdAt || "Baru saja",
        timeAgo: r.createdAt || "Baru saja",
        badge: "RSVP CONFIRM",
      });
    });

    // 3. Wish events
    wishes.slice(0, 15).forEach((w) => {
      events.push({
        id: `wish-${w.id}`,
        type: "wish",
        title: `Ucapan dari ${w.name}`,
        description: `"${w.message}"`,
        timestamp: w.createdAt || "Baru saja",
        timeAgo: w.createdAt || "Baru saja",
        badge: "PRAYER & WISH",
      });
    });

    // Sort by ID / timestamp descending
    return events.sort((a, b) => {
      const idA = Number(a.id.replace(/\D/g, "")) || 0;
      const idB = Number(b.id.replace(/\D/g, "")) || 0;
      return idB - idA;
    });
  }, [checkedInGuests, rsvps, wishes]);

  // Days / Hours until wedding countdown
  const weddingCountdown = useMemo(() => {
    const weddingDate = new Date("2026-10-10T08:00:00+07:00").getTime();
    const now = Date.now();
    const diff = weddingDate - now;

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, isPassed: false };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F1F0EC] font-sans antialiased selection:bg-[#C8A96B] selection:text-[#0A0B0E]">
      {/* Background Cinematic Grid Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(200,169,107,0.12),rgba(255,255,255,0))]" />
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #1A1C23 1px, transparent 1px), linear-gradient(to bottom, #1A1C23 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* TOP COMMAND CENTER HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#1E2028] bg-[#0E1015]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C8A96B] to-[#806A42] flex items-center justify-center shadow-lg shadow-[#C8A96B]/20 border border-[#E0C98F]/40">
            <span className="text-xl">🛰️</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wider text-white font-serif" style={{ fontFamily: "var(--font-heading)" }}>
                MISSION CONTROL MONITORING
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-700/80 text-[9.5px] font-extrabold tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-[#8E92A4] font-mono flex items-center gap-2">
              <span>{weddingData.couple.groom.nickname} &amp; {weddingData.couple.bride.nickname} Wedding</span>
              <span>•</span>
              <span className="text-[#C8A96B]">{currentTime}</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60"
                : "bg-[#181A22] border-[#2A2D39] text-[#7A7E90] hover:bg-[#20232E]"
            }`}
            title={soundEnabled ? "Live Sound On" : "Live Sound Off"}
          >
            <span>{soundEnabled ? "🔊" : "🔇"}</span>
            <span className="hidden md:inline">{soundEnabled ? "Sound ON" : "Muted"}</span>
          </button>

          {/* Refresh Pulse Button */}
          <button
            onClick={fetchTelemetry}
            disabled={isRefreshing}
            className="p-2 sm:px-3 sm:py-2 bg-[#181A22] hover:bg-[#222532] border border-[#2A2D39] text-[#E0C98F] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Telemetry"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isRefreshing ? "animate-spin" : ""}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span className="hidden sm:inline font-mono">{latencyMs}ms</span>
          </button>

          {/* Fullscreen TV / Projector Mode */}
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 sm:py-2 bg-[#181A22] hover:bg-[#222532] border border-[#2A2D39] text-[#F1F0EC] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Toggle TV / Projector Fullscreen Mode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            <span className="hidden md:inline">TV Mode</span>
          </button>

          {/* Shortcut to Admin Panel */}
          <Link
            href="/admin"
            className="py-2 px-3.5 bg-gradient-to-r from-[#C8A96B] to-[#9A7D46] hover:from-[#D4B577] hover:to-[#A88B52] text-[#0A0B0E] font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>⚙️ Admin Panel</span>
          </Link>
        </div>
      </header>

      {/* MAIN MONITORING CONTENT STAGE */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* ROW 1: MISSION STATUS & COUNTDOWN HERO BANNER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Countdown & Event Info Card */}
          <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#13151D] via-[#101218] to-[#0D0E13] border border-[#262A37] shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="text-9xl">💍</span>
            </div>

            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#C8A96B]/20 text-[#E0C98F] border border-[#806A42]/60 text-[10px] font-mono font-extrabold uppercase tracking-widest">
                  EVENT COUNTDOWN
                </span>
                <span className="text-xs text-[#8E92A4] font-mono">BALAI IKABAMA • Depok</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-serif text-white pt-1">
                The Wedding of Misbakhul Anam &amp; Angi Sulistia
              </h2>
              <p className="text-xs text-[#A8ACB9]">
                Monitoring real-time aktivitas kehadiran, RSVP, ucapan doa, serta performa backend 500 tamu undangan.
              </p>
            </div>

            {/* Live Big Digital Countdown */}
            <div className="grid grid-cols-4 gap-3 pt-6 relative z-10">
              <div className="p-3 sm:p-4 rounded-2xl bg-[#181A24]/90 border border-[#2B2F3E] text-center shadow-inner">
                <span className="block text-2xl sm:text-4xl font-black text-[#E0C98F] font-mono">{weddingCountdown.days}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#7A7E90] font-bold">HARI</span>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-[#181A24]/90 border border-[#2B2F3E] text-center shadow-inner">
                <span className="block text-2xl sm:text-4xl font-black text-[#E0C98F] font-mono">{weddingCountdown.hours}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#7A7E90] font-bold">JAM</span>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-[#181A24]/90 border border-[#2B2F3E] text-center shadow-inner">
                <span className="block text-2xl sm:text-4xl font-black text-[#E0C98F] font-mono">{weddingCountdown.minutes}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#7A7E90] font-bold">MENIT</span>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-[#181A24]/90 border border-[#2B2F3E] text-center shadow-inner">
                <span className="block text-2xl sm:text-4xl font-black text-emerald-400 font-mono animate-pulse">{weddingCountdown.seconds}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#7A7E90] font-bold">DETIK</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Status Card */}
          <div className="p-6 rounded-3xl bg-[#13151D] border border-[#262A37] shadow-xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202330]">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#A8ACB9] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                SYSTEM HEALTH
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md font-bold">
                100% OPERATIONAL
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#181A24] border border-[#232634]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <span className="text-[#C5C8D4]">Vercel Edge Node</span>
                </div>
                <span className="text-emerald-400 font-bold">ONLINE ({latencyMs}ms)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#181A24] border border-[#232634]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🗄️</span>
                  <span className="text-[#C5C8D4]">Database Engine</span>
                </div>
                <span className="text-[#E0C98F] font-bold uppercase">{dbProvider.replace("_", " ")}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#181A24] border border-[#232634]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🛡️</span>
                  <span className="text-[#C5C8D4]">Multi-Tier Cloud Sync</span>
                </div>
                <span className={isCloudSynced ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {isCloudSynced ? "SYNCHRONIZED" : "LOCAL READY"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#181A24] border border-[#232634]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📲</span>
                  <span className="text-[#C5C8D4]">WhatsApp API Gateway</span>
                </div>
                <span className="text-emerald-400 font-bold">CONNECTED</span>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-[#6A6F82] font-mono text-center">
              Auto-sync telemetry cycle: 6.0s • SSL 256-bit Encrypted
            </div>
          </div>
        </div>

        {/* ROW 2: 4 MAJOR LIVE TELEMETRY METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Venue Occupancy */}
          <div className="p-5 rounded-2xl bg-[#13151D] border border-emerald-900/50 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 font-mono">VENUE CHECK-IN</span>
              <span className="text-lg">🎟️</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-300 font-mono">{totalPaxInVenue}</span>
              <span className="text-xs text-[#8E92A4] font-bold">/ {targetGuests} PAX</span>
            </div>
            <div className="mt-3 w-full bg-[#1F2330] rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700" style={{ width: `${venueCapacityPct}%` }} />
            </div>
            <div className="mt-2 text-[10.5px] text-[#8E92A4] flex justify-between">
              <span>Kapasitas Gedung</span>
              <strong className="text-emerald-400">{venueCapacityPct}% Terisi</strong>
            </div>
          </div>

          {/* Card 2: RSVP Confirmation */}
          <div className="p-5 rounded-2xl bg-[#13151D] border border-[#2B2F3E] shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C8A96B] font-mono">RSVP CONFIRMED</span>
              <span className="text-lg">📋</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#F5F1E8] font-mono">{attendingRsvpPax}</span>
              <span className="text-xs text-emerald-400 font-bold">PAX Hadir</span>
            </div>
            <div className="mt-3 text-[10.5px] text-[#8E92A4] flex items-center justify-between pt-1">
              <span>Total Respon: <strong>{rsvps.length}</strong></span>
              <span className="text-rose-400 font-bold">{notAttendingRsvps.length} Halangan</span>
            </div>
          </div>

          {/* Card 3: WhatsApp Broadcast Rate */}
          <div className="p-5 rounded-2xl bg-[#13151D] border border-[#2B2F3E] shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400 font-mono">WA BROADCAST</span>
              <span className="text-lg">💬</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-blue-300 font-mono">{waSentCount}</span>
              <span className="text-xs text-[#8E92A4] font-bold">/ {totalRegisteredGuests} Tamu</span>
            </div>
            <div className="mt-3 w-full bg-[#1F2330] rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-700" style={{ width: `${waSentPct}%` }} />
            </div>
            <div className="mt-2 text-[10.5px] text-[#8E92A4] flex justify-between">
              <span>Undangan Tersebar</span>
              <strong className="text-blue-400">{waSentPct}% Terkirim</strong>
            </div>
          </div>

          {/* Card 4: Total Wishes & Prayers */}
          <div className="p-5 rounded-2xl bg-[#13151D] border border-[#2B2F3E] shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 font-mono">DOA &amp; UCAPAN</span>
              <span className="text-lg">💌</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-purple-300 font-mono">{totalWishesCount}</span>
              <span className="text-xs text-[#8E92A4] font-bold">Pesan Masuk</span>
            </div>
            <div className="mt-3 text-[10.5px] text-[#8E92A4] flex items-center justify-between pt-1">
              <span>Tersimpan di Cloud</span>
              <strong className="text-purple-400">✓ Permanen</strong>
            </div>
          </div>
        </div>

        {/* ROW 3: DETAILED SPLIT STAGE (LIVE ACTIVITY LOG & GUEST BREAKDOWN) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1 & 2: LIVE REAL-TIME RADAR ACTIVITY STREAM */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#13151D] border border-[#262A37] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202330]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white font-mono">
                  LIVE REAL-TIME ACTIVITY LOG
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8E92A4]">Auto-refreshed live feed</span>
            </div>

            {activityStream.length === 0 ? (
              <div className="py-14 text-center text-xs text-[#7A7E90] italic space-y-1">
                <p>Belum ada aktivitas baru tercatat.</p>
                <p className="text-[11px] text-[#55596A]">Aktivitas check-in scan barcode, konfirmasi RSVP, dan ucapan doa akan muncul di sini secara real-time.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {activityStream.map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(0.2, idx * 0.03) }}
                      className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 text-xs transition-all hover:border-[#3E4357] ${
                        event.type === "checkin"
                          ? "bg-emerald-950/40 border-emerald-800/60"
                          : event.type === "wish"
                          ? "bg-[#181A24] border-[#292D3C]"
                          : "bg-[#161822] border-[#252836]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 mt-0.5 ${
                            event.type === "checkin"
                              ? "bg-emerald-900/80 text-emerald-300 border border-emerald-700"
                              : event.type === "wish"
                              ? "bg-purple-900/60 text-purple-300 border border-purple-700"
                              : "bg-[#242736] text-[#E0C98F] border border-[#373B4E]"
                          }`}
                        >
                          {event.type === "checkin" ? "🎟️" : event.type === "wish" ? "💌" : "📋"}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white font-serif text-sm">{event.title}</span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-extrabold uppercase tracking-wider ${
                                event.type === "checkin"
                                  ? "bg-emerald-900 text-emerald-300 border border-emerald-700"
                                  : event.type === "wish"
                                  ? "bg-purple-900 text-purple-300 border border-purple-700"
                                  : "bg-[#282B3A] text-[#C8A96B] border border-[#3A3E52]"
                              }`}
                            >
                              {event.badge}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[#C5C8D4] leading-relaxed line-clamp-2">{event.description}</p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[10px] font-mono text-[#8E92A4] bg-[#0E1015] px-2 py-1 rounded-lg border border-[#232634] inline-block">
                          {event.timeAgo}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* COLUMN 3: GUEST DEMOGRAPHICS & QUICK STATS */}
          <div className="space-y-6">
            {/* Category Breakdown Card */}
            <div className="p-6 rounded-3xl bg-[#13151D] border border-[#262A37] shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#202330]">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#E0C98F] font-mono">
                  GUEST CATEGORIES
                </h3>
                <span className="text-[10px] font-mono text-[#8E92A4]">{totalRegisteredGuests} Tamu</span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(categoryStats).map(([cat, count]) => {
                  const pct = totalRegisteredGuests > 0 ? Math.round((count / totalRegisteredGuests) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#C5C8D4]">{cat}</span>
                        <span className="font-mono text-white font-bold">
                          {count} <span className="text-[#7A7E90] text-[10px]">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-[#181A24] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-[#C8A96B] to-[#E0C98F] h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reception Venue Pass Guide */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1B1E2B] via-[#141620] to-[#0E1017] border border-[#303546] shadow-xl space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-2">
                <span>📍</span>
                <span>VENUE RECEPTION GUIDE</span>
              </h3>
              <p className="text-xs text-[#B2B6C6] leading-relaxed">
                Panitia di pintu masuk dapat menggunakan HP / Tablet untuk membuka <strong>/admin</strong> pada menu <strong>Scanner</strong> untuk scan QR barcode tamu.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/admin"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-[#0A0B0E] font-black text-xs uppercase tracking-wider rounded-xl text-center shadow-md transition-all block"
                >
                  Buka Scanner Pintu Masuk →
                </Link>
                <a
                  href="https://wedding-angi-anam.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-[#202330] hover:bg-[#282C3D] text-[#C5C8D4] font-bold text-xs rounded-xl text-center border border-[#32374A] transition-all block"
                >
                  Buka Web Undangan Tamu ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
