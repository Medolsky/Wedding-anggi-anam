"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInvitationStore } from "@/stores/invitationStore";
import { weddingData } from "@/data/weddingData";
import { QRCodeCanvas } from "@/components/ui/QRCodeCanvas";
import { copyToClipboard } from "@/lib/utils";

export function ETicketSection() {
  const guest = useInvitationStore((s) => s.guest);
  const [copied, setCopied] = useState(false);

  const guestCode =
    guest.code ||
    `GUEST-${(guest.name || "VIP")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 6)
      .toUpperCase()}`;

  const handleCopyCode = async () => {
    const success = await copyToClipboard(guestCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section
      id="eticket"
      data-section="eticket"
      className="relative py-14 md:py-18 px-5 overflow-hidden flex flex-col items-center justify-center text-center bg-[#0E0E0F] text-[#F1F0EC] transform-gpu"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-radial from-[#1E1F25] via-[#0E0E0F] to-[#0A0A0B]" />
        <div className="absolute inset-0 photo-overlay-cinematic opacity-60" />
        <div className="absolute inset-0 film-grain" />
      </div>

      {/* Decorative Gold Corner Lines */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#C8A96B]/40 rounded-tl-lg pointer-events-none" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#C8A96B]/40 rounded-tr-lg pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#C8A96B]/40 rounded-bl-lg pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#C8A96B]/40 rounded-br-lg pointer-events-none" />

      {/* Section Header */}
      <motion.div
        className="relative z-20 max-w-md mx-auto mb-6 text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C8A96B]/15 border border-[#806A42] text-[#E0C98F] text-[10px] font-extrabold uppercase tracking-[3px]">
          <span>🎟️</span>
          <span>E-Ticket &amp; Barcode Check-In</span>
        </div>

        <h2
          className="text-2xl sm:text-3xl font-bold font-serif text-white pt-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Barcode Tamu Undangan
        </h2>

        <p className="text-xs text-[#A1A4B2] max-w-xs mx-auto leading-relaxed">
          Tunjukkan barcode ini kepada penerima tamu di pintu masuk untuk verifikasi kedatangan instan.
        </p>
      </motion.div>

      {/* VIP Access Card — Black & Gold Ticket */}
      <motion.div
        className="relative z-20 w-full max-w-sm mx-auto bg-[#171719] rounded-3xl border-2 border-[#806A42] shadow-[0_16px_50px_rgba(0,0,0,0.85)] p-5 sm:p-6 text-center overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        {/* Subtle Ticket Top Header */}
        <div className="space-y-1 pb-3 border-b border-[#2B2C32]">
          <span className="text-[9.5px] uppercase tracking-[3px] font-extrabold text-[#C8A96B] font-mono">
            OFFICIAL GUEST PASS
          </span>
          <h3
            className="text-lg font-bold font-serif text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {weddingData.couple.groom.nickname} &amp; {weddingData.couple.bride.nickname}
          </h3>
          <p className="text-[10px] text-[#8C8983]">
            Sabtu, 10 Oktober 2026 • BALAI IKABAMA
          </p>
        </div>

        {/* Guest Details */}
        <div className="py-4 space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-[#8A8C94]">Nama Tamu Terdaftar</p>
          <p
            className="text-lg sm:text-xl font-bold font-serif text-[#F5F1E8] tracking-wide"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {guest.name}
          </p>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="bg-[#C8A96B]/20 border border-[#806A42] text-[#E0C98F] text-[10px] font-bold px-3 py-0.5 rounded-full">
              {guest.category || "Tamu VIP"}
            </span>
            <span className="text-[11px] text-[#636674]">•</span>
            <span className="bg-[#24262E] text-[#A1A4B2] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {guest.maxGuest || 1} PAX
            </span>
          </div>
        </div>

        {/* Barcode Frame */}
        <div className="bg-[#0E0E0F] p-4 rounded-2xl border-2 border-[#C8A96B]/60 shadow-[0_0_30px_rgba(200,169,107,0.15)] flex flex-col items-center justify-center my-2 space-y-3">
          <div className="p-2 bg-white rounded-xl shadow-md">
            <QRCodeCanvas data={guestCode} size={180} className="rounded-lg" />
          </div>

          {/* Guest Code Pill & Copy Button */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-extrabold tracking-[2px] text-[#E0C98F] bg-[#171719] px-3 py-1 rounded-lg border border-[#806A42] shadow-sm">
              {guestCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 bg-[#22242B] hover:bg-[#2B2E38] text-[#C8A96B] hover:text-white rounded-lg border border-[#35373E] text-[11px] transition-all cursor-pointer"
              title="Salin Kode"
            >
              {copied ? "✓" : "📋"}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="pt-3 space-y-2">
          <div className="p-2.5 bg-[#121316] rounded-xl border border-[#2B2C32] text-[10.5px] text-[#8C8983] leading-relaxed">
            💡 <strong className="text-[#C8A96B]">Tips:</strong> Screenshot layar ini sekarang agar mudah discan saat tiba di lokasi acara tanpa repot membuka internet.
          </div>
        </div>
      </motion.div>
    </section>
  );
}
