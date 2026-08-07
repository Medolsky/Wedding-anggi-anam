"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { weddingData } from "@/data/weddingData";
import { AnimatedText, StaggerContainer, StaggerItem } from "@/components/ui/AnimatedText";
import { Modal } from "@/components/ui/Modal";
import { copyToClipboard } from "@/lib/utils";

export function GiftSection() {
  const { giftAccounts, giftAddress, sectionBgs } = weddingData;
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showQris, setShowQris] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  async function handleCopy(text: string, fieldId: string) {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }

  return (
    <section
      id="gift"
      data-section="gift"
      className="section-gift relative py-18 md:py-24 overflow-hidden flex flex-col items-center justify-center text-center bg-[#FAF8F5] text-[#1A1815]"
    >
      {/* Background Image — Clear & Vivid */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${sectionBgs.gift}')`,
            filter: "brightness(0.95) contrast(1.02)",
          }}
          initial={{ scale: 1.15 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 10, ease: "linear" }}
        />
        <div className="absolute inset-0 photo-overlay-cinematic" />
        <div className="absolute inset-0 film-grain" />
      </div>

      <div className="relative z-20 max-w-md mx-auto px-6 w-full text-center flex flex-col items-center justify-center">
        {/* Section header frame card */}
        <AnimatedText delay={0} variant="fadeUp" className="w-full flex justify-center mb-6">
          <div className="gold-card-pro p-4 md:p-5 border border-[#C8A96B] shadow-xl rounded-2xl w-full max-w-xs text-center flex flex-col items-center justify-center">
            <p
              className="text-[10px] uppercase tracking-[4px] text-[#B8860B] font-extrabold mb-1.5 text-center leading-none"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Wedding Gift
            </p>

            <h2
              className="text-2xl md:text-3xl text-center font-serif text-[#1A1815] font-bold leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Hadiah Pernikahan
            </h2>

            <p className="text-center text-xs opacity-90 leading-relaxed text-[#555555]">
              Kehadiran dan doa Anda adalah hadiah terindah. Namun jika ingin
              memberikan tanda kasih, kami menyediakan opsi berikut.
            </p>
          </div>
        </AnimatedText>

        {/* Bank account cards */}
        <StaggerContainer delay={0.3} staggerDelay={0.15} className="space-y-4 mb-5 w-full max-w-xs">
          {giftAccounts.map((account) => (
            <StaggerItem key={account.id}>
              <motion.div
                className="gold-card-pro p-4 border border-[#C8A96B] shadow-2xl text-center flex flex-col items-center justify-center w-full rounded-2xl"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-[9px] uppercase tracking-[2px] font-bold text-[#B8860B] mb-1 text-center leading-none">
                  {account.bankName}
                </p>

                {/* Account number */}
                <p
                  className="text-2xl md:text-3xl tracking-[2.5px] mb-0.5 font-serif text-gold-gradient font-extrabold text-center drop-shadow-xs leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {account.accountNumber}
                </p>

                {/* Account name */}
                <p className="text-xs text-[#4A453F] font-semibold mb-2.5 text-center leading-none">
                  a.n. {account.accountName}
                </p>

                {/* Single compact copy button */}
                <button
                  onClick={() =>
                    handleCopy(account.accountNumber, `num-${account.id}`)
                  }
                  className="btn-modern-primary py-1 px-4 text-[10px] font-bold rounded-full flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <AnimatePresence mode="wait">
                    {copiedField === `num-${account.id}` ? (
                      <motion.span
                        key="copied"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        ✓
                      </motion.span>
                    ) : (
                      <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        📋
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {copiedField === `num-${account.id}`
                    ? "Tersalin!"
                    : "Salin Rekening"}
                </button>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* QRIS & Physical gift buttons — Compact & Sleek */}
        <AnimatedText delay={0.5} variant="fadeUp" className="w-full max-w-xs flex justify-center">
          <div className="flex gap-2 justify-center w-full">
            <button
              onClick={() => setShowQris(true)}
              className="btn-modern-primary py-1.5 px-4 text-[9.5px] uppercase tracking-[1px] font-bold rounded-full shadow-sm flex items-center justify-center"
            >
              Lihat QRIS
            </button>
            <button
              onClick={() => setShowAddress(true)}
              className="btn-modern-secondary py-1.5 px-4 text-[9.5px] uppercase tracking-[1px] font-bold rounded-full shadow-sm flex items-center justify-center"
            >
              Kado Fisik
            </button>
          </div>
        </AnimatedText>
      </div>

      {/* QRIS Modal */}
      <Modal isOpen={showQris} onClose={() => setShowQris(false)} title="QRIS Pembayaran">
        <div className="flex flex-col items-center justify-center text-center py-2">
          <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-xl flex flex-col items-center justify-center mb-3 border border-[#C8A96B]">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Wedding-Raka-Alya-QRIS"
              alt="QRIS Wedding"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs text-[#555555] text-center max-w-xs leading-relaxed">
            Scan QR code di atas menggunakan GoPay, OVO, Dana, ShopeePay, LinkAja, atau Mobile Banking Anda.
          </p>
        </div>
      </Modal>

      {/* Gift Address Modal */}
      <Modal
        isOpen={showAddress}
        onClose={() => setShowAddress(false)}
        title="Alamat Pengiriman Kado"
      >
        <div className="py-2 space-y-3 text-center flex flex-col items-center">
          <div className="w-full text-center">
            <p className="text-[9px] uppercase tracking-[1.5px] text-[#B8860B] mb-0.5 font-bold leading-none">
              Penerima
            </p>
            <p className="font-bold text-sm text-[#1A1815]">{giftAddress.name}</p>
          </div>
          <div className="w-full text-center">
            <p className="text-[9px] uppercase tracking-[1.5px] text-[#B8860B] mb-0.5 font-bold leading-none">
              Alamat Lengkap
            </p>
            <p className="text-xs leading-relaxed text-[#66615C] max-w-xs mx-auto">{giftAddress.address}</p>
          </div>
          <div className="w-full text-center">
            <p className="text-[9px] uppercase tracking-[1.5px] text-[#B8860B] mb-0.5 font-bold leading-none">
              No. Telepon
            </p>
            <p className="text-xs font-mono text-[#1A1815] font-semibold">{giftAddress.phone}</p>
          </div>
          <button
            onClick={() =>
              handleCopy(
                `${giftAddress.name}\n${giftAddress.address}\n${giftAddress.phone}`,
                "address"
              )
            }
            className="btn-modern-primary w-full py-2 text-[10px] uppercase tracking-[1.5px] font-bold rounded-full shadow-md mt-1"
          >
            {copiedField === "address" ? "✓ Alamat Tersalin!" : "Salin Alamat Lengkap"}
          </button>
        </div>
      </Modal>
    </section>
  );
}
