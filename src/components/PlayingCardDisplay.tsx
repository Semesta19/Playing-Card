import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { CardOption } from '../types';

interface PlayingCardDisplayProps {
  card: CardOption;
  userImage: string | null;
  aiGeneratedImage?: string | null;
  isGenerating?: boolean;
}

export interface PlayingCardDisplayRef {
  downloadCard: (fileName?: string) => Promise<void>;
  getCanvasBlob: () => Promise<Blob | null>;
}

export const PlayingCardDisplay = forwardRef<PlayingCardDisplayRef, PlayingCardDisplayProps>(
  ({ card, userImage, aiGeneratedImage, isGenerating = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // High resolution rendering for download
    const renderCardToCanvas = async (exportWidth = 1000, exportHeight = 1500): Promise<HTMLCanvasElement> => {
      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const W = exportWidth;
      const H = exportHeight;

      // 1. Background - Ivory / Cream
      const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
      bgGrad.addColorStop(0, '#FAF7F0');
      bgGrad.addColorStop(1, '#F3ECE0');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Card outer margin and rounded boundary
      const cornerRadius = 48;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, cornerRadius);
      ctx.clip();

      // Outer Maroon Border
      ctx.strokeStyle = '#5B1420';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, W - 14, H - 14);

      // Inner Gold Border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 6;
      ctx.strokeRect(26, 26, W - 52, H - 52);

      // Thin inner gold frame
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, W - 72, H - 72);

      // Left & Right Burgundy Decorative Side Panels
      ctx.fillStyle = '#671424';
      ctx.fillRect(26, 80, 16, H - 160);
      ctx.fillRect(W - 42, 80, 16, H - 160);

      // Corner Suits & Ranks
      const isRed = card.suitColor === 'red';
      const rankColor = isRed ? '#C9182B' : '#1C1C1E';
      ctx.fillStyle = rankColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Top-Left Rank
      ctx.font = `bold ${card.rankLetter === '10' ? '58px' : '74px'} "Playfair Display", serif`;
      ctx.fillText(card.rankLetter, 92, 100);
      ctx.font = '54px "Cinzel", serif';
      ctx.fillText(card.suitSymbol, 92, 160);

      // Bottom-Right Rank (Inverted)
      ctx.save();
      ctx.translate(W - 92, H - 100);
      ctx.rotate(Math.PI);
      ctx.font = `bold ${card.rankLetter === '10' ? '58px' : '74px'} "Playfair Display", serif`;
      ctx.fillText(card.rankLetter, 0, 0);
      ctx.font = '54px "Cinzel", serif';
      ctx.fillText(card.suitSymbol, 0, -60);
      ctx.restore();

      // Draw mirrored top and bottom royal figures
      const drawHalfFigure = async (inverted = false) => {
        ctx.save();
        if (inverted) {
          ctx.translate(W, H);
          ctx.rotate(Math.PI);
        }

        const midY = H / 2;
        const centerX = W / 2;

        // Arched ornate frame behind head
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, 330, 200, Math.PI, 0, false);
        ctx.lineTo(centerX + 200, midY - 20);
        ctx.lineTo(centerX - 200, midY - 20);
        ctx.closePath();
        ctx.fillStyle = '#1A2A44';
        ctx.fill();
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Filigree rays inside arch
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
        ctx.lineWidth = 2;
        for (let a = -75; a <= 75; a += 15) {
          const rad = (a * Math.PI) / 180;
          ctx.beginPath();
          ctx.moveTo(centerX, 330);
          ctx.lineTo(centerX + Math.sin(rad) * 195, 330 - Math.cos(rad) * 195);
          ctx.stroke();
        }
        ctx.restore();

        // Cloak / Cape (Deep maroon)
        ctx.fillStyle = '#4A0E17';
        ctx.beginPath();
        ctx.ellipse(centerX, 480, 250, 160, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ottoman Military Navy Coat
        ctx.fillStyle = '#0F1A2C';
        ctx.beginPath();
        ctx.moveTo(centerX - 170, midY);
        ctx.lineTo(centerX - 130, 390);
        ctx.lineTo(centerX, 420);
        ctx.lineTo(centerX + 130, 390);
        ctx.lineTo(centerX + 170, midY);
        ctx.closePath();
        ctx.fill();

        // Gold Epaulettes on shoulders
        ctx.fillStyle = '#E5C158';
        ctx.beginPath();
        ctx.ellipse(centerX - 135, 385, 45, 20, -0.2, 0, Math.PI * 2);
        ctx.ellipse(centerX + 135, 385, 45, 20, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Gold braided aiguillette / fourragère across chest
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.bezierCurveTo(centerX - 100, 420, centerX, 490, centerX + 60, 440);
        ctx.stroke();
        ctx.beginPath();
        ctx.bezierCurveTo(centerX - 90, 440, centerX, 520, centerX + 50, 470);
        ctx.stroke();

        // Two star-shaped medal badges with red centers
        const drawMedal = (mx: number, my: number) => {
          ctx.save();
          ctx.translate(mx, my);
          ctx.fillStyle = '#F4EDE0';
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.lineTo(16, 0);
            ctx.lineTo(6, 6);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Red gemstone center
          ctx.fillStyle = '#A81C28';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };
        drawMedal(centerX - 60, 450);
        drawMedal(centerX - 25, 475);

        // Portrait Face Circle/Oval (Uploaded image or silhouette)
        const faceX = centerX;
        const faceY = 275;
        const faceR = 105;

        // Velvet Headpiece / Crown above face
        ctx.fillStyle = '#7E192B';
        ctx.beginPath();
        ctx.moveTo(centerX - 95, 215);
        ctx.quadraticCurveTo(centerX, 130, centerX + 95, 215);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#E5C158';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Crown filigree cross/gem
        ctx.fillStyle = '#E5C158';
        ctx.fillRect(centerX - 4, 115, 8, 28);
        ctx.fillRect(centerX - 14, 123, 28, 8);
        ctx.fillStyle = '#C9182B';
        ctx.beginPath();
        ctx.arc(centerX, 127, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw the subject face
        ctx.save();
        ctx.beginPath();
        ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2);
        ctx.clip();

        if (userImage) {
          // Render uploaded photo
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = userImage;
            });
            // Draw photo maintaining aspect ratio
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(
              img,
              sx,
              sy,
              minDim,
              minDim,
              faceX - faceR,
              faceY - faceR,
              faceR * 2,
              faceR * 2
            );

            // Subtle painterly royal vintage tint over the photo
            ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
            ctx.fillRect(faceX - faceR, faceY - faceR, faceR * 2, faceR * 2);
          } catch {
            drawFallbackFace(ctx, faceX, faceY);
          }
        } else {
          drawFallbackFace(ctx, faceX, faceY);
        }
        ctx.restore();

        // Face ornate gold frame
        ctx.beginPath();
        ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Symbolic object at chest level
        drawSymbolicObject(ctx, centerX, 590, card.suit);

        ctx.restore();
      };

      await drawHalfFigure(false);
      await drawHalfFigure(true);

      // Center Divider line with gold filigree gem
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, H / 2);
      ctx.lineTo(W - 80, H / 2);
      ctx.stroke();

      // Center emblem
      ctx.fillStyle = '#5B1420';
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, 45, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E5C158';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = card.suitColor === 'red' ? '#C9182B' : '#E5C158';
      ctx.font = '24px "Cinzel", serif';
      ctx.fillText(card.suitSymbol, W / 2, H / 2 + 1);

      ctx.restore();
      return canvas;
    };

    const drawFallbackFace = (ctx: CanvasRenderingContext2D, fx: number, fy: number) => {
      // Elegant painterly royal silhouette
      const faceGrad = ctx.createLinearGradient(fx, fy - 100, fx, fy + 100);
      faceGrad.addColorStop(0, '#EBD2B9');
      faceGrad.addColorStop(1, '#D1AA88');
      ctx.fillStyle = faceGrad;
      ctx.fillRect(fx - 105, fy - 105, 210, 210);

      // Regal shadow silhouette
      ctx.fillStyle = 'rgba(75, 40, 25, 0.25)';
      ctx.beginPath();
      ctx.ellipse(fx, fy + 10, 45, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#2C1D11';
      ctx.beginPath();
      ctx.arc(fx, fy - 20, 68, Math.PI, 0, false);
      ctx.fill();
    };

    const drawSymbolicObject = (
      ctx: CanvasRenderingContext2D,
      sx: number,
      sy: number,
      suit: CardOption['suit']
    ) => {
      ctx.save();
      ctx.translate(sx, sy);

      // Golden scepter shaft
      ctx.fillStyle = '#E5C158';
      ctx.fillRect(-5, -60, 10, 110);
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 2;
      ctx.strokeRect(-5, -60, 10, 110);

      if (suit === 'Diamond') {
        // Justice scales + diamond
        ctx.strokeStyle = '#E5C158';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-45, -45);
        ctx.lineTo(45, -45);
        ctx.stroke();

        // Little hanging scale pans
        ctx.beginPath();
        ctx.arc(-45, -25, 14, 0, Math.PI, false);
        ctx.arc(45, -25, 14, 0, Math.PI, false);
        ctx.fillStyle = '#E5C158';
        ctx.fill();

        // Red diamond emblem
        ctx.fillStyle = '#C9182B';
        ctx.beginPath();
        ctx.moveTo(0, -65);
        ctx.lineTo(14, -50);
        ctx.lineTo(0, -35);
        ctx.lineTo(-14, -50);
        ctx.closePath();
        ctx.fill();
      } else if (suit === 'Heart') {
        // Heart ruby emblem
        ctx.fillStyle = '#C9182B';
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.bezierCurveTo(-20, -70, -35, -40, 0, -18);
        ctx.bezierCurveTo(35, -40, 20, -70, 0, -45);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (suit === 'Club') {
        // Trefoil / Clover emerald
        ctx.fillStyle = '#105B35';
        ctx.beginPath();
        ctx.arc(0, -56, 12, 0, Math.PI * 2);
        ctx.arc(-11, -38, 12, 0, Math.PI * 2);
        ctx.arc(11, -38, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else {
        // Spade onyx
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.moveTo(0, -65);
        ctx.bezierCurveTo(24, -38, 22, -22, 0, -30);
        ctx.bezierCurveTo(-22, -22, -24, -38, 0, -65);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.restore();
    };

    useImperativeHandle(ref, () => ({
      downloadCard: async (fileName = `PlayingCard-${card.rank}-${card.suit}.png`) => {
        if (aiGeneratedImage) {
          const link = document.createElement('a');
          link.download = fileName;
          link.href = aiGeneratedImage;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
        const canvas = await renderCardToCanvas(1200, 1800);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      getCanvasBlob: async (): Promise<Blob | null> => {
        if (aiGeneratedImage) {
          const res = await fetch(aiGeneratedImage);
          return await res.blob();
        }
        const canvas = await renderCardToCanvas(1200, 1800);
        return new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob), 'image/png');
        });
      },
    }));

    const isRed = card.suitColor === 'red';

    return (
      <div className="relative group w-full flex justify-center py-1">
        {/* Card Frame */}
        <div
          className={`relative w-[280px] sm:w-[320px] aspect-[5/7] rounded-[24px] bg-[#FAF7F0] border-4 border-[#5B1420] shadow-[0_12px_36px_rgba(0,0,0,0.14)] overflow-hidden transition-all duration-300 ${
            isGenerating ? 'opacity-80 scale-[0.99] filter blur-[0.5px]' : ''
          }`}
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, #FAF7F0 0%, #F1E9DC 100%)',
          }}
        >
          {aiGeneratedImage ? (
            <div className="relative w-full h-full">
              <img
                src={aiGeneratedImage}
                alt={`${card.rank} of ${card.suit}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Subtle vintage border overlay */}
              <div className="absolute inset-[6px] rounded-[18px] border-2 border-[#D4AF37]/70 pointer-events-none" />
            </div>
          ) : (
            <>
              {/* Inner Ornate Gold Border Line */}
              <div className="absolute inset-[8px] rounded-[18px] border-2 border-[#D4AF37]/90 pointer-events-none" />
              <div className="absolute inset-[12px] rounded-[14px] border border-[#D4AF37]/40 pointer-events-none" />

              {/* Left and Right Burgundy Accent Ribbons */}
              <div className="absolute left-[8px] top-[25px] bottom-[25px] w-[5px] bg-[#671424] opacity-90 rounded-full" />
              <div className="absolute right-[8px] top-[25px] bottom-[25px] w-[5px] bg-[#671424] opacity-90 rounded-full" />

              {/* Top Left Rank & Suit */}
              <div className="absolute top-4 left-5 flex flex-col items-center select-none z-10 w-7">
                <span
                  className={`font-serif ${card.rankLetter === '10' ? 'text-2xl' : 'text-3xl'} font-bold leading-none ${
                    isRed ? 'text-[#C9182B]' : 'text-[#1C1C1E]'
                  }`}
                >
                  {card.rankLetter}
                </span>
                <span
                  className={`text-2xl leading-none mt-1 ${
                    isRed ? 'text-[#C9182B]' : 'text-[#1C1C1E]'
                  }`}
                >
                  {card.suitSymbol}
                </span>
              </div>

              {/* Bottom Right Rank & Suit (Mirrored) */}
              <div className="absolute bottom-4 right-5 flex flex-col items-center select-none rotate-180 z-10 w-7">
                <span
                  className={`font-serif ${card.rankLetter === '10' ? 'text-2xl' : 'text-3xl'} font-bold leading-none ${
                    isRed ? 'text-[#C9182B]' : 'text-[#1C1C1E]'
                  }`}
                >
                  {card.rankLetter}
                </span>
                <span
                  className={`text-2xl leading-none mt-1 ${
                    isRed ? 'text-[#C9182B]' : 'text-[#1C1C1E]'
                  }`}
                >
                  {card.suitSymbol}
                </span>
              </div>

              {/* Center Royal Graphic & Portrait */}
              <div className="absolute inset-0 flex flex-col items-center justify-between py-6 px-10 pointer-events-none">
                {/* Top Half Portrait */}
                <div className="flex flex-col items-center pt-2">
                  {/* Crown Filigree */}
                  <div className="w-12 h-4 mb-[-2px] bg-[#7E192B] rounded-t-full border border-[#D4AF37] flex items-center justify-center shadow-xs">
                    <span className="text-[9px] text-[#FFD700]">⚜</span>
                  </div>

                  {/* Portrait Frame */}
                  <div className="relative w-24 h-24 rounded-full border-2 border-[#D4AF37] p-0.5 bg-[#1A2A44] shadow-md overflow-hidden">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt="Subject Reference"
                        className="w-full h-full object-cover rounded-full filter contrast-105 sepia-[0.15]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-b from-[#2E1810] to-[#120D08] flex items-center justify-center">
                        <span className="text-[#D4AF37] text-2xl font-serif font-bold">
                          {card.rankLetter}
                        </span>
                      </div>
                    )}
                    {/* Royal Overlay Tint */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A2C]/60 via-transparent to-transparent" />
                  </div>

                  {/* Ottoman Coat Silhouette with Epaulettes & Braids */}
                  <div className="mt-[-8px] w-36 h-12 bg-[#0F1A2C] rounded-t-2xl border-t-2 border-[#D4AF37] flex items-center justify-center relative shadow-sm">
                    <div className="absolute -top-1 left-2 w-5 h-2 bg-[#D4AF37] rounded-full" />
                    <div className="absolute -top-1 right-2 w-5 h-2 bg-[#D4AF37] rounded-full" />
                    {/* Scepter Emblem */}
                    <div className="text-xs text-[#E5C158] font-bold tracking-widest flex items-center gap-1">
                      <span>✦</span>
                      <span className="text-sm">{card.suitSymbol}</span>
                      <span>✦</span>
                    </div>
                  </div>
                </div>

                {/* Center Royal Divider */}
                <div className="w-full flex items-center justify-center gap-2 my-auto">
                  <div className="flex-1 h-[1.5px] bg-[#D4AF37]" />
                  <div className="w-8 h-8 rounded-full bg-[#5B1420] border-2 border-[#D4AF37] flex items-center justify-center shadow-xs">
                    <span
                      className={`text-sm ${
                        isRed ? 'text-[#FF4A5A]' : 'text-[#E5C158]'
                      }`}
                    >
                      {card.suitSymbol}
                    </span>
                  </div>
                  <div className="flex-1 h-[1.5px] bg-[#D4AF37]" />
                </div>

                {/* Bottom Half Inverted Portrait */}
                <div className="flex flex-col items-center pb-2 rotate-180">
                  {/* Crown Filigree */}
                  <div className="w-12 h-4 mb-[-2px] bg-[#7E192B] rounded-t-full border border-[#D4AF37] flex items-center justify-center shadow-xs">
                    <span className="text-[9px] text-[#FFD700]">⚜</span>
                  </div>

                  {/* Portrait Frame */}
                  <div className="relative w-24 h-24 rounded-full border-2 border-[#D4AF37] p-0.5 bg-[#1A2A44] shadow-md overflow-hidden">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt="Subject Reference"
                        className="w-full h-full object-cover rounded-full filter contrast-105 sepia-[0.15]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-b from-[#2E1810] to-[#120D08] flex items-center justify-center">
                        <span className="text-[#D4AF37] text-2xl font-serif font-bold">
                          {card.rankLetter}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A2C]/60 via-transparent to-transparent" />
                  </div>

                  {/* Ottoman Coat Silhouette */}
                  <div className="mt-[-8px] w-36 h-12 bg-[#0F1A2C] rounded-t-2xl border-t-2 border-[#D4AF37] flex items-center justify-center relative shadow-sm">
                    <div className="absolute -top-1 left-2 w-5 h-2 bg-[#D4AF37] rounded-full" />
                    <div className="absolute -top-1 right-2 w-5 h-2 bg-[#D4AF37] rounded-full" />
                    <div className="text-xs text-[#E5C158] font-bold tracking-widest flex items-center gap-1">
                      <span>✦</span>
                      <span className="text-sm">{card.suitSymbol}</span>
                      <span>✦</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subdued foil sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
            </>
          )}

          {/* Loading overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-20">
              <div className="w-9 h-9 rounded-full border-3 border-white/30 border-t-white animate-spin mb-3" />
              <span className="text-white text-xs font-medium tracking-wide">
                Menghasilkan Kartu...
              </span>
              <span className="text-white/70 text-[11px] mt-0.5 font-mono">
                GPT AI
              </span>
            </div>
          )}
        </div>

        {/* Hidden offscreen canvas for rendering high-res export */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }
);

PlayingCardDisplay.displayName = 'PlayingCardDisplay';
