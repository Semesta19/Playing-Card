import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw } from 'lucide-react';

interface UploadBoxProps {
  imagePreview: string | null;
  onImageSelected: (base64: string | null) => void;
}

export const UploadBox: React.FC<UploadBoxProps> = ({
  imagePreview,
  onImageSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickBox = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#E5E5EA]">
      {/* iOS Header label */}
      <div className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2.5 px-0.5">
        Upload Foto Referensi
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {!imagePreview ? (
        <button
          type="button"
          onClick={handleClickBox}
          className="w-full h-32 rounded-xl border-2 border-dashed border-[#C7C7CC] bg-[#F9F9FB] hover:bg-[#F2F2F7] transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group active:scale-[0.99]"
        >
          <div className="w-10 h-10 rounded-full bg-[#E5E5EA] flex items-center justify-center text-[#8E8E93] group-hover:text-[#007AFF] group-hover:bg-[#E5F1FF] transition-colors">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[15px] font-medium text-[#8E8E93] group-hover:text-[#1C1C1E] transition-colors">
            Pilih Foto
          </span>
        </button>
      ) : (
        <div
          onClick={handleClickBox}
          className="w-full h-32 rounded-xl border border-[#D1D1D6] bg-[#F9F9FB] p-2 flex items-center justify-between gap-3 cursor-pointer group relative overflow-hidden"
        >
          {/* Thumbnail preview */}
          <div className="relative w-24 h-full rounded-lg overflow-hidden border border-[#E5E5EA] bg-black/5 shrink-0">
            <img
              src={imagePreview}
              alt="Foto referensi thumbnail"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details & Actions */}
          <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#34C759]">
              <span className="w-2 h-2 rounded-full bg-[#34C759]" />
              Foto Terpilih
            </div>
            <p className="text-[13px] text-[#8E8E93] truncate mt-0.5">
              Wajah subjek siap dipetakan
            </p>
            <div className="flex items-center gap-1 text-[13px] font-medium text-[#007AFF] mt-2 group-hover:underline">
              <RefreshCw className="w-3.5 h-3.5" />
              Ganti Foto
            </div>
          </div>

          {/* Clear button */}
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#8E8E93]/20 hover:bg-[#8E8E93]/40 text-[#1C1C1E] flex items-center justify-center transition-colors"
            title="Hapus foto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
