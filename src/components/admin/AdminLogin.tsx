"use client";

import { useState } from "react";
import { weddingData } from "@/data/weddingData";

export interface AdminUser {
  username: string;
  role: string;
  name: string;
}

// 5 Akun Admin Resmi
export const ADMIN_ACCOUNTS: Record<string, { pass: string; role: string; name: string }> = {
  admin: {
    pass: "anamangi2026",
    role: "Super Admin",
    name: "Master Admin",
  },
  anam: {
    pass: "anam123",
    role: "Mempelai Pria",
    name: "Misbakhul Anam",
  },
  angi: {
    pass: "angi123",
    role: "Mempelai Wanita",
    name: "Angi Sulistia",
  },
  panitia1: {
    pass: "nikah2026",
    role: "Penerima Tamu 1",
    name: "Panitia Registrasi A",
  },
  panitia2: {
    pass: "nikah2026",
    role: "Penerima Tamu 2",
    name: "Panitia Registrasi B",
  },
};

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const userKey = username.trim().toLowerCase();
    const passInput = password.trim();

    setTimeout(() => {
      if (ADMIN_ACCOUNTS[userKey] && ADMIN_ACCOUNTS[userKey].pass === passInput) {
        const loggedUser: AdminUser = {
          username: userKey,
          role: ADMIN_ACCOUNTS[userKey].role,
          name: ADMIN_ACCOUNTS[userKey].name,
        };

        // Save session locally
        localStorage.setItem("wedding_admin_auth", JSON.stringify(loggedUser));
        onLoginSuccess(loggedUser);
      } else {
        setError("Username atau password salah! Silakan coba lagi.");
        setIsLoading(false);
      }
    }, 400);
  };

  const handleQuickSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F1F0EC] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-[#C8A96B] selection:text-black">
      {/* Background Cinematic Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C8A96B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#131418]/90 backdrop-blur-xl border border-[#2B2E38] shadow-[0_20px_60px_rgba(0,0,0,0.85)] rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#E0C98F] via-[#C8A96B] to-[#8A6B35] flex items-center justify-center text-[#0E0F12] font-black text-2xl shadow-lg shadow-[#C8A96B]/25">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide pt-2" style={{ fontFamily: "var(--font-heading)" }}>
            Admin Panel Login
          </h2>

          <p className="text-xs text-[#C8A96B] font-serif font-bold italic">
            The Wedding of {weddingData.couple.bride.nickname} &amp; {weddingData.couple.groom.nickname}
          </p>

          <p className="text-[11px] text-[#8A8C94]">
            Masukkan username dan password untuk mengakses dashboard manajemen undangan &amp; check-in.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#A1A4B2]">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: admin / anam / panitia1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs py-3 pl-10 pr-4 rounded-xl border border-[#2E313D] bg-[#1A1C22] text-[#F1F0EC] placeholder-[#636674] focus:ring-2 focus:ring-[#C8A96B] focus:border-transparent focus:outline-none transition-all"
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#727585" strokeWidth="2" className="absolute left-3.5 top-3.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#A1A4B2]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs py-3 pl-10 pr-10 rounded-xl border border-[#2E313D] bg-[#1A1C22] text-[#F1F0EC] placeholder-[#636674] focus:ring-2 focus:ring-[#C8A96B] focus:border-transparent focus:outline-none transition-all"
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#727585" strokeWidth="2" className="absolute left-3.5 top-3.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#727585] hover:text-[#E0C98F] transition-colors cursor-pointer"
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-[#E0C98F] via-[#C8A96B] to-[#8A6B35] text-[#0E0F12] font-black text-xs rounded-xl shadow-lg shadow-[#C8A96B]/20 hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-[#0E0F12]" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Cheat-Sheet / Daftar 5 Akun Admin Tersedia */}
        <div className="pt-2 border-t border-[#24262E]">
          <button
            type="button"
            onClick={() => setShowAccountList(!showAccountList)}
            className="w-full text-center text-[11px] text-[#C8A96B] hover:underline font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{showAccountList ? "▲ Tutup Daftar Akun" : "▼ Lihat 5 Akun Admin Tersedia"}</span>
          </button>

          {showAccountList && (
            <div className="mt-3 p-3.5 bg-[#17181D] border border-[#2B2E38] rounded-2xl space-y-2 text-xs">
              <p className="text-[10px] uppercase font-bold text-[#8A8C94] tracking-wider mb-1">
                Klik akun untuk isi otomatis:
              </p>

              {Object.entries(ADMIN_ACCOUNTS).map(([u, acc]) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleQuickSelect(u, acc.pass)}
                  className="w-full p-2 bg-[#1F2128] hover:bg-[#2A2D37] border border-[#303340] rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div>
                    <span className="font-bold text-white group-hover:text-[#E0C98F] transition-colors">{u}</span>
                    <span className="text-[10px] text-[#8A8C94] ml-2">({acc.role})</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#C8A96B] bg-[#141519] px-2 py-0.5 rounded-md border border-[#2E313D]">
                    pass: {acc.pass}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Back to Web */}
      <div className="relative z-10 mt-6 text-center">
        <a
          href="/"
          className="text-xs text-[#8A8C94] hover:text-[#E0C98F] transition-colors flex items-center gap-1.5 font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Kembali ke Halaman Undangan</span>
        </a>
      </div>
    </div>
  );
}
