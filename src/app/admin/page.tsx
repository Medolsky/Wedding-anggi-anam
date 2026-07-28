"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { weddingData } from "@/data/weddingData";
import { GuestLinkGenerator, GeneratedGuest } from "@/components/admin/GuestLinkGenerator";
import { RSVPManager, RSVPItem } from "@/components/admin/RSVPManager";
import { WishesManager, WishItem } from "@/components/admin/WishesManager";
import { BarcodeScannerManager } from "@/components/admin/BarcodeScannerManager";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "scanner" | "links" | "rsvp" | "wishes" | "info">("dashboard");

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

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#2a2723] selection:bg-[#d4af37] selection:text-white pb-16 font-sans">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Header Bar */}
        <header className="bg-white border border-[#d4af37]/40 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] uppercase tracking-[3px] text-[#b8860b] font-extrabold bg-[#f7ebbf]/40 px-3 py-0.5 rounded-full border border-[#d4af37]/30">
                👑 Professional Admin Panel
              </span>

              {/* Cloud Sync Badge */}
              <span
                className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 border ${
                  isCloudSynced === true
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : isCloudSynced === false
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
                {isCloudSynced ? "Supabase Cloud Connected" : "Local Memory Store"}
              </span>
            </div>

            <h1
              className="text-xl sm:text-2xl font-bold font-serif text-[#2a2723]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Pernikahan {weddingData.couple.bride.nickname} &amp; {weddingData.couple.groom.nickname}
            </h1>
            <p className="text-xs text-[#66615c] mt-0.5">
              Sabtu, 10 Oktober 2026 • BALAI IKABAMA, Depok
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={exportFullDataCSV}
              className="py-2 px-3.5 bg-white border border-[#d4af37]/40 text-[#2a2723] hover:bg-[#f7ebbf]/40 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>📥 Export Laporan CSV</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="py-2 px-4 bg-[#d4af37] text-white hover:bg-[#b8860b] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>👁️ Lihat Undangan Live</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border border-[#d4af37]/30 rounded-2xl shadow-sm p-1.5 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/30 hover:text-[#2a2723]"
            }`}
          >
            <span>📊 Dashboard Utama</span>
          </button>

          <button
            onClick={() => setActiveTab("scanner")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "scanner"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/30 hover:text-[#2a2723]"
            }`}
          >
            <span>📷 Scanner Check-In</span>
            {checkedInCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === "scanner" ? "bg-white text-[#b8860b]" : "bg-emerald-100 text-emerald-800"}`}>
                {checkedInCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("links")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "links"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/30 hover:text-[#2a2723]"
            }`}
          >
            <span>🔗 Daftar Tamu &amp; WA Bot</span>
            {totalGuests > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === "links" ? "bg-white text-[#b8860b]" : "bg-[#f7ebbf] text-[#8a662d]"}`}>
                {totalGuests}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("rsvp")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "rsvp"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/30 hover:text-[#2a2723]"
            }`}
          >
            <span>📅 Rekap RSVP</span>
            {attendingRsvpCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === "rsvp" ? "bg-white text-[#b8860b]" : "bg-emerald-100 text-emerald-800"}`}>
                {attendingRsvpCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("wishes")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "wishes"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/30 hover:text-[#2a2723]"
            }`}
          >
            <span>💌 Ucapan &amp; Doa</span>
            {totalWishes > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === "wishes" ? "bg-white text-[#b8860b]" : "bg-[#f7ebbf] text-[#8a662d]"}`}>
                {totalWishes}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "info"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/30 hover:text-[#2a2723]"
            }`}
          >
            <span>⚙️ Info Acara &amp; Kado</span>
          </button>
        </nav>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 border border-[#d4af37]/40 rounded-2xl shadow-sm space-y-1">
                  <p className="text-[10.5px] uppercase tracking-wider text-[#66615c] font-bold">Total Tamu Diundang</p>
                  <p className="text-3xl font-bold font-serif text-[#2a2723]">{totalGuests}</p>
                  <p className="text-[10px] text-[#8a662d]">Undangan terbuat</p>
                </div>

                <div className="bg-white p-4 border border-emerald-400/50 rounded-2xl shadow-sm space-y-1">
                  <p className="text-[10.5px] uppercase tracking-wider text-emerald-800 font-bold">Tamu Hadir di Lokasi</p>
                  <p className="text-3xl font-bold font-serif text-emerald-700">
                    {checkedInCount} <span className="text-xs font-semibold text-emerald-600">({totalPaxCheckedIn} PAX)</span>
                  </p>
                  <p className="text-[10px] text-emerald-700">Sudah scan QR di pintu</p>
                </div>

                <div className="bg-white p-4 border border-amber-400/50 rounded-2xl shadow-sm space-y-1">
                  <p className="text-[10.5px] uppercase tracking-wider text-amber-800 font-bold">Konfirmasi RSVP Hadir</p>
                  <p className="text-3xl font-bold font-serif text-amber-700">
                    {attendingRsvpCount} <span className="text-xs font-semibold text-amber-600">({totalPaxRsvp} Orang)</span>
                  </p>
                  <p className="text-[10px] text-amber-700">Mengisi form RSVP web</p>
                </div>

                <div className="bg-white p-4 border border-blue-400/50 rounded-2xl shadow-sm space-y-1">
                  <p className="text-[10.5px] uppercase tracking-wider text-blue-800 font-bold">Total Ucapan &amp; Doa</p>
                  <p className="text-3xl font-bold font-serif text-blue-700">{totalWishes}</p>
                  <p className="text-[10px] text-blue-700">Pesan dari tamu</p>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white p-5 border border-[#d4af37]/40 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold font-serif text-[#2a2723] uppercase tracking-wider">
                  ⚡ Akses Cepat Fitur Utilitas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab("scanner")}
                    className="p-4 bg-[#faf8f5] hover:bg-[#f7ebbf]/40 border border-[#d4af37]/40 rounded-xl text-left transition-all cursor-pointer space-y-1"
                  >
                    <div className="text-xl">📷</div>
                    <p className="text-xs font-bold text-[#2a2723]">Scan Barcode Check-In</p>
                    <p className="text-[10.5px] text-[#66615c]">Buka kamera untuk scan QR E-Ticket kedatangan tamu.</p>
                  </button>

                  <button
                    onClick={() => setActiveTab("links")}
                    className="p-4 bg-[#faf8f5] hover:bg-[#f7ebbf]/40 border border-[#d4af37]/40 rounded-xl text-left transition-all cursor-pointer space-y-1"
                  >
                    <div className="text-xl">🚀</div>
                    <p className="text-xs font-bold text-[#2a2723]">Kirim WA Massal &amp; Impor</p>
                    <p className="text-[10.5px] text-[#66615c]">Impor daftar tamu dari Excel/WA &amp; kirim via bot.</p>
                  </button>

                  <button
                    onClick={exportFullDataCSV}
                    className="p-4 bg-[#faf8f5] hover:bg-[#f7ebbf]/40 border border-[#d4af37]/40 rounded-xl text-left transition-all cursor-pointer space-y-1"
                  >
                    <div className="text-xl">📥</div>
                    <p className="text-xs font-bold text-[#2a2723]">Download Rekap Laporan</p>
                    <p className="text-[10.5px] text-[#66615c]">Export seluruh data tamu, RSVP, &amp; ucapan ke CSV.</p>
                  </button>
                </div>
              </div>

              {/* Recent Activity Live Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Recent Check-Ins */}
                <div className="bg-white p-4 border border-[#d4af37]/30 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#b8860b]">
                      📋 Check-In Terbaru ({checkedInCount})
                    </h4>
                    <button
                      onClick={() => setActiveTab("scanner")}
                      className="text-[10px] text-[#b8860b] hover:underline font-bold"
                    >
                      Buka Scanner →
                    </button>
                  </div>

                  {guests.filter((g) => g.checkedIn).length === 0 ? (
                    <p className="text-xs text-[#66615c] italic text-center py-4">Belum ada tamu yang check-in.</p>
                  ) : (
                    <div className="space-y-2">
                      {guests
                        .filter((g) => g.checkedIn)
                        .slice(0, 4)
                        .map((g) => (
                          <div key={g.id} className="p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-[#2a2723]">{g.name}</span>
                              <div className="text-[10px] text-[#66615c]">
                                {g.pax || 1} PAX • {g.checkInTime || "Baru saja"}
                              </div>
                            </div>
                            <span className="text-[9px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              ✓ HADIR
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Recent Wishes */}
                <div className="bg-white p-4 border border-[#d4af37]/30 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#b8860b]">
                      💌 Ucapan Terbaru ({totalWishes})
                    </h4>
                    <button
                      onClick={() => setActiveTab("wishes")}
                      className="text-[10px] text-[#b8860b] hover:underline font-bold"
                    >
                      Lihat Semua →
                    </button>
                  </div>

                  {wishes.length === 0 ? (
                    <p className="text-xs text-[#66615c] italic text-center py-4">Belum ada ucapan masuk.</p>
                  ) : (
                    <div className="space-y-2">
                      {wishes.slice(0, 3).map((w) => (
                        <div key={w.id} className="p-2.5 bg-[#faf8f5] border border-[#d4af37]/30 rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#2a2723]">{w.name}</span>
                            <span className="text-[9.5px] text-[#888]">{w.createdAt}</span>
                          </div>
                          <p className="text-[11px] text-[#555] italic truncate">&quot;{w.message}&quot;</p>
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
              <div className="gold-card-pro p-6 border border-[#d4af37]/40 rounded-2xl bg-white space-y-4 shadow-sm">
                <h3 className="text-lg font-bold font-serif text-[#2a2723]">ℹ️ Ringkasan Informasi Acara</h3>
                <div className="text-xs space-y-2 text-[#555555]">
                  <p><strong>Mempelai:</strong> {weddingData.couple.bride.fullName} &amp; {weddingData.couple.groom.fullName}</p>
                  <p><strong>Tanggal:</strong> Sabtu, 10 Oktober 2026</p>
                  <p><strong>Lokasi:</strong> BALAI IKABAMA, Depok</p>
                  <p><strong>Musik:</strong> Catalyst - Weird Genius</p>
                </div>
              </div>

              <div className="gold-card-pro p-6 border border-[#d4af37]/40 rounded-2xl bg-white space-y-4 shadow-sm">
                <h3 className="text-lg font-bold font-serif text-[#2a2723]">💳 Rekening &amp; Hadiah</h3>
                <div className="text-xs space-y-2 text-[#555555]">
                  {weddingData.giftAccounts.map((acc) => (
                    <p key={acc.id}>• <strong>{acc.bankName}:</strong> {acc.accountNumber} (a.n. {acc.accountName})</p>
                  ))}
                  <p className="pt-2 border-t border-[#d4af37]/20"><strong>Alamat Kado:</strong> {weddingData.giftAddress.address}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <footer className="pt-6 border-t border-[#d4af37]/20 text-center text-xs text-[#66615c]">
          Wevitation Wedding Digital Admin Panel Dashboard • 2026
        </footer>
      </div>
    </main>
  );
}
