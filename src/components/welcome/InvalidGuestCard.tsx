"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface InvalidGuestCardProps {
  enteredName?: string;
  onVerifySuccess?: (guest: any) => void;
}

export function InvalidGuestCard({
  enteredName,
  onVerifySuccess,
}: InvalidGuestCardProps) {
  const [searchName, setSearchName] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isFakeOrCustomName =
    enteredName &&
    enteredName !== "Tamu Undangan" &&
    enteredName.trim().length > 0;

  async function handleManualVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!searchName.trim()) return;

    setIsChecking(true);
    setErrorMessage("");

    try {
      const res = await fetch(
        `/api/db?type=verify&to=${encodeURIComponent(searchName.trim())}&t=${Date.now()}`,
        { cache: "no-store" }
      );
      const json = await res.json();

      if (json.success && json.valid && json.guest) {
        if (onVerifySuccess) {
          onVerifySuccess(json.guest);
        }
      } else {
        setErrorMessage(
          "Nama tidak ditemukan dalam daftar undangan resmi. Silakan periksa kembali ejaan nama Anda atau hubungi kedua mempelai."
        );
      }
    } catch {
      setErrorMessage("Gagal memverifikasi. Silakan periksa koneksi internet Anda.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <motion.div
      className="absolute inset-x-0 top-[78%] -translate-y-1/2 z-30 flex flex-col items-center justify-center px-4 pointer-events-auto"
      initial={{ opacity: 0, scale: 0.92, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="w-full max-w-[340px] bg-[#121316]/90 backdrop-blur-xl border border-[#C8A96B]/60 shadow-[0_16px_40px_rgba(0,0,0,0.85)] rounded-2xl p-5 text-center text-[#F1F0EC]">
        {/* Golden Lock Icon */}
        <div className="w-11 h-11 mx-auto mb-2.5 rounded-full bg-[#C8A96B]/15 border border-[#C8A96B]/40 flex items-center justify-center text-[#E0C98F] shadow-inner">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xs uppercase tracking-[2px] font-extrabold text-[#E0C98F] mb-0.5">
          Undangan Privat
        </h3>
        <p className="text-[10px] text-[#A1A4B2] font-serif mb-3">
          Misbakhul Anam &amp; Angi Sulistia
        </p>

        {/* Rejection Notice */}
        {isFakeOrCustomName ? (
          <div className="bg-[#1C1D21]/90 border border-rose-900/50 rounded-xl p-2.5 mb-3 text-left">
            <p className="text-[9.5px] text-[#8E909A] uppercase tracking-wider">
              Tautan nama:
            </p>
            <p className="text-[11.5px] font-bold text-rose-300 font-mono truncate">
              {enteredName}
            </p>
            <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
              <span>✕</span> Tidak terdaftar di buku tamu resmi
            </p>
          </div>
        ) : (
          <p className="text-[10.5px] text-[#D1D3DC] mb-3 leading-relaxed">
            Halaman ini hanya dapat diakses oleh tamu yang telah terdaftar dalam daftar undangan resmi.
          </p>
        )}

        {/* Manual Search Verification Form */}
        <form onSubmit={handleManualVerify} className="space-y-2 text-left">
          <label className="block text-[9.5px] uppercase tracking-wider text-[#A1A4B2] font-semibold">
            Periksa Nama yang Terdaftar:
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="text-xs bg-[#1A1B20] border border-[#35373E] rounded-xl px-3 py-2 text-[#F1F0EC] placeholder-[#636674] focus:outline-none focus:border-[#C8A96B] flex-1"
            />
            <button
              type="submit"
              disabled={isChecking}
              className="text-xs font-bold bg-gradient-to-r from-[#C8A96B] to-[#B8860B] text-[#0A0B0D] px-3.5 py-2 rounded-xl hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isChecking ? "..." : "Cari"}
            </button>
          </div>

          {errorMessage && (
            <p className="text-[10px] text-amber-300 leading-snug pt-1">
              {errorMessage}
            </p>
          )}
        </form>

        {/* WhatsApp Contact Link to Couple */}
        <div className="mt-3 pt-2.5 border-t border-[#2D2E34]/60">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `Halo Anam & Angi, saya ingin konfirmasi link undangan pernikahan atas nama: ${
                enteredName || searchName || ""
              }`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10.5px] text-[#E0C98F] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <span>💬 Konfirmasi ke Mempelai via WhatsApp</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
