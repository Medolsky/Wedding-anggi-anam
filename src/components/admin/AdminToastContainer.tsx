"use client";

import { useAdminStore, AdminToast } from "@/stores/adminStore";

export function AdminToastContainer() {
  const toasts = useAdminStore((s) => s.toasts);
  const removeToast = useAdminStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: AdminToast; onClose: () => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return (
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-lg bg-[#C8A96B]/20 text-[#E0C98F] border border-[#C8A96B]/40 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
        );
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-emerald-600/60 shadow-[0_4px_20px_rgba(16,185,129,0.15)]";
      case "error":
        return "border-rose-600/60 shadow-[0_4px_20px_rgba(244,63,94,0.15)]";
      case "warning":
        return "border-amber-600/60 shadow-[0_4px_20px_rgba(245,158,11,0.15)]";
      default:
        return "border-[#C8A96B]/60 shadow-[0_4px_20px_rgba(200,169,107,0.15)]";
    }
  };

  return (
    <div
      className={`pointer-events-auto p-3.5 bg-[#17181F]/95 backdrop-blur-md rounded-2xl border text-xs text-[#F1F0EC] flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${getBorderColor()}`}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white font-serif tracking-wide">{toast.title}</p>
        {toast.message && <p className="text-[11px] text-[#A1A4B2] mt-0.5 leading-snug">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        className="text-[#727585] hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0"
        title="Tutup Notifikasi"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
