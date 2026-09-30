/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { UploadBox } from './components/UploadBox';
import { CardSelect } from './components/CardSelect';
import { PlayingCardDisplay, PlayingCardDisplayRef } from './components/PlayingCardDisplay';
import { ActionToolbar } from './components/ActionToolbar';
import { PromptInspectorSheet } from './components/PromptInspectorSheet';
import {
  CARD_OPTIONS,
  constructCardPrompt,
  CUSTOM_TEXT_MAX_LENGTH,
} from './utils/promptBuilder';
import { CardOption } from './types';
import { Loader2, Code2, ChevronDown, RotateCcw } from 'lucide-react';

/**
 * Perkecil & kompres foto sebelum dikirim ke server.
 * Vercel membatasi body request ~4.5MB, jadi foto HP (base64) harus dikecilkan.
 */
const compressImage = (
  dataUrl: string,
  maxSize = 1024,
  quality = 0.88
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

/**
 * Auto-crop hasil AI: buang margin putih/transparan di sekeliling kartu,
 * lalu jadikan sudut membulat di luar kartu transparan.
 * Jika terjadi masalah apa pun, gambar asli dikembalikan apa adanya.
 */
const cropToCard = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const W = img.naturalWidth;
        const H = img.naturalHeight;

        const src = document.createElement('canvas');
        src.width = W;
        src.height = H;
        const sctx = src.getContext('2d', { willReadFrequently: true });
        if (!sctx) return resolve(dataUrl);
        sctx.drawImage(img, 0, 0);

        const { data } = sctx.getImageData(0, 0, W, H);

        // Piksel dianggap "latar" jika transparan atau hampir putih
        const BG_THRESHOLD = 244;
        const isBg = (i: number) =>
          data[i + 3] < 10 ||
          (data[i] >= BG_THRESHOLD &&
            data[i + 1] >= BG_THRESHOLD &&
            data[i + 2] >= BG_THRESHOLD);

        // Hitung jumlah piksel konten per baris & kolom (abaikan noise kecil)
        const rowCount = new Uint32Array(H);
        const colCount = new Uint32Array(W);
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (!isBg((y * W + x) * 4)) {
              rowCount[y]++;
              colCount[x]++;
            }
          }
        }

        const MIN_COUNT = 8;
        let top = 0;
        let bottom = H - 1;
        let left = 0;
        let right = W - 1;
        while (top < H && rowCount[top] < MIN_COUNT) top++;
        while (bottom > top && rowCount[bottom] < MIN_COUNT) bottom--;
        while (left < W && colCount[left] < MIN_COUNT) left++;
        while (right > left && colCount[right] < MIN_COUNT) right--;

        // Potong 1px ke dalam untuk membuang sisa anti-alias putih di tepi
        top += 1;
        left += 1;
        bottom -= 1;
        right -= 1;

        const cw = right - left + 1;
        const ch = bottom - top + 1;

        // Jika hasil deteksi tidak masuk akal, pakai gambar asli
        if (cw < W * 0.3 || ch < H * 0.3) return resolve(dataUrl);

        const out = document.createElement('canvas');
        out.width = cw;
        out.height = ch;
        const octx = out.getContext('2d', { willReadFrequently: true });
        if (!octx) return resolve(dataUrl);
        octx.drawImage(src, left, top, cw, ch, 0, 0, cw, ch);

        // Flood fill dari 4 sudut: latar putih di luar lengkung kartu -> transparan
        const outData = octx.getImageData(0, 0, cw, ch);
        const px = outData.data;
        const visited = new Uint8Array(cw * ch);
        const stack: number[] = [];

        const pushIfBg = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= cw || y >= ch) return;
          const idx = y * cw + x;
          if (visited[idx]) return;
          const i = idx * 4;
          if (
            px[i + 3] < 10 ||
            (px[i] >= BG_THRESHOLD && px[i + 1] >= BG_THRESHOLD && px[i + 2] >= BG_THRESHOLD)
          ) {
            visited[idx] = 1;
            stack.push(idx);
          }
        };

        pushIfBg(0, 0);
        pushIfBg(cw - 1, 0);
        pushIfBg(0, ch - 1);
        pushIfBg(cw - 1, ch - 1);

        while (stack.length) {
          const idx = stack.pop() as number;
          const x = idx % cw;
          const y = (idx - x) / cw;
          px[idx * 4 + 3] = 0; // jadikan transparan
          pushIfBg(x + 1, y);
          pushIfBg(x - 1, y);
          pushIfBg(x, y + 1);
          pushIfBg(x, y - 1);
        }

        octx.putImageData(outData, 0, 0);
        resolve(out.toDataURL('image/png'));
      } catch (err) {
        console.error('cropToCard error:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

interface QuotaInfo {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string; // ISO
  resetLabel: string; // mis. "00.01 WIB"
}

/** Sisa waktu menuju reset kuota, mis. "5 jam 12 menit" */
const formatTimeLeft = (resetAtIso: string): string => {
  const ms = new Date(resetAtIso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return 'sebentar lagi';
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
};

export default function App() {
  // State for user uploaded reference photo (base64 or object URL)
  const [userImage, setUserImage] = useState<string | null>(null);

  // State for selected card option (default: Queen of Diamond)
  const [selectedCard, setSelectedCard] = useState<CardOption>(
    CARD_OPTIONS.find((c) => c.id === 'Q_Diamond') || CARD_OPTIONS[0]
  );

  // Kustomisasi opsional: pose & pakaian (kosong = tampilan default)
  const [customPose, setCustomPose] = useState<string>('');
  const [customOutfit, setCustomOutfit] = useState<string>('');
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(false);

  // State for currently displayed/generated card
  const [generatedCard, setGeneratedCard] = useState<CardOption>(selectedCard);
  const [activeUserImage, setActiveUserImage] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loading state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Kuota harian (null = belum diketahui / gagal dimuat)
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  const refreshQuota = async () => {
    try {
      const res = await fetch('/api/quota', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data?.remaining === 'number') setQuota(data as QuotaInfo);
    } catch {
      // Abaikan: kuota hanya informasi tambahan
    }
  };

  useEffect(() => {
    refreshQuota();
  }, []);

  const isQuotaExhausted = quota !== null && quota.remaining <= 0;

  // Constructed prompt tracking
  const [currentPrompt, setCurrentPrompt] = useState<string>(() => {
    return constructCardPrompt(selectedCard).fullPrompt;
  });

  // Prompt inspector sheet visibility
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);

  // Ref to the rendered playing card for downloading and sharing
  const cardRef = useRef<PlayingCardDisplayRef | null>(null);

  const hasCustom = customPose.trim().length > 0 || customOutfit.trim().length > 0;

  // Susun prompt dengan kartu terpilih + kustomisasi saat ini
  const buildPrompt = (card: CardOption) =>
    constructCardPrompt(card, { pose: customPose, outfit: customOutfit }).fullPrompt;

  /**
   * Main Generate Handler
   * Membuat prompt, mengompres foto referensi, memanggil backend,
   * lalu meng-crop hasil agar pas dengan bentuk kartu.
   */
  const handleGenerate = async () => {
    if (isGenerating) return;

    if (isQuotaExhausted) {
      return; // peringatan kuota sudah tampil di layar
    }

    if (!userImage) {
      setErrorMessage('Upload foto wajah terlebih dahulu agar hasil mengikuti wajah Anda.');
      return;
    }

    // Construct dynamic prompt string (termasuk pose & pakaian kustom)
    const fullPrompt = buildPrompt(selectedCard);
    setCurrentPrompt(fullPrompt);

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // Kompres foto agar lolos batas ukuran request Vercel
      const compressedImage = await compressImage(userImage);

      const response = await fetch('/api/generate-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          referenceImage: compressedImage,
        }),
      });

      // Tangani respons non-JSON (mis. 413 / timeout dari Vercel)
      let data: any = null;
      try {
        data = await response.json();
      } catch {
        if (response.status === 413) {
          throw new Error('Ukuran foto terlalu besar. Coba foto lain yang lebih kecil.');
        }
        throw new Error(`Server error (${response.status}). Coba lagi sebentar.`);
      }

      if (!response.ok) {
        // Kuota harian per pengguna habis: tampilkan peringatan kuota (bukan error biasa)
        if (response.status === 429 && data?.code === 'QUOTA_EXCEEDED') {
          setQuota({
            limit: data.limit,
            used: data.limit,
            remaining: 0,
            resetAt: data.resetAt,
            resetLabel: data.resetLabel,
          });
          return;
        }
        throw new Error(data.error || 'Gagal memproses gambar');
      }

      if (data.imageUrl) {
        // Crop otomatis: buang margin putih di sekeliling kartu
        const croppedImage = await cropToCard(data.imageUrl);
        setAiGeneratedImage(croppedImage);
        setGeneratedCard(selectedCard);
        setActiveUserImage(userImage);
      }
    } catch (error: any) {
      console.error('Error generating card image:', error);
      setErrorMessage(error.message || 'Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsGenerating(false);
      refreshQuota();
    }
  };

  // Safe navigation helper without window.open
  const safeOpenUrl = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Action Toolbar Handlers
  const handleDownload = async () => {
    if (cardRef.current) {
      await cardRef.current.downloadCard(
        `PlayingCard-${generatedCard.rank}-${generatedCard.suit}.png`
      );
    }
  };

  const handleShare = async () => {
    const title = `${generatedCard.rank} of ${generatedCard.suit} - AI Playing Card`;
    const text = `Lihat kartu kerajaan custom saya: ${generatedCard.label}! Dibuat dengan AI Playing Card Generator.`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(`${title}\n${url}`);
        }
      }
    } else {
      await navigator.clipboard.writeText(`${title}\n${url}`);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Lihat kartu remi kerajaan kustom saya: ${generatedCard.label}!\n${window.location.href}`
    );
    safeOpenUrl(`https://api.whatsapp.com/send?text=${text}`);
  };

  const handleInstagram = async () => {
    // Trigger download so user can post to Instagram stories or feed
    await handleDownload();
    safeOpenUrl('https://instagram.com');
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(
      `Kartu remi kerajaan kustom saya: ${generatedCard.label}`
    );
    const url = encodeURIComponent(window.location.href);
    safeOpenUrl(`https://t.me/share/url?url=${url}&text=${text}`);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(
      `AI Playing Card: ${generatedCard.label}`
    );
    const body = encodeURIComponent(
      `Halo!\n\nLihat kartu remi kustom bertema kerajaan yang baru saja saya buat:\n\nKartu: ${generatedCard.label}\n\nBuat kartumu juga di: ${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const resetCustom = () => {
    setCustomPose('');
    setCustomOutfit('');
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] flex flex-col justify-start items-center py-6 px-4 font-sans select-none">
      {/* Mobile-sized container mimicking iOS device screen */}
      <div className="w-full max-w-md mx-auto flex flex-col gap-5 pb-10">
        
        {/* 1. Header */}
        <header className="relative flex items-center justify-center pt-2 pb-1">
          <h1 className="text-[20px] font-semibold text-[#1C1C1E] tracking-tight">
            Generate Your Card
          </h1>

          {/* Discreet prompt inspector button for developers */}
          <button
            type="button"
            onClick={() => {
              setCurrentPrompt(buildPrompt(selectedCard));
              setIsPromptModalOpen(true);
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#8E8E93] hover:text-[#007AFF] hover:bg-[#E5E5EA] rounded-full transition-colors cursor-pointer"
            title="Inspect API Prompt"
            aria-label="Inspect API Prompt"
          >
            <Code2 className="w-5 h-5" />
          </button>
        </header>

        {/* 2. Upload Section */}
        <section aria-labelledby="upload-section">
          <UploadBox
            imagePreview={userImage}
            onImageSelected={(img) => {
              setUserImage(img);
              if (!activeUserImage) {
                setActiveUserImage(img);
              }
            }}
          />
        </section>

        {/* 3. Card Selection Dropdown */}
        <section aria-labelledby="card-selection">
          <CardSelect
            selectedCard={selectedCard}
            onSelectCard={(card) => {
              setSelectedCard(card);
              setCurrentPrompt(buildPrompt(card));
            }}
          />
        </section>

        {/* 3b. Kustomisasi Pose & Pakaian (opsional) */}
        <section aria-labelledby="custom-section">
          <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCustomOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer"
              aria-expanded={isCustomOpen}
            >
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[#1C1C1E]">
                  Kustomisasi Pose &amp; Pakaian
                </span>
                <span className="text-[12px] text-[#8E8E93]">
                  {hasCustom
                    ? 'Aktif — tema & warna kartu tetap sama'
                    : 'Opsional — kosongkan untuk tampilan default'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasCustom && (
                  <span className="w-2 h-2 rounded-full bg-[#007AFF]" aria-hidden="true" />
                )}
                <ChevronDown
                  className={`w-5 h-5 text-[#8E8E93] transition-transform ${
                    isCustomOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {isCustomOpen && (
              <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[#E5E5EA] pt-3">
                {/* Pose */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="custom-pose" className="text-[13px] font-medium text-[#3A3A3C]">
                    Pose
                  </label>
                  <textarea
                    id="custom-pose"
                    value={customPose}
                    onChange={(e) => setCustomPose(e.target.value.slice(0, CUSTOM_TEXT_MAX_LENGTH))}
                    maxLength={CUSTOM_TEXT_MAX_LENGTH}
                    rows={2}
                    placeholder="Contoh: berdiri gagah sambil menghunus pedang ke atas, tersenyum percaya diri"
                    className="select-text w-full resize-none rounded-xl border border-[#D1D1D6] bg-[#F2F2F7] px-3 py-2.5 text-[16px] leading-snug text-[#1C1C1E] placeholder:text-[#AEAEB2] focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                  <span className="text-[11px] text-[#8E8E93] text-right">
                    {customPose.length}/{CUSTOM_TEXT_MAX_LENGTH}
                  </span>
                </div>

                {/* Pakaian */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="custom-outfit" className="text-[13px] font-medium text-[#3A3A3C]">
                    Pakaian
                  </label>
                  <textarea
                    id="custom-outfit"
                    value={customOutfit}
                    onChange={(e) => setCustomOutfit(e.target.value.slice(0, CUSTOM_TEXT_MAX_LENGTH))}
                    maxLength={CUSTOM_TEXT_MAX_LENGTH}
                    rows={2}
                    placeholder="Contoh: beskap Jawa hitam dengan blangkon dan keris emas"
                    className="select-text w-full resize-none rounded-xl border border-[#D1D1D6] bg-[#F2F2F7] px-3 py-2.5 text-[16px] leading-snug text-[#1C1C1E] placeholder:text-[#AEAEB2] focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                  <span className="text-[11px] text-[#8E8E93] text-right">
                    {customOutfit.length}/{CUSTOM_TEXT_MAX_LENGTH}
                  </span>
                </div>

                {hasCustom && (
                  <button
                    type="button"
                    onClick={resetCustom}
                    className="self-start flex items-center gap-1.5 text-[13px] font-medium text-[#007AFF] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Kembalikan ke