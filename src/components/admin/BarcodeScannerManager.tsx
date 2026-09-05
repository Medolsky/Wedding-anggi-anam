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
  _alreadyCheckedIn?: boolean;
}

// Audio & Haptic Feedback Helpers
function playSuccessBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      // 3-tone cheerful ascending chime
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.24); // C6

      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.65);
    }
  } catch {
    // Audio context not available or blocked
  }

  // Haptic Vibration for Mobile Devices
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 50, 150]);
    }
  } catch {
    // Vibration not supported
  }
}

function playErrorBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, audioCtx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch {
    //
  }

  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    //
  }
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

  // Big Celebration Popup Modal State
  const [activeSuccessGuest, setActiveSuccessGuest] = useState<CheckedInGuest | null>(null);
  const [countdown, setCountdown] = useState(2);
  const [isExpressMode, setIsExpressMode] = useState<boolean>(true); // Mode Antrian Cepat (Express Scan)

  // Anti-Spam Scanner Refs (Debounce multiple camera frames)
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const isProcessingRef = useRef<boolean>(false);

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

  // Auto-dismiss celebration modal with progress timer
  useEffect(() => {
    if (!activeSuccessGuest) return;

    const initialTime = isExpressMode ? 1 : 2;
    setCountdown(initialTime);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setActiveSuccessGuest(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSuccessGuest, isExpressMode]);

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
    const cleanCode = codeToSubmit.trim();
    if (!cleanCode) return;

    // Anti-Spam Protection: Ultra-fast debounce (1.0s in Express Mode, 1.8s in Normal Mode)
    const now = Date.now();
    const minCooldown = isExpressMode ? 1000 : 1800;
    if (
      isProcessingRef.current ||
      (lastScannedRef.current.code.toLowerCase() === cleanCode.toLowerCase() && now - lastScannedRef.current.time < minCooldown)
    ) {
      return;
    }

    lastScannedRef.current = { code: cleanCode, time: now };
    isProcessingRef.current = true;
    setIsScanning(true);
    setScanResult({ status: null, message: "" });

    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkin",
          item: { code: cleanCode },
        }),
      });

      const json = await res.json();

      if (json.success && json.guest) {
        if (json.alreadyCheckedIn) {
          // Play notification chime and show already checked-in info
          playSuccessBeep();
          setActiveSuccessGuest({
            ...json.guest,
            _alreadyCheckedIn: true,
          });

          setScanResult({
            status: "success",
            message: `⚠️ Tamu "${json.guest.name}" sudah pernah check-in pada pukul ${json.guest.checkInTime || "sebelumnya"}.`,
            guest: json.guest,
          });
        } else {
          // First time check-in celebration!
          playSuccessBeep();
          setActiveSuccessGuest({
            ...json.guest,
            _alreadyCheckedIn: false,
          });

          setScanResult({
            status: "success",
            message: `✓ Check-In Berhasil! Selamat Datang ${json.guest.name}`,
            guest: json.guest,
          });
        }

        if (Array.isArray(json.guests)) {
          setGuests(json.guests);
        } else {
          loadCloudGuests();
        }

        setScannedCode("");
      } else {
        playErrorBeep();
        setScanResult({
          status: "error",
          message: `⚠️ Tamu / Kode "${cleanCode}" tidak ditemukan atau gagal diverifikasi.`,
        });
      }
    } catch {
      playErrorBeep();
      setScanResult({
        status: "error",
        message: "❌ Terjadi kesalahan koneksi saat memproses check-in.",
      });
    } finally {
      setIsScanning(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
      if (inputRef.current) inputRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpressMode]);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleCheckInCode(scannedCode);
  }

  // Camera QR Scanner using html5-qrcode
  const [showCamera, setShowCamera] = useState(false);

  async function startCameraScanner() {
    setCameraError("");
    setShowCamera(true);

    await new Promise((resolve) => setTimeout(resolve, 200));

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
      el.innerHTML = "";

      // Enable native BarcodeDetector hardware acceleration for 10ms frame detection
      const html5QrCode = new Html5Qrcode(scannerId, {
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 25, // High frame rate for rapid scanning
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.85);
            return {
              width: Math.max(size, 200),
              height: Math.max(size, 200),
            };
          },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleCheckInCode(decodedText);
        },
        () => {
          // Ignored per-frame scan attempt
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      const msg = err?.message || String(err) || "";
      if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("denied")) {
        setCameraError("❌ Izin kamera ditolak. Mohon izinkan akses kamera di browser Anda.");
      } else if (msg.includes("NotFoundError") || msg.includes("Requested device not found")) {
        setCameraError("❌ Kamera tidak ditemukan pada perangkat Anda.");
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
        //
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
    <div className="space-y-6 relative">
      {/* =================================================================
          PROMINENT SUCCESS CELEBRATION MODAL OR EXPRESS FLOATING TOAST
          ================================================================= */}
      {activeSuccessGuest && (
        isExpressMode ? (
          // Non-blocking floating toast for Express Mode (Continuous camera scan)
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-bounceIn">
            <div
              className={`p-4 rounded-2xl border-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-center justify-between gap-4 ${
                activeSuccessGuest._alreadyCheckedIn
                  ? "bg-amber-950/95 border-amber-500 text-amber-100"
                  : "bg-emerald-950/95 border-emerald-500 text-emerald-100"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    activeSuccessGuest._alreadyCheckedIn
                      ? "bg-amber-500 text-black"
                      : "bg-emerald-500 text-black"
                  }`}
                >
                  {activeSuccessGuest._alreadyCheckedIn ? "⚠️" : "✓"}
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 block">
                    {activeSuccessGuest._alreadyCheckedIn ? "Sudah Check-In Sebelum" : "⚡ CHECK-IN SUKSES"}
                  </span>
                  <h4 className="text-base font-black truncate font-serif text-white">{activeSuccessGuest.name}</h4>
                  <p className="text-xs opacity-90">
                    {activeSuccessGuest.category || "Tamu VIP"} • {activeSuccessGuest.pax || 1} PAX • <span className="font-mono font-bold">{activeSuccessGuest.checkInTime || "Sekarang"}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSuccessGuest(null)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-extrabold shrink-0"
              >
                Tutup ({countdown}s)
              </button>
            </div>
          </div>
        ) : (
          // Full-screen backdrop modal for Normal Celebration Mode
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div
              className={`relative w-full max-w-md bg-gradient-to-b ${
                activeSuccessGuest._alreadyCheckedIn
                  ? "from-[#2A2314] via-[#1F190F] to-[#120E0A] border-2 border-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.35)]"
                  : "from-[#142A1D] via-[#101F17] to-[#0A120E] border-2 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.35)]"
              } rounded-3xl p-6 sm:p-8 text-center space-y-5 animate-scaleUp`}
            >
              {/* Animated Ring */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full ${
                    activeSuccessGuest._alreadyCheckedIn ? "bg-amber-500/20" : "bg-emerald-500/20"
                  } animate-ping`}
                />
                <div
                  className={`relative w-20 h-20 rounded-full ${
                    activeSuccessGuest._alreadyCheckedIn ? "bg-amber-500 text-[#120E0A]" : "bg-emerald-500 text-[#0A120E]"
                  } flex items-center justify-center shadow-lg`}
                >
                  {activeSuccessGuest._alreadyCheckedIn ? (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ) : (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Title & Status */}
              <div className="space-y-1">
                <span
                  className={`inline-block px-3 py-1 ${
                    activeSuccessGuest._alreadyCheckedIn
                      ? "bg-amber-950 text-amber-300 border border-amber-700"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-700"
                  } text-[11px] font-extrabold uppercase tracking-[3px] rounded-full`}
                >
                  {activeSuccessGuest._alreadyCheckedIn ? "⚠️ SUDAH CHECK-IN SEBELUMNYA" : "✓ CHECK-IN BERHASIL"}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-wide pt-2" style={{ fontFamily: "var(--font-heading)" }}>
                  {activeSuccessGuest.name}
                </h3>
                <p className={`text-xs ${activeSuccessGuest._alreadyCheckedIn ? "text-amber-300" : "text-emerald-300"} font-medium`}>
                  {activeSuccessGuest._alreadyCheckedIn
                    ? `Tamu ini sudah tercatat masuk pada ${activeSuccessGuest.checkInTime || "sebelumnya"}.`
                    : "Selamat Datang di Acara Pernikahan Anam & Angi!"}
                </p>
              </div>

              {/* Guest Details Pill Box */}
              <div
                className={`p-4 rounded-2xl border ${
                  activeSuccessGuest._alreadyCheckedIn
                    ? "bg-[#16120A]/80 border-amber-800/80"
                    : "bg-[#0A1610]/80 border-emerald-800/80"
                } grid grid-cols-3 gap-2 text-center text-xs`}
              >
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-[#8A8C94] font-bold">Kategori</p>
                  <p className="font-bold text-white truncate">{activeSuccessGuest.category || "Tamu VIP"}</p>
                </div>
                <div className={`space-y-0.5 border-x ${activeSuccessGuest._alreadyCheckedIn ? "border-amber-900/60" : "border-emerald-900/60"}`}>
                  <p className="text-[10px] uppercase text-[#8A8C94] font-bold">Pax</p>
                  <p className={`font-bold ${activeSuccessGuest._alreadyCheckedIn ? "text-amber-400" : "text-emerald-400"}`}>
                    {activeSuccessGuest.pax || 1} Orang
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-[#8A8C94] font-bold">Waktu Masuk</p>
                  <p className="font-bold text-[#E0C98F] font-mono">{activeSuccessGuest.checkInTime || "Sekarang"}</p>
                </div>
              </div>

              {/* Dismiss Button with Timer */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSuccessGuest(null)}
                  className={`w-full py-3 ${
                    activeSuccessGuest._alreadyCheckedIn
                      ? "bg-amber-500 hover:bg-amber-400 text-[#120E0A]"
                      : "bg-emerald-500 hover:bg-emerald-400 text-[#0A120E]"
                  } font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all active:scale-95`}
                >
                  Scan Tamu Berikutnya ({countdown}s)
                </button>
              </div>
            </div>
          </div>
        )
      )}

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

          {/* Scanner Mode Switcher Pill */}
          <div className="p-1.5 bg-[#17181D] border border-[#2B2E38] rounded-2xl max-w-md mx-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsExpressMode(true)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isExpressMode
                  ? "bg-emerald-500 text-black shadow-md"
                  : "text-[#8A8C94] hover:text-white"
              }`}
            >
              <span>⚡ Mode Express (Tanpa Delay)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExpressMode(false)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isExpressMode
                  ? "bg-[#C8A96B] text-black shadow-md"
                  : "text-[#8A8C94] hover:text-white"
              }`}
            >
              <span>🎉 Mode Popup Selebrasi</span>
            </button>
          </div>

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
            className={`rounded-2xl border-2 overflow-hidden transition-all ${
              activeSuccessGuest ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]" : "border-[#C8A96B]/50"
            }`}
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
          {scanResult.status && !activeSuccessGuest && (
            <div
              className={`p-4 rounded-2xl border text-center transition-all ${
                scanResult.status === "success"
                  ? "bg-emerald-950/70 border-emerald-600 text-emerald-200"
                  : "bg-rose-950/70 border-rose-600 text-rose-200"
              }`}
            >
              <p className="text-sm font-extrabold flex items-center justify-center gap-2">
                <span>{scanResult.status === "success" ? "✓" : "⚠️"}</span>
                <span>{scanResult.message}</span>
              </p>
              {scanResult.guest && (
                <div className="mt-2 text-xs pt-2 border-t border-emerald-800/60 flex items-center justify-center gap-4 flex-wrap">
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
                className="p-3.5 border border-emerald-800/60 rounded-xl bg-emerald-950/30 flex items-center justify-between gap-3 text-xs transition-all hover:bg-emerald-950/50"
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

                  <div className="text-[11px] text-[#9E9D98] flex gap-4 flex-wrap">
                    <span>Jumlah: <strong className="text-[#E0C98F]">{g.pax || 1} PAX</strong></span>
                    <span>Jam Masuk: <strong className="text-white">{g.checkInTime || "Baru saja"}</strong></span>
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
