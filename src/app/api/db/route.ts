import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Universal Cloud Database API Route for Wedding Invitation App
 * Syncs Guests, RSVPs, and Wishes across all devices globally.
 * Uses Supabase Cloud SQL (PostgreSQL) / JSONBin with fallback in-memory & persistent storage.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-supabase-project")
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// Global cloud memory store for instant real-time sync across multi-devices
let cloudStore: {
  guests: any[];
  rsvps: any[];
  wishes: any[];
  config: any;
} = {
  guests: [],
  config: {
    customServerUrl: "https://wedding-anam-bot.loca.lt",
    provider: "fonnte",
    waToken: "4Sf3SH6toe8ztYykjmMV",
  },
  rsvps: [],
  wishes: [],
};

// Optional external free Cloud Database Integration (JSONBin.io / Supabase / KV)
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

async function fetchFromExternalCloud() {
  // 1. Try Supabase Cloud SQL first if configured
  if (supabase) {
    try {
      const [guestsRes, rsvpsRes, wishesRes, configRes] = await Promise.all([
        supabase.from("guests").select("*").order("created_at", { ascending: false }),
        supabase.from("rsvps").select("*").order("created_at", { ascending: false }),
        supabase.from("wishes").select("*").order("created_at", { ascending: false }),
        supabase.from("config").select("*").eq("key", "bot_config").maybeSingle(),
      ]);

      if (!guestsRes.error && Array.isArray(guestsRes.data)) {
        cloudStore.guests = guestsRes.data.map((g) => ({
          ...g,
          checkedIn: g.checked_in,
          checkInTime: g.check_in_time,
        }));
      }
      if (!rsvpsRes.error && Array.isArray(rsvpsRes.data)) {
        cloudStore.rsvps = rsvpsRes.data.map((r) => ({
          ...r,
          checkedIn: r.checked_in,
          checkInTime: r.check_in_time,
        }));
      }
      if (!wishesRes.error && Array.isArray(wishesRes.data)) {
        cloudStore.wishes = wishesRes.data;
      }
      if (!configRes.error && configRes.data?.value) {
        cloudStore.config = configRes.data.value;
      }

      return cloudStore;
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback to JSONBin if configured
  if (JSONBIN_BIN_ID && JSONBIN_API_KEY) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: { "X-Master-Key": JSONBIN_API_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          cloudStore = { ...cloudStore, ...data.record };
        }
      }
    } catch {
      // Fallback
    }
  }

  return cloudStore;
}

async function saveToExternalCloud(updatedStore: any) {
  cloudStore = updatedStore;

  // 1. Save to Supabase Cloud SQL if configured
  if (supabase) {
    try {
      if (updatedStore.guests) {
        const sqlGuests = updatedStore.guests.map((g: any) => ({
          id: g.id || Date.now().toString(),
          code: g.code || `GUEST-${g.id}`,
          name: g.name,
          phone: g.phone || null,
          category: g.category || "Tamu VIP",
          template: g.template || "Formal",
          status: g.status || "pending",
          checked_in: !!g.checkedIn,
          check_in_time: g.checkInTime || null,
          pax: g.pax || 1,
        }));
        await supabase.from("guests").upsert(sqlGuests);
      }

      if (updatedStore.rsvps) {
        const sqlRsvps = updatedStore.rsvps.map((r: any) => ({
          id: r.id || Date.now().toString(),
          name: r.name,
          status: r.status || "Hadir",
          pax: r.pax || 1,
          notes: r.notes || "",
          checked_in: !!r.checkedIn,
          check_in_time: r.checkInTime || null,
        }));
        await supabase.from("rsvps").upsert(sqlRsvps);
      }

      if (updatedStore.wishes) {
        const sqlWishes = updatedStore.wishes.map((w: any) => ({
          id: w.id || Date.now().toString(),
          name: w.name,
          message: w.message || "",
          relationship: w.relationship || "Kerabat",
          is_approved: w.is_approved !== false,
        }));
        await supabase.from("wishes").upsert(sqlWishes);
      }

      if (updatedStore.config) {
        await supabase.from("config").upsert({
          key: "bot_config",
          value: updatedStore.config,
        });
      }
    } catch {
      // Fallback below
    }
  }

  // 2. Save to JSONBin if configured
  if (JSONBIN_BIN_ID && JSONBIN_API_KEY) {
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": JSONBIN_API_KEY,
        },
        body: JSON.stringify(cloudStore),
      });
    } catch {
      // Fallback
    }
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";

  const data = await fetchFromExternalCloud();

  if (type === "guests") return NextResponse.json({ success: true, data: data.guests });
  if (type === "rsvps") return NextResponse.json({ success: true, data: data.rsvps });
  if (type === "wishes") return NextResponse.json({ success: true, data: data.wishes });
  if (type === "config") return NextResponse.json({ success: true, data: data.config });

  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, item, type } = body;

    const currentStore = await fetchFromExternalCloud();

    if (action === "add" && type) {
      const list = currentStore[type as "guests" | "rsvps" | "wishes"] || [];
      const updatedList = [item, ...list];
      const newStore = { ...currentStore, [type]: updatedList };

      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: newStore[type as "guests" | "rsvps" | "wishes"] });
    }

    if (action === "set" && type) {
      const newStore = { ...currentStore, [type]: item };
      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: newStore[type as "guests" | "rsvps" | "wishes"] });
    }

    if (action === "delete" && type && item?.id) {
      const list = currentStore[type as "guests" | "rsvps" | "wishes"] || [];
      const updatedList = list.filter((i: any) => i.id !== item.id);
      const newStore = { ...currentStore, [type]: updatedList };

      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: newStore[type as "guests" | "rsvps" | "wishes"] });
    }

    if (action === "checkin") {
      const codeToMatch = (item?.code || item?.id || item?.name || "").toString().trim().toLowerCase();
      let matchedGuest: any = null;

      const guests = currentStore.guests || [];
      const updatedGuests = guests.map((g: any) => {
        const guestCode = (g.code || g.id || "").toString().trim().toLowerCase();
        const guestName = (g.name || "").toString().trim().toLowerCase();
        if (guestCode === codeToMatch || guestName === codeToMatch || (codeToMatch && guestCode.includes(codeToMatch))) {
          matchedGuest = {
            ...g,
            checkedIn: true,
            checkInTime: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            pax: item?.pax || g.pax || 1,
          };
          return matchedGuest;
        }
        return g;
      });

      if (!matchedGuest) {
        // Create new guest entry if scanned code wasn't pre-added
        matchedGuest = {
          id: Date.now().toString(),
          code: item?.code || `GUEST-${Date.now()}`,
          name: item?.name || item?.code || "Tamu Undangan",
          category: "Tamu General",
          template: "Formal",
          checkedIn: true,
          checkInTime: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          pax: item?.pax || 1,
          createdAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        };
        updatedGuests.unshift(matchedGuest);
      }

      // Also sync to RSVPs
      const rsvps = currentStore.rsvps || [];
      const existingRsvpIndex = rsvps.findIndex((r: any) => r.name?.toLowerCase() === matchedGuest.name?.toLowerCase());
      let updatedRsvps = [...rsvps];
      if (existingRsvpIndex >= 0) {
        updatedRsvps[existingRsvpIndex] = {
          ...updatedRsvps[existingRsvpIndex],
          status: "Hadir",
          checkedIn: true,
          checkInTime: matchedGuest.checkInTime,
          pax: matchedGuest.pax,
        };
      } else {
        updatedRsvps.unshift({
          id: Date.now().toString(),
          name: matchedGuest.name,
          status: "Hadir",
          checkedIn: true,
          checkInTime: matchedGuest.checkInTime,
          pax: matchedGuest.pax,
          notes: "Checked-In via Scanner Barcode",
          createdAt: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        });
      }

      const newStore = { ...currentStore, guests: updatedGuests, rsvps: updatedRsvps };
      await saveToExternalCloud(newStore);

      return NextResponse.json({
        success: true,
        message: `✓ Check-in Berhasil! ${matchedGuest.name}`,
        guest: matchedGuest,
        guests: updatedGuests,
        rsvps: updatedRsvps,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action or type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Cloud DB Error" }, { status: 500 });
  }
}
