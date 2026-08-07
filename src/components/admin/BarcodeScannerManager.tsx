"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadCloudGuests();
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const interval = setInterval(loadCloudGuests, 10000);
    return () => {
      clearInterval(interval);
      stopCameraScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleCheckInCode = useCallback(async (codeToSubmit: string) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleCheckInCode(scannedCode);
  }

  // Camera QR Scanner using html5-qrcode
  const [showCamera, setShowCamera] = useState(false);

  async function startCameraScanner() {
    setCameraError("");
    // Show container FIRST so the DOM element is visible
    setShowCamera(true);

    // Wait for DOM to render the container
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {
          // Already stopped
        }
        scannerRef.current = null;
      }

      const scannerId = "qr-reader-container";
      const el = document.getElementById(scannerId);
      if (!el) {
        setCameraError("❌ Container kamera tidak ditemukan. Coba reload halaman.");
        return;
      }
      // Clear any previous content
      el.innerHTML = "";

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText: string) => {
          // On successful scan
          handleCheckInCode(decodedText);
        },
        () => {
          // QR code not found in frame — ignore silently
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      const msg = err?.message || String(err) || "";
      if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("denied")) {
        setCameraError("❌ Izin kamera ditolak. Mohon izinkan akses kamera di pengaturan browser Anda.");
      } else if (msg.includes("NotFoundError") || msg.includes("Requested device not found")) {
        setCameraError("❌ Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera.");
      } else {
        setCameraError(`❌ Gagal memulai kamera: ${msg}`);
      }
      setCameraActive(false);
    }
  }

  async function stopCameraScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Already stopped
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setShowCamera(false);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#202125] p-4 border border-[#2D2E34] text-center rounded-2xl shadow-xs">
          <p className="text-[10.5px] uppercase tracking-wider text-[#9E9D98] font-bold">Total Tamu Diundang</p>
          <p className="text-2xl font-bold font-serif text-[#F1F0EC] mt-1">{totalGuests}</p>
        </div>

        <div className="bg-[#202125] p-4 border border-emerald-800/60 text-center rounded-2xl shadow-xs">
          <p className="text-[10.5px] uppercase tracking-wider text-emerald-400 font-bold">Tamu Hadir di Lokasi</p>
          <p className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            {checkedInCount} <span className="text-xs font-semibold text-emerald-300">({totalPaxCheckedIn} PAX)</span>
          </p>
        </div>

        <div className="bg-[#202125] p-4 border border-amber-800/60 text-center rounded-2xl shadow-xs">
          <p className="text-[10.5px] uppercase tracking-wider text-amber-400 font-bold">Belum Check-In</p>
          <p className="text-2xl font-bold font-serif text-amber-400 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-[#202125] p-4 border border-blue-800/60 text-center rounded-2xl shadow-xs">
          <p className="text-[10.5px] uppercase tracking-wider text-blue-400 font-bold">Persentase Kehadiran</p>
          <p className="text-2xl font-bold font-serif text-blue-400 mt-1">
            {totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Main Scanner Area */}
      <div className="bg-[#202125] p-5 md:p-8 border border-[#C8A96B]/50 shadow-md rounded-2xl text-center space-y-6">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E0C98F" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <h3 className="text-lg md:text-xl font-bold font-serif text-[#F1F0EC]" style={{ fontFamily: "var(--font-heading)" }}>
              Scanner Check-In QR Tamu
            </h3>
          </div>

          <p className="text-xs text-[#9E9D98] leading-relaxed">
            Scan QR code tamu via kamera atau ketik kode E-Ticket manual untuk konfirmasi kehadiran real-time.
          </p>

          {/* Camera Scanner Toggle */}
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={cameraActive ? stopCameraScanner : startCameraScanner}
              className={`py-2.5 px-5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2 ${
                cameraActive
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{cameraActive ? "Matikan Kamera" : "Buka Kamera Scanner"}</span>
            </button>
          </div>

          {/* Camera Error */}
          {cameraError && (
            <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-300 text-xs font-semibold">
              {cameraError}
            </div>
          )}

          {/* Camera Scanner View */}
          <div
            ref={scannerContainerRef}
            style={{ display: showCamera ? "block" : "none" }}
            className="rounded-xl border-2 border-[#C8A96B]/40 overflow-hidden"
          >
            <div id="qr-reader-container" style={{ width: "100%" }} />
          </div>

          {/* Manual Input */}
          <div className="border-t border-[#2D2E34] pt-5">
            <p className="text-[10px] uppercase tracking-wider text-[#9E9D98] font-bold mb-2.5">
              Atau Input Kode E-Ticket Manual:
            </p>
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  placeholder="Ketik Kode E-Ticket atau Nama Tamu..."
                  className="w-full text-center text-sm md:text-base py-3 px-4 rounded-xl font-mono font-bold tracking-wider uppercase border-2 border-[#C8A96B]/60 bg-[#28292F] text-[#F1F0EC] placeholder-[#71717A] shadow-inner focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isScanning || !scannedCode.trim()}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isScanning ? "Verifikasi..." : "CHECK-IN SEKARANG"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Scan Result Banner */}
          {scanResult.status && (
            <div
              className={`p-4 rounded-xl border text-center transition-all ${
                scanResult.status === "success"
                  ? "bg-emerald-950/60 border-emerald-700 text-emerald-200"
                  : "bg-rose-950/60 border-rose-700 text-rose-200"
              }`}
            >
              <p className="text-sm font-extrabold">{scanResult.message}</p>
              {scanResult.guest && (
                <div className="mt-2 text-xs pt-2 border-t border-emerald-800/60 flex items-center justify-center gap-4">
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
      <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs uppercase tracking-[2px] font-bold text-[#E0C98F] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <span>Daftar Riwayat Check-In Tamu ({checkedInCount})</span>
          </h4>
          <button
            onClick={loadCloudGuests}
            className="text-[11px] text-[#E0C98F] bg-[#28292F] hover:bg-[#32343B] px-3 py-1.5 rounded-xl border border-[#35373E] cursor-pointer font-bold transition-all flex items-center gap-1.5"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span>Sync Real-Time</span>
          </button>
        </div>

        {checkedInGuests.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#9E9D98] italic">
            Belum ada tamu yang check-in di lokasi. Gunakan input scanner di atas saat tamu tiba!
          </div>
        ) : (
          <div className="space-y-2.5">
            {checkedInGuests.map((g) => (
              <div
                key={g.id}
                className="p-3.5 border border-emerald-800/60 rounded-xl bg-emerald-950/30 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#F1F0EC] font-serif text-sm">{g.name}</span>
                    <span className="text-[9px] bg-emerald-900 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                      ✓ HADIR (Checked-In)
                    </span>
                    <span className="text-[9px] bg-[#28292F] text-[#E0C98F] border border-[#35373E] px-2.5 py-0.5 rounded-full font-mono font-semibold">
                      {g.code || g.id}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#9E9D98] flex gap-4">
                    <span>Jumlah: <strong className="text-[#E0C98F]">{g.pax || 1} PAX</strong></span>
                    <span>Jam Masuk: <strong>{g.checkInTime || "Baru saja"}</strong></span>
                    {g.category && <span>Kategori: <strong>{g.category}</strong></span>}
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
