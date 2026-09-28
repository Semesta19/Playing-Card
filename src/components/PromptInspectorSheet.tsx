import React, { useState } from 'react';
import { Copy, Check, Terminal, X } from 'lucide-react';

interface PromptInspectorSheetProps {
  prompt: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PromptInspectorSheet: React.FC<PromptInspectorSheetProps> = ({
  prompt,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[24px] p-5 shadow-2xl border border-[#E5E5EA] max-h-[85vh] flex flex-col">
        {/* iOS Handle / Header */}
        <div className="w-10 h-1 bg-[#D1D1D6] rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
              <Terminal className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-[17px] text-[#1C1C1E]">
              API Prompt String
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#8E8E93]/15 text-[#1C1C1E] flex items-center justify-center hover:bg-[#8E8E93]/25 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Content */}
        <div className="flex-1 overflow-y-auto my-3 font-mono text-[12px] leading-relaxed text-[#3A3A3C] bg-[#F2F2F7] p-3.5 rounded-xl whitespace-pre-wrap select-text border border-[#E5E5EA]">
          {prompt}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full py-3 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.99] text-white font-medium text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Tersalin ke Clipboard!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Salin Prompt Lengkap
            </>
          )}
        </button>
      </div>
    </div>
  );
};
