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

interface ActivePopupState {
  type: "success" | "already_checked_in" | "not_found";
  guest?: CheckedInGuest;
  code?: string;
  message?: string;
}

// Extract clean guest name or code from raw scanned string or URL (e.g. https://domain.com/?to=Nama+Tamu)
function extractGuestIdentifier(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://") || cleaned.includes("?")) {
    try {
      const url = new URL(cleaned, typeof window !== "undefined" ? window.location.origin : "https://wedding.local");
      const toParam =
        url.searchParams.get("to") ||
        url.searchParams.get("t") ||
        url.searchParams.get("name") ||
        url.searchParams.get("guest") ||
        url.searchParams.get("code");
      if (toParam) {
        return decodeURIComponent(toParam).replace(/\+/g, " ").trim();
      }
    } catch {
      const match = cleaned.match(/[?&](?:to|t|name|guest|code)=([^&]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).replace(/\+/g, " ").trim();
      }
    }
  }
  return cleaned;
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
      // 4-tone cheerful ascending luxury chime
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.07); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.14); // G5
      osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime + 0.22); // C6

      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.7);
    }
  } catch {
    // Audio context not available or blocked
  }

  // Haptic Vibration for Mobile Devices
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([80, 50, 100]);
    }
  } catch {
    // Vibration not supported
  }
}

function playWarningBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.setValueAtTime(370, audioCtx.currentTime + 0.12); // F#4

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    }
  } catch {
    //
  }

  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([120, 80, 120]);
    }
  } catch {
    //
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

interface BarcodeScannerManagerProps {
  initialFullScreen?: boolean;
}

export function BarcodeScannerManager({ initialFullScreen = false }: BarcodeScannerManagerProps) {
  const [scannedCode, setScannedCode] = useState("");
  const [guests, setGuests] = useState<CheckedInGuest[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: "success" | "warning" | "error" | null;
    message: string;
    guest?: CheckedInGuest;
  }>({ status: null, message: "" });

  // Full Screen & Camera States
  const [isFullScreenScanner, setIsFullScreenScanner] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);

  // Professional Pop-up Notification State
  const [activePopup, setActivePopup] = useState<ActivePopupState | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isExpressMode, setIsExpressMode] = useState<boolean>(false); // Mode Express: 1.5s auto dismiss, Normal: 3.5s

  // Fullscreen Drawer States (for manual input or history list without closing camera)
  const [showManualInputDrawer, setShowManualInputDrawer] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // Anti-Spam Scanner Refs (Debounce multiple camera frames)
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const isProcessingRef = useRef<boolean>(false);
  const scannerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadCloudGuests();
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const interval = setInterval(loadCloudGuests, 8000);
    return () => {
      clearInterval(interval);
      stopCameraScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss popup with countdown progress timer
  useEffect(() => {
    if (!activePopup) return;

    const initialTime =
      activePopup.type === "success" ? (isExpressMode ? 1.5 : 3) : activePopup.type === "already_checked_in" ? 4 : 4.5;
    setCountdown(initialTime);

    const step = 0.5;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= step) {
          setActivePopup(null);
          return 0;
        }
        return Number((prev - step).toFixed(1));
      });
    }, 500);

    return () => clearInterval(interval);
  }, [activePopup, isExpressMode]);

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

  // Handle checking in guest code
  const handleCheckInCode = useCallback(
    async (codeToSubmit: string) => {
      const cleanIdentifier = extractGuestIdentifier(codeToSubmit);
      if (!cleanIdentifier) return;

      // Anti-Spam Protection: Ultra-fast debounce
      const now = Date.now();
      const minCooldown = isExpressMode ? 1200 : 2000;
      if (
        isProcessingRef.current ||
        (lastScannedRef.current.code.toLowerCase() === cleanIdentifier.toLowerCase() &&
          now - lastScannedRef.current.time < minCooldown)
      ) {
        return;
      }

      lastScannedRef.current = { code: cleanIdentifier, time: now };
      isProcessingRef.current = true;
      setIsScanning(true);
      setScanResult({ status: null, message: "" });

      try {
        const res = await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "checkin",
            item: { code: cleanIdentifier },
          }),
        });

        const json = await res.json();

        if (json.success && json.guest) {
          if (json.alreadyCheckedIn) {
            // Already checked in previously
            if (isSoundOn) playWarningBeep();
            setActivePopup({
              type: "already_checked_in",
              guest: json.guest,
              message: `⚠️ Tamu "${json.guest.name}" sudah pernah check-in pada pukul ${
                json.guest.checkInTime || "sebelumnya"
              }.`,
            });
            setScanResult({
              status: "warning",
              message: `⚠️ Tamu "${json.guest.name}" sudah pernah check-in sebelumnya (${json.guest.checkInTime}).`,
              guest: json.guest,
            });
          } else {
            // Check-In Approved (ACC)
            if (isSoundOn) playSuccessBeep();
            setActivePopup({
              type: "success",
              guest: json.guest,
              message: `✓ Check-In Berhasil! Selamat Datang ${json.guest.name}`,
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
          setShowManualInputDrawer(false);
        } else {
          // Not found or invalid code
          if (isSoundOn) playErrorBeep();
          setActivePopup({
            type: "not_found",
            code: cleanIdentifier,
            message: `Kode atau nama "${cleanIdentifier}" tidak terdaftar dalam daftar undangan resmi.`,
          });
          setScanResult({
            status: "error",
            message: `⚠️ Kode "${cleanIdentifier}" tidak ditemukan dalam daftar undangan.`,
          });
        }
      } catch {
        if (isSoundOn) playErrorBeep();
        setActivePopup({
          type: "not_found",
          code: cleanIdentifier,
          message: "Terjadi kesalahan koneksi saat memproses check-in.",
        });
        setScanResult({
          status: "error",
          message: "❌ Terjadi gangguan koneksi saat verifikasi.",
        });
      } finally {
        setIsScanning(false);
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 500);
        if (inputRef.current) inputRef.current.focus();
      }
    },
    [isExpressMode, isSoundOn]
  );

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleCheckInCode(scannedCode);
  }

  // Pax adjustment handler (+ / - pax on-the-fly)
  async function handleAdjustPax(guestId: string, delta: number) {
    const target = guests.find((g) => g.id === guestId);
    if (!target) return;
    const currentPax = target.pax || 1;
    const newPax = Math.max(1, currentPax + delta);

    const updatedGuests = guests.map((g) => (g.id === guestId ? { ...g, pax: newPax } : g));
    setGuests(updatedGuests);

    if (activePopup?.guest?.id === guestId) {
      setActivePopup({
        ...activePopup,
        guest: { ...activePopup.guest, pax: newPax },
      });
    }

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          type: "guests",
          item: updatedGuests,
        }),
      });
    } catch {
      // Fallback
    }
  }

  // Camera QR Scanner using html5-qrcode
  async function startCameraScanner(mode: "environment" | "user" = facingMode) {
    setCameraError("");
    setIsFullScreenScanner(true);

    // Request native browser fullscreen if supported (for mobile immersive kiosk feel)
    try {
      if (typeof document !== "undefined" && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Ignore fullscreen API restrictions
    }

    await new Promise((resolve) => setTimeout(resolve, 250));

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

      const scannerId = "qr-reader-fullscreen";
      const el = document.getElementById(scannerId);
      if (!el) {
        setCameraError("Container scanner kamera tidak ditemukan.");
        return;
      }
      el.innerHTML = "";

      const html5QrCode = new Html5Qrcode(scannerId, {
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: mode },
        {
          fps: 26,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.75);
            return {
              width: Math.max(size, 220),
              height: Math.max(size, 220),
            };
          },
          aspectRatio: undefined,
        },
        (decodedText: string) => {
          handleCheckInCode(decodedText);
        },
        () => {}
      );

      setCameraActive(true);

      // Check for torch / flashlight capability
      setTimeout(() => {
        try {
          const videoEl = document.querySelector("#qr-reader-fullscreen video") as HTMLVideoElement | null;
          if (videoEl && videoEl.srcObject) {
            const stream = videoEl.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];
            if (track) {
              const capabilities = (track.getCapabilities?.() as any) || {};
              if ("torch" in capabilities) {
                setTorchSupported(true);
              }
            }
          }
        } catch {
          setTorchSupported(false);
        }
      }, 500);
    } catch (err: any) {
      const msg = err?.message || String(err) || "";
      if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("denied")) {
        setCameraError("❌ Izin kamera ditolak. Mohon izinkan akses kamera pada browser HP Anda.");
      } else if (msg.includes("NotFoundError") || msg.includes("Requested device not found")) {
        setCameraError("❌ Kamera tidak ditemukan pada perangkat ini.");
      } else {
        setCameraError(`❌ Gagal memulai kamera: ${msg}`);
      }
      setCameraActive(false);
    }
  }

  async function stopCameraScanner() {
    if (isTorchOn) {
      await toggleTorch(false);
    }

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        //
      }
      scannerRef.current = null;
    }

    try {
      if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      //
    }

    setCameraActive(false);
    setIsFullScreenScanner(false);
    setShowManualInputDrawer(false);
    setShowHistoryDrawer(false);
  }

  async function switchCamera() {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
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
    setTimeout(() => {
      startCameraScanner(nextMode);
    }, 200);
  }

  async function toggleTorch(targetState?: boolean) {
    const nextTorch = typeof targetState === "boolean" ? targetState : !isTorchOn;
    try {
      const videoEl = document.querySelector("#qr-reader-fullscreen video") as HTMLVideoElement | null;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          await track.applyConstraints({
            advanced: [{ torch: nextTorch } as any],
          });
          setIsTorchOn(nextTorch);
        }
      }
    } catch {
      // Torch not supported on current device
    }
  }

  // Calculate Metrics
  const totalGuests = guests.length;
  const checkedInGuests = guests.filter((g) => g.checkedIn);
  const checkedInCount = checkedInGuests.length;
  const totalPaxCheckedIn = checkedInGuests.reduce((sum, g) => sum + (g.pax || 1), 0);
  const pendingCount = totalGuests - checkedInCount;

  // Filtered History
  const filteredHistory = checkedInGuests.filter(
    (g) =>
      g.name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      (g.code && g.code.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
      (g.category && g.category.toLowerCase().includes(historySearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative">
      {/* Scoped Styles for Full-Screen Camera Video & Laser Animation */}
      <style jsx global>{`
        #qr-reader-fullscreen {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          background: #000 !important;
          overflow: hidden !important;
        }
        #qr-reader-fullscreen video {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border: none !important;
        }
        #qr-reader-fullscreen img,
        #qr-reader-fullscreen span {
          display: none !important;
        }
        @keyframes scannerLaserMotion {
          0% {
            top: 5%;
            opacity: 0.8;
          }
          50% {
            top: 93%;
            opacity: 1;
          }
          100% {
            top: 5%;
            opacity: 0.8;
          }
        }
        .animate-laser {
          animation: scannerLaserMotion 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* =========================================================================
          FULL-SCREEN CAMERA SCANNER VIEW (KHUSUS HP PENERIMA TAMU)
          ========================================================================= */}
      {isFullScreenScanner && (
        <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-black text-[#F1F0EC] flex flex-col justify-between overflow-hidden select-none">
          {/* Background Video Viewport */}
          <div id="qr-reader-fullscreen" />

          {/* Viewfinder Target Layer (Center Reticle + Laser) */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
            {/* Soft Dark Vignette Surrounding Target */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              {/* 4 Golden Corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#E0C98F] rounded-tl-2xl shadow-[0_0_12px_rgba(224,201,143,0.6)]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#E0C98F] rounded-tr-2xl shadow-[0_0_12px_rgba(224,201,143,0.6)]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#E0C98F] rounded-bl-2xl shadow-[0_0_12px_rgba(224,201,143,0.6)]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#E0C98F] rounded-br-2xl shadow-[0_0_12px_rgba(224,201,143,0.6)]" />

              {/* Animated Laser Beam */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_18px_#10B981] animate-laser" />

              {/* Center Crosshair Target */}
              <div className="absolute inset-0 flex items-center justify-center opacity-35">
                <div className="w-4 h-0.5 bg-[#E0C98F]" />
                <div className="h-4 w-0.5 bg-[#E0C98F] -ml-2" />
              </div>
            </div>

            <p className="text-[11.5px] font-bold text-[#E0C98F] tracking-wider mt-5 bg-black/60 px-4 py-1.5 rounded-full border border-[#C8A96B]/40 shadow-lg backdrop-blur-md">
              Posisikan QR Code di dalam kotak
            </p>
          </div>

          {/* Top Bar Navigation (Floating on top of camera) */}
          <div className="relative z-20 pt-safe px-4 pt-4 pb-2 flex items-center justify-between gap-2 bg-gradient-to-b from-black/85 via-black/50 to-transparent">
            {/* Close Button */}
            <button
              type="button"
              onClick={stopCameraScanner}
              className="py-2 px-3.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-lg"
              title="Keluar dari Scanner Kamera"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Tutup</span>
            </button>

            {/* Attendance Counter Pill */}
            <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {checkedInCount} / {totalGuests} Hadir
              </span>
            </div>

            {/* Quick Utility Tools: Torch, Camera Flip, Sound */}
            <div className="flex items-center gap-1.5">
              {/* Torch / Senter */}
              {torchSupported && (
                <button
                  type="button"
                  onClick={() => toggleTorch()}
                  className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isTorchOn
                      ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.7)]"
                      : "bg-black/60 text-white border-white/20 hover:bg-black/80"
                  }`}
                  title="Senter Flashlight"
                >
                  <span className="text-sm">🔦</span>
                </button>
              )}

              {/* Flip Camera */}
              <button
                type="button"
                onClick={switchCamera}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:rotate-180"
                title="Ganti Kamera Depan / Belakang"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              </button>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setIsSoundOn(!isSoundOn)}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                title={isSoundOn ? "Suara Notifikasi Aktif" : "Suara Senyap"}
              >
                <span className="text-xs">{isSoundOn ? "🔊" : "🔇"}</span>
              </button>
            </div>
          </div>

          {/* Bottom Bar Controls (Floating on bottom of camera) */}
          <div className="relative z-20 pb-safe px-4 pb-6 pt-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent space-y-3">
            {/* Quick Action Drawer Buttons */}
            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => setShowManualInputDrawer(true)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-lg"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="6" y1="8" x2="6.01" y2="8" />
                  <line x1="10" y1="8" x2="10.01" y2="8" />
                  <line x1="14" y1="8" x2="14.01" y2="8" />
                  <line x1="18" y1="8" x2="18.01" y2="8" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                </svg>
                <span>Input Manual</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHistoryDrawer(true)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-lg"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
                <span>Riwayat ({checkedInCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExpressMode(!isExpressMode)}
                className={`py-2.5 px-3 rounded-xl backdrop-blur-md border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-lg ${
                  isExpressMode
                    ? "bg-emerald-500 text-black border-emerald-400 font-extrabold"
                    : "bg-black/70 text-[#C8C5BE] border-white/20"
                }`}
                title="Mode Cepat: Auto-dismiss pop-up lebih singkat"
              >
                <span>⚡ {isExpressMode ? "Cepat" : "Normal"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROFESSIONAL POP-UP NOTIFICATION (ACC / CELEBRATION MODAL)
          ========================================================================= */}
      {activePopup && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          {activePopup.type === "success" && activePopup.guest ? (
            /* SUCCESS POPUP (CHECK-IN ACC) */
            <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#112418] via-[#0E1C13] to-[#08120C] border-2 border-emerald-400/90 rounded-3xl p-6 text-center space-y-4 shadow-[0_0_60px_rgba(16,185,129,0.4)] animate-scaleUp">
              {/* Glowing Success Ring */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg font-black">
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              {/* Status Header */}
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-extrabold uppercase tracking-[2px] rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>CHECK-IN DISETUJUI (ACC)</span>
                </span>
                <h3
                  className="text-2xl sm:text-3xl font-black font-serif text-white tracking-wide pt-2.5 pb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {activePopup.guest.name}
                </h3>
                <p className="text-xs text-emerald-300 font-medium">
                  Selamat Datang di Acara Pernikahan Anam &amp; Angi!
                </p>
              </div>

              {/* Guest Details Pill Box */}
              <div className="p-3.5 rounded-2xl bg-[#09160F]/90 border border-emerald-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="space-y-0.5">
                  <p className="text-[9.5px] uppercase text-[#8A8C94] font-bold">Kategori</p>
                  <p className="font-bold text-white truncate">{activePopup.guest.category || "Tamu VIP"}</p>
                </div>

                <div className="space-y-0.5 border-x border-emerald-900/60 flex flex-col items-center justify-center">
                  <p className="text-[9.5px] uppercase text-[#8A8C94] font-bold">Kehadiran (Pax)</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustPax(activePopup.guest!.id, -1)}
                      className="w-5 h-5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center justify-center text-xs font-black active:scale-90"
                      title="Kurangi Pax"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-emerald-400 px-1 font-mono text-sm">
                      {activePopup.guest.pax || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustPax(activePopup.guest!.id, 1)}
                      className="w-5 h-5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center justify-center text-xs font-black active:scale-90"
                      title="Tambah Pax"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[9.5px] uppercase text-[#8A8C94] font-bold">Waktu Masuk</p>
                  <p className="font-bold text-[#E0C98F] font-mono text-[11px] truncate">
                    {activePopup.guest.checkInTime || "Baru saja"}
                  </p>
                </div>
              </div>

              {/* Action Button with Countdown Bar */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>SCAN TAMU BERIKUTNYA ({countdown}s)</span>
                </button>

                {/* Smooth Countdown Bar */}
                <div className="w-full bg-emerald-950 h-1.5 rounded-full overflow-hidden border border-emerald-800">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-500 ease-linear"
                    style={{ width: `${(countdown / (isExpressMode ? 1.5 : 3)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : activePopup.type === "already_checked_in" && activePopup.guest ? (
            /* ALREADY CHECKED-IN WARNING POPUP */
            <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#251B0A] via-[#1A1307] to-[#100B04] border-2 border-amber-400/90 rounded-3xl p-6 text-center space-y-4 shadow-[0_0_60px_rgba(245,158,11,0.4)] animate-scaleUp">
              {/* Warning Icon Ring */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg font-black">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-extrabold uppercase tracking-[2px] rounded-full">
                  ⚠️ SUDAH CHECK-IN SEBELUMNYA
                </span>
                <h3
                  className="text-2xl sm:text-3xl font-black font-serif text-white tracking-wide pt-2.5 pb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {activePopup.guest.name}
                </h3>
                <p className="text-xs text-amber-300 font-medium">
                  Tamu ini sudah tercatat masuk pada pukul{" "}
                  <strong>{activePopup.guest.checkInTime || "sebelumnya"}</strong>.
                </p>
              </div>

              {/* Guest Details */}
              <div className="p-3.5 rounded-2xl bg-[#130E05]/90 border border-amber-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="space-y-0.5">
                  <p className="text-[9.5px] uppercase text-[#8A8C94] font-bold">Kategori</p>
                  <p className="font-bold text-white truncate">{activePopup.guest.category || "Tamu VIP"}</p>
                </div>
                <div className="space-y-0.5 border-x border-amber-900/60">
                  <p className="text-[9.5px] uppercase text-[#8A8C94] font-bold">Jumlah</p>
                  <p className="font-bold text-amber-400 font-mono text-sm">{activePopup.guest.pax || 1} PAX</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9.5px] uppercase text-[#8A8C94] font-bold">Jam Masuk</p>
                  <p className="font-bold text-[#E0C98F] font-mono text-[11px] truncate">
                    {activePopup.guest.checkInTime || "Sebelumnya"}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>LANJUT SCAN TAMU LAIN ({countdown}s)</span>
                </button>
              </div>
            </div>
          ) : (
            /* NOT FOUND / INVALID QR POPUP */
            <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#270E12] via-[#1B0A0C] to-[#100607] border-2 border-rose-500/90 rounded-3xl p-6 text-center space-y-4 shadow-[0_0_60px_rgba(244,63,94,0.4)] animate-scaleUp">
              {/* Error Icon */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="relative w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg font-black">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-950 text-rose-300 border border-rose-700 text-[10px] font-extrabold uppercase tracking-[2px] rounded-full">
                  ❌ QR CODE TIDAK DIKENALI
                </span>
                <h3
                  className="text-xl sm:text-2xl font-black font-serif text-white tracking-wide pt-2.5 pb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Tamu Tidak Ditemukan
                </h3>
                <p className="text-xs text-rose-300/90 font-medium">
                  {activePopup.code
                    ? `Kode "${activePopup.code}" tidak terdaftar di daftar undangan.`
                    : "QR Code ini tidak cocok dengan data undangan pernikahan."}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePopup(null);
                    setShowManualInputDrawer(true);
                  }}
                  className="flex-1 py-3 bg-[#201014] hover:bg-[#2C161C] border border-rose-700/80 text-rose-200 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Input Manual
                </button>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all"
                >
                  Scan Ulang
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          FULLSCREEN DRAWER: INPUT MANUAL DALAM MODE KAMERA
          ========================================================================= */}
      {showManualInputDrawer && (
        <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#1C1D21] border border-[#35373E] rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#2D2E34] pb-3">
              <h4 className="text-sm font-bold font-serif text-white flex items-center gap-2">
                <span>⌨️ Check-In Manual</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowManualInputDrawer(false)}
                className="text-[#8A8C94] hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#9E9D98]">
              Ketik nama tamu atau kode E-Ticket jika QR code rusak atau sulit terbaca kamera.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Ketik Nama Tamu atau Kode..."
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                className="w-full py-3 px-4 rounded-xl text-sm font-mono font-bold bg-[#28292F] border border-[#35373E] text-white placeholder-[#71717A] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualInputDrawer(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-[#35373E] bg-[#28292F] text-[#9E9D98]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isScanning || !scannedCode.trim()}
                  className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isScanning ? "Memproses..." : "Check-In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULLSCREEN DRAWER: RIWAYAT CHECK-IN
          ========================================================================= */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg max-h-[85vh] bg-[#1C1D21] border border-[#35373E] rounded-3xl p-5 md:p-6 flex flex-col gap-3 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#2D2E34] pb-3">
              <h4 className="text-sm font-bold font-serif text-white flex items-center gap-2">
                <span>📋 Riwayat Check-In Hadir ({checkedInCount} Tamu)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="text-[#8A8C94] hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Cari tamu yang sudah hadir..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full py-2 px-3 rounded-xl text-xs bg-[#28292F] border border-[#35373E] text-white placeholder-[#71717A] focus:outline-none"
            />

            <div className="overflow-y-auto space-y-2 max-h-[50vh] pr-1">
              {filteredHistory.length === 0 ? (
                <p className="text-xs text-center py-6 text-[#71717A] italic">Tidak ada data yang cocok.</p>
              ) : (
                filteredHistory.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 bg-emerald-950/25 border border-emerald-800/50 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white font-serif">{g.name}</p>
                      <p className="text-[10px] text-[#9E9D98]">
                        {g.category || "Tamu VIP"} • {g.pax || 1} PAX
                      </p>
                    </div>
                    <span className="text-[10.5px] font-mono font-bold text-[#E0C98F]">{g.checkInTime}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          NORMAL ADMIN TAB VIEW (METRICS & HERO START SCANNER BUTTON)
          ========================================================================= */}
      {/* Real-time Attendance Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#202125] p-4 border border-[#2D2E34] text-center rounded-2xl shadow-xs">
          <p className="text-[10px] uppercase tracking-wider text-[#9E9D98] font-bold">Total Tamu Diundang</p>
          <p className="text-2xl font-bold font-serif text-[#F1F0EC] mt-1">{totalGuests}</p>
        </div>

        <div className="bg-[#202125] p-4 border border-emerald-800/60 text-center rounded-2xl shadow-xs">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Tamu Hadir di Lokasi</p>
          <p className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            {checkedInCount} <span className="text-xs font-semibold text-emerald-300">({totalPaxCheckedIn} PAX)</span>
          </p>
        </div>

        <div className="bg-[#202125] p-4 border border-amber-800/60 text-center rounded-2xl shadow-xs">
          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Belum Check-In</p>
          <p className="text-2xl font-bold font-serif text-amber-400 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-[#202125] p-4 border border-blue-800/60 text-center rounded-2xl shadow-xs">
          <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Persentase Kehadiran</p>
          <p className="text-2xl font-bold font-serif text-blue-400 mt-1">
            {totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Hero Dedicated Scanner CTA Card */}
      <div className="bg-gradient-to-br from-[#202125] via-[#1A1C20] to-[#141518] p-6 md:p-8 border-2 border-[#C8A96B]/60 shadow-xl rounded-3xl text-center space-y-5">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C8A96B]/15 border border-[#C8A96B]/50 flex items-center justify-center text-[#E0C98F] shadow-inner">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>

          <h3
            className="text-xl md:text-2xl font-black font-serif text-[#F1F0EC]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Scanner Check-In Khusus HP Penerima Tamu
          </h3>

          <p className="text-xs text-[#A1A4B2] leading-relaxed">
            Buka kamera mode layar penuh (full-screen) di HP meja resepsi untuk verifikasi E-Ticket tamu super cepat,
            dilengkapi audio chime dan notifikasi pop-up ACC otomatis.
          </p>

          {/* Big Launch Full-Screen Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => startCameraScanner()}
              className="w-full sm:w-auto py-4 px-8 text-sm font-black uppercase tracking-wider rounded-2xl cursor-pointer transition-all shadow-xl bg-gradient-to-r from-[#C8A96B] via-[#DFCA93] to-[#B8860B] text-black hover:opacity-95 active:scale-95 flex items-center justify-center gap-2.5 mx-auto"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>BUKA SCANNER LAYAR PENUH (HP)</span>
            </button>
          </div>

          {cameraError && (
            <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-300 text-xs font-semibold">
              {cameraError}
            </div>
          )}

          {/* Quick link to /scanner */}
          <p className="text-[11px] text-[#8A8C94] pt-2">
            Atau buka langsung alamat{" "}
            <a href="/scanner" target="_blank" className="text-[#E0C98F] font-mono font-bold underline">
              /scanner
            </a>{" "}
            di browser HP panitia.
          </p>
        </div>
      </div>

      {/* Desktop / Manual Input Backup Box */}
      <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs space-y-3">
        <h4 className="text-xs uppercase tracking-wider font-bold text-[#E0C98F] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="6" y1="8" x2="6.01" y2="8" />
            <line x1="10" y1="8" x2="10.01" y2="8" />
            <line x1="14" y1="8" x2="14.01" y2="8" />
            <line x1="18" y1="8" x2="18.01" y2="8" />
            <line x1="6" y1="12" x2="18" y2="12" />
          </svg>
          <span>Input Kode / Nama Tamu Manual</span>
        </h4>

        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            placeholder="Ketik Nama Tamu atau Kode E-Ticket..."
            className="flex-1 text-xs py-2.5 px-3.5 rounded-xl font-mono font-bold border border-[#35373E] bg-[#28292F] text-[#F1F0EC] placeholder-[#71717A] focus:ring-2 focus:ring-[#C8A96B] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isScanning || !scannedCode.trim()}
            className="py-2.5 px-5 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-white hover:opacity-95 rounded-xl transition-all disabled:opacity-50"
          >
            {isScanning ? "Memverifikasi..." : "Check-In"}
          </button>
        </form>

        {/* Scan Result Notification banner */}
        {scanResult.status && !activePopup && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold ${
              scanResult.status === "success"
                ? "bg-emerald-950/70 border-emerald-600 text-emerald-200"
                : scanResult.status === "warning"
                ? "bg-amber-950/70 border-amber-600 text-amber-200"
                : "bg-rose-950/70 border-rose-600 text-rose-200"
            }`}
          >
            {scanResult.message}
          </div>
        )}
      </div>

      {/* Live Checked-In Guests Feed Table */}
      <div className="bg-[#202125] p-5 border border-[#2D2E34] rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs uppercase tracking-[2px] font-bold text-[#E0C98F] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <span>Daftar Riwayat Hadir di Lokasi ({checkedInCount})</span>
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
            Belum ada tamu yang check-in di lokasi. Gunakan tombol scanner di atas saat tamu tiba!
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
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
                    {g.code && g.code !== g.name && !g.code.startsWith("GUEST-") && (
                      <span className="text-[9px] bg-[#28292F] text-[#E0C98F] border border-[#35373E] px-2.5 py-0.5 rounded-full font-mono font-semibold">
                        {g.code}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#9E9D98] flex gap-4 flex-wrap">
                    <span>
                      Jumlah: <strong className="text-[#E0C98F]">{g.pax || 1} PAX</strong>
                    </span>
                    <span>
                      Jam Masuk: <strong className="text-white">{g.checkInTime || "Baru saja"}</strong>
                    </span>
                    {g.category && (
                      <span>
                        Kategori: <strong>{g.category}</strong>
                      </span>
                    )}
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
