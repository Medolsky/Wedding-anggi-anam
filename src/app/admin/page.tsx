"use client";

import { useState } from "react";
import Link from "next/link";
import { weddingData } from "@/data/weddingData";
import { GuestLinkGenerator } from "@/components/admin/GuestLinkGenerator";
import { RSVPManager } from "@/components/admin/RSVPManager";
import { WishesManager } from "@/components/admin/WishesManager";
import { BarcodeScannerManager } from "@/components/admin/BarcodeScannerManager";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"links" | "scanner" | "rsvp" | "wishes" | "info">("scanner");

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#2a2723] selection:bg-[#d4af37] selection:text-white pb-16">
      {/* Full Desktop Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Bar */}
        <header className="bg-white border border-[#d4af37]/30 rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-[3px] text-[#b8860b] font-extrabold bg-[#f7ebbf]/40 px-2.5 py-0.5 rounded-full border border-[#d4af37]/30">
                Wevitation Admin Dashboard
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold font-serif text-[#2a2723]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {weddingData.couple.bride.nickname} &amp; {weddingData.couple.groom.nickname}
            </h1>
            <p className="text-xs text-[#66615c] mt-0.5">
              Kelola daftar tamu, bot WA, rekap konfirmasi RSVP, ucapan, dan scanner check-in lokasi acara.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="btn-modern-primary text-xs py-2 px-4 flex items-center gap-2 font-bold shadow-md whitespace-nowrap"
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

        {/* Desktop Navigation Tabs */}
        <div className="bg-white border border-[#d4af37]/30 rounded-2xl shadow-sm p-2 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "scanner"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/40 hover:text-[#2a2723]"
            }`}
          >
            <span>📷 Scanner Check-In Barcode</span>
          </button>

          <button
            onClick={() => setActiveTab("links")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "links"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/40 hover:text-[#2a2723]"
            }`}
          >
            <span>🔗 Daftar Tamu &amp; WA Bot</span>
          </button>

          <button
            onClick={() => setActiveTab("rsvp")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "rsvp"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/40 hover:text-[#2a2723]"
            }`}
          >
            <span>📅 Rekap Kehadiran (RSVP)</span>
          </button>

          <button
            onClick={() => setActiveTab("wishes")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "wishes"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/40 hover:text-[#2a2723]"
            }`}
          >
            <span>💌 Ucapan &amp; Doa</span>
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "info"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-transparent text-[#66615c] hover:bg-[#f7ebbf]/40 hover:text-[#2a2723]"
            }`}
          >
            <span>⚙️ Info Acara &amp; Kado</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
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
