"use client";

import { create } from "zustand";
import { GeneratedGuest } from "@/components/admin/GuestLinkGenerator";
import { RSVPItem } from "@/components/admin/RSVPManager";
import { WishItem } from "@/components/admin/WishesManager";

export interface AdminToast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface AdminStore {
  // Data
  guests: GeneratedGuest[];
  rsvps: RSVPItem[];
  wishes: WishItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  dbProvider: string;
  isCloudSynced: boolean | null;
  latencyMs: number | null;
  lastSyncedAt: Date | null;
  toasts: AdminToast[];

  // Data fetching
  fetchData: (silent?: boolean) => Promise<void>;

  // Guest actions
  addGuest: (guest: GeneratedGuest) => Promise<boolean>;
  updateGuest: (guest: GeneratedGuest) => Promise<boolean>;
  deleteGuest: (id: string) => Promise<boolean>;
  bulkAddGuests: (newGuests: GeneratedGuest[]) => Promise<boolean>;
  clearAllGuests: () => Promise<boolean>;
  toggleGuestStatus: (id: string) => Promise<void>;
  markGuestSent: (guest: GeneratedGuest) => Promise<void>;
  markGuestCopied: (id: string, name: string) => Promise<void>;
  adjustPax: (guestId: string, delta: number) => Promise<void>;

  // RSVP actions
  addRsvp: (rsvp: RSVPItem) => Promise<boolean>;
  updateRsvp: (rsvp: RSVPItem) => Promise<boolean>;
  deleteRsvp: (rsvp: RSVPItem) => Promise<boolean>;

  // Wish actions
  updateWish: (wish: WishItem) => Promise<boolean>;
  deleteWish: (wish: WishItem) => Promise<boolean>;
  clearAllWishes: () => Promise<boolean>;

  // Scanner checkin update
  updateAfterCheckIn: (guest: any, allGuests?: any[], allRsvps?: any[]) => void;

  // Toast notifications
  addToast: (title: string, message?: string, type?: AdminToast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
}

function formatPhoneNumber(num: string): string {
  let cleaned = num.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  return cleaned;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  guests: [],
  rsvps: [],
  wishes: [],
  isLoading: true,
  isRefreshing: false,
  dbProvider: "memory",
  isCloudSynced: null,
  latencyMs: null,
  lastSyncedAt: null,
  toasts: [],

  addToast: (title, message, type = "success", duration = 3500) => {
    const id = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 5);
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, type, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  fetchData: async (silent = false) => {
    const startTime = performance.now();
    if (!silent) set({ isRefreshing: true });

    try {
      const res = await fetch(`/api/db?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (json.success && json.data) {
        const rawGuests = Array.isArray(json.data.guests) ? json.data.guests : [];
        const mappedGuests = rawGuests.map((g: any) => ({
          ...g,
          isSentWa: g.isSentWa || g.status === "sent" || g.status === "sent_and_copied",
          isCopied: g.isCopied || g.status === "copied" || g.status === "sent_and_copied",
        }));

        const rawRsvps = Array.isArray(json.data.rsvps) ? json.data.rsvps : [];
        const formattedRsvps = rawRsvps.map((item: any) => ({
          id: item.id || Date.now().toString(),
          name: item.name,
          attendance: item.status === "Hadir" ? "Hadir" : item.status === "Ragu-ragu" ? "Ragu-ragu" : "Tidak Hadir",
          guestCount: item.pax || 1,
          session: item.notes || "Akad & Resepsi",
          createdAt: item.createdAt || "Baru saja",
        }));

        const formattedWishes = Array.isArray(json.data.wishes)
          ? json.data.wishes.map((w: any) => ({
              ...w,
              createdAt: w.createdAt || w.created_at || "Baru saja",
            }))
          : [];

        set({
          guests: mappedGuests,
          rsvps: formattedRsvps,
          wishes: formattedWishes,
          isCloudSynced: json.persistent !== false,
          dbProvider: json.provider || "memory",
          latencyMs: latency,
          lastSyncedAt: new Date(),
          isLoading: false,
          isRefreshing: false,
        });
      }
    } catch (err) {
      console.error("fetchData error:", err);
      set({
        isCloudSynced: false,
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  // ==========================================
  // GUEST ACTIONS (OPTIMISTIC + INSTANT REACTIVITY)
  // ==========================================

  addGuest: async (newGuest) => {
    // 1. Instant Optimistic Update
    set((state) => ({
      guests: [newGuest, ...state.guests],
    }));

    get().addToast("Tamu Ditambahkan", `✓ "${newGuest.name}" berhasil ditambahkan ke daftar.`, "success");

    // 2. Persist to API
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          type: "guests",
          item: newGuest,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        get().addToast("Peringatan Sinkronisasi", "Gagal menyimpan ke server cloud. Data disimpan lokal.", "warning");
        return false;
      }
      return true;
    } catch (err) {
      console.error("addGuest API error:", err);
      get().addToast("Koneksi Terganggu", "Data tersimpan di memori browser.", "warning");
      return false;
    }
  },

  updateGuest: async (updatedGuest) => {
    // 1. Instant Optimistic Update
    set((state) => ({
      guests: state.guests.map((g) => (g.id === updatedGuest.id ? updatedGuest : g)),
    }));

    get().addToast("Data Diperbarui", `✓ Data tamu "${updatedGuest.name}" berhasil disimpan.`, "success");

    // 2. Persist to API
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          type: "guests",
          item: updatedGuest,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        get().addToast("Peringatan Sinkronisasi", "Perubahan belum tersinkron ke cloud.", "warning");
        return false;
      }
      return true;
    } catch (err) {
      console.error("updateGuest API error:", err);
      return false;
    }
  },

  deleteGuest: async (id) => {
    const targetGuest = get().guests.find((g) => g.id === id);
    const guestName = targetGuest?.name || "Tamu";

    // 1. Instant Optimistic Removal
    set((state) => ({
      guests: state.guests.filter((g) => g.id !== id),
    }));

    get().addToast("Tamu Dihapus", `✓ "${guestName}" telah dihapus dari daftar undangan.`, "info");

    // 2. Persist to API
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          type: "guests",
          item: {
            id,
            name: targetGuest?.name,
            code: targetGuest?.code,
          },
        }),
      });
      return true;
    } catch (err) {
      console.error("deleteGuest API error:", err);
      get().addToast("Gagal Hapus Cloud", "Terjadi kesalahan saat menghapus dari cloud database.", "error");
      return false;
    }
  },

  bulkAddGuests: async (newGuests) => {
    if (newGuests.length === 0) return false;

    // 1. Instant Optimistic Update
    const current = get().guests;
    const combined = [...newGuests, ...current];
    set({ guests: combined });

    get().addToast("Impor Berhasil", `✓ ${newGuests.length} tamu berhasil ditambahkan.`, "success");

    // 2. Persist
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          type: "guests",
          item: combined,
        }),
      });
      return true;
    } catch (err) {
      console.error("bulkAddGuests API error:", err);
      return false;
    }
  },

  clearAllGuests: async () => {
    set({ guests: [] });
    get().addToast("Daftar Dikosongkan", "Semua daftar tamu telah dibersihkan.", "info");

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          type: "guests",
          item: [],
        }),
      });
      return true;
    } catch (err) {
      console.error("clearAllGuests API error:", err);
      return false;
    }
  },

  toggleGuestStatus: async (id) => {
    const updated = get().guests.map((g) => {
      if (g.id === id) {
        let nextStatus: GeneratedGuest["status"] = "sent";
        let isSentWa = true;
        let isCopied = false;

        if (g.status === "sent") {
          nextStatus = "copied";
          isSentWa = false;
          isCopied = true;
        } else if (g.status === "copied") {
          nextStatus = "sent_and_copied";
          isSentWa = true;
          isCopied = true;
        } else if (g.status === "sent_and_copied") {
          nextStatus = "pending";
          isSentWa = false;
          isCopied = false;
        }

        return { ...g, status: nextStatus, isSentWa, isCopied };
      }
      return g;
    });

    set({ guests: updated });

    const target = updated.find((g) => g.id === id);
    if (target) {
      try {
        await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            type: "guests",
            item: target,
          }),
        });
      } catch {}
    }
  },

  markGuestSent: async (guest) => {
    const timeStr =
      new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";

    const isAlreadyCopied = guest.isCopied || guest.status === "copied" || guest.status === "sent_and_copied";
    const nextStatus = isAlreadyCopied ? ("sent_and_copied" as const) : ("sent" as const);

    const updatedGuest = {
      ...guest,
      status: nextStatus,
      isSentWa: true,
      sentWaAt: timeStr,
    };

    set((state) => ({
      guests: state.guests.map((g) => (g.id === guest.id ? updatedGuest : g)),
    }));

    get().addToast("Status WA Terkirim", `✓ Ditandai terkirim ke WhatsApp: ${guest.name}`, "success", 2500);

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          type: "guests",
          item: updatedGuest,
        }),
      });
    } catch {}
  },

  markGuestCopied: async (id, name) => {
    const timeStr =
      new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";

    let targetUpdated: GeneratedGuest | null = null;
    const updated = get().guests.map((g) => {
      if (g.id === id) {
        const isAlreadySent = g.isSentWa || g.status === "sent" || g.status === "sent_and_copied";
        const nextStatus = isAlreadySent ? ("sent_and_copied" as const) : ("copied" as const);
        targetUpdated = {
          ...g,
          status: nextStatus,
          isCopied: true,
          copiedAt: timeStr,
        };
        return targetUpdated;
      }
      return g;
    });

    set({ guests: updated });
    get().addToast("Link Disalin", `✓ Link undangan untuk "${name}" tersalin ke clipboard.`, "info", 2000);

    if (targetUpdated) {
      try {
        await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            type: "guests",
            item: targetUpdated,
          }),
        });
      } catch {}
    }
  },

  adjustPax: async (guestId, delta) => {
    const target = get().guests.find((g) => g.id === guestId);
    if (!target) return;
    const currentPax = target.pax || 1;
    const newPax = Math.max(1, currentPax + delta);

    const updatedGuest = { ...target, pax: newPax };
    set((state) => ({
      guests: state.guests.map((g) => (g.id === guestId ? updatedGuest : g)),
    }));

    get().addToast("PAX Disesuaikan", `PAX "${target.name}" diubah menjadi ${newPax} orang.`, "info", 2000);

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          type: "guests",
          item: updatedGuest,
        }),
      });
    } catch {}
  },

  // ==========================================
  // RSVP ACTIONS (OPTIMISTIC + INSTANT REACTIVITY)
  // ==========================================

  addRsvp: async (newRsvp) => {
    set((state) => ({
      rsvps: [newRsvp, ...state.rsvps],
    }));

    get().addToast("RSVP Ditambahkan", `✓ Konfirmasi untuk "${newRsvp.name}" (${newRsvp.attendance}) berhasil disimpan.`, "success");

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          type: "rsvps",
          item: {
            id: newRsvp.id,
            name: newRsvp.name,
            pax: newRsvp.guestCount,
            status: newRsvp.attendance,
            notes: newRsvp.session,
            createdAt: newRsvp.createdAt,
          },
        }),
      });
      return true;
    } catch (err) {
      console.error("addRsvp API error:", err);
      return false;
    }
  },

  updateRsvp: async (updatedRsvp) => {
    set((state) => ({
      rsvps: state.rsvps.map((r) => (r.id === updatedRsvp.id ? updatedRsvp : r)),
    }));

    get().addToast("RSVP Diperbarui", `✓ Data RSVP "${updatedRsvp.name}" berhasil disimpan.`, "success");

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          type: "rsvps",
          item: {
            id: updatedRsvp.id,
            name: updatedRsvp.name,
            pax: updatedRsvp.guestCount,
            status: updatedRsvp.attendance,
            notes: updatedRsvp.session,
          },
        }),
      });
      return true;
    } catch (err) {
      console.error("updateRsvp API error:", err);
      return false;
    }
  },

  deleteRsvp: async (rsvp) => {
    set((state) => ({
      rsvps: state.rsvps.filter((r) => r.id !== rsvp.id),
    }));

    get().addToast("RSVP Dihapus", `✓ Data RSVP "${rsvp.name}" telah dihapus.`, "info");

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          type: "rsvps",
          item: {
            id: rsvp.id,
            name: rsvp.name,
            message: rsvp.session,
          },
        }),
      });
      return true;
    } catch (err) {
      console.error("deleteRsvp API error:", err);
      return false;
    }
  },

  // ==========================================
  // WISH ACTIONS (OPTIMISTIC + INSTANT REACTIVITY)
  // ==========================================

  updateWish: async (updatedWish) => {
    set((state) => ({
      wishes: state.wishes.map((w) => (w.id === updatedWish.id ? updatedWish : w)),
    }));

    get().addToast("Ucapan Diperbarui", `✓ Ucapan dari "${updatedWish.name}" berhasil diedit.`, "success");

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          type: "wishes",
          item: updatedWish,
        }),
      });
      return true;
    } catch (err) {
      console.error("updateWish API error:", err);
      return false;
    }
  },

  deleteWish: async (wish) => {
    set((state) => ({
      wishes: state.wishes.filter((w) => w.id !== wish.id && !(w.name === wish.name && w.message === wish.message)),
    }));

    get().addToast("Ucapan Dihapus", `✓ Ucapan dari "${wish.name}" telah dihapus.`, "info");

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          type: "wishes",
          item: {
            id: wish.id,
            name: wish.name,
            message: wish.message,
          },
        }),
      });
      return true;
    } catch (err) {
      console.error("deleteWish API error:", err);
      return false;
    }
  },

  clearAllWishes: async () => {
    set({ wishes: [] });
    get().addToast("Ucapan Dikosongkan", "Semua ucapan telah dibersihkan.", "info");

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          type: "wishes",
          item: [],
        }),
      });
      return true;
    } catch (err) {
      console.error("clearAllWishes API error:", err);
      return false;
    }
  },

  updateAfterCheckIn: (guest, allGuests, allRsvps) => {
    if (Array.isArray(allGuests) && allGuests.length > 0) {
      set({ guests: allGuests });
    } else if (guest) {
      set((state) => ({
        guests: state.guests.map((g) => (g.id === guest.id ? { ...g, ...guest } : g)),
      }));
    }

    if (Array.isArray(allRsvps) && allRsvps.length > 0) {
      set({ rsvps: allRsvps });
    }
  },
}));
