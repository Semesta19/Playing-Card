import OpenAI, { toFile } from "openai";
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));

// Kunci ke server resmi OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

// Model bisa diganti lewat env var tanpa edit kode
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

// Instruksi wajib supaya wajah mengikuti foto referensi
const FACE_LOCK_PREFIX = `
IDENTITY PRESERVATION (highest priority):
The input image is a reference photo of a real person. The face of the person on the playing card MUST be the same person as in the reference photo.
Keep exactly the same facial structure, face shape, eyes, eyebrows, nose, lips, skin tone, hairstyle/hairline, and any facial hair or glasses.
Do NOT beautify, age, slim, or change the ethnicity of the face. The face must be clearly recognizable as this exact person.
Only the costume, crown, background, ornaments, and card layout follow the design below.

CARD DESIGN:
`.trim();

// Ubah data URL base64 menjadi Buffer + mime type
function parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), buffer: Buffer.from(match[2], 'base64') };
}

app.post('/api/generate-card', async (req, res) => {
  try {
    const { prompt, referenceImage } = req.body as {
      prompt?: string;
      referenceImage?: string | null;
    };

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

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
        size: "1024x1024",
      };

      // Opsional: aktifkan hanya jika model Anda mendukung parameter ini
      // (mis. gpt-image-1). Set OPENAI_INPUT_FIDELITY=high di .env / Vercel.
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
        size: "1024x1024",
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

    return res.json({ imageUrl: generatedImageUrl });
  } catch (error: any) {
    console.error('Error API:', error);
    return res.status(error?.status || 500).json({
      error: error?.message || 'Gagal memproses gambar',
    });
  }
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