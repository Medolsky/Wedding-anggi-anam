import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";

/**
 * Universal Cloud Database API Route for Wedding Invitation App
 * Supports: Vercel Postgres / Neon, Google Sheets (Apps Script), Supabase SQL, and JSONBin.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

const sql = POSTGRES_URL ? neon(POSTGRES_URL) : null;
let isPostgresInitialized = false;

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
    customServerUrl: "",
    provider: "fonnte",
    waToken: "",
  },
  rsvps: [],
  wishes: [],
};

// Optional external free Cloud Database Integration (Google Sheets / JSONBin.io / Supabase / KV)
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

async function initPostgresTables() {
  if (!sql || isPostgresInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT NOT NULL,
        phone TEXT,
        category TEXT DEFAULT 'Tamu VIP',
        template TEXT DEFAULT 'Formal',
        status TEXT DEFAULT 'pending',
        checked_in BOOLEAN DEFAULT FALSE,
        check_in_time TEXT,
        pax INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS rsvps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'Hadir',
        pax INTEGER DEFAULT 1,
        session TEXT DEFAULT 'Sesi 1',
        notes TEXT,
        checked_in BOOLEAN DEFAULT FALSE,
        check_in_time TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS wishes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        relationship TEXT DEFAULT 'Kerabat',
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );
    `;
    isPostgresInitialized = true;
  } catch (err) {
    console.error("Postgres auto-init table error:", err);
  }
}

async function fetchFromExternalCloud() {
  // 1. Try Vercel Postgres / Neon if configured
  if (sql) {
    try {
      await initPostgresTables();
      const [guests, rsvps, wishes, configRows] = await Promise.all([
        sql`SELECT * FROM guests ORDER BY created_at DESC`,
        sql`SELECT * FROM rsvps ORDER BY created_at DESC`,
        sql`SELECT * FROM wishes ORDER BY created_at DESC`,
        sql`SELECT * FROM config WHERE key = 'bot_config' LIMIT 1`,
      ]);

      if (Array.isArray(guests)) {
        cloudStore.guests = guests.map((g: any) => ({
          ...g,
          checkedIn: g.checked_in,
          checkInTime: g.check_in_time,
        }));
      }
      if (Array.isArray(rsvps)) {
        cloudStore.rsvps = rsvps.map((r: any) => ({
          ...r,
          checkedIn: r.checked_in,
          checkInTime: r.check_in_time,
          guestCount: r.pax || 1,
          attendance: r.status || "Hadir",
        }));
      }
      if (Array.isArray(wishes)) {
        cloudStore.wishes = wishes.map((w: any) => ({
          ...w,
          is_approved: w.is_approved !== false,
        }));
      }
      if (Array.isArray(configRows) && configRows.length > 0 && configRows[0].value) {
        cloudStore.config = configRows[0].value;
      }

      return cloudStore;
    } catch (err) {
      console.error("Vercel Postgres fetch exception:", err);
    }
  }

  // 2. Try Google Apps Script (Google Sheets / Google Drive) if configured
  if (GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?type=all&t=${Date.now()}`, {
        redirect: "follow",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (Array.isArray(json.data.guests)) cloudStore.guests = json.data.guests;
          if (Array.isArray(json.data.rsvps)) cloudStore.rsvps = json.data.rsvps;
          if (Array.isArray(json.data.wishes)) cloudStore.wishes = json.data.wishes;
          if (json.data.config) cloudStore.config = json.data.config;
          return cloudStore;
        }
      }
    } catch (err) {
      console.error("Google Script fetch exception:", err);
    }
  }

  // 3. Try Supabase Cloud SQL if configured
  if (supabase) {
    try {
      const [guestsRes, rsvpsRes, wishesRes, configRes] = await Promise.all([
        supabase.from("guests").select("*").order("created_at", { ascending: false }),
        supabase.from("rsvps").select("*").order("created_at", { ascending: false }),
        supabase.from("wishes").select("*").order("created_at", { ascending: false }),
        supabase.from("config").select("*").eq("key", "bot_config").maybeSingle(),
      ]);

      if (guestsRes.error) console.error("Supabase Guests Error:", guestsRes.error);
      if (rsvpsRes.error) console.error("Supabase RSVPs Error:", rsvpsRes.error);
      if (wishesRes.error) console.error("Supabase Wishes Error:", wishesRes.error);

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
          guestCount: r.pax || 1,
          attendance: r.status || "Hadir",
        }));
      }
      if (!wishesRes.error && Array.isArray(wishesRes.data)) {
        cloudStore.wishes = wishesRes.data;
      }
      if (!configRes.error && configRes.data?.value) {
        cloudStore.config = configRes.data.value;
      }

      return cloudStore;
    } catch (err) {
      console.error("Supabase fetch exception:", err);
    }
  }

  // 4. Fallback to JSONBin if configured
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

  // 1. Save to Vercel Postgres / Neon if configured
  if (sql) {
    try {
      await initPostgresTables();

      if (updatedStore.guests) {
        for (const g of updatedStore.guests) {
          await sql`
            INSERT INTO guests (id, code, name, phone, category, template, status, checked_in, check_in_time, pax)
            VALUES (${g.id || Date.now().toString()}, ${g.code || `GUEST-${g.id}`}, ${g.name}, ${g.phone || null}, ${g.category || "Tamu VIP"}, ${g.template || "Formal"}, ${g.status || "pending"}, ${!!g.checkedIn}, ${g.checkInTime || null}, ${g.pax || 1})
            ON CONFLICT (id) DO UPDATE SET
              code = EXCLUDED.code,
              name = EXCLUDED.name,
              phone = EXCLUDED.phone,
              category = EXCLUDED.category,
              template = EXCLUDED.template,
              status = EXCLUDED.status,
              checked_in = EXCLUDED.checked_in,
              check_in_time = EXCLUDED.check_in_time,
              pax = EXCLUDED.pax;
          `;
        }
      }

      if (updatedStore.rsvps) {
        for (const r of updatedStore.rsvps) {
          await sql`
            INSERT INTO rsvps (id, name, status, pax, notes, checked_in, check_in_time)
            VALUES (${r.id || Date.now().toString()}, ${r.name}, ${r.status || r.attendance || "Hadir"}, ${r.pax || r.guestCount || 1}, ${r.notes || ""}, ${!!r.checkedIn}, ${r.checkInTime || null})
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              status = EXCLUDED.status,
              pax = EXCLUDED.pax,
              notes = EXCLUDED.notes,
              checked_in = EXCLUDED.checked_in,
              check_in_time = EXCLUDED.check_in_time;
          `;
        }
      }

      if (updatedStore.wishes) {
        for (const w of updatedStore.wishes) {
          await sql`
            INSERT INTO wishes (id, name, message, relationship, is_approved)
            VALUES (${w.id || Date.now().toString()}, ${w.name}, ${w.message || ""}, ${w.relationship || "Kerabat"}, ${w.is_approved !== false})
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              message = EXCLUDED.message,
              relationship = EXCLUDED.relationship,
              is_approved = EXCLUDED.is_approved;
          `;
        }
      }

      if (updatedStore.config) {
        await sql`
          INSERT INTO config (key, value)
          VALUES ('bot_config', ${JSON.stringify(updatedStore.config)})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
        `;
      }
    } catch (err) {
      console.error("Vercel Postgres save exception:", err);
    }
  }

  // 2. Save to Google Apps Script (Google Sheets / Google Drive) if configured
  if (GOOGLE_SCRIPT_URL) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", data: updatedStore }),
        redirect: "follow",
      });
    } catch (err) {
      console.error("Google Script save exception:", err);
    }
  }

  // 3. Save to Supabase Cloud SQL if configured
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
        const { error: guestErr } = await supabase.from("guests").upsert(sqlGuests);
        if (guestErr) console.error("Supabase Save Guests Error:", guestErr);
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

  // 4. Save to JSONBin if configured
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

  // Check if using persistent database
  const isUsingDB = !!POSTGRES_URL || !!GOOGLE_SCRIPT_URL || !!supabase || !!(JSONBIN_BIN_ID && JSONBIN_API_KEY);
  const provider = POSTGRES_URL
    ? "vercel_postgres"
    : GOOGLE_SCRIPT_URL
    ? "google_sheets"
    : supabase
    ? "supabase"
    : JSONBIN_BIN_ID
    ? "jsonbin"
    : "memory";

  if (type === "guests") return NextResponse.json({ success: true, data: data.guests, persistent: isUsingDB, provider });
  if (type === "rsvps") return NextResponse.json({ success: true, data: data.rsvps, persistent: isUsingDB, provider });
  if (type === "wishes") return NextResponse.json({ success: true, data: data.wishes, persistent: isUsingDB, provider });
  if (type === "config") return NextResponse.json({ success: true, data: data.config, persistent: isUsingDB, provider });

  return NextResponse.json({ success: true, data, persistent: isUsingDB, provider });
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
            checkInTime: new Date().toLocaleTimeString("id-ID", {
              timeZone: "Asia/Jakarta",
              hour: "2-digit",
              minute: "2-digit",
            }) + " WIB",
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
          checkInTime: new Date().toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB",
          pax: item?.pax || 1,
          createdAt: new Date().toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB",
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
