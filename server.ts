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

// Inisialisasi OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate-card', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`[Image API] Generating image with prompt: ${prompt.substring(0, 50)}...`);

    // 1. Memanggil API tanpa parameter response_format yang bikin error
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({
        error: 'API tidak mengembalikan URL gambar.',
      });
    }

    // 2. Fetch URL gambar dan ubah ke base64 secara manual
    // Ini memastikan frontend tetap menerima data URI yang seragam
    const imageFetch = await fetch(imageUrl);
    const arrayBuffer = await imageFetch.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    // Format menjadi URL data (base64) yang siap ditampilkan di tag <img>
    const generatedImageUrl = `data:image/png;base64,${base64Data}`;

    return res.json({ imageUrl: generatedImageUrl });

  } catch (error: any) {
    console.error('Error generating card image with API:', error);
    return res.status(500).json({
      error: error.message || 'Gagal membuat gambar.',
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