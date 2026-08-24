import React, { useRef } from 'react';
import {
  Upload,
  Trash2,
  Eye,
  Camera,
  Film,
  Sparkles,
  CheckCircle2,
  Loader2,
  Download,
} from 'lucide-react';
import { VideoSlot, GeneratorConfig, ExportProgressState } from '../types';

interface MinimalFormProps {
  config: GeneratorConfig;
  slots: VideoSlot[];
  onUpdateConfig: (updates: Partial<GeneratorConfig>) => void;
  onUpdateSlot: (index: number, updates: Partial<VideoSlot>) => void;
  onRemoveSlot: (index: number) => void;
  onGenerate: () => void;
  onCancel: () => void;
  exportState: ExportProgressState;
}

export const MinimalForm: React.FC<MinimalFormProps> = ({
  config,
  slots,
  onUpdateConfig,
  onUpdateSlot,
  onRemoveSlot,
  onGenerate,
  onCancel,
  exportState,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateConfig({ logoUrl: url, logoFile: file });
    }
  };

  // Find slots by rank (Rank 1, Rank 2, Rank 3)
  const slot1Index = slots.findIndex((s) => s.rank === 1);
  const slot2Index = slots.findIndex((s) => s.rank === 2);
  const slot3Index = slots.findIndex((s) => s.rank === 3);

  const orderedSlotIndices = [
    { rank: 1, index: slot1Index !== -1 ? slot1Index : 0, title: 'Video 1 (Winner • Climax)', color: 'border-amber-500/50 bg-amber-500/10 text-amber-300', badge: 'bg-gradient-to-br from-amber-400 to-amber-600' },
    { rank: 2, index: slot2Index !== -1 ? slot2Index : 1, title: 'Video 2 (Second Place)', color: 'border-sky-500/50 bg-sky-500/10 text-sky-300', badge: 'bg-gradient-to-br from-sky-400 to-sky-600' },
    { rank: 3, index: slot3Index !== -1 ? slot3Index : 2, title: 'Video 3 (Third Place • Opening)', color: 'border-orange-500/50 bg-orange-500/10 text-orange-300', badge: 'bg-gradient-to-br from-orange-500 to-orange-700' },
  ];

  return (
    <div className="w-full space-y-5 bg-[#141221]/90 border border-white/10 rounded-3xl p-5 lg:p-7 shadow-2xl backdrop-blur-md">
      {/* 1. Ranking Title */}
      <div className="space-y-1.5">
        <label
          htmlFor="input-ranking-title"
          className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5"
        >
          <span>1. Ranking Title</span>
        </label>
        <input
          id="input-ranking-title"
          type="text"
          value={config.title}
          onChange={(e) => onUpdateConfig({ title: e.target.value.toUpperCase() })}
          placeholder="e.g. TOP 3 TIKTOKS"
          className="w-full bg-[#0B0B0F] border border-white/15 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30 text-white font-extrabold text-sm sm:text-base rounded-2xl px-4 py-3 outline-none transition-all placeholder:text-gray-600 uppercase tracking-wide"
        />
      </div>

      {/* 2. Logo Upload & Watermark Handle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Logo Upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between">
            <span>2. Channel Logo</span>
            {config.logoUrl && (
              <button
                type="button"
                onClick={() => onUpdateConfig({ logoUrl: '', logoFile: undefined })}
                className="text-[11px] text-gray-400 hover:text-red-400 cursor-pointer font-semibold"
              >
                Reset
              </button>
            )}
          </label>

          <div className="flex items-center gap-3 bg-[#0B0B0F] border border-white/15 rounded-2xl p-2.5">
            <div
              onClick={() => logoInputRef.current?.click()}
              className="relative w-12 h-12 rounded-full bg-[#1C1830] border-2 border-[#7C3AED] flex items-center justify-center overflow-hidden cursor-pointer hover:border-white transition-all shrink-0 group"
              title="Upload new logo"
            >
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-lg font-black text-white">
                  {(config.title || 'B').trim().charAt(0) || 'B'}
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-full px-3 py-1.5 bg-[#1C1830] hover:bg-[#2A2447] border border-purple-500/40 text-purple-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3 h-3" />
                <span className="truncate">{config.logoUrl ? 'Change' : 'Upload'}</span>
              </button>
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Watermark / Channel Handle */}
        <div className="space-y-1.5">
          <label
            htmlFor="input-watermark"
            className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5"
          >
            <span>3. Watermark / Credit</span>
          </label>
          <div className="bg-[#0B0B0F] border border-white/15 focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/30 rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
            <span className="text-purple-400 font-bold text-sm">@</span>
            <input
              id="input-watermark"
              type="text"
              value={config.watermarkText?.replace(/^(@|By @)/, '') || ''}
              onChange={(e) =>
                onUpdateConfig({
                  watermarkText: e.target.value ? `By @${e.target.value.replace(/^(@|By @)/, '')}` : '',
                })
              }
              placeholder="yourchannel"
              className="w-full bg-transparent text-white font-bold text-sm outline-none placeholder:text-gray-600"
            />
          </div>
          <p className="text-[10px] text-gray-400 px-1">
            Rendered at the bottom: <span className="text-purple-300 font-semibold">{config.watermarkText || 'None'}</span>
          </p>
        </div>
      </div>

      {/* 4. Video Clips + Views */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold uppercase tracking-wider text-purple-300 block">
          <span>4. Video Clips & Views</span>
        </label>

        {orderedSlotIndices.map(({ rank, index, title, color, badge }) => {
          const slot = slots[index] || {
            id: `slot-${rank}`,
            rank,
            file: null,
            url: '',
            title: `Video #${rank}`,
            viewCount: rank === 1 ? '18.4M' : rank === 2 ? '9.8M' : '5.2M',
            duration: 3,
            currentTime: 0,
            volume: 1,
            isMuted: false,
            isVideoLoaded: false,
          };

          return (
            <VideoRowItem
              key={`slot-item-${rank}`}
              slot={slot}
              title={title}
              colorClass={color}
              badgeClass={badge}
              onUpdate={(updates) => onUpdateSlot(index, updates)}
              onRemove={() => onRemoveSlot(index)}
            />
          );
        })}
      </div>

      {/* 6. Generate MP4 Button */}
      <div className="pt-3">
        {exportState.isExporting ? (
          <div className="w-full bg-[#1C1830] border border-purple-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-purple-200">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                Rendering Video: {exportState.stage === 'rendering' ? `Frame ${exportState.currentFrame}/${exportState.totalFrames}` : 'Preparing audio & muxing...'}
              </span>
              <span className="font-mono">{exportState.progress}%</span>
            </div>

            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-200"
                style={{ width: `${Math.max(5, exportState.progress)}%` }}
              />
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="w-full text-xs text-red-400 hover:text-red-300 font-semibold py-1 transition-colors cursor-pointer"
            >
              Cancel Rendering
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#F59E0B] hover:from-[#6D28D9] hover:via-[#7E22CE] hover:to-[#D97706] text-white font-black text-base shadow-xl shadow-purple-900/40 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>Generate 1080×1920 MP4</span>
          </button>
        )}
      </div>
    </div>
  );
};

interface VideoRowItemProps {
  slot: VideoSlot;
  title: string;
  colorClass: string;
  badgeClass: string;
  onUpdate: (updates: Partial<VideoSlot>) => void;
  onRemove: () => void;
}

const VideoRowItem: React.FC<VideoRowItemProps> = ({
  slot,
  title,
  badgeClass,
  onUpdate,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|m4v)$/i))) {
      const url = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        const detectedDuration = tempVideo.duration && !isNaN(tempVideo.duration) && tempVideo.duration > 0
          ? tempVideo.duration
          : 3.5;
        onUpdate({
          file,
          url,
          title: file.name.replace(/\.[^/.]+$/, ''),
          duration: detectedDuration,
          isVideoLoaded: true,
        });
      };
      tempVideo.onerror = () => {
        onUpdate({
          file,
          url,
          title: file.name.replace(/\.[^/.]+$/, ''),
          isVideoLoaded: true,
        });
      };
    }
  };

  return (
    <div className="bg-[#0B0B0F] border border-white/15 rounded-2xl p-3.5 space-y-3">
      {/* Row Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl ${badgeClass} text-white font-black text-xs flex items-center justify-center shadow-md`}
          >
            #{slot.rank}
          </div>
          <span className="text-xs font-bold text-white">{title}</span>
        </div>

        {slot.url && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
            title="Remove video"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Video & Views Input Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
        {/* Video Picker (Col 7) */}
        <div className="sm:col-span-7">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-2.5 px-3 rounded-xl border border-dashed flex items-center justify-between gap-2 cursor-pointer transition-all ${
              slot.url
                ? 'bg-purple-950/30 border-purple-500/50 hover:border-purple-400 text-purple-200'
                : 'bg-white/5 border-white/20 hover:border-white/40 text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Film className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs font-semibold truncate">
                {slot.url ? slot.title || `Video #${slot.rank} (Loaded)` : `Choose Video #${slot.rank}`}
              </span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/10 shrink-0">
              {slot.url ? 'Change' : 'Browse'}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Views Count Input (Col 5) */}
        <div className="sm:col-span-5 flex items-center gap-1.5 bg-black/50 border border-white/15 focus-within:border-[#7C3AED] rounded-xl px-3 py-2">
          <Eye className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <input
            type="text"
            value={slot.viewCount || ''}
            onChange={(e) => onUpdate({ viewCount: e.target.value })}
            placeholder="Views (e.g. 18.4M)"
            className="w-full bg-transparent text-white font-bold text-xs outline-none placeholder:text-gray-600"
          />
        </div>
      </div>
    </div>
  );
};
