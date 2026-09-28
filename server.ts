import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/generate-card', async (req, res) => {
  try {
    const { prompt, referenceImage } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const parts: any[] = [];

    if (referenceImage && typeof referenceImage === 'string') {
      let mimeType = 'image/jpeg';
      let data = referenceImage;
      if (referenceImage.startsWith('data:')) {
        const matches = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          data = matches[2];
        }
      }
      parts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    parts.push({
      text: prompt,
    });

    // Nano Banana model call: gemini-3.1-flash-lite-image -> gemini-3.1-flash-image -> gemini-3-pro-image
    let response;
    const modelCandidates = [
      'gemini-3.1-flash-lite-image',
      'gemini-3.1-flash-image',
      'gemini-3-pro-image',
    ];

    let lastError: any = null;
    for (const modelName of modelCandidates) {
      try {
        console.log(`[Nano Banana] Attempting generation with model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts,
          },
          config: {
            imageConfig: {
              aspectRatio: '3:4',
            },
          },
        });
        if (response?.candidates?.[0]?.content?.parts?.some((p: any) => p.inlineData?.data)) {
          break;
        }
      } catch (err: any) {
        console.warn(`[Nano Banana] ${modelName} failed:`, err?.message);
        lastError = err;
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    let generatedImageUrl: string | null = null;
    let textFeedback: string | null = null;

    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          textFeedback = part.text;
        }
      }
    }

    if (!generatedImageUrl) {
      return res.status(500).json({
        error: 'Nano Banana tidak mengembalikan gambar.',
        details: textFeedback || 'No image part returned',
      });
    }

    return res.json({ imageUrl: generatedImageUrl });
  } catch (error: any) {
    console.error('Error generating card image:', error);
    return res.status(500).json({
      error: error.message || 'Gagal membuat gambar dengan Nano Banana',
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
