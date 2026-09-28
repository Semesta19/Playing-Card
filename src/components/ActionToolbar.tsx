import React, { useState } from 'react';
import { Download, Mail } from 'lucide-react';

interface ActionToolbarProps {
  onDownload: () => void;
  onShare: () => void;
  onWhatsApp: () => void;
  onInstagram: () => void;
  onTelegram: () => void;
  onEmail: () => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onDownload,
  onShare,
  onWhatsApp,
  onInstagram,
  onTelegram,
  onEmail,
}) => {
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setActiveToast(message);
    setTimeout(() => {
      setActiveToast(null);
    }, 2200);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Toast Notification */}
      {activeToast && (
        <div className="absolute -top-12 px-3.5 py-1.5 rounded-full bg-[#1C1C1E]/90 backdrop-blur-md text-white text-xs font-medium shadow-lg animate-fade-in z-30 transition-all">
          {activeToast}
        </div>
      )}

      {/* Floating Pill Toolbar */}
      <div className="bg-white/95 backdrop-blur-md border border-[#E5E5EA] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-full px-3 py-2 flex items-center justify-around w-full max-w-[340px] gap-1">
        {/* 1. Download */}
        <button
          type="button"
          onClick={() => {
            onDownload();
            showToast('Mengunduh kartu...');
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1C1C1E] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] active:scale-95 transition-all cursor-pointer"
          title="Download Card"
          aria-label="Download Card"
        >
          <Download className="w-[19px] h-[19px] stroke-[2]" />
        </button>

        {/* 2. iOS Share */}
        <button
          type="button"
          onClick={() => {
            onShare();
            showToast('Membuka menu bagikan...');
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1C1C1E] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] active:scale-95 transition-all cursor-pointer"
          title="Share Card"
          aria-label="Share Card"
        >
          {/* iOS-style share icon (box with upward arrow) */}
          <svg
            className="w-[19px] h-[19px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        {/* 3. WhatsApp */}
        <button
          type="button"
          onClick={() => {
            onWhatsApp();
            showToast('Membuka WhatsApp...');
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/10 active:scale-95 transition-all cursor-pointer"
          title="Share to WhatsApp"
          aria-label="Share to WhatsApp"
        >
          <svg className="w-[19px] h-[19px] fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.02L7.55 18.84L4.44 19.66L5.27 16.63L5.07 16.31C4.27 15.03 3.81 13.5 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.06 6.84C8.88 6.84 8.58 6.91 8.33 7.18C8.08 7.45 7.38 8.11 7.38 9.46C7.38 10.81 8.36 12.11 8.5 12.3C8.64 12.49 10.42 15.24 13.15 16.42C13.8 16.7 14.31 16.87 14.7 17C15.35 17.21 15.95 17.18 16.41 17.11C16.93 17.03 18.01 16.46 18.23 15.82C18.46 15.19 18.46 14.65 18.39 14.54C18.32 14.43 18.14 14.36 17.86 14.23C17.58 14.09 16.23 13.42 15.98 13.33C15.73 13.24 15.55 13.2 15.37 13.47C15.19 13.74 14.67 14.36 14.51 14.54C14.35 14.72 14.19 14.75 13.91 14.61C13.63 14.47 12.74 14.18 11.68 13.23C10.86 12.5 10.3 11.6 10.16 11.33C10.02 11.06 10.14 10.91 10.28 10.77C10.41 10.64 10.57 10.43 10.71 10.27C10.85 10.11 10.89 10 10.99 9.81C11.09 9.63 11.04 9.47 10.97 9.33C10.9 9.19 10.35 7.84 10.12 7.3C9.9 6.77 9.68 6.84 9.5 6.84H9.06Z" />
          </svg>
        </button>

        {/* 4. Instagram */}
        <button
          type="button"
          onClick={() => {
            onInstagram();
            showToast('Membuka Instagram...');
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#E4405F] hover:bg-[#E4405F]/10 active:scale-95 transition-all cursor-pointer"
          title="Share to Instagram"
          aria-label="Share to Instagram"
        >
          <svg className="w-[19px] h-[19px] fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </button>

        {/* 5. Telegram */}
        <button
          type="button"
          onClick={() => {
            onTelegram();
            showToast('Membuka Telegram...');
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#2AABEE] hover:bg-[#2AABEE]/10 active:scale-95 transition-all cursor-pointer"
          title="Share to Telegram"
          aria-label="Share to Telegram"
        >
          <svg className="w-[19px] h-[19px] fill-current" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </button>

        {/* 6. Email */}
        <button
          type="button"
          onClick={() => {
            onEmail();
            showToast('Membuka Email...');
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1C1C1E] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] active:scale-95 transition-all cursor-pointer"
          title="Share via Email"
          aria-label="Share via Email"
        >
          <Mail className="w-[19px] h-[19px] stroke-[2]" />
        </button>
      </div>
    </div>
  );
};
