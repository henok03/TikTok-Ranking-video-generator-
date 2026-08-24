import React from 'react';
import { Tag, Sparkles } from 'lucide-react';

interface WatermarkInputProps {
  watermarkText: string;
  onChange: (text: string) => void;
}

export const WatermarkInput: React.FC<WatermarkInputProps> = ({ watermarkText, onChange }) => {
  return (
    <div className="bg-[#141221]/90 border border-white/10 rounded-[20px] p-4 lg:p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-2.5">
        <label htmlFor="watermark-input" className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#A855F7]" />
          <span>Bottom Watermark Text</span>
        </label>
        <span className="text-[11px] text-gray-400">Footer credit</span>
      </div>

      <input
        id="watermark-input"
        type="text"
        value={watermarkText}
        onChange={(e) => onChange(e.target.value)}
        placeholder="By @bertemios"
        maxLength={35}
        className="w-full bg-[#0B0B0F] border border-white/15 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white font-semibold text-sm rounded-xl px-4 py-2.5 outline-none transition-all placeholder:text-gray-600"
      />
    </div>
  );
};
