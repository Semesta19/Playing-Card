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

    console.log(`[OpenAI Image] Generating image with prompt: ${prompt.substring(0, 50)}...`);

    // Memanggil API Image OpenAI (DALL-E 3)
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json", // Format base64 agar serasi dengan frontend
    });

    const b64Data = response.data?.[0]?.b64_json;

    if (!b64Data) {
      return res.status(500).json({
        error: 'OpenAI tidak mengembalikan gambar.',
      });
    }

    // Format output data URL base64 yang siap ditampilkan langsung di tag <img>
    const generatedImageUrl = `data:image/png;base64,${b64Data}`;

    return res.json({ imageUrl: generatedImageUrl });
  } catch (error: any) {
    console.error('Error generating card image with OpenAI:', error);
    return res.status(500).json({
      error: error.message || 'Gagal membuat gambar dengan OpenAI',
    });
  }
});

// Mount Vite middleware in development
if (process.env.NODE_ENV !== 'production') {
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
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});