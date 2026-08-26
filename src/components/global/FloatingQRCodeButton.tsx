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
          bg-[#171719] text-[#C8A96B] shadow-xl shadow-black/80
          flex items-center justify-center
          hover:bg-[#232326] transition-all border-1.5 border-[#806A42] hover:border-[#C8A96B] cursor-pointer"
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
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Body — Black Gold Theme */}
            <motion.div
              className="relative w-full max-w-sm bg-[#171719] rounded-3xl border-2 border-[#806A42] shadow-[0_16px_50px_rgba(0,0,0,0.85)] p-6 text-center text-[#F5F1E8] z-10 overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-[#C8A96B] hover:text-[#E0C98F] bg-[#0E0E0F] hover:bg-[#232326] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-colors border border-[#806A42]"
              >
                ✕
              </button>

              {/* Header */}
              <div className="space-y-1 mb-4">
                <span className="text-[9px] uppercase tracking-[3px] font-extrabold text-[#E0C98F] bg-[#C8A96B]/15 px-3 py-1 rounded-full border border-[#806A42] inline-block">
                  🎟️ E-TICKET CHECK-IN MASUK
                </span>
                <h3 className="text-xl font-bold font-serif text-[#F5F1E8] pt-1" style={{ fontFamily: "var(--font-heading)" }}>
                  {weddingData.couple.groom.nickname} &amp; {weddingData.couple.bride.nickname}
                </h3>
              </div>

              {/* QR Code Frame — Black & Gold Frame */}
              <div className="bg-[#0E0E0F] p-4 rounded-2xl border-2 border-[#C8A96B]/60 shadow-[0_0_25px_rgba(200,169,107,0.15)] flex flex-col items-center justify-center my-3 space-y-2">
                <QRCodeCanvas data={guestCode} size={190} className="rounded-xl shadow-md p-2 bg-white" />
                <span className="text-xs font-mono font-extrabold tracking-[2px] text-[#E0C98F] bg-[#171719] px-3 py-1 rounded-lg border border-[#806A42] shadow-sm">
                  {guestCode}
                </span>
              </div>

              {/* Guest Details */}
              <div className="space-y-1.5 mb-5">
                <p className="text-sm font-bold text-[#F5F1E8] font-serif">{guest.name}</p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-[#C8A96B]">
                  <span className="bg-[#C8A96B]/20 border border-[#806A42] px-2.5 py-0.5 rounded-full font-semibold text-[#E0C98F]">
                    {guest.category || "Tamu VIP"}
                  </span>
                  <span>•</span>
                  <span>10 Oktober 2026</span>
                </div>
                <p className="text-[10.5px] text-[#8C8983] pt-1 leading-relaxed">
                  Tunjukkan QR Code ini kepada panitia/admin di lokasi acara saat memasuki gedung.
                </p>
              </div>

              {/* Close Action Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#E0C98F] via-[#C8A96B] to-[#8A6B35] text-[#0E0E0F] font-black text-xs rounded-xl shadow-lg hover:brightness-110 cursor-pointer transition-all uppercase tracking-wider"
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
