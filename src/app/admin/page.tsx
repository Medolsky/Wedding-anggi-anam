"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { weddingData } from "@/data/weddingData";
import { GuestLinkGenerator, GeneratedGuest } from "@/components/admin/GuestLinkGenerator";
import { RSVPManager, RSVPItem } from "@/components/admin/RSVPManager";
import { WishesManager, WishItem } from "@/components/admin/WishesManager";
import { BarcodeScannerManager } from "@/components/admin/BarcodeScannerManager";
import { AdminLogin, AdminUser } from "@/components/admin/AdminLogin";

type AdminTab = "dashboard" | "scanner" | "links" | "rsvp" | "wishes" | "database" | "info";

export default function AdminPage() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Summary Metrics State
  const [guests, setGuests] = useState<GeneratedGuest[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean | null>(null);
  const [dbProvider, setDbProvider] = useState<string>("memory");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Check login session on mount
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("wedding_admin_auth");
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.username) {
          setCurrentUser(parsed);
        }
      }
    } catch {
      // LocalStorage error
    } finally {
      setIsAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchDashboardMetrics();
    const interval = setInterval(fetchDashboardMetrics, 12000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("wedding_admin_auth");
    setCurrentUser(null);
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  async function fetchDashboardMetrics() {
    const startTime = performance.now();
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/db?t=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));

      if (json.success && json.data) {
        if (Array.isArray(json.data.guests)) setGuests(json.data.guests);
        if (Array.isArray(json.data.rsvps)) setRsvps(json.data.rsvps);
        if (Array.isArray(json.data.wishes)) {
          setWishes((prev) => {
            const map = new Map<string, any>();
            prev.forEach((w) => map.set(w.id, w));
            json.data.wishes.forEach((w: any) => map.set(w.id, w));
            return Array.from(map.values()).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
          });
        }
        setIsCloudSynced(json.persistent !== false);
        if (json.provider) setDbProvider(json.provider);
      }
    } catch {
      setIsCloudSynced(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  // Calculated Metrics
  const totalGuests = guests.length;
  const sentCount = guests.filter((g) => g.status === "sent").length;
  const checkedInCount = guests.filter((g) => g.checkedIn).length;
  const totalPaxCheckedIn = guests.filter((g) => g.checkedIn).reduce((sum, g) => sum + (g.pax || 1), 0);
  const attendingRsvpCount = rsvps.filter((r) => r.attendance === "Hadir").length;
  const notAttendingRsvpCount = rsvps.filter((r) => r.attendance === "Tidak Hadir").length;
  const totalPaxRsvp = rsvps.filter((r) => r.attendance === "Hadir").reduce((sum, r) => sum + (r.guestCount || 1), 0);
  const totalWishes = wishes.length;

  function exportFullDataCSV() {
    let csv = "--- DAFTAR TAMU UNDANGAN ---\n";
    csv += "ID,Kode,Nama,Telepon,Kategori,Status WA,Status CheckIn,Jam CheckIn,PAX\n";
    guests.forEach((g) => {
      csv += `"${g.id}","${g.code || ""}","${g.name}","${g.phone || ""}","${g.category}","${g.status || "pending"}","${g.checkedIn ? "Hadir" : "Belum"}","${g.checkInTime || ""}","${g.pax || 1}"\n`;
    });

    csv += "\n--- KONFIRMASI KEHADIRAN (RSVP) ---\n";
    csv += "Nama,Status Kehadiran,Jumlah PAX,Sesi,Waktu\n";
    rsvps.forEach((r) => {
      csv += `"${r.name}","${r.attendance}","${r.guestCount}","${r.session}","${r.createdAt}"\n`;
    });

    csv += "\n--- UCAPAN & DOA ---\n";
    csv += "Nama,Pesan,Waktu\n";
    wishes.forEach((w) => {
      csv += `"${w.name}","${w.message.replace(/"/g, '""')}","${w.createdAt}"\n`;
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Lengkap_Pernikahan_${weddingData.couple.bride.nickname}_${weddingData.couple.groom.nickname}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportFullDataJSON() {
    const backupData = {
      exportedAt: new Date().toISOString(),
      couple: `${weddingData.couple.bride.nickname} & ${weddingData.couple.groom.nickname}`,
      dbProvider,
      guests,
      rsvps,
      wishes,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_wedding_db_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const getProviderName = (prov: string) => {
    switch (prov) {
      case "vercel_postgres":
        return "Neon Postgres (Vercel)";
      case "google_sheets":
        return "Google Sheets (Drive)";
      case "supabase":
        return "Supabase PostgreSQL";
      case "jsonbin":
        return "JSONBin Cloud";
      default:
        return "Local In-Memory";
    }
  };

  const sidebarNavItems = [
    {
      id: "dashboard" as AdminTab,
      label: "Dashboard Utama",
      badge: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: "scanner" as AdminTab,
      label: "Scanner Check-In",
      badge: checkedInCount > 0 ? `${checkedInCount} Tamu` : null,
      badgeColor: "bg-emerald-500 text-white",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <line x1="7" y1="12" x2="17" y2="12" />
        </svg>
      ),
    },
    {
      id: "links" as AdminTab,
      label: "Daftar Tamu & WA Bot",
      badge: totalGuests > 0 ? totalGuests : null,
      badgeColor: "bg-[#C8A96B] text-white",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "rsvp" as AdminTab,
      label: "Rekap RSVP",
      badge: attendingRsvpCount > 0 ? `${attendingRsvpCount} Hadir` : null,
      badgeColor: "bg-amber-500 text-white",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: "wishes" as AdminTab,
      label: "Ucapan & Doa",
      badge: totalWishes > 0 ? totalWishes : null,
      badgeColor: "bg-blue-500 text-white",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: "database" as AdminTab,
      label: "Database & Cloud Sync",
      badge: dbProvider === "vercel_postgres" ? "Neon" : dbProvider === "google_sheets" ? "Sheets" : null,
      badgeColor: "bg-purple-600 text-white",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
    },
    {
      id: "info" as AdminTab,
      label: "Info Acara & Rekening",
      badge: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
  ];

  // Auth Protection Gate
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-[#0E0F12] flex items-center justify-center text-[#C8A96B]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#C8A96B]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-mono tracking-widest uppercase text-[#8A8C94]">Memverifikasi Akun Admin...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AdminLogin onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#0E0F12] text-[#F1F0EC] font-sans flex flex-col md:flex-row antialiased selection:bg-[#C8A96B] selection:text-black">
      {/* ==========================================
          SIDEBAR NAVIGATION (PREMIUM DARK SLATE)
          ========================================== */}
      
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-72 bg-[#141519] text-[#E5E3DF] border-r border-[#24262E] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } h-screen overflow-y-auto`}
      >
        <div>
          {/* Sidebar Header Brand */}
          <div className="p-5 border-b border-[#24262E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E0C98F] via-[#C8A96B] to-[#8A6B35] flex items-center justify-center text-[#0E0F12] font-black text-lg shadow-md shadow-[#C8A96B]/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xs font-black text-white tracking-[2px] uppercase leading-tight">
                  WEDDING ADMIN
                </h2>
                <p className="text-[11.5px] text-[#C8A96B] font-serif font-bold italic">
                  {weddingData.couple.bride.nickname} &amp; {weddingData.couple.groom.nickname}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-[#9E9D98] hover:text-white p-1 rounded-lg bg-[#1D1F26]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Database Connection Status Pill */}
          <div className="px-4 py-3">
            <button
              onClick={() => setActiveTab("database")}
              className="w-full bg-[#1A1C22] hover:bg-[#20222A] border border-[#2B2E38] hover:border-[#C8A96B]/50 p-2.5 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCloudSynced ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCloudSynced ? "bg-emerald-500" : "bg-amber-500"}`} />
                </span>
                <div className="truncate">
                  <p className="text-[11px] font-bold text-white group-hover:text-[#E0C98F] transition-colors truncate">
                    {getProviderName(dbProvider)}
                  </p>
                  <p className="text-[9.5px] text-[#8A8C94]">
                    {latencyMs !== null ? `${latencyMs}ms latency` : "Checking connection..."}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                isCloudSynced
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"
                  : "bg-amber-950/80 text-amber-300 border border-amber-800/80"
              }`}>
                {isCloudSynced ? "LIVE" : "LOCAL"}
              </span>
            </button>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="px-3 space-y-1">
            <p className="px-3 pt-2 text-[10px] font-extrabold uppercase tracking-[2px] text-[#636674] mb-1.5">
              Menu Navigasi
            </p>
            {sidebarNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer group ${
                    isActive
                      ? "bg-gradient-to-r from-[#C8A96B] to-[#A38240] text-[#0E0F12] font-black shadow-lg shadow-[#C8A96B]/25"
                      : "text-[#A1A4B2] hover:bg-[#1C1E25] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-[#0E0F12]" : "text-[#727585] group-hover:text-[#C8A96B] transition-colors"}>
                      {item.icon}
                    </span>
                    <span className="tracking-wide">{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded-full font-mono font-extrabold ${
                        isActive
                          ? "bg-black/25 text-black"
                          : item.badgeColor || "bg-[#252833] text-[#E5E3DF]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Quick Links */}
        <div className="p-4 border-t border-[#24262E] space-y-2.5 bg-[#111216]">
          {/* Active Admin User Card */}
          <div className="p-2.5 bg-[#17181D] rounded-xl border border-[#262832] flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-lg bg-[#C8A96B]/20 border border-[#806A42] flex items-center justify-center text-[#E0C98F] text-xs font-bold font-serif">
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[9.5px] text-[#C8A96B] font-mono">{currentUser.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout / Keluar"
              className="p-1.5 text-[#8A8C94] hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>

          <button
            onClick={exportFullDataCSV}
            className="w-full py-2 px-3 bg-[#1C1E25] hover:bg-[#252833] border border-[#2E313D] text-[#E5E3DF] rounded-xl text-[11.5px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV Report</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              target="_blank"
              className="w-full py-2 px-2.5 bg-[#C8A96B]/15 hover:bg-[#C8A96B]/25 border border-[#C8A96B]/40 text-[#E0C98F] rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm text-center"
            >
              <span>Web Live</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full py-2 px-2.5 bg-[#231416] hover:bg-rose-950 border border-rose-900/60 text-rose-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            >
              <span>Logout</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA (PROFESSIONAL SLATE)
          ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="bg-[#141519]/90 backdrop-blur-md border-b border-[#24262E] sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-[#9E9D98] hover:text-white bg-[#1C1E25] rounded-xl border border-[#2E313D] cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold font-serif text-[#F1F0EC] tracking-wide leading-tight">
                  {sidebarNavItems.find((n) => n.id === activeTab)?.label}
                </h1>
                {isRefreshing && (
                  <span className="text-[10px] text-[#C8A96B] flex items-center gap-1 font-mono">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Syncing...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8A8C94] hidden sm:block">
                Wedding Event System • Sabtu, 10 Oktober 2026 @ BALAI IKABAMA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Active User Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1C1E25] border border-[#2B2E38] rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white font-serif">{currentUser.name}</span>
              <span className="text-[10px] text-[#C8A96B] font-mono font-bold bg-[#141519] px-2 py-0.5 rounded-md border border-[#2E313D]">
                {currentUser.role}
              </span>
            </div>

            {/* Live Clock Badge */}
            {currentTime && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1E25] border border-[#2B2E38] rounded-xl text-xs font-mono text-[#A1A4B2]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentTime}</span>
              </div>
            )}

            {/* Manual Refresh Button */}
            <button
              onClick={fetchDashboardMetrics}
              disabled={isRefreshing}
              title="Refresh Data"
              className="p-2 sm:px-3 sm:py-1.5 bg-[#1C1E25] hover:bg-[#252833] text-[#A1A4B2] hover:text-white border border-[#2B2E38] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm active:scale-95"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isRefreshing ? "animate-spin text-[#C8A96B]" : ""}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* View Live Web Button */}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex py-1.5 px-3 bg-gradient-to-r from-[#C8A96B] via-[#B8860B] to-[#966F17] text-[#0E0F12] font-black hover:brightness-110 rounded-xl text-xs transition-all shadow-md shadow-[#C8A96B]/20 items-center gap-1.5"
            >
              <span>Lihat Web</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
              </svg>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Logout Akun Admin"
              className="py-1.5 px-3 bg-[#231416] hover:bg-rose-950 border border-rose-900/60 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-7 flex-1 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {/* Total Undangan */}
                <div className="bg-[#141519] p-4 sm:p-5 border border-[#24262E] hover:border-[#333642] rounded-2xl shadow-sm space-y-2 transition-all">
                  <div className="flex items-center justify-between text-[#8A8C94]">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-[#A1A4B2]">Total Undangan</span>
                    <div className="w-8 h-8 rounded-lg bg-[#1E2028] flex items-center justify-center text-[#C8A96B]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black font-serif text-[#F1F0EC] tracking-tight">{totalGuests}</p>
                  <div className="flex items-center justify-between text-[10.5px] text-[#8A8C94] pt-1 border-t border-[#20222B]">
                    <span>Terkirim via WA:</span>
                    <span className="font-bold text-[#E0C98F]">{sentCount} / {totalGuests}</span>
                  </div>
                </div>

                {/* Check-In Kedatangan */}
                <div className="bg-[#141519] p-4 sm:p-5 border border-emerald-900/40 hover:border-emerald-700/60 rounded-2xl shadow-sm space-y-2 transition-all bg-gradient-to-br from-emerald-950/20 to-transparent">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-emerald-400">Check-In Lokasi</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black font-serif text-emerald-400 tracking-tight">
                    {checkedInCount} <span className="text-xs font-semibold text-emerald-300">({totalPaxCheckedIn} PAX)</span>
                  </p>
                  <div className="flex items-center justify-between text-[10.5px] text-emerald-500 pt-1 border-t border-emerald-950/60">
                    <span>Kedatangan:</span>
                    <span className="font-bold text-emerald-300">
                      {totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0}% Kuota
                    </span>
                  </div>
                </div>

                {/* RSVP Konfirmasi */}
                <div className="bg-[#141519] p-4 sm:p-5 border border-amber-900/40 hover:border-amber-700/60 rounded-2xl shadow-sm space-y-2 transition-all bg-gradient-to-br from-amber-950/20 to-transparent">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-amber-400">RSVP Hadir</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black font-serif text-amber-400 tracking-tight">
                    {attendingRsvpCount} <span className="text-xs font-semibold text-amber-300">({totalPaxRsvp} Orang)</span>
                  </p>
                  <div className="flex items-center justify-between text-[10.5px] text-amber-500 pt-1 border-t border-amber-950/60">
                    <span>Tidak Hadir:</span>
                    <span className="font-bold text-rose-400">{notAttendingRsvpCount} Tamu</span>
                  </div>
                </div>

                {/* Ucapan & Doa */}
                <div className="bg-[#141519] p-4 sm:p-5 border border-blue-900/40 hover:border-blue-700/60 rounded-2xl shadow-sm space-y-2 transition-all bg-gradient-to-br from-blue-950/20 to-transparent">
                  <div className="flex items-center justify-between text-blue-400">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-blue-400">Ucapan &amp; Doa</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black font-serif text-blue-400 tracking-tight">{totalWishes}</p>
                  <div className="flex items-center justify-between text-[10.5px] text-blue-500 pt-1 border-t border-blue-950/60">
                    <span>Buku Tamu:</span>
                    <span className="font-bold text-blue-300">{totalWishes} Pesan</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Utility Panels */}
              <div className="bg-[#141519] p-5 sm:p-6 border border-[#24262E] rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#A1A4B2] uppercase tracking-[2px]">
                    Akses Cepat Fitur Manajemen
                  </h3>
                  <span className="text-[11px] text-[#636674]">Pilih modul untuk mengelola</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <button
                    onClick={() => setActiveTab("scanner")}
                    className="p-4 bg-[#1A1C22] hover:bg-emerald-950/30 border border-[#2B2E38] hover:border-emerald-600/50 rounded-2xl text-left transition-all cursor-pointer space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#111215] border border-[#2B2E38] flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <line x1="7" y1="12" x2="17" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F1F0EC] group-hover:text-emerald-300 transition-colors">Scanner Barcode Check-In</p>
                      <p className="text-[11px] text-[#8A8C94] mt-0.5 leading-relaxed">Buka kamera untuk scan QR E-Ticket kedatangan tamu di meja registrasi.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("links")}
                    className="p-4 bg-[#1A1C22] hover:bg-[#C8A96B]/15 border border-[#2B2E38] hover:border-[#C8A96B]/50 rounded-2xl text-left transition-all cursor-pointer space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#111215] border border-[#2B2E38] flex items-center justify-center text-[#E0C98F] group-hover:scale-105 transition-transform">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F1F0EC] group-hover:text-[#E0C98F] transition-colors">Kirim WA Massal &amp; Tamu</p>
                      <p className="text-[11px] text-[#8A8C94] mt-0.5 leading-relaxed">Buat link personal tamu, impor daftar Excel/WA, dan blast link otomatis.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("database")}
                    className="p-4 bg-[#1A1C22] hover:bg-purple-950/30 border border-[#2B2E38] hover:border-purple-600/50 rounded-2xl text-left transition-all cursor-pointer space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#111215] border border-[#2B2E38] flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F1F0EC] group-hover:text-purple-300 transition-colors">Status Database &amp; Cloud</p>
                      <p className="text-[11px] text-[#8A8C94] mt-0.5 leading-relaxed">Cek status koneksi Neon Postgres, Google Sheets, dan download backup data.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity Live Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Check-Ins */}
                <div className="bg-[#141519] p-5 border border-[#24262E] rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#F1F0EC]">
                        Check-In Terbaru ({checkedInCount})
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab("scanner")}
                      className="text-[11px] text-[#C8A96B] hover:text-[#E0C98F] font-bold"
                    >
                      Buka Scanner →
                    </button>
                  </div>

                  {guests.filter((g) => g.checkedIn).length === 0 ? (
                    <div className="py-8 text-center space-y-1">
                      <p className="text-xs text-[#8A8C94] italic">Belum ada tamu yang check-in.</p>
                      <p className="text-[10.5px] text-[#636674]">Scan barcode e-ticket tamu di pintu masuk untuk mencatat kehadiran.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {guests
                        .filter((g) => g.checkedIn)
                        .slice(0, 4)
                        .map((g) => (
                          <div key={g.id} className="p-3 bg-[#1A1C22] border border-emerald-900/40 rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-[#F1F0EC]">{g.name}</span>
                              <div className="text-[10px] text-[#8A8C94] mt-0.5">
                                {g.category || "Tamu VIP"} • {g.pax || 1} PAX • <span className="text-emerald-400 font-mono">{g.checkInTime || "Baru saja"}</span>
                              </div>
                            </div>
                            <span className="text-[9.5px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              ✓ HADIR
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Recent Wishes */}
                <div className="bg-[#141519] p-5 border border-[#24262E] rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#F1F0EC]">
                        Ucapan &amp; Doa Terbaru ({totalWishes})
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab("wishes")}
                      className="text-[11px] text-[#C8A96B] hover:text-[#E0C98F] font-bold"
                    >
                      Lihat Semua →
                    </button>
                  </div>

                  {wishes.length === 0 ? (
                    <div className="py-8 text-center space-y-1">
                      <p className="text-xs text-[#8A8C94] italic">Belum ada ucapan masuk.</p>
                      <p className="text-[10.5px] text-[#636674]">Pesan ucapan dari tamu yang mengisi form di web akan muncul di sini.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {wishes.slice(0, 3).map((w) => (
                        <div key={w.id} className="p-3 bg-[#1A1C22] border border-[#2B2E38] rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#F1F0EC]">{w.name}</span>
                            <span className="text-[9.5px] text-[#8A8C94] font-mono">{w.createdAt}</span>
                          </div>
                          <p className="text-[11px] text-[#C5C4C0] italic line-clamp-2">&quot;{w.message}&quot;</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "scanner" && <BarcodeScannerManager />}

          {activeTab === "links" && <GuestLinkGenerator />}

          {activeTab === "rsvp" && <RSVPManager />}

          {activeTab === "wishes" && <WishesManager />}

          {/* Database Diagnostics & Cloud Status Tab */}
          {activeTab === "database" && (
            <div className="space-y-6">
              <div className="p-6 border border-[#24262E] rounded-2xl bg-[#141519] space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#24262E]">
                  <div>
                    <h3 className="text-base font-bold font-serif text-[#F1F0EC]">Status Koneksi Database Cloud</h3>
                    <p className="text-xs text-[#8A8C94] mt-0.5">
                      Pemeriksaan status real-time engine database backend yang aktif.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchDashboardMetrics}
                      className="py-2 px-3 bg-[#1C1E25] hover:bg-[#252833] text-white border border-[#2E313D] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                      <span>Tes Ping Ulang</span>
                    </button>

                    <button
                      onClick={exportFullDataJSON}
                      className="py-2 px-3 bg-[#C8A96B] hover:bg-[#B8860B] text-[#0E0F12] font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Backup JSON</span>
                    </button>
                  </div>
                </div>

                {/* Engine Diagnostic Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#1A1C22] border border-[#2B2E38] rounded-xl space-y-1.5">
                    <p className="text-[10.5px] uppercase tracking-wider font-extrabold text-[#8A8C94]">Provider Aktif</p>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isCloudSynced ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {getProviderName(dbProvider)}
                    </p>
                    <p className="text-[10px] text-[#636674]">
                      {dbProvider === "vercel_postgres" ? "Terkoneksi via Serverless SQL" : "Terkoneksi via Web App API"}
                    </p>
                  </div>

                  <div className="p-4 bg-[#1A1C22] border border-[#2B2E38] rounded-xl space-y-1.5">
                    <p className="text-[10.5px] uppercase tracking-wider font-extrabold text-[#8A8C94]">Kecepatan Respon (Latency)</p>
                    <p className="text-sm font-bold font-mono text-emerald-400">
                      {latencyMs !== null ? `${latencyMs} ms` : "Calculating..."}
                    </p>
                    <p className="text-[10px] text-[#636674]">Waktu bolak-balik client-to-cloud</p>
                  </div>

                  <div className="p-4 bg-[#1A1C22] border border-[#2B2E38] rounded-xl space-y-1.5">
                    <p className="text-[10.5px] uppercase tracking-wider font-extrabold text-[#8A8C94]">Status Persistence</p>
                    <p className="text-sm font-bold text-[#E0C98F]">
                      {isCloudSynced ? "✓ Tersimpan Permanen" : "⚠️ Memory Temporary"}
                    </p>
                    <p className="text-[10px] text-[#636674]">Data aman jika web direstart</p>
                  </div>
                </div>

                {/* Table Record Count Summary */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[#A1A4B2] uppercase tracking-wider">
                    Jumlah Baris Data Tersimpan (Tabel)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[#111215] border border-[#24262E] rounded-xl text-center">
                      <p className="text-xl font-bold text-white font-mono">{totalGuests}</p>
                      <p className="text-[10.5px] text-[#8A8C94] mt-0.5">Tamu Undangan</p>
                    </div>
                    <div className="p-3.5 bg-[#111215] border border-[#24262E] rounded-xl text-center">
                      <p className="text-xl font-bold text-amber-400 font-mono">{rsvps.length}</p>
                      <p className="text-[10.5px] text-[#8A8C94] mt-0.5">Konfirmasi RSVP</p>
                    </div>
                    <div className="p-3.5 bg-[#111215] border border-[#24262E] rounded-xl text-center">
                      <p className="text-xl font-bold text-blue-400 font-mono">{totalWishes}</p>
                      <p className="text-[10.5px] text-[#8A8C94] mt-0.5">Ucapan &amp; Doa</p>
                    </div>
                    <div className="p-3.5 bg-[#111215] border border-[#24262E] rounded-xl text-center">
                      <p className="text-xl font-bold text-emerald-400 font-mono">{checkedInCount}</p>
                      <p className="text-[10.5px] text-[#8A8C94] mt-0.5">Check-In Terverifikasi</p>
                    </div>
                  </div>
                </div>

                {/* Neon Postgres / Google Sheets Quick Guide */}
                <div className="p-4 bg-[#111216] border border-[#282A35] rounded-xl space-y-2 text-xs text-[#A1A4B2]">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>💡</span> Cara Mengaktifkan Neon Postgres di Vercel:
                  </p>
                  <p className="leading-relaxed">
                    1. Buka dashboard project Anda di <strong>vercel.com</strong> ➔ klik tab <strong>Storage</strong>.<br />
                    2. Klik <strong>Create Database</strong> ➔ pilih <strong>Neon</strong> (atau Postgres).<br />
                    3. Klik <strong>Connect to Project</strong>. Database SQL akan otomatis aktif dengan kecepatan respon ultra kilat (&lt;50ms)!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Acara & Rekening Tab */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-[#24262E] rounded-2xl bg-[#141519] space-y-4 shadow-sm">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#24262E]">
                  <div className="w-8 h-8 rounded-lg bg-[#1E2028] flex items-center justify-center text-[#C8A96B]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold font-serif text-[#F1F0EC]">Ringkasan Informasi Acara</h3>
                </div>
                <div className="text-xs space-y-3 text-[#C5C4C0]">
                  <div className="flex justify-between py-1 border-b border-[#1E2028]">
                    <span className="text-[#8A8C94]">Mempelai Wanita:</span>
                    <span className="font-bold text-white">{weddingData.couple.bride.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1E2028]">
                    <span className="text-[#8A8C94]">Mempelai Pria:</span>
                    <span className="font-bold text-white">{weddingData.couple.groom.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1E2028]">
                    <span className="text-[#8A8C94]">Hari &amp; Tanggal:</span>
                    <span className="font-bold text-[#E0C98F]">Sabtu, 10 Oktober 2026</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1E2028]">
                    <span className="text-[#8A8C94]">Lokasi Acara:</span>
                    <span className="font-bold text-white">BALAI IKABAMA, Depok</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#8A8C94]">Musik Latar:</span>
                    <span className="font-bold text-white">Catalyst - Weird Genius</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-[#24262E] rounded-2xl bg-[#141519] space-y-4 shadow-sm">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#24262E]">
                  <div className="w-8 h-8 rounded-lg bg-[#1E2028] flex items-center justify-center text-[#C8A96B]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold font-serif text-[#F1F0EC]">Rekening &amp; Alamat Hadiah</h3>
                </div>
                <div className="text-xs space-y-3 text-[#C5C4C0]">
                  {weddingData.giftAccounts.map((acc) => (
                    <div key={acc.id} className="p-3 bg-[#1A1C22] border border-[#2B2E38] rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{acc.bankName}</p>
                        <p className="text-[11px] text-[#8A8C94]">a.n. {acc.accountName}</p>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#E0C98F] bg-[#111215] px-3 py-1 rounded-lg border border-[#2B2E38]">
                        {acc.accountNumber}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#1E2028] text-xs">
                    <p className="text-[#8A8C94] font-bold mb-1">Alamat Pengiriman Kado Fisik:</p>
                    <p className="text-white bg-[#1A1C22] p-3 rounded-xl border border-[#2B2E38] leading-relaxed">
                      {weddingData.giftAddress.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
