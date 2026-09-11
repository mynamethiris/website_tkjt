import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import crypto from "crypto";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { db } from "./src/server/secure_db.js";
import { getSupabase, supabaseConfigured } from "./src/server/supabase.js";
import {
  authConfigured,
  issueToken,
  requireWriteAccess,
  sessionFromRequest,
} from "./src/server/auth_token.js";
import {
  loadAccountsWithPins,
  preserveExistingPins,
  stripPins,
  verifyPin,
} from "./src/server/picket_store.js";

// Students dibaca dari JSON saat runtime (tidak di-bundle ke server.cjs)
const studentsPath = path.join(process.cwd(), "data", "students.json");
const students = JSON.parse(fs.readFileSync(studentsPath, "utf-8"));

// Perbandingan waktu-konstan untuk kredensial.
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function stripMeta(items: any[] | null): any[] {
  if (!items) return [];
  return items.map(({ created_at, updated_at, ...rest }) => rest);
}

async function supaQuery(promise: any, ms = 8000): Promise<any> {
  return Promise.race([
    promise,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error("supabase timeout")), ms),
    ),
  ]);
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const supabase = getSupabase();

  // Rate limiter sederhana untuk login
  // ponytail: rate limit in-memory per instance. Naik ke Redis kalau jalan multi-instance.
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  const MAX_ATTEMPTS = Number(process.env.AUTH_RATE_MAX || 5);
  const WINDOW_MS = Number(process.env.AUTH_RATE_WINDOW_MS || 60_000);

  app.use((req, res, next) => {
    if (req.method === "POST" && req.path.startsWith("/api/auth/")) {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const now = Date.now();
      const entry = loginAttempts.get(ip);
      if (!entry || now >= entry.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      } else {
        entry.count++;
        if (entry.count > MAX_ATTEMPTS) {
          return res.status(429).json({ error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." });
        }
      }
    }
    next();
  });

  const isDev = process.env.NODE_ENV !== "production";

  app.use(helmet({
    contentSecurityPolicy: isDev ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://docs.google.com"],
        connectSrc: ["'self'"],
      }
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({ origin: false }));
  app.use(express.json({ limit: "2mb" }));

  // Fungsi sinkronisasi awal ke Supabase (latar belakang, tidak blocking)
  if (supabase) {
    (async () => {
      console.log("--- Supabase Startup Sync Active ---");
      try {
        const syncPairs: [string, () => any[]][] = [
          ["tkjt_gallery", () => db.getGalleryItems()],
          ["tkjt_picket_groups", () => db.getPicketGroups()],
          ["tkjt_picket_accounts", () => db.getPicketAccounts()],
          ["tkjt_picket_reports", () => db.getPicketReports()],
          ["tkjt_inventory", () => db.getInventory()],
          ["tkjt_absensi", () => db.getAbsensi()],
          ["tkjt_bengkel_logs", () => db.getBengkelLogs()],
          ["tkjt_pencapaian", () => db.getPencapaian()],
        ];

        for (const [table, getItems] of syncPairs) {
          try {
            const items = getItems();
            if (items && items.length > 0) {
              const { error } = await supaQuery(
                supabase.from(table).upsert(items),
              );
              if (error) {
                console.error(
                  `Supabase startup ${table} sync error:`,
                  JSON.stringify(error),
                );
              } else {
                console.log(`Synced ${items.length} ${table} to Supabase.`);
              }
            }
          } catch (err) {
            console.error(
              `Supabase startup ${table} sync failed:`,
              err instanceof Error ? err.message : err,
            );
          }
        }
      } catch (err) {
        console.error(
          "Supabase startup sync aborted:",
          err instanceof Error ? err.message : err,
        );
      }
      console.log("------------------------------------");
    })().catch(() => {});
  }

  // Fungsi sinkronisasi dua arah tabel array lokal ↔ Supabase
  async function syncTable(tableName: string, items: any[]) {
    if (!supabase) return;
    try {
      const { data: existing, error: fetchError } = await supaQuery(
        supabase.from(tableName).select("id"),
      );

      if (fetchError) {
        console.error(
          `Supabase fetch error for ${tableName}:`,
          JSON.stringify(fetchError),
        );
        return;
      }

      const existingItems = existing || [];

      if (items && items.length > 0) {
        const payloadIds = new Set(items.map((x) => String(x.id)));
        const toDelete = existingItems
          .map((x) => x.id)
          .filter((id) => !payloadIds.has(String(id)));

        if (toDelete.length > 0) {
          const { error: deleteError } = await supaQuery(
            supabase.from(tableName).delete().in("id", toDelete),
          );

          if (deleteError) {
            console.error(
              `Supabase sync delete error for ${tableName}:`,
              JSON.stringify(deleteError),
            );
          }
        }

        const { error: upsertError } = await supaQuery(
          supabase.from(tableName).upsert(items),
        );

        if (upsertError) {
          console.error(
            `Supabase sync upsert error for ${tableName}:`,
            JSON.stringify(upsertError),
          );
        }
      } else {
        if (existingItems.length > 0) {
          const toDeleteAll = existingItems.map((x) => x.id);
          const { error: clearError } = await supaQuery(
            supabase.from(tableName).delete().in("id", toDeleteAll),
          );

          if (clearError) {
            console.error(
              `Supabase clear error for ${tableName}:`,
              JSON.stringify(clearError),
            );
          }
        }
      }
    } catch (err) {
      console.error(`Unexpected syncTable error for ${tableName}:`, err);
    }
  }

  // Fungsi status Supabase (redacted)
  app.get("/api/supabase-status", (_req, res) => {
    res.json({
      supabaseClientCreated: !!supabase,
      configured: supabaseConfigured(),
    });
  });

  // Endpoint autentikasi server-side
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password harus diisi" });
    }

    const userLower = String(username).trim().toLowerCase();
    const passRaw = String(password).trim();

    const adminUser = (process.env.ADMIN_USER || "").trim().toLowerCase();
    const adminPass = (process.env.ADMIN_PASS || "").trim();
    const guestUser = (process.env.GUEST_USER || "").trim().toLowerCase();
    const guestPass = (process.env.GUEST_PASS || "").trim();

    if (!adminUser || !adminPass) {
      return res.status(500).json({ error: "Admin credentials not configured on server" });
    }
    if (!authConfigured()) {
      return res.status(503).json({ error: "Server belum dikonfigurasi: AUTH_SECRET tidak diset" });
    }

    if (safeEqual(userLower, adminUser) && safeEqual(passRaw, adminPass)) {
      return res.json({
        success: true,
        role: "admin",
        username: adminUser,
        token: issueToken({ username: adminUser, role: "admin" }),
      });
    }
    if (
      guestUser &&
      guestPass &&
      safeEqual(userLower, guestUser) &&
      safeEqual(passRaw, guestPass)
    ) {
      return res.json({
        success: true,
        role: "tamu",
        username: guestUser,
        token: issueToken({ username: guestUser, role: "tamu" }),
      });
    }

    return res.status(401).json({ error: "Kombinasi nama pengguna atau kata sandi tidak valid" });
  });

  // Login akun piket & verifikasi PIN, keduanya server-side
  app.post("/api/auth/picket", async (req, res) => {
    if (!authConfigured()) {
      return res.status(503).json({ error: "Server belum dikonfigurasi: AUTH_SECRET tidak diset" });
    }

    const { action, username, pin, groupName } = req.body || {};
    const pinRaw = String(pin || "").trim();
    if (!pinRaw) {
      return res.status(400).json({ error: "PIN harus diisi" });
    }

    const accounts = await loadAccountsWithPins();

    if (action === "verify") {
      const group = String(groupName || "").trim();
      if (!group) {
        return res.status(400).json({ error: "Kelompok piket harus disebutkan" });
      }
      const account = accounts.find((a) => a.groupName === group);
      if (!account || typeof account.pin !== "string" || !account.pin) {
        return res.status(404).json({ error: "Akun piket kelompok ini belum dikonfigurasi" });
      }
      if (!verifyPin(pinRaw, account.pin)) {
        return res.status(401).json({ valid: false, error: "PIN Otorisasi salah" });
      }
      return res.json({ valid: true, ketuaPiket: account.ketuaPiket });
    }

    const userLower = String(username || "").trim().toLowerCase();
    if (!userLower) {
      return res.status(400).json({ error: "Username harus diisi" });
    }

    const account = accounts.find(
      (a) =>
        String(a.username || "").toLowerCase() === userLower &&
        typeof a.pin === "string" &&
        a.pin,
    );
    if (!account || !verifyPin(pinRaw, account.pin)) {
      return res.status(401).json({ error: "Kombinasi nama pengguna atau kata sandi tidak valid" });
    }

    const gName = account.groupName || "";
    let kelas = "TKJT 1";
    if (gName.includes("TKJT 2")) kelas = "TKJT 2";
    else if (gName.includes("TKJT 3")) kelas = "TKJT 3";
    const angkatan = gName.includes("Angkatan 9") || gName.includes("9") ? 9 : 8;

    return res.json({
      success: true,
      role: "piket",
      username: account.username,
      kelas,
      angkatan,
      token: issueToken({ username: account.username, role: "piket", kelas, angkatan }),
    });
  });

  // Fungsi ambil data galeri & siswa (students langsung dari data.ts)
  app.get("/api/data", async (_req, res) => {
    try {
      if (supabase) {
        const { data: galleryItems, error: galleryError } = await supaQuery(
          supabase
            .from("tkjt_gallery")
            .select("*")
            .order("id", { ascending: false }),
        );

        if (!galleryError && galleryItems) {
          return res.json({
            students,
            galleryItems: stripMeta(galleryItems),
          });
        }
      }
      res.json({ students, galleryItems: db.getGalleryItems() });
    } catch {
      res.json({ students, galleryItems: db.getGalleryItems() });
    }
  });

  // Fungsi simpan data galeri (students bersifat read-only dari data.ts)
  app.post("/api/data", async (req, res) => {
    if (!requireWriteAccess(req, res, ["admin"])) return;
    try {
      const { galleryItems } = req.body;
      if (!Array.isArray(galleryItems)) {
        return res
          .status(400)
          .json({ error: "Data galeri harus berupa array" });
      }

      db.setGalleryItems(galleryItems);

      if (supabase) {
        try {
          await syncTable("tkjt_gallery", galleryItems);
        } catch (err) {
          console.error("Supabase gallery upsert error:", err);
        }
      }

      res.json({ success: true, galleryItems });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Gagal menyimpan data" });
    }
  });

  // Fungsi ambil data piket
  app.get("/api/picket", async (_req, res) => {
    // Pin tidak pernah dikirim ke klien. Yang tersimpan adalah hash scrypt.
    const shape = (accounts: any[]) => stripPins(accounts);

    try {
      if (supabase) {
        const { data: groups, error: groupsErr } = await supaQuery(
          supabase.from("tkjt_picket_groups").select("*").order("id"),
        );
        const { data: accounts, error: accountsErr } = await supaQuery(
          supabase.from("tkjt_picket_accounts").select("*").order("id"),
        );
        const { data: reports, error: reportsErr } = await supaQuery(
          supabase.from("tkjt_picket_reports").select("*").order("id"),
        );

        if (
          !groupsErr &&
          !accountsErr &&
          !reportsErr &&
          groups &&
          accounts &&
          reports
        ) {
          return res.json({
            picketGroups: stripMeta(groups),
            picketAccounts: shape(stripMeta(accounts)),
            picketReports: stripMeta(reports),
          });
        }
      }
      res.json({
        picketGroups: db.getPicketGroups(),
        picketAccounts: shape(db.getPicketAccounts()),
        picketReports: db.getPicketReports(),
      });
    } catch {
      res.json({
        picketGroups: db.getPicketGroups(),
        picketAccounts: shape(db.getPicketAccounts()),
        picketReports: db.getPicketReports(),
      });
    }
  });

  // Fungsi simpan data piket
  app.post("/api/picket", async (req, res) => {
    const session = requireWriteAccess(req, res, ["admin", "piket"]);
    if (!session) return;
    try {
      const { picketGroups, picketAccounts, picketReports } = req.body;

      // Hanya admin boleh mengubah kelompok dan akun (termasuk pin).
      if ((picketGroups || picketAccounts) && session.role !== "admin") {
        return res.status(403).json({
          error: "Hanya admin yang boleh mengubah kelompok atau akun piket",
        });
      }

      if (picketGroups) db.setPicketGroups(picketGroups);
      let mergedAccounts: any[] | null = null;
      if (picketAccounts) {
        mergedAccounts = preserveExistingPins(picketAccounts, db.getPicketAccounts());
        db.setPicketAccounts(mergedAccounts);
      }
      if (picketReports) db.setPicketReports(picketReports);

      if (supabase) {
        try {
          if (picketGroups) await syncTable("tkjt_picket_groups", picketGroups);
          if (mergedAccounts)
            await syncTable("tkjt_picket_accounts", mergedAccounts);
          if (picketReports)
            await syncTable("tkjt_picket_reports", picketReports);
        } catch (err) {
          console.error("Supabase picket sync error:", err);
        }
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fungsi ambil data inventaris
  app.get("/api/inventory", async (_req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supaQuery(
          supabase.from("tkjt_inventory").select("*").order("id"),
        );

        if (!error && data) {
          return res.json(stripMeta(data));
        }
      }
      res.json(db.getInventory());
    } catch {
      res.json(db.getInventory());
    }
  });

  // Fungsi simpan data inventaris
  app.post("/api/inventory", async (req, res) => {
    if (!requireWriteAccess(req, res, ["admin", "piket"])) return;
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res
          .status(400)
          .json({ error: "Data inventaris harus berupa array" });
      }
      db.setInventory(items);

      if (supabase) {
        try {
          await syncTable("tkjt_inventory", items);
        } catch (err) {
          console.error("Supabase inventory sync error:", err);
        }
      }
      res.json({ success: true, inventory: items });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fungsi ambil data absensi TKJT
  app.get('/api/absensi', async (_req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supaQuery(
          supabase.from('tkjt_absensi').select('*').order('createdAt', { ascending: false }),
        );
        if (!error && data) {
          return res.json(stripMeta(data));
        }
      }
      res.json(db.getAbsensi());
    } catch {
      res.json(db.getAbsensi());
    }
  });

  // Fungsi simpan data absensi TKJT
  app.post('/api/absensi', async (req, res) => {
    if (!requireWriteAccess(req, res, ['admin', 'piket'])) return;
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Data absensi harus berupa array' });
      }
      db.setAbsensi(items);

      if (supabase) {
        try {
          await syncTable('tkjt_absensi', items);
        } catch (err) {
          console.error('Supabase absensi sync error:', err);
        }
      }
      res.json({ success: true, absensi: items });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fungsi ambil data log penggunaan bengkel
  app.get('/api/bengkel', async (_req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supaQuery(
          supabase.from('tkjt_bengkel_logs').select('*').order('createdAt', { ascending: false }),
        );
        if (!error && data) {
          return res.json(stripMeta(data));
        }
      }
      res.json(db.getBengkelLogs());
    } catch {
      res.json(db.getBengkelLogs());
    }
  });

  // Fungsi simpan data log penggunaan bengkel
  app.post('/api/bengkel', async (req, res) => {
    if (!requireWriteAccess(req, res, ['admin', 'piket'])) return;
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Data bengkel harus berupa array' });
      }
      db.setBengkelLogs(items);

      if (supabase) {
        try {
          await syncTable('tkjt_bengkel_logs', items);
        } catch (err) {
          console.error('Supabase bengkel sync error:', err);
        }
      }
      res.json({ success: true, bengkelLogs: items });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fungsi ambil data pencapaian TKJT
  app.get('/api/pencapaian', async (_req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supaQuery(
          supabase.from('tkjt_pencapaian').select('*').order('createdAt', { ascending: false }),
        );
        if (!error && data) {
          return res.json(stripMeta(data));
        }
      }
      res.json(db.getPencapaian());
    } catch {
      res.json(db.getPencapaian());
    }
  });

  // Fungsi simpan data pencapaian TKJT
  app.post('/api/pencapaian', async (req, res) => {
    if (!requireWriteAccess(req, res, ['admin'])) return;
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Data pencapaian harus berupa array' });
      }
      db.setPencapaian(items);

      if (supabase) {
        try {
          await syncTable('tkjt_pencapaian', items);
        } catch (err) {
          console.error('Supabase pencapaian sync error:', err);
        }
      }
      res.json({ success: true, pencapaian: items });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
