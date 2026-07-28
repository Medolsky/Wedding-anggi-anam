"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvitationStore } from "@/stores/invitationStore";
import { QRCodeCanvas } from "@/components/ui/QRCodeCanvas";
import { weddingData } from "@/data/weddingData";

export function FloatingQRCodeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const appState = useInvitationStore((s) => s.state);
  const guest = useInvitationStore((s) => s.guest);

  if (appState !== "OPENED") return null;

  const guestCode =
    guest.code ||
    `GUEST-${(guest.name || "VIP")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 6)
      .toUpperCase()}`;

  return (
    <>
      {/* Floating Right QR Button */}
      <motion.button
        className="fixed bottom-20 right-6 z-[90] w-12 h-12 rounded-full 
          bg-[#d4af37] text-white shadow-lg shadow-amber-500/20
          flex items-center justify-center
          hover:bg-[#b8860b] transition-colors border border-[#e6ca65] cursor-pointer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.8, type: "spring", stiffness: 200 }}
        onClick={() => setIsOpen(true)}
        aria-label="Lihat QR Code E-Ticket"
        title="Lihat Barcode E-Ticket Anda"
      >
        <div className="flex flex-col items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
      </motion.button>

      {/* E-Ticket QR Code Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Body */}
            <motion.div
              className="relative w-full max-w-sm bg-white rounded-3xl border-2 border-[#d4af37]/60 shadow-2xl p-6 text-center text-[#2a2723] z-10 overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-[#8a662d] hover:text-[#2a2723] bg-[#faf8f5] hover:bg-[#f7ebbf] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-colors border border-[#d4af37]/30"
              >
                ✕
              </button>

              {/* Header */}
              <div className="space-y-1 mb-4">
                <span className="text-[9px] uppercase tracking-[3px] font-extrabold text-[#b8860b] bg-[#f7ebbf]/40 px-3 py-1 rounded-full border border-[#d4af37]/30 inline-block">
                  🎟️ E-TICKET CHECK-IN MASUK
                </span>
                <h3 className="text-xl font-bold font-serif text-[#2a2723] pt-1" style={{ fontFamily: "var(--font-heading)" }}>
                  {weddingData.couple.groom.nickname} &amp; {weddingData.couple.bride.nickname}
                </h3>
              </div>

              {/* QR Code Frame */}
              <div className="bg-[#faf8f5] p-4 rounded-2xl border border-[#d4af37]/40 shadow-inner flex flex-col items-center justify-center my-3 space-y-2">
                <QRCodeCanvas data={guestCode} size={190} className="rounded-xl shadow-sm" />
                <span className="text-xs font-mono font-extrabold tracking-[2px] text-[#2a2723] bg-white px-3 py-1 rounded-lg border border-[#d4af37]/40 shadow-sm">
                  {guestCode}
                </span>
              </div>

              {/* Guest Details */}
              <div className="space-y-1.5 mb-5">
                <p className="text-sm font-bold text-[#2a2723] font-serif">{guest.name}</p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-[#8a662d]">
                  <span className="bg-[#f7ebbf]/60 border border-[#d4af37]/30 px-2.5 py-0.5 rounded-full font-semibold">
                    {guest.category || "Tamu VIP"}
                  </span>
                  <span>•</span>
                  <span>10 Oktober 2026</span>
                </div>
                <p className="text-[10.5px] text-[#66615c] pt-1 leading-relaxed">
                  Tunjukkan QR Code ini kepada panitia/admin di lokasi acara saat memasuki gedung.
                </p>
              </div>

              {/* Close Action Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 bg-[#d4af37] text-white hover:bg-[#b8860b] font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider"
              >
                Tutup E-Ticket
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
