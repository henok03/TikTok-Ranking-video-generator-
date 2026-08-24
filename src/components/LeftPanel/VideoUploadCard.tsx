import React, { useRef } from 'react';
import { Upload, Trash2, Eye, Play, Pause, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { VideoSlot } from '../../types';

interface VideoUploadCardProps {
  slot: VideoSlot;
  onUpdate: (updates: Partial<VideoSlot>) => void;
  onRemove: () => void;
}

const VIEW_QUICK_TAGS = ['5.6M', '9.4M', '14.8M', '25.2M', '50.1M'];

export const VideoUploadCard: React.FC<VideoUploadCardProps> = ({ slot, onUpdate, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const rankBadgeConfig = {
    1: {
      color: 'from-amber-400 to-amber-600',
      border: 'border-amber-400/60',
      text: 'text-amber-300',
      glow: 'shadow-amber-500/20',
      title: 'Video #1 — Top Place (Winner)',
      sceneInfo: 'Plays 3rd in final video (Climax Scene)',
      badgeBg: 'bg-amber-500',
    },
    2: {
      color: 'from-slate-300 to-slate-500',
      border: 'border-slate-300/60',
      text: 'text-slate-200',
      glow: 'shadow-slate-500/20',
      title: 'Video #2 — Second Place (Runner Up)',
      sceneInfo: 'Plays 2nd in final video (Mid Scene)',
      badgeBg: 'bg-slate-400',
    },
    3: {
      color: 'from-orange-500 to-orange-700',
      border: 'border-orange-500/60',
      text: 'text-orange-300',
      glow: 'shadow-orange-500/20',
      title: 'Video #3 — Third Place',
      sceneInfo: 'Plays 1st in final video (Opening Scene)',
      badgeBg: 'bg-orange-600',
    },
  }[slot.rank as 1 | 2 | 3];

  const handleFile = (file: File) => {
    if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|m4v)$/i))) {
      const url = URL.createObjectURL(file);
      onUpdate({
        file,
        url,
        title: file.name.replace(/\.[^/.]+$/, ''),
        isVideoLoaded: false,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-[#141221]/90 border border-white/10 rounded-[20px] p-4 lg:p-5 shadow-xl backdrop-blur-md relative overflow-hidden group">
      {/* Top Header Row with Rank Indicator and Title */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${rankBadgeConfig.color} border ${rankBadgeConfig.border} shadow-lg ${rankBadgeConfig.glow} flex items-center justify-center font-black text-white text-base shrink-0`}
          >
            {slot.rank}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
              <span>{rankBadgeConfig.title}</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              {rankBadgeConfig.sceneInfo}
            </p>
          </div>
        </div>

        {slot.url && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            title="Clear video"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content: Video Upload / Preview Area */}
      <div className="space-y-3.5">
        {slot.url ? (
          <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/15 aspect-video group/player">
            <video
              ref={videoRef}
              src={slot.url}
              playsInline
              muted={slot.isMuted}
              loop
              onLoadedMetadata={(e) => {
                const target = e.currentTarget;
                onUpdate({
                  duration: target.duration,
                  isVideoLoaded: true,
                  aspectRatio: target.videoWidth / target.videoHeight,
                });
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-cover"
            />

            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity flex flex-col justify-between p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/15">
                  Duration: {slot.duration ? `${Math.round(slot.duration * 10) / 10}s` : 'Calculating...'}
                </span>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white px-2.5 py-1 rounded-lg backdrop-blur-md transition-all cursor-pointer"
                >
                  Change Video
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => onUpdate({ isMuted: !slot.isMuted })}
                  className="text-xs bg-black/70 hover:bg-black/90 text-white px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  {slot.isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      <span>Audio Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-green-400" />
                      <span>Audio Enabled</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-[#7C3AED] hover:bg-[#7C3AED]/10 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#0B0B0F]/50 group/drop"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 group-hover/drop:bg-[#7C3AED]/20 border border-white/10 flex items-center justify-center mb-2 transition-all">
              <Upload className="w-5 h-5 text-[#C084FC]" />
            </div>
            <p className="text-xs font-semibold text-gray-200">
              Upload Video #{slot.rank} (MP4 / WebM / MOV)
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Plays full duration with native audio in Scene {slot.rank === 3 ? 1 : slot.rank === 2 ? 2 : 3}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          id={`video-input-${slot.rank}`}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* View Count Input Section */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={`views-input-${slot.rank}`}
              className="text-xs font-semibold text-gray-300 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>Video #{slot.rank} View Count</span>
            </label>
            <span className="text-[10px] text-gray-400">Shown bottom-right in Scene</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              id={`views-input-${slot.rank}`}
              type="text"
              value={slot.viewCount}
              onChange={(e) => onUpdate({ viewCount: e.target.value })}
              placeholder="e.g. 5.6M"
              className="flex-1 bg-[#0B0B0F] border border-white/15 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-white font-bold text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-600 placeholder:font-normal"
            />
          </div>

          {/* Quick tags for views */}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400">Presets:</span>
            {VIEW_QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onUpdate({ viewCount: tag })}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-[#7C3AED]/20 border border-white/10 hover:border-[#7C3AED]/40 text-gray-300 hover:text-white transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
