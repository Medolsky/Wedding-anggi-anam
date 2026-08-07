"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { weddingData } from "@/data/weddingData";
import { GuestLinkGenerator, GeneratedGuest } from "@/components/admin/GuestLinkGenerator";
import { RSVPManager, RSVPItem } from "@/components/admin/RSVPManager";
import { WishesManager, WishItem } from "@/components/admin/WishesManager";
import { BarcodeScannerManager } from "@/components/admin/BarcodeScannerManager";

type AdminTab = "dashboard" | "scanner" | "links" | "rsvp" | "wishes" | "info";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Summary Metrics State
  const [guests, setGuests] = useState<GeneratedGuest[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
    const interval = setInterval(fetchDashboardMetrics, 12000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardMetrics() {
    try {
      const res = await fetch("/api/db");
      const json = await res.json();
      if (json.success && json.data) {
        if (Array.isArray(json.data.guests)) setGuests(json.data.guests);
        if (Array.isArray(json.data.rsvps)) setRsvps(json.data.rsvps);
        if (Array.isArray(json.data.wishes)) setWishes(json.data.wishes);
        setIsCloudSynced(json.persistent !== false);
      }
    } catch {
      setIsCloudSynced(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculated Metrics
  const totalGuests = guests.length;
  const sentCount = guests.filter((g) => g.status === "sent").length;
  const checkedInCount = guests.filter((g) => g.checkedIn).length;
  const totalPaxCheckedIn = guests.filter((g) => g.checkedIn).reduce((sum, g) => sum + (g.pax || 1), 0);
  const attendingRsvpCount = rsvps.filter((r) => r.attendance === "Hadir").length;
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
      badge: checkedInCount > 0 ? checkedInCount : null,
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
      badge: attendingRsvpCount > 0 ? attendingRsvpCount : null,
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
      id: "info" as AdminTab,
      label: "Info Acara & Kado",
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

  return (
    <div className="min-h-screen bg-[#18191C] text-[#F1F0EC] font-sans flex flex-col md:flex-row">
      {/* ==========================================
          SIDEBAR NAVIGATION (DARK SLATE THEME)
          ========================================== */}
      
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-72 bg-[#121316] text-[#E5E3DF] border-r border-[#2B2C32] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } h-screen overflow-y-auto`}
      >
        <div>
          {/* Sidebar Header Brand */}
          <div className="p-6 border-b border-[#2B2C32] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E0C98F] via-[#C8A96B] to-[#8A6B35] flex items-center justify-center text-white font-bold text-lg shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide leading-tight">
                  ADMIN PANEL
                </h2>
                <p className="text-[11px] text-[#C8A96B] font-serif">
                  {weddingData.couple.bride.nickname} &amp; {weddingData.couple.groom.nickname}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-[#9E9D98] hover:text-white p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Cloud Sync Status Pill */}
          <div className="px-6 py-4">
            <div className="bg-[#1A1B1E] border border-[#2B2C32] p-3 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isCloudSynced ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                <span className="text-[11px] font-semibold text-[#9E9D98]">
                  {isCloudSynced ? "Supabase Cloud" : "Local Memory"}
                </span>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isCloudSynced ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"}`}>
                {isCloudSynced ? "CONNECTED" : "OFFLINE"}
              </span>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="px-4 space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[2px] text-[#6E6E73] mb-2">
              Menu Utama
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
                  className={`w-full py-3 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer group ${
                    isActive
                      ? "bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white shadow-lg shadow-[#C8A96B]/20"
                      : "text-[#9E9D98] hover:bg-[#1E1F23] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-white" : "text-[#6E6E73] group-hover:text-[#C8A96B]"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : item.badgeColor || "bg-[#2B2C32] text-[#E5E3DF]"
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
        <div className="p-4 border-t border-[#2B2C32] space-y-2">
          <button
            onClick={exportFullDataCSV}
            className="w-full py-2.5 px-3 bg-[#1A1B1E] hover:bg-[#25262B] border border-[#35373E] text-[#E5E3DF] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV Report</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="w-full py-2.5 px-3 bg-[#C8A96B]/15 hover:bg-[#C8A96B]/25 border border-[#C8A96B]/40 text-[#E0C98F] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Preview Live Web</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT STAGE (DARK SLATE THEME)
          ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar for Mobile & Desktop */}
        <header className="bg-[#202125] border-b border-[#2D2E34] sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-[#9E9D98] hover:text-white bg-[#18191C] rounded-xl border border-[#2D2E34] cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold font-serif text-[#F1F0EC] leading-tight">
                {sidebarNavItems.find((n) => n.id === activeTab)?.label}
              </h1>
              <p className="text-[11px] text-[#9E9D98] hidden sm:block">
                Wedding Admin • {weddingData.couple.bride.nickname} &amp; {weddingData.couple.groom.nickname} (10 Oktober 2026)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportFullDataCSV}
              className="hidden sm:flex py-2 px-3.5 bg-[#2A2B31] hover:bg-[#32343B] text-[#E5E3DF] border border-[#3A3C44] rounded-xl text-xs font-bold transition-all items-center gap-1.5 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="py-2 px-3.5 bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Lihat Web</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-8 flex-1 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[#9E9D98] mb-1">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold">Total Tamu</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold font-serif text-[#F1F0EC]">{totalGuests}</p>
                  <p className="text-[10.5px] text-[#9E9D98]">Undangan terbuat</p>
                </div>

                <div className="bg-[#202125] p-5 border border-emerald-800/60 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-400 mb-1">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold">Check-In Lokasi</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold font-serif text-emerald-400">
                    {checkedInCount} <span className="text-xs font-semibold text-emerald-300">({totalPaxCheckedIn} PAX)</span>
                  </p>
                  <p className="text-[10.5px] text-emerald-500">Sudah scan QR di lokasi</p>
                </div>

                <div className="bg-[#202125] p-5 border border-amber-800/60 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-amber-400 mb-1">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold">RSVP Hadir</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold font-serif text-amber-400">
                    {attendingRsvpCount} <span className="text-xs font-semibold text-amber-300">({totalPaxRsvp} Orang)</span>
                  </p>
                  <p className="text-[10.5px] text-amber-500">Konfirmasi via web</p>
                </div>

                <div className="bg-[#202125] p-5 border border-blue-800/60 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-blue-400 mb-1">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold">Ucapan &amp; Doa</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold font-serif text-blue-400">{totalWishes}</p>
                  <p className="text-[10.5px] text-blue-500">Pesan dari tamu</p>
                </div>
              </div>

              {/* Quick Action Panels */}
              <div className="bg-[#202125] p-6 border border-[#2D2E34] rounded-2xl shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-[#9E9D98] uppercase tracking-[2px]">
                  Akses Cepat Fitur Utilitas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab("scanner")}
                    className="p-5 bg-[#28292F] hover:bg-emerald-950/40 border border-[#35373E] hover:border-emerald-700/50 rounded-2xl text-left transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1C1D21] border border-[#35373E] flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-xs">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <line x1="7" y1="12" x2="17" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F1F0EC]">Scan Barcode Check-In</p>
                      <p className="text-[11px] text-[#9E9D98] mt-0.5">Buka kamera untuk scan QR E-Ticket kedatangan tamu.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("links")}
                    className="p-5 bg-[#28292F] hover:bg-[#C8A96B]/15 border border-[#35373E] hover:border-[#C8A96B]/50 rounded-2xl text-left transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1C1D21] border border-[#35373E] flex items-center justify-center text-[#E0C98F] group-hover:scale-105 transition-transform shadow-xs">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F1F0EC]">Kirim WA Massal &amp; Impor</p>
                      <p className="text-[11px] text-[#9E9D98] mt-0.5">Impor daftar tamu dari Excel/WA &amp; blast link via bot.</p>
                    </div>
                  </button>

                  <button
                    onClick={exportFullDataCSV}
                    className="p-5 bg-[#28292F] hover:bg-blue-950/40 border border-[#35373E] hover:border-blue-700/50 rounded-2xl text-left transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1C1D21] border border-[#35373E] flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shadow-xs">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#F1F0EC]">Download Laporan CSV</p>
                      <p className="text-[11px] text-[#9E9D98] mt-0.5">Export seluruh data tamu, RSVP, &amp; ucapan ke file CSV.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Check-Ins */}
                <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#F1F0EC]">
                      Check-In Terbaru ({checkedInCount})
                    </h4>
                    <button
                      onClick={() => setActiveTab("scanner")}
                      className="text-[11px] text-[#E0C98F] hover:underline font-bold"
                    >
                      Buka Scanner →
                    </button>
                  </div>

                  {guests.filter((g) => g.checkedIn).length === 0 ? (
                    <p className="text-xs text-[#9E9D98] italic text-center py-6">Belum ada tamu yang check-in.</p>
                  ) : (
                    <div className="space-y-2">
                      {guests
                        .filter((g) => g.checkedIn)
                        .slice(0, 4)
                        .map((g) => (
                          <div key={g.id} className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-[#F1F0EC]">{g.name}</span>
                              <div className="text-[10px] text-[#9E9D98]">
                                {g.pax || 1} PAX • {g.checkInTime || "Baru saja"}
                              </div>
                            </div>
                            <span className="text-[9.5px] bg-emerald-900 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                              ✓ HADIR
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Recent Wishes */}
                <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#F1F0EC]">
                      Ucapan Terbaru ({totalWishes})
                    </h4>
                    <button
                      onClick={() => setActiveTab("wishes")}
                      className="text-[11px] text-[#E0C98F] hover:underline font-bold"
                    >
                      Lihat Semua →
                    </button>
                  </div>

                  {wishes.length === 0 ? (
                    <p className="text-xs text-[#9E9D98] italic text-center py-6">Belum ada ucapan masuk.</p>
                  ) : (
                    <div className="space-y-2">
                      {wishes.slice(0, 3).map((w) => (
                        <div key={w.id} className="p-3 bg-[#28292F] border border-[#35373E] rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#F1F0EC]">{w.name}</span>
                            <span className="text-[9.5px] text-[#9E9D98]">{w.createdAt}</span>
                          </div>
                          <p className="text-[11px] text-[#C5C4C0] italic truncate">&quot;{w.message}&quot;</p>
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

          {activeTab === "info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-[#2D2E34] rounded-2xl bg-[#202125] space-y-4 shadow-xs">
                <h3 className="text-lg font-bold font-serif text-[#F1F0EC]">Ringkasan Informasi Acara</h3>
                <div className="text-xs space-y-2.5 text-[#C5C4C0]">
                  <p><strong>Mempelai:</strong> {weddingData.couple.bride.fullName} &amp; {weddingData.couple.groom.fullName}</p>
                  <p><strong>Tanggal:</strong> Sabtu, 10 Oktober 2026</p>
                  <p><strong>Lokasi:</strong> BALAI IKABAMA, Depok</p>
                  <p><strong>Musik Background:</strong> Catalyst - Weird Genius</p>
                </div>
              </div>

              <div className="p-6 border border-[#2D2E34] rounded-2xl bg-[#202125] space-y-4 shadow-xs">
                <h3 className="text-lg font-bold font-serif text-[#F1F0EC]">Rekening &amp; Alamat Hadiah</h3>
                <div className="text-xs space-y-2.5 text-[#C5C4C0]">
                  {weddingData.giftAccounts.map((acc) => (
                    <p key={acc.id}>• <strong>{acc.bankName}:</strong> {acc.accountNumber} (a.n. {acc.accountName})</p>
                  ))}
                  <p className="pt-2 border-t border-[#35373E]"><strong>Alamat Kado:</strong> {weddingData.giftAddress.address}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
