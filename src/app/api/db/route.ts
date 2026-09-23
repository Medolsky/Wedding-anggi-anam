import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";

import fs from "fs";
import path from "path";
import initialGuests from "@/data/initialGuests.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
} = (globalThis as any).__weddingStore || {
  guests: initialGuests || [],
  config: {
    customServerUrl: "",
    provider: "fonnte",
    waToken: "",
  },
  rsvps: [],
  wishes: [],
};
if (!cloudStore.guests || cloudStore.guests.length === 0) {
  cloudStore.guests = (initialGuests as any[]) || [];
}
(globalThis as any).__weddingStore = cloudStore;

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
          id: r.id,
          name: r.name,
          phone: r.phone || "",
          guestCount: r.pax || 1,
          pax: r.pax || 1,
          status: r.status || "Hadir",
          attendance: r.status || "Hadir",
          session: r.notes || "Akad & Resepsi",
          notes: r.notes || "",
          checkedIn: r.checked_in,
          checkInTime: r.check_in_time,
          createdAt: r.created_at
            ? new Date(r.created_at).toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }) + " WIB"
            : r.createdAt || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
        }));
      }
      if (Array.isArray(wishes)) {
        cloudStore.wishes = wishes.map((w: any) => ({
          id: w.id,
          name: w.name,
          message: w.message,
          relationship: w.relationship || "Kerabat",
          is_approved: w.is_approved !== false,
          createdAt: w.created_at
            ? new Date(w.created_at).toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }) + " WIB"
            : w.createdAt || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
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

  // Persist to local JSON file
  try {
    const filePath = path.join(process.cwd(), "src/data/initialGuests.json");
    if (updatedStore.guests && Array.isArray(updatedStore.guests)) {
      fs.writeFileSync(filePath, JSON.stringify(updatedStore.guests, null, 2));
    }
  } catch {}

  // 1. Save to Vercel Postgres / Neon if configured
  if (sql) {
    try {
      await initPostgresTables();

      if (updatedStore.guests) {
        const guestIds = updatedStore.guests.map((g: any) => String(g.id || "")).filter(Boolean);
        if (guestIds.length > 0) {
          for (const g of updatedStore.guests) {
            await sql`
              INSERT INTO guests (id, code, name, phone, category, template, status, checked_in, check_in_time, pax)
              VALUES (${g.id || Date.now().toString()}, ${g.code || g.name || g.id}, ${g.name}, ${g.phone || null}, ${g.category || "Tamu VIP"}, ${g.template || "Formal"}, ${g.status || "pending"}, ${!!g.checkedIn}, ${g.checkInTime || null}, ${g.pax || 1})
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
          // Remove orphan guests that were deleted
          try {
            const allPg = await sql`SELECT id FROM guests`;
            if (Array.isArray(allPg)) {
              const activeSet = new Set(guestIds);
              const orphans = allPg.map((r: any) => String(r.id)).filter((id: string) => !activeSet.has(id));
              for (const oId of orphans) {
                await sql`DELETE FROM guests WHERE id = ${oId}`;
              }
            }
          } catch {}
        } else {
          await sql`TRUNCATE TABLE guests`;
        }
      }

      if (updatedStore.rsvps) {
        const rsvpIds = updatedStore.rsvps.map((r: any) => String(r.id || "")).filter(Boolean);
        if (rsvpIds.length > 0) {
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
        } else {
          await sql`TRUNCATE TABLE rsvps`;
        }
      }

      if (updatedStore.wishes) {
        const wishIds = updatedStore.wishes.map((w: any) => String(w.id || "")).filter(Boolean);
        if (wishIds.length > 0) {
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
        } else {
          await sql`TRUNCATE TABLE wishes`;
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
        if (updatedStore.guests.length === 0) {
          await supabase.from("guests").delete().neq("id", "___dummy___");
        } else {
          const sqlGuests = updatedStore.guests.map((g: any) => ({
            id: String(g.id || Date.now()),
            code: g.code || g.name || g.id,
            name: g.name,
            phone: g.phone || null,
            category: g.category || "Tamu VIP",
            template: g.template || "Standar",
            status: g.status || "pending",
            checked_in: !!g.checkedIn,
            check_in_time: g.checkInTime || null,
            pax: g.pax || 1,
          }));
          const { error: guestErr } = await supabase.from("guests").upsert(sqlGuests);
          if (guestErr) console.error("Supabase Save Guests Error:", guestErr);

          // Synchronize/delete orphan guests in Supabase that are no longer in updatedStore.guests
          try {
            const { data: existingRows } = await supabase.from("guests").select("id");
            if (Array.isArray(existingRows)) {
              const activeIdSet = new Set(sqlGuests.map((g: any) => String(g.id)));
              const orphanIds = existingRows.map((r: any) => String(r.id)).filter((id: string) => !activeIdSet.has(id));
              for (const orphanId of orphanIds) {
                await supabase.from("guests").delete().eq("id", orphanId);
              }
            }
          } catch (delErr) {
            console.error("Supabase orphan guests deletion error:", delErr);
          }
        }
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

async function saveSingleCheckInToCloud(matchedGuest: any, matchedRsvp: any, updatedStore: any) {
  cloudStore = updatedStore;
  (globalThis as any).__weddingStore = updatedStore;

  // 1. Save targeted single guest & rsvp to Vercel Postgres / Neon
  if (sql) {
    try {
      await initPostgresTables();
      if (matchedGuest) {
        await sql`
          INSERT INTO guests (id, code, name, phone, category, template, status, checked_in, check_in_time, pax)
          VALUES (${matchedGuest.id || Date.now().toString()}, ${matchedGuest.code || matchedGuest.name || matchedGuest.id}, ${matchedGuest.name}, ${matchedGuest.phone || null}, ${matchedGuest.category || "Tamu VIP"}, ${matchedGuest.template || "Formal"}, ${matchedGuest.status || "pending"}, ${!!matchedGuest.checkedIn}, ${matchedGuest.checkInTime || null}, ${matchedGuest.pax || 1})
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
      if (matchedRsvp) {
        await sql`
          INSERT INTO rsvps (id, name, status, pax, notes, checked_in, check_in_time)
          VALUES (${matchedRsvp.id || Date.now().toString()}, ${matchedRsvp.name}, ${matchedRsvp.status || matchedRsvp.attendance || "Hadir"}, ${matchedRsvp.pax || matchedRsvp.guestCount || 1}, ${matchedRsvp.notes || ""}, ${!!matchedRsvp.checkedIn}, ${matchedRsvp.checkInTime || null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            status = EXCLUDED.status,
            pax = EXCLUDED.pax,
            notes = EXCLUDED.notes,
            checked_in = EXCLUDED.checked_in,
            check_in_time = EXCLUDED.check_in_time;
        `;
      }
    } catch (err) {
      console.error("Vercel Postgres single check-in save exception:", err);
    }
  }

  // 2. Save to Google Apps Script asynchronously
  if (GOOGLE_SCRIPT_URL) {
    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", data: updatedStore }),
      redirect: "follow",
    }).catch((err) => console.error("Google Script single save exception:", err));
  }

  // 3. Save targeted single guest & rsvp to Supabase
  if (supabase) {
    try {
      if (matchedGuest) {
        await supabase.from("guests").upsert([{
          id: matchedGuest.id || Date.now().toString(),
          code: matchedGuest.code || matchedGuest.name || matchedGuest.id,
          name: matchedGuest.name,
          phone: matchedGuest.phone || null,
          category: matchedGuest.category || "Tamu VIP",
          template: matchedGuest.template || "Formal",
          status: matchedGuest.status || "pending",
          checked_in: !!matchedGuest.checkedIn,
          check_in_time: matchedGuest.checkInTime || null,
          pax: matchedGuest.pax || 1,
        }]);
      }
      if (matchedRsvp) {
        await supabase.from("rsvps").upsert([{
          id: matchedRsvp.id || Date.now().toString(),
          name: matchedRsvp.name,
          status: matchedRsvp.status || "Hadir",
          pax: matchedRsvp.pax || 1,
          notes: matchedRsvp.notes || "",
          checked_in: !!matchedRsvp.checkedIn,
          check_in_time: matchedRsvp.checkInTime || null,
        }]);
      }
    } catch (err) {
      console.error("Supabase single check-in save exception:", err);
    }
  }

  // 4. Save to JSONBin asynchronously
  if (JSONBIN_BIN_ID && JSONBIN_API_KEY) {
    fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY,
      },
      body: JSON.stringify(updatedStore),
    }).catch(() => {});
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

  if (type === "verify") {
    const toParam = (searchParams.get("to") || searchParams.get("name") || "").trim();
    const codeParam = (searchParams.get("code") || "").trim();

    if (!toParam && !codeParam) {
      return NextResponse.json({
        success: true,
        valid: false,
        reason: "empty_query",
        message: "Silakan gunakan link undangan resmi yang telah dibagikan.",
      });
    }

    const guests = data.guests || [];
    if (guests.length === 0) {
      return NextResponse.json({
        success: true,
        valid: true,
        guest: { name: toParam || "Tamu Undangan" },
      });
    }

    const clean = (s: string) =>
      s
        .toLowerCase()
        .replace(/^yth\.?\s*/i, "")
        .replace(/^bapak\/ibu\s*/i, "")
        .replace(/^bpk\.?\s*/i, "")
        .replace(/^ibu\.?\s*/i, "")
        .replace(/^sdr\.?\s*/i, "")
        .replace(/\s*&\s*partner/i, "")
        .replace(/\s*&\s*pasangan/i, "")
        .replace(/\s*dan\s*keluarga/i, "")
        .replace(/[^a-z0-9]/g, "");

    const matched = guests.find((g: any) => {
      const gCode = String(g.code || g.id || "").trim().toLowerCase();
      const gName = String(g.name || "").trim().toLowerCase();
      const searchCode = codeParam.toLowerCase();
      const searchTo = toParam.toLowerCase();

      if (searchCode && (gCode === searchCode || gCode.includes(searchCode) || searchCode.includes(gCode))) {
        return true;
      }

      if (searchTo) {
        if (gName === searchTo) return true;
        if (
          clean(gName) &&
          clean(searchTo) &&
          (clean(gName) === clean(searchTo) ||
            clean(gName).includes(clean(searchTo)) ||
            clean(searchTo).includes(clean(gName)))
        ) {
          return true;
        }
      }

      return false;
    });

    if (matched) {
      return NextResponse.json({
        success: true,
        valid: true,
        guest: {
          id: matched.id,
          name: matched.name,
          code: matched.code || matched.id,
          category: matched.category || "Tamu VIP",
          pax: matched.pax || 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      valid: false,
      reason: "not_found",
      message: "Nama atau tautan tidak ditemukan dalam daftar tamu resmi.",
    });
  }

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

      cloudStore = newStore;
      (globalThis as any).__weddingStore = newStore;

      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: newStore[type as "guests" | "rsvps" | "wishes"] });
    }

    if (action === "set" && type) {
      const newStore = { ...currentStore, [type]: item };
      cloudStore = newStore;
      (globalThis as any).__weddingStore = newStore;

      if (Array.isArray(item) && item.length === 0) {
        if (sql) {
          try {
            if (type === "wishes") await sql`TRUNCATE TABLE wishes`;
            if (type === "guests") await sql`TRUNCATE TABLE guests`;
            if (type === "rsvps") await sql`TRUNCATE TABLE rsvps`;
          } catch (err) {
            console.error("Postgres truncate error:", err);
          }
        }
        if (supabase) {
          try {
            await supabase.from(type).delete().neq("id", "___dummy___");
          } catch {}
        }
      }

      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: newStore[type as "guests" | "rsvps" | "wishes"] });
    }

    if (action === "delete" && type && item) {
      const targetId = String(item.id || "").trim();
      const targetName = String(item.name || "").trim();
      const targetCode = String(item.code || "").trim();
      const targetMessage = String(item.message || "").trim();

      const list = currentStore[type as "guests" | "rsvps" | "wishes"] || [];
      const updatedList = list.filter((i: any) => {
        const rowId = String(i.id || "").trim();
        const rowName = String(i.name || "").trim();
        const rowCode = String(i.code || "").trim();
        const rowMsg = String(i.message || i.notes || "").trim();
        if (targetId && rowId === targetId) return false;
        if (targetCode && rowCode === targetCode) return false;
        if (targetName && targetMessage && rowName === targetName && rowMsg === targetMessage) return false;
        if (type === "guests" && targetName && rowName === targetName) return false;
        if (type === "rsvps" && targetName && rowName === targetName) return false;
        return true;
      });

      const newStore = { ...currentStore, [type]: updatedList };
      cloudStore = newStore;
      (globalThis as any).__weddingStore = newStore;

      if (sql) {
        try {
          if (type === "wishes") {
            if (targetId) await sql`DELETE FROM wishes WHERE id = ${targetId}`;
            if (targetName && targetMessage) await sql`DELETE FROM wishes WHERE name = ${targetName} AND message = ${targetMessage}`;
          }
          if (type === "guests") {
            if (targetId) await sql`DELETE FROM guests WHERE id = ${targetId}`;
            if (targetCode) await sql`DELETE FROM guests WHERE code = ${targetCode}`;
            if (targetName && !targetId) await sql`DELETE FROM guests WHERE name = ${targetName}`;
          }
          if (type === "rsvps") {
            if (targetId) await sql`DELETE FROM rsvps WHERE id = ${targetId}`;
            if (targetName && !targetId) await sql`DELETE FROM rsvps WHERE name = ${targetName}`;
          }
        } catch (err) {
          console.error("Postgres delete error:", err);
        }
      }

      if (supabase) {
        try {
          if (targetId) await supabase.from(type).delete().eq("id", targetId);
          if (type === "guests" && targetCode) {
            await supabase.from("guests").delete().eq("code", targetCode);
          }
          if (type === "guests" && targetName && !targetId) {
            await supabase.from("guests").delete().eq("name", targetName);
          }
          if (targetName && targetMessage && type === "wishes") {
            await supabase.from(type).delete().eq("name", targetName).eq("message", targetMessage);
          }
          if (type === "rsvps" && targetName && !targetId) {
            await supabase.from("rsvps").delete().eq("name", targetName);
          }
        } catch (err) {
          console.error("Supabase delete error:", err);
        }
      }

      await saveToExternalCloud(newStore);
      return NextResponse.json({ success: true, data: updatedList });
    }

    if (action === "checkin") {
      const rawCode = (item?.code || item?.id || item?.name || "").toString().trim();
      const codeToMatch = rawCode.toLowerCase();
      let wasAlreadyCheckedIn = false;
      let matchedGuest: any = null;

      const guests = currentStore.guests || [];
      const clean = (s: string) =>
        s
          .toLowerCase()
          .replace(/^yth\.?\s*/i, "")
          .replace(/^bapak\/ibu\s*/i, "")
          .replace(/^bpk\.?\s*/i, "")
          .replace(/^ibu\.?\s*/i, "")
          .replace(/^sdr\.?\s*/i, "")
          .replace(/\s*&\s*partner/i, "")
          .replace(/\s*&\s*pasangan/i, "")
          .replace(/\s*dan\s*keluarga/i, "")
          .replace(/[^a-z0-9]/g, "");

      const cleanSearch = clean(codeToMatch);

      const updatedGuests = guests.map((g: any) => {
        const guestCode = (g.code || g.id || "").toString().trim().toLowerCase();
        const guestName = (g.name || "").toString().trim().toLowerCase();
        const cleanGName = clean(guestName);
        const cleanGCode = clean(guestCode);

        const isMatch =
          guestCode === codeToMatch ||
          guestName === codeToMatch ||
          (cleanSearch && cleanGName && (cleanGName === cleanSearch || cleanGName.includes(cleanSearch) || cleanSearch.includes(cleanGName))) ||
          (cleanSearch && cleanGCode && (cleanGCode === cleanSearch || cleanGCode.includes(cleanSearch) || cleanSearch.includes(cleanGCode))) ||
          (codeToMatch && (guestCode.includes(codeToMatch) || codeToMatch.includes(guestCode)));

        if (isMatch) {
          if (g.checkedIn) {
            wasAlreadyCheckedIn = true;
            matchedGuest = g;
            return g;
          }
          matchedGuest = {
            ...g,
            checkedIn: true,
            checkInTime: new Date().toLocaleTimeString("id-ID", {
              timeZone: "Asia/Jakarta",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }) + " WIB",
            pax: item?.pax || g.pax || 1,
          };
          return matchedGuest;
        }
        return g;
      });

      // If guest is already checked in, return immediately without duplicate writes
      if (wasAlreadyCheckedIn && matchedGuest) {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          message: `⚠️ Tamu "${matchedGuest.name}" sudah check-in sebelumnya pada ${matchedGuest.checkInTime || "jam yang tercatat"}.`,
          guest: matchedGuest,
          guests: currentStore.guests,
          rsvps: currentStore.rsvps,
        });
      }

      if (!matchedGuest) {
        // Create new guest entry if scanned code wasn't pre-added
        const newCheckInTime = new Date().toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB";

        const assignedName = item?.name || item?.code || "Tamu Undangan";
        matchedGuest = {
          id: Date.now().toString(),
          code: assignedName,
          name: assignedName,
          category: "Tamu General",
          template: "Formal",
          checkedIn: true,
          checkInTime: newCheckInTime,
          pax: item?.pax || 1,
          createdAt: new Date().toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) + " WIB",
        };
        updatedGuests.unshift(matchedGuest);
      }

      // Sync and deduplicate RSVPs
      const rsvps = currentStore.rsvps || [];
      const cleanRsvps = rsvps.filter((r: any) => r.name?.trim().toLowerCase() !== matchedGuest.name?.trim().toLowerCase());
      const newRsvp = {
        id: String(matchedGuest.id || Date.now()),
        name: matchedGuest.name,
        status: "Hadir",
        checkedIn: true,
        checkInTime: matchedGuest.checkInTime,
        pax: matchedGuest.pax || 1,
        notes: "Checked-In via Scanner Barcode",
        createdAt: new Date().toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB",
      };
      const updatedRsvps = [newRsvp, ...cleanRsvps];

      const newStore = { ...currentStore, guests: updatedGuests, rsvps: updatedRsvps };
      
      // Perform ultra-fast single-item DB update instead of full-store multi-query loop
      await saveSingleCheckInToCloud(matchedGuest, newRsvp, newStore);

      return NextResponse.json({
        success: true,
        alreadyCheckedIn: false,
        message: `✓ Check-in Berhasil! Selamat Datang ${matchedGuest.name}`,
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
