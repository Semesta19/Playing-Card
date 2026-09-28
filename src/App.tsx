/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UploadBox } from './components/UploadBox';
import { CardSelect } from './components/CardSelect';
import { PlayingCardDisplay, PlayingCardDisplayRef } from './components/PlayingCardDisplay';
import { ActionToolbar } from './components/ActionToolbar';
import { PromptInspectorSheet } from './components/PromptInspectorSheet';
import { CARD_OPTIONS, constructCardPrompt } from './utils/promptBuilder';
import { CardOption } from './types';
import { Loader2, Code2 } from 'lucide-react';

export default function App() {
  // State for user uploaded reference photo (base64 or object URL)
  const [userImage, setUserImage] = useState<string | null>(null);

  // State for selected card option (default: Queen of Diamond)
  const [selectedCard, setSelectedCard] = useState<CardOption>(
    CARD_OPTIONS.find((c) => c.id === 'Q_Diamond') || CARD_OPTIONS[0]
  );

  // State for currently displayed/generated card
  const [generatedCard, setGeneratedCard] = useState<CardOption>(selectedCard);
  const [activeUserImage, setActiveUserImage] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loading state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Constructed prompt tracking
  const [currentPrompt, setCurrentPrompt] = useState<string>(() => {
    return constructCardPrompt(selectedCard).fullPrompt;
  });

  // Prompt inspector sheet visibility
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);

  // Ref to the rendered playing card for downloading and sharing
  const cardRef = useRef<PlayingCardDisplayRef | null>(null);

  /**
   * Main Generate Handler with Nano Banana
   * Constructs the dynamic prompt string and calls backend Nano Banana API.
   */
  const handleGenerate = async () => {
    if (isGenerating) return;

    // Construct dynamic prompt string according to the specification
    const promptData = constructCardPrompt(selectedCard);
    setCurrentPrompt(promptData.fullPrompt);

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptData.fullPrompt,
          referenceImage: userImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses gambar dengan Nano Banana');
      }

      if (data.imageUrl) {
        setAiGeneratedImage(data.imageUrl);
        setGeneratedCard(selectedCard);
        setActiveUserImage(userImage);
      }
    } catch (error: any) {
      console.error('Error generating card image:', error);
      setErrorMessage(error.message || 'Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsGenerating(false);
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
              const p = constructCardPrompt(selectedCard);
              setCurrentPrompt(p.fullPrompt);
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
              setCurrentPrompt(constructCardPrompt(card).fullPrompt);
            }}
          />
        </section>

        {/* 4. Generate Button */}
        <section className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 px-6 rounded-full bg-[#007AFF] hover:bg-[#0066D6] active:bg-[#0051A8] active:scale-[0.985] text-white font-semibold text-[17px] tracking-tight shadow-[0_4px_14px_rgba(0,122,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses Kartu...</span>
              </>
            ) : (
              <span>Generate Gambar</span>
            )}
          </button>

          {errorMessage && (
            <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-center text-[13px] font-medium text-[#FF3B30] animate-fade-in">
              {errorMessage}
            </div>
          )}
        </section>

        {/* 5. Result & Action Section */}
        <section className="flex flex-col items-center gap-4 mt-1">
          {/* Card Mockup Graphic */}
          <PlayingCardDisplay
            ref={cardRef}
            card={generatedCard}
            userImage={activeUserImage}
            aiGeneratedImage={aiGeneratedImage}
            isGenerating={isGenerating}
          />

          {/* Action Toolbar */}
          <ActionToolbar
            onDownload={handleDownload}
            onShare={handleShare}
            onWhatsApp={handleWhatsApp}
            onInstagram={handleInstagram}
            onTelegram={handleTelegram}
            onEmail={handleEmail}
          />
        </section>
      </div>

      {/* API Prompt Inspector Sheet */}
      <PromptInspectorSheet
        prompt={currentPrompt}
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
      />
    </main>
  );
}
