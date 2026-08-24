import React from 'react';
import { Type, Sparkles } from 'lucide-react';

interface TitleInputProps {
  title: string;
  onChange: (title: string) => void;
}

const PRESET_TITLES = [
  'BEST BERTEMIOS TIKTOKS',
  'TOP 3 VIRAL MOMENTS',
  'INSANE GAMING CLUTCHES',
  'GREATEST OF ALL TIME',
];

export const TitleInput: React.FC<TitleInputProps> = ({ title, onChange }) => {
  return (
    <div className="bg-[#141221]/90 border border-white/10 rounded-[20px] p-4 lg:p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-2.5">
        <label htmlFor="ranking-title-input" className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Type className="w-4 h-4 text-[#A855F7]" />
          <span>Ranking Title</span>
        </label>
        <span className="text-[11px] text-gray-400 font-medium">
          {title.length}/40 characters
        </span>
      </div>

      <div className="relative">
        <input
          id="ranking-title-input"
          type="text"
          value={title}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="BEST BERTEMIOS TIKTOKS"
          maxLength={40}
          className="w-full bg-[#0B0B0F] border border-white/15 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30 text-white font-extrabold text-sm sm:text-base tracking-wide rounded-xl px-4 py-3 outline-none transition-all placeholder:text-gray-600 placeholder:font-normal"
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-gray-400 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-[#A855F7]" />
          Suggestions:
        </span>
        {PRESET_TITLES.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#7C3AED]/20 border border-white/10 hover:border-[#7C3AED]/40 text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
};
