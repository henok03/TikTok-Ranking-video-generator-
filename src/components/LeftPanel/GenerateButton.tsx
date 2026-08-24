import React from 'react';
import { Play, Loader2, X, Download, Film, Sparkles } from 'lucide-react';
import { ExportProgressState } from '../../types';

interface GenerateButtonProps {
  onGenerate: () => void;
  onCancel: () => void;
  exportState: ExportProgressState;
  hasVideos: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onGenerate,
  onCancel,
  exportState,
  hasVideos,
}) => {
  if (exportState.isExporting) {
    const stageLabels = {
      idle: 'Ready',
      preparing: 'Preparing video frames & assets...',
      rendering: 'Rendering 1080x1920 frames...',
      muxing: 'Muxing & finalizing MP4 stream...',
      finished: 'Done! Video generated.',
      error: 'Export error occurred',
    };

    return (
      <div className="bg-[#171428] border border-[#7C3AED]/50 rounded-[20px] p-5 shadow-2xl shadow-purple-500/20 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-5 h-5 text-[#C084FC] animate-spin" />
            <div>
              <h4 className="text-sm font-bold text-white">Generating 9:16 MP4</h4>
              <p className="text-xs text-gray-400">{stageLabels[exportState.stage]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Cancel export"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#0B0B0F] rounded-full h-3.5 p-0.5 border border-white/10 overflow-hidden relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C084FC] transition-all duration-300 shadow-lg shadow-purple-500/50"
            style={{ width: `${exportState.progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mt-2 font-medium">
          <span>
            {exportState.totalFrames > 0
              ? `Frame ${exportState.currentFrame} / ${exportState.totalFrames}`
              : 'Encoding...'}
          </span>
          <span className="font-bold text-purple-300">{exportState.progress}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <button
        id="btn-generate-mp4"
        type="button"
        onClick={onGenerate}
        className="w-full relative group overflow-hidden rounded-[20px] p-0.5 shadow-2xl shadow-[#7C3AED]/40 hover:shadow-[#7C3AED]/70 transition-all duration-300 cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C084FC] group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#7C3AED] py-4 px-6 rounded-[18px] flex items-center justify-center gap-3 transition-transform active:scale-[0.99]">
          <Film className="w-5 h-5 text-white animate-pulse" />
          <span className="text-white font-extrabold text-base tracking-wide uppercase">
            Generate 9:16 MP4 Video
          </span>
          <Sparkles className="w-4 h-4 text-purple-200" />
        </div>
      </button>

      {!hasVideos && (
        <p className="text-center text-[11px] text-amber-300/80 mt-2">
          Tip: You can generate with uploaded clips or use the instant Bertemios sample demo!
        </p>
      )}
    </div>
  );
};
