import OpenAI, { toFile } from "openai";
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
    const { prompt, image } = req.body;

    // ==============================
    // VALIDASI PROMPT
    // ==============================

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    // ==============================
    // VALIDASI IMAGE
    // ==============================

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Reference image is required",
      });
    }

    if (!image.startsWith("data:image/")) {
      return res.status(400).json({
        error: "Invalid image format",
      });
    }

    console.log("[Image API] Generating card...");
    console.log("[Image API] Reference image received");


    // ==============================
    // CONVERT BASE64 → FILE
    // ==============================

    const matches = image.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
    );

    if (!matches) {
      return res.status(400).json({
        error: "Invalid base64 image",
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const buffer = Buffer.from(base64Data, "base64");

    const extension =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
        ? "webp"
        : "jpg";

    const referenceImage = await toFile(
      buffer,
      `reference.${extension}`,
      {
        type: mimeType,
      }
    );


    // ==============================
    // GPT IMAGE 2
    // ==============================

    const response = await openai.images.edit({
      model: "gpt-image-2",

      image: referenceImage,

      prompt: prompt,

      size: "1024x1536",

      quality: "high",

      output_format: "png",
    });


    // ==============================
    // GET RESULT
    // ==============================

    const result = response.data?.[0];

    if (!result?.b64_json) {
      console.error(
        "[Image API] Unexpected response:",
        response
      );

      return res.status(500).json({
        error: "OpenAI tidak mengembalikan gambar.",
      });
    }


    const imageUrl =
      `data:image/png;base64,${result.b64_json}`;


    console.log("[Image API] Generation complete");


    return res.json({
      imageUrl,
    });

  } catch (error: any) {

    console.error(
      "[Image API Error]",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Gagal memproses gambar.",
    });
  }
});


// ==========================================
// VITE DEVELOPMENT
// ==========================================

if (
  process.env.NODE_ENV !== "production" &&
  !process.env.VERCEL
) {
  const { createServer: createViteServer } =
    await import("vite");

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      host: "0.0.0.0",

      hmr:
        process.env.DISABLE_HMR !== "true",

      watch:
        process.env.DISABLE_HMR === "true"
          ? null
          : {},
    },

    appType: "spa",
  });

  app.use(vite.middlewares);
}


// ==========================================
// LOCAL SERVER
// ==========================================

if (!process.env.VERCEL) {

  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `Server running on http://0.0.0.0:${PORT}`
      );
    }
  );
}

export default app;