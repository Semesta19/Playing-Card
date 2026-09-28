import React from 'react';
import { CardOption } from '../types';
import { CARD_OPTIONS } from '../utils/promptBuilder';
import { ChevronDown } from 'lucide-react';

interface CardSelectProps {
  selectedCard: CardOption;
  onSelectCard: (card: CardOption) => void;
}

export const CardSelect: React.FC<CardSelectProps> = ({
  selectedCard,
  onSelectCard,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cardId = e.target.value;
    const found = CARD_OPTIONS.find((c) => c.id === cardId);
    if (found) {
      onSelectCard(found);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#E5E5EA]">
      {/* iOS Group Label */}
      <div className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2.5 px-0.5">
        Pilih Jenis Kartu
      </div>

      <div className="relative">
        <select
          value={selectedCard.id}
          onChange={handleChange}
          aria-label="Pilih Jenis Kartu"
          className="w-full appearance-none bg-[#F9F9FB] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] border border-[#D1D1D6] rounded-xl px-4 py-3.5 pr-10 text-[16px] font-medium text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all cursor-pointer font-sans"
        >
          {CARD_OPTIONS.map((card) => (
            <option key={card.id} value={card.id} className="text-[#1C1C1E]">
              {card.label}
            </option>
          ))}
        </select>

        {/* Custom iOS Chevron */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-[#8E8E93]">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
