"use client";

import { useState, useEffect, useRef } from "react";

export interface CheckedInGuest {
  id: string;
  code?: string;
  name: string;
  category?: string;
  checkedIn?: boolean;
  checkInTime?: string;
  pax?: number;
  phone?: string;
}

export function BarcodeScannerManager() {
  const [scannedCode, setScannedCode] = useState("");
  const [guests, setGuests] = useState<CheckedInGuest[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: "success" | "error" | null;
    message: string;
    guest?: CheckedInGuest;
  }>({ status: null, message: "" });

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadCloudGuests();
    // Auto-focus barcode input for instant USB/Bluetooth barcode scanner compatibility
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Auto refresh data every 10s
    const interval = setInterval(loadCloudGuests, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadCloudGuests() {
    try {
      const res = await fetch("/api/db?type=guests");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setGuests(json.data);
      }
    } catch {
      // Fallback
    }
  }

  async function handleCheckInCode(codeToSubmit: string) {
    if (!codeToSubmit.trim()) return;

    setIsScanning(true);
    setScanResult({ status: null, message: "" });

    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkin",
          item: { code: codeToSubmit.trim() },
        }),
      });

      const json = await res.json();

      if (json.success && json.guest) {
        setScanResult({
          status: "success",
          message: `✓ Check-In Berhasil! Selamat Datang ${json.guest.name}`,
          guest: json.guest,
        });

        if (Array.isArray(json.guests)) {
          setGuests(json.guests);
        } else {
          loadCloudGuests();
        }

        setScannedCode("");
      } else {
        setScanResult({
          status: "error",
          message: `⚠️ Tamu/Kode "${codeToSubmit}" tidak ditemukan atau gagal diautentikasi.`,
        });
      }
    } catch {
      setScanResult({
        status: "error",
        message: "❌ Terjadi kesalahan koneksi saat memproses check-in.",
      });
    } finally {
      setIsScanning(false);
      if (inputRef.current) inputRef.current.focus();
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleCheckInCode(scannedCode);
  }

  // Calculate Metrics
  const totalGuests = guests.length;
  const checkedInGuests = guests.filter((g) => g.checkedIn);
  const checkedInCount = checkedInGuests.length;
  const totalPaxCheckedIn = checkedInGuests.reduce((sum, g) => sum + (g.pax || 1), 0);
  const pendingCount = totalGuests - checkedInCount;

  return (
    <div className="space-y-6">
      {/* Real-time Attendance Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="gold-card-pro p-3.5 border border-[#d4af37]/40 text-center rounded-xl bg-white/80">
          <p className="text-[10px] uppercase tracking-wider text-[#66615c] font-semibold">Total Tamu Diundang</p>
          <p className="text-2xl font-bold font-serif text-[#2a2723]">{totalGuests}</p>
        </div>

        <div className="gold-card-pro p-3.5 border border-emerald-500/40 text-center rounded-xl bg-emerald-50/80">
          <p className="text-[10px] uppercase tracking-wider text-emerald-800 font-extrabold">Tamu Hadir di Lokasi</p>
          <p className="text-2xl font-bold font-serif text-emerald-700">
            {checkedInCount} <span className="text-xs font-semibold text-emerald-800">({totalPaxCheckedIn} PAX)</span>
          </p>
        </div>

        <div className="gold-card-pro p-3.5 border border-amber-500/40 text-center rounded-xl bg-amber-50/80">
          <p className="text-[10px] uppercase tracking-wider text-amber-800 font-semibold">Belum Check-In</p>
          <p className="text-2xl font-bold font-serif text-amber-700">{pendingCount}</p>
        </div>

        <div className="gold-card-pro p-3.5 border border-blue-500/40 text-center rounded-xl bg-blue-50/80">
          <p className="text-[10px] uppercase tracking-wider text-blue-800 font-semibold">Persentase Kehadiran</p>
          <p className="text-2xl font-bold font-serif text-blue-700">
            {totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Main Barcode Scanner Input Box */}
      <div className="gold-card-pro p-5 md:p-6 border-2 border-[#d4af37] shadow-2xl rounded-2xl bg-white/95 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">📷</span>
            <h3 className="text-lg md:text-xl font-bold font-serif text-[#2a2723]" style={{ fontFamily: "var(--font-heading)" }}>
              Scanner Check-In Barcode Tamu
            </h3>
          </div>

          <p className="text-xs text-[#66615c] leading-relaxed">
            Arahkan scanner barcode / ketik kode E-Ticket / nama tamu untuk konfirmasi kehadiran langsung di pintu masuk.
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Scan Barcode atau ketik Nama/Kode E-Ticket..."
                className="form-input text-center text-sm md:text-base py-3 px-4 rounded-xl font-mono font-bold tracking-wider uppercase border-2 border-[#d4af37] bg-white shadow-inner focus:ring-2 focus:ring-[#d4af37]"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isScanning || !scannedCode.trim()}
                className="btn-modern-primary flex-1 py-3 text-xs font-bold uppercase tracking-wider shadow-lg cursor-pointer"
              >
                {isScanning ? "⌛ Verifikasi..." : "✓ CHECK-IN SEKARANG"}
              </button>
            </div>
          </form>

          {/* Real-time Scan Result Banner */}
          {scanResult.status && (
            <div
              className={`p-4 rounded-xl border text-center transition-all animate-bounce ${
                scanResult.status === "success"
                  ? "bg-emerald-100 border-emerald-500 text-emerald-900"
                  : "bg-rose-100 border-rose-500 text-rose-900"
              }`}
            >
              <p className="text-sm font-extrabold">{scanResult.message}</p>
              {scanResult.guest && (
                <div className="mt-2 text-xs pt-2 border-t border-emerald-300/60 flex items-center justify-center gap-4">
                  <span>Kategori: <strong>{scanResult.guest.category || "Tamu VIP"}</strong></span>
                  <span>Jumlah: <strong>{scanResult.guest.pax || 1} PAX</strong></span>
                  <span>Jam: <strong>{scanResult.guest.checkInTime}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Checked-In Guests Feed */}
      <div className="gold-card-pro p-4 border border-[#d4af37]/30 rounded-xl bg-white/90">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs uppercase tracking-[2px] font-bold text-[#b8860b]">
            📋 Daftar Riwayat Check-In Tamu ({checkedInCount})
          </h4>
          <button
            onClick={loadCloudGuests}
            className="text-[10px] text-[#8a662d] bg-[#f7ebbf]/40 px-2.5 py-1 rounded-md border border-[#d4af37]/40 cursor-pointer font-bold"
          >
            🔄 Sync Real-Time
          </button>
        </div>

        {checkedInGuests.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#66615c] italic">
            Belum ada tamu yang check-in di lokasi. Gunakan input scanner di atas saat tamu tiba! 🎟️
          </div>
        ) : (
          <div className="space-y-2.5">
            {checkedInGuests.map((g) => (
              <div
                key={g.id}
                className="p-3 border border-emerald-300 rounded-xl bg-emerald-50/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#2a2723] font-serif text-sm">{g.name}</span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 border border-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      ✓ HADIR (Checked-In)
                    </span>
                    <span className="text-[9px] bg-[#f7ebbf] text-[#8a662d] border border-[#d4af37]/40 px-2 py-0.5 rounded-full font-mono font-semibold">
                      {g.code || g.id}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#66615c] flex gap-4">
                    <span>👥 Jumlah: <strong className="text-[#b8860b]">{g.pax || 1} PAX</strong></span>
                    <span>🕒 Jam Masuk: <strong>{g.checkInTime || "Baru saja"}</strong></span>
                    {g.category && <span>🏷️ Kategori: <strong>{g.category}</strong></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
