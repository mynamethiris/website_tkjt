import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { db } from "./src/server/secure_db.js";
import { getSupabase } from "./src/server/supabase.js";

// Students dibaca dari JSON saat runtime (tidak di-bundle ke server.cjs)
const studentsPath = path.join(process.cwd(), "data", "students.json");
const students = JSON.parse(fs.readFileSync(studentsPath, "utf-8"));

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

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
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
      configured: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
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

    const adminUser = (process.env.ADMIN_USER || "guru").toLowerCase();
    const adminPass = process.env.ADMIN_PASS || "tkjt";
    const guestUser = (process.env.GUEST_USER || "tamu").toLowerCase();
    const guestPass = process.env.GUEST_PASS || "tkjt";

    if (userLower === adminUser && passRaw === adminPass) {
      return res.json({ success: true, role: "admin", username: adminUser });
    }
    if (userLower === guestUser && passRaw === guestPass) {
      return res.json({ success: true, role: "tamu", username: guestUser });
    }

    // Cek akun piket dari localStorage client (tetap client-side untuk akun piket)
    return res.status(401).json({ error: "Kombinasi nama pengguna atau kata sandi tidak valid" });
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
    try {
      const { galleryItems } = req.body;
      if (!galleryItems) {
        return res
          .status(400)
          .json({ error: "Data galeri tidak lengkap" });
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
            picketAccounts: stripMeta(accounts),
            picketReports: stripMeta(reports),
          });
        }
      }
      res.json({
        picketGroups: db.getPicketGroups(),
        picketAccounts: db.getPicketAccounts(),
        picketReports: db.getPicketReports(),
      });
    } catch {
      res.json({
        picketGroups: db.getPicketGroups(),
        picketAccounts: db.getPicketAccounts(),
        picketReports: db.getPicketReports(),
      });
    }
  });

  // Fungsi simpan data piket
  app.post("/api/picket", async (req, res) => {
    try {
      const { picketGroups, picketAccounts, picketReports } = req.body;

      if (picketGroups) db.setPicketGroups(picketGroups);
      if (picketAccounts) db.setPicketAccounts(picketAccounts);
      if (picketReports) db.setPicketReports(picketReports);

      if (supabase) {
        try {
          if (picketGroups) await syncTable("tkjt_picket_groups", picketGroups);
          if (picketAccounts)
            await syncTable("tkjt_picket_accounts", picketAccounts);
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
