import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Download, CheckCircle2, X, Film, Share2, Sparkles, Smartphone } from 'lucide-react';
import { ExportProgressState } from '../types';

interface ExportModalProps {
  exportState: ExportProgressState;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ exportState, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (exportState.stage === 'finished') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#A855F7', '#C084FC', '#F59E0B', '#38BDF8'],
        });
      } catch {
        // non-blocking
      }
    }
  }, [exportState.stage]);

  if (exportState.stage !== 'finished' || !exportState.downloadUrl) {
    return null;
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1080x1920 MP4';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleDownload = () => {
    if (!exportState.downloadUrl) return;
    const a = document.createElement('a');
    a.href = exportState.downloadUrl;
    a.download = exportState.fileName || 'ranking_video_1080x1920.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#141221] border border-white/15 rounded-[24px] max-w-lg w-full p-6 shadow-2xl shadow-purple-950/60 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#7C3AED]/30 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Video Generated Successfully!</h3>
              <p className="text-xs text-gray-400">Your 9:16 TikTok Ranking MP4 is ready</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Preview in Modal */}
        <div className="my-5 relative z-10 flex flex-col items-center">
          <div className="w-48 aspect-[9/16] rounded-2xl overflow-hidden bg-black border-2 border-[#7C3AED]/50 shadow-xl shadow-purple-500/20 relative">
            <video
              ref={videoRef}
              src={exportState.downloadUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
              1080 × 1920 MP4
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
              {formatFileSize(exportState.fileSizeBytes)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 relative z-10">
          <button
            id="btn-download-mp4-final"
            type="button"
            onClick={handleDownload}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#7C3AED] hover:opacity-95 text-white font-extrabold text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-purple-500/40 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download 1080x1920 MP4</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
          >
            Back to Editor
          </button>
        </div>
      </div>
    </div>
  );
};
