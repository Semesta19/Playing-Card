import OpenAI from "openai";
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "30mb" }));

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not configured");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

app.post("/api/generate-card", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    console.log("[Image API] Generating image...");

    const response = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
      output_format: "png",
    });

    const image = response.data?.[0];

    if (!image?.b64_json) {
      console.error("Unexpected OpenAI response:", response);

      return res.status(500).json({
        error: "OpenAI tidak mengembalikan gambar.",
      });
    }

    const imageUrl = `data:image/png;base64,${image.b64_json}`;

    return res.json({
      imageUrl,
    });

  } catch (error: any) {
    console.error("[Image API Error]", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Gagal memproses gambar.",
    });
  }
});


// Vite hanya untuk development lokal
if (
  process.env.NODE_ENV !== "production" &&
  !process.env.VERCEL
) {
  const { createServer: createViteServer } = await import("vite");

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      host: "0.0.0.0",
      hmr: process.env.DISABLE_HMR !== "true",
      watch:
        process.env.DISABLE_HMR === "true"
          ? null
          : {},
    },
    appType: "spa",
  });

  app.use(vite.middlewares);
}


// Jalankan server hanya ketika lokal
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on http://0.0.0.0:${PORT}`
    );
  });
}

export default app;