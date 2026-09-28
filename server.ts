import OpenAI from "openai";
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

// KUNCI PAKSA KE SERVER RESMI OPENAI
// Ini akan mengabaikan URL nyasar/proxy yang mungkin nyangkut di Vercel
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1", // <-- Kunci paten di sini
});

app.post('/api/generate-card', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`[Image API] Generating image...`);

    // KUNCI PAKSA KE MODEL DALL-E-2
    const response = await openai.images.generate({
      model: "dall-e-2", // <-- Kunci paten di sini
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const data = response.data?.[0];

    if (!data) {
      return res.status(500).json({ error: 'API tidak mengembalikan data.' });
    }

    let generatedImageUrl = '';

    // Logika otomatis menangani format URL maupun Base64 dari API
    if (data.url) {
      const imageFetch = await fetch(data.url);
      const arrayBuffer = await imageFetch.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      generatedImageUrl = `data:image/png;base64,${base64Data}`;
    } else if (data.b64_json) {
      generatedImageUrl = `data:image/png;base64,${data.b64_json}`;
    } else {
      return res.status(500).json({ error: 'Format tidak dikenali.' });
    }

    return res.json({ imageUrl: generatedImageUrl });

  } catch (error: any) {
    console.error('Error API:', error);
    return res.status(500).json({
      error: error.message || 'Gagal memproses gambar',
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

// Jalankan listener port lokal HANYA jika BUKAN di serverless Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;