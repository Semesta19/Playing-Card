import OpenAI, { toFile } from "openai";
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Vercel membatasi body ~4.5MB, jadi 6mb sudah lebih dari cukup
app.use(express.json({ limit: '6mb' }));

// Kunci ke server resmi OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

// Model bisa diganti lewat env var tanpa edit kode
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

// Ukuran gambar (potret)
const CARD_SIZE = "1024x1536";

// ===== PEMBATASAN PEMAKAIAN (atur lewat env var) =====
// Maks. kartu per IP per hari
const DAILY_LIMIT_PER_IP = Number(process.env.DAILY_LIMIT_PER_IP) || 3;
// Batas total per hari untuk SEMUA pengguna (pengaman biaya)
const DAILY_GLOBAL_LIMIT = Number(process.env.DAILY_GLOBAL_LIMIT) || 300;
// Kuota reset setiap hari pukul 00.01 pada zona waktu ini.
// Default WIB = UTC+7. (WITA = 8, WIT = 9)
const RESET_UTC_OFFSET_HOURS = (() => {
  const raw = process.env.RESET_UTC_OFFSET_HOURS;
  return raw !== undefined && raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : 7;
})();
const RESET_LABEL = process.env.RESET_LABEL || '00.01 WIB';
// Batas ukuran input
const MAX_PROMPT_CHARS = 8000;
const MAX_IMAGE_DATAURL_CHARS = 5_500_000;

// Opsional: Redis (Upstash) agar hitungan bersama antar instance Vercel.
// Tanpa ini, hitungan hanya di memori (cukup baik tapi tidak sempurna di serverless).
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Opsional: daftar origin yang diizinkan, pisahkan dengan koma
// contoh: https://playing-card-lac.vercel.app,https://domainku.com
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Foto = acuan IDENTITAS saja. Sudut kepala, tilt, dan ekspresi bebas mengikuti pose.
const FACE_LOCK_PREFIX = `
IDENTITY PRESERVATION (highest priority):
The input image is a reference photo of a real person, used ONLY to define WHO the person is.
The face of the person on the playing card MUST be the same individual: keep the same facial structure, face shape, eyes, eyebrows, nose, lips, skin tone, hairstyle/hairline, and any facial hair or glasses. Do NOT beautify, age, slim, or change the ethnicity of the face.
Do NOT copy the photo's head angle, head tilt, expression, framing, lighting, or clothing. Redraw the same person in the requested pose: head angle, tilt, gaze and expression may differ from the photo, while the identity stays exactly the same and clearly recognizable.
Only the costume, pose, crown, background, ornaments, and card layout follow the design below.

CARD DESIGN:
`.trim();

// ---------- Hari kuota: berganti tepat pukul 00.01 ----------
interface QuotaDay {
  dayKey: string; // penanda hari kuota, mis. "2026-09-30"
  resetAtMs: number; // kapan kuota berikutnya reset (epoch ms)
  secondsToReset: number;
}

/**
 * Hari kuota berganti pukul 00.01 (bukan 00.00).
 * Caranya: geser waktu sesuai zona, lalu kurangi 1 menit sebelum menentukan tanggal.
 */
function getQuotaDay(now = Date.now()): QuotaDay {
  const shifted = now + RESET_UTC_OFFSET_HOURS * 3600_000 - 60_000;
  const dayStartShifted = Math.floor(shifted / 86_400_000) * 86_400_000;
  const dayKey = new Date(dayStartShifted).toISOString().slice(0, 10);
  const resetAtMs = dayStartShifted + 86_400_000 + 60_000 - RESET_UTC_OFFSET_HOURS * 3600_000;
  return {
    dayKey,
    resetAtMs,
    secondsToReset: Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
  };
}

function humanTimeLeft(seconds: number): string {
  const totalMin = Math.max(1, Math.ceil(seconds / 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
}

// ---------- Penghitung (Redis bila tersedia, kalau tidak memori) ----------
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function hitMemory(key: string, ttlSec: number): number {
  const now = Date.now();

  // Bersihkan entri kedaluwarsa agar memori tidak membengkak
  if (memoryStore.size > 5000) {
    for (const [k, v] of memoryStore) {
      if (v.resetAt <= now) memoryStore.delete(k);
    }
  }

  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + ttlSec * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

function peekMemory(key: string): number {
  const entry = memoryStore.get(key);
  return entry && entry.resetAt > Date.now() ? entry.count : 0;
}

function unhitMemory(key: string) {
  const entry = memoryStore.get(key);
  if (entry && entry.count > 0) entry.count -= 1;
}

async function redisPipeline(commands: Array<Array<string>>): Promise<Array<{ result?: any; error?: string }>> {
  const response = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!response.ok) throw new Error(`Redis HTTP ${response.status}`);
  const out = (await response.json()) as Array<{ result?: any; error?: string }>;
  if (!Array.isArray(out) || out.some((o) => o.error)) throw new Error('Redis response tidak valid');
  return out;
}

const useRedis = () => Boolean(REDIS_URL && REDIS_TOKEN);

/** Tambah hitungan, kembalikan jumlah terbaru */
async function hit(key: string, ttlSec: number): Promise<number> {
  if (useRedis()) {
    try {
      const out = await redisPipeline([
        ['INCR', key],
        ['EXPIRE', key, String(ttlSec + 300), 'NX'],
      ]);
      if (typeof out[0]?.result === 'number') return out[0].result;
    } catch (err) {
      console.error('[Quota] Redis gagal, fallback ke memori:', err);
    }
  }
  return hitMemory(key, ttlSec);
}

/** Lihat hitungan saat ini tanpa menambah */
async function peek(key: string): Promise<number> {
  if (useRedis()) {
    try {
      const out = await redisPipeline([['GET', key]]);
      const v = out[0]?.result;
      return v == null ? 0 : Number(v) || 0;
    } catch (err) {
      console.error('[Quota] Redis gagal, fallback ke memori:', err);
    }
  }
  return peekMemory(key);
}

/** Kembalikan 1 hitungan (dipakai saat pembuatan gambar gagal) */
async function unhit(key: string) {
  if (useRedis()) {
    try {
      const out = await redisPipeline([['DECR', key]]);
      const v = out[0]?.result;
      if (typeof v === 'number' && v < 0) await redisPipeline([['SET', key, '0', 'KEEPTTL']]);
      return;
    } catch (err) {
      console.error('[Quota] Redis gagal, fallback ke memori:', err);
    }
  }
  unhitMemory(key);
}

// ---------- Middleware ----------
function getClientIp(req: Request): string {
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const fwd = req.headers['x-forwarded-for'];

  const pick = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v)?.split(',')[0].trim();

  return pick(vercelIp) || pick(realIp) || pick(fwd) || req.socket.remoteAddress || 'unknown';
}

const ipKey = (ip: string, dayKey: string) => `quota:ip:${ip}:${dayKey}`;
const globalKey = (dayKey: string) => `quota:global:${dayKey}`;

// Tolak permintaan dari situs lain. Ini hanya penghalang tambahan,
// perlindungan utamanya tetap kuota + batas biaya di dashboard OpenAI.
function originGuard(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (!origin) return next(); // curl/server-to-server: diserahkan ke kuota

  try {
    const originHost = new URL(origin).host;
    const sameHost = originHost === req.headers.host;
    const allowed = ALLOWED_ORIGINS.includes(origin);
    if (sameHost || allowed) return next();
  } catch {
    // origin tidak valid -> jatuh ke penolakan
  }
  return res.status(403).json({ error: 'Permintaan dari sumber ini tidak diizinkan.' });
}

// Validasi input SEBELUM dihitung ke kuota
function validateBody(req: Request, res: Response, next: NextFunction) {
  const { prompt, referenceImage } = (req.body || {}) as {
    prompt?: unknown;
    referenceImage?: unknown;
  };

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return res.status(400).json({ error: 'Prompt terlalu panjang.' });
  }
  if (referenceImage != null) {
    if (typeof referenceImage !== 'string') {
      return res.status(400).json({ error: 'Format foto tidak valid.' });
    }
    if (referenceImage.length > MAX_IMAGE_DATAURL_CHARS) {
      return res.status(413).json({ error: 'Ukuran foto terlalu besar. Coba foto lain yang lebih kecil.' });
    }
  }
  next();
}

async function enforceQuota(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = getClientIp(req);
    const day = getQuotaDay();
    const perIpKey = ipKey(ip, day.dayKey);

    // 1) Batas per IP per hari
    const count = await hit(perIpKey, day.secondsToReset);
    res.setHeader('X-RateLimit-Limit', String(DAILY_LIMIT_PER_IP));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, DAILY_LIMIT_PER_IP - count)));

    if (count > DAILY_LIMIT_PER_IP) {
      await unhit(perIpKey); // permintaan yang ditolak tidak boleh menambah hitungan
      res.setHeader('Retry-After', String(day.secondsToReset));
      return res.status(429).json({
        code: 'QUOTA_EXCEEDED',
        error: `Kuota harian habis (maks. ${DAILY_LIMIT_PER_IP} kartu per hari). Kuota akan reset pada pukul ${RESET_LABEL} (sekitar ${humanTimeLeft(day.secondsToReset)} lagi).`,
        limit: DAILY_LIMIT_PER_IP,
        remaining: 0,
        resetAt: new Date(day.resetAtMs).toISOString(),
        resetLabel: RESET_LABEL,
      });
    }

    // 2) Batas total harian (pengaman biaya untuk semua pengguna)
    const gKey = globalKey(day.dayKey);
    const gCount = await hit(gKey, day.secondsToReset);
    if (gCount > DAILY_GLOBAL_LIMIT) {
      await unhit(gKey);
      await unhit(perIpKey);
      res.setHeader('Retry-After', String(day.secondsToReset));
      return res.status(429).json({
        code: 'GLOBAL_QUOTA_EXCEEDED',
        error: `Kuota harian aplikasi sudah habis. Silakan coba lagi setelah pukul ${RESET_LABEL}.`,
      });
    }

    // Simpan kunci untuk pengembalian kuota bila pembuatan gambar gagal
    res.locals.quotaKeys = [perIpKey, gKey];
    next();
  } catch (err) {
    // Kegagalan penghitung tidak boleh mematikan fitur utama
    console.error('[Quota] error tak terduga:', err);
    next();
  }
}

// Ubah data URL base64 menjadi Buffer + mime type
function parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), buffer: Buffer.from(match[2], 'base64') };
}

// Cek sisa kuota tanpa memakainya (dipakai UI untuk menampilkan "sisa kuota")
app.get('/api/quota', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const day = getQuotaDay();
    const used = await peek(ipKey(ip, day.dayKey));
    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      limit: DAILY_LIMIT_PER_IP,
      used: Math.min(used, DAILY_LIMIT_PER_IP),
      remaining: Math.max(0, DAILY_LIMIT_PER_IP - used),
      resetAt: new Date(day.resetAtMs).toISOString(),
      resetLabel: RESET_LABEL,
    });
  } catch (err) {
    console.error('[Quota] gagal membaca kuota:', err);
    return res.status(500).json({ error: 'Gagal membaca kuota.' });
  }
});

app.post('/api/generate-card', originGuard, validateBody, enforceQuota, async (req, res) => {
  let success = false;
  try {
    const { prompt, referenceImage } = req.body as {
      prompt: string;
      referenceImage?: string | null;
    };

    let response;

    if (referenceImage) {
      // ===== MODE DENGAN FOTO REFERENSI: pakai images.edit =====
      const parsed = parseDataUrl(referenceImage);
      if (!parsed) {
        return res.status(400).json({
          error: 'Format foto tidak valid. Gunakan JPG, PNG, atau WEBP.',
        });
      }

      const ext = parsed.mime.includes('png') ? 'png' : parsed.mime.includes('webp') ? 'webp' : 'jpg';
      const imageFile = await toFile(parsed.buffer, `reference.${ext}`, { type: parsed.mime });

      console.log(`[Image API] Edit mode with reference photo, model=${IMAGE_MODEL}`);

      const editParams: any = {
        model: IMAGE_MODEL,
        image: imageFile,
        prompt: `${FACE_LOCK_PREFIX}\n${prompt}`,
        n: 1,
        size: CARD_SIZE,
      };

      // Opsional. Catatan: gpt-image-2 mengabaikan parameter ini.
      if (process.env.OPENAI_INPUT_FIDELITY) {
        editParams.input_fidelity = process.env.OPENAI_INPUT_FIDELITY;
      }

      response = await openai.images.edit(editParams);
    } else {
      // ===== MODE TANPA FOTO: generate biasa =====
      console.log(`[Image API] Generate mode (no reference), model=${IMAGE_MODEL}`);
      response = await openai.images.generate({
        model: IMAGE_MODEL,
        prompt,
        n: 1,
        size: CARD_SIZE,
      } as any);
    }

    const data = response.data?.[0];
    if (!data) {
      return res.status(500).json({ error: 'API tidak mengembalikan data.' });
    }

    let generatedImageUrl = '';

    // Tangani format Base64 maupun URL
    if (data.b64_json) {
      generatedImageUrl = `data:image/png;base64,${data.b64_json}`;
    } else if (data.url) {
      const imageFetch = await fetch(data.url);
      const arrayBuffer = await imageFetch.arrayBuffer();
      generatedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
    } else {
      return res.status(500).json({ error: 'Format tidak dikenali.' });
    }

    success = true;
    return res.json({ imageUrl: generatedImageUrl });
  } catch (error: any) {
    console.error('Error API:', error);
    return res.status(error?.status || 500).json({
      error: error?.message || 'Gagal memproses gambar',
    });
  } finally {
    // Gagal membuat kartu = kuota pengguna tidak terpakai
    if (!success) {
      const keys: string[] = res.locals.quotaKeys || [];
      await Promise.all(keys.map((k) => unhit(k)));
    }
  }
});

// Penanganan error umum (mis. body terlalu besar) agar selalu berupa JSON
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Ukuran foto terlalu besar. Coba foto lain yang lebih kecil.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Permintaan tidak valid.' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

// Mount Vite middleware HANYA saat development lokal
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

// Jalankan listener HANYA jika BUKAN di serverless Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;