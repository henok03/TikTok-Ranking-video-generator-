import React from 'react';
import { Sparkles, RotateCcw, Video, Film } from 'lucide-react';

interface NavbarProps {
  onLoadPreset: (presetName: string) => void;
  onReset: () => void;
  isExporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoadPreset, onReset, isExporting }) => {
  return (
    <header className="w-full bg-[#0B0B0F]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#C084FC] p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#0B0B0F] rounded-[10px] flex items-center justify-center">
            <Film className="w-5 h-5 text-[#A855F7]" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              TikTok Ranking Generator
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#C084FC] tracking-wider">
                1080x1920 MP4
              </span>
            </h1>
          </div>
          <p className="text-xs text-gray-400 hidden sm:block">
            Sequential 3-to-1 countdown video creator with persistent logo, title, and ranking overlays
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-1.5 bg-[#171524] border border-white/10 rounded-xl p-1">
          <button
            id="btn-preset-viral"
            type="button"
            onClick={() => onLoadPreset('viral')}
            disabled={isExporting}
            className="px-3 py-1.5 text-xs font-semibold text-gray-200 hover:text-white hover:bg-[#7C3AED]/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
            <span>Viral Demo</span>
          </button>
          <button
            id="btn-preset-gaming"
            type="button"
            onClick={() => onLoadPreset('gaming')}
            disabled={isExporting}
            className="px-3 py-1.5 text-xs font-semibold text-gray-200 hover:text-white hover:bg-[#7C3AED]/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Video className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Gaming Hits</span>
          </button>
        </div>

        <button
          id="btn-reset-all"
          type="button"
          onClick={onReset}
          disabled={isExporting}
          className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Reset to default template"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
