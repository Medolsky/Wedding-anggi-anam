"use client";

import { useState } from "react";
import Link from "next/link";
import { weddingData } from "@/data/weddingData";
import { GuestLinkGenerator } from "@/components/admin/GuestLinkGenerator";
import { RSVPManager } from "@/components/admin/RSVPManager";
import { WishesManager } from "@/components/admin/WishesManager";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"links" | "rsvp" | "wishes" | "info">("links");

  return (
    <main className="min-h-screen bg-[#120605] text-white flex justify-center selection:bg-[#d4af37] selection:text-black">
      {/* Mobile Stage Container (480px Centered Wrapper) */}
      <div className="w-full max-w-[480px] min-h-screen bg-[#1c0a08] relative shadow-2xl flex flex-col justify-between border-x border-[#d4af37]/20 pb-12">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-[#1c0a08]/90 backdrop-blur-md border-b border-[#d4af37]/30 px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[3px] text-[#d4af37] font-extrabold block">
              Wevitation Admin
            </span>
            <h1
              className="text-lg md:text-xl font-bold font-serif text-white leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {weddingData.couple.bride.nickname} &amp; {weddingData.couple.groom.nickname}
            </h1>
          </div>

          <Link
            href="/"
            target="_blank"
            className="btn-modern-secondary text-[10px] py-1.5 px-3 flex items-center gap-1 font-bold"
          >
            <span>Lihat Undangan</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        </header>

        {/* Tab Buttons Navigation */}
        <div className="p-4 bg-[#140706] border-b border-[#d4af37]/20 flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("links")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "links"
                ? "bg-[#d4af37] text-black shadow-lg"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <span>🔗 Link Tamu</span>
          </button>

          <button
            onClick={() => setActiveTab("rsvp")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "rsvp"
                ? "bg-[#d4af37] text-black shadow-lg"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <span>📅 RSVP</span>
          </button>

          <button
            onClick={() => setActiveTab("wishes")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "wishes"
                ? "bg-[#d4af37] text-black shadow-lg"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <span>💌 Ucapan</span>
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "info"
                ? "bg-[#d4af37] text-black shadow-lg"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <span>⚙️ Info</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 space-y-6">
          {activeTab === "links" && <GuestLinkGenerator />}

          {activeTab === "rsvp" && <RSVPManager />}

          {activeTab === "wishes" && <WishesManager />}

          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="gold-card-pro p-5 border border-[#d4af37]/40 rounded-xl space-y-3">
                <h3 className="text-base font-bold font-serif text-[#f3e5ab]">ℹ️ Ringkasan Informasi Acara</h3>
                <div className="text-xs space-y-2 text-white/80">
                  <p><strong>Mempelai:</strong> {weddingData.couple.bride.fullName} &amp; {weddingData.couple.groom.fullName}</p>
                  <p><strong>Tanggal:</strong> Sabtu, 10 Oktober 2026</p>
                  <p><strong>Lokasi:</strong> BALAI IKABAMA, Depok</p>
                  <p><strong>Musik:</strong> Catalyst - Weird Genius</p>
                </div>
              </div>

              <div className="gold-card-pro p-5 border border-[#d4af37]/40 rounded-xl space-y-3">
                <h3 className="text-base font-bold font-serif text-[#f3e5ab]">💳 Rekening &amp; Hadiah</h3>
                <div className="text-xs space-y-2 text-white/80">
                  {weddingData.giftAccounts.map((acc) => (
                    <p key={acc.id}>• <strong>{acc.bankName}:</strong> {acc.accountNumber} (a.n. {acc.accountName})</p>
                  ))}
                  <p className="pt-1"><strong>Alamat Kado:</strong> {weddingData.giftAddress.address}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <footer className="px-5 py-4 border-t border-[#d4af37]/20 text-center text-[10px] text-white/40">
          Wevitation Wedding Digital Admin Panel • 2026
        </footer>
      </div>
    </main>
  );
}
