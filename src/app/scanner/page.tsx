"use client";

import Link from "next/link";
import { BarcodeScannerManager } from "@/components/admin/BarcodeScannerManager";

export default function ScannerStandalonePage() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EC] selection:bg-[#C8A96B]/30 flex flex-col">
      {/* Top Wedding Header */}
      <header className="bg-[#171719]/90 backdrop-blur-md border-b border-[#2D2E34] px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C8A96B]/20 border border-[#C8A96B]/50 flex items-center justify-center text-[#E0C98F]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold font-serif text-[#F1F0EC] tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              Anam &amp; Angi Wedding
            </h1>
            <p className="text-[10px] text-[#A1A4B2] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Meja Resepsi • Scanner Khusus HP</span>
            </p>
          </div>
        </div>

        <Link
          href="/admin"
          className="text-xs py-1.5 px-3 rounded-xl bg-[#202125] hover:bg-[#28292F] border border-[#35373E] text-[#E0C98F] font-bold transition-all"
        >
          Admin Panel →
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <BarcodeScannerManager initialFullScreen={false} />
      </main>

      {/* Subtle Footer */}
      <footer className="py-4 text-center text-[10px] text-[#71717A] border-t border-[#202125]">
        Misbakhul Anam &amp; Angi Sulistia • Resepsi Pernikahan 2026
      </footer>
    </div>
  );
}
