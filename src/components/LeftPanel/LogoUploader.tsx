import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, Check } from 'lucide-react';
import { createDefaultLogoUrl } from '../../utils/sampleData';

interface LogoUploaderProps {
  logoUrl: string;
  onLogoChange: (url: string, file: File | null) => void;
}

const PRESET_LOGOS = [
  { id: 'bertemios', name: 'Bertemios', letter: 'B' },
  { id: 'crown', name: 'Crown', letter: '👑' },
  { id: 'fire', name: 'Flame', letter: '🔥' },
  { id: 'star', name: 'Star', letter: '⭐' },
  { id: 'game', name: 'Gamer', letter: '🎮' },
];

export const LogoUploader: React.FC<LogoUploaderProps> = ({ logoUrl, onLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onLogoChange(url, file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|svg)$/i))) {
      const url = URL.createObjectURL(file);
      onLogoChange(url, file);
    }
  };

  const handleSelectPreset = (letter: string) => {
    const url = createDefaultLogoUrl(letter);
    onLogoChange(url, null);
  };

  const handleRemove = () => {
    onLogoChange('', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-[#141221]/90 border border-white/10 rounded-[20px] p-4 lg:p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#A855F7]" />
          <span>Top Circular Logo</span>
        </label>
        <span className="text-[11px] text-gray-400">PNG / JPG</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Logo Preview Circle */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-[#1A1829] border-2 border-dashed border-[#7C3AED]/60 flex items-center justify-center overflow-hidden shadow-lg p-0.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Channel Logo"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <ImageIcon className="w-6 h-6 text-gray-400 mb-0.5" />
                <span className="text-[10px] text-gray-400">No Logo</span>
              </div>
            )}
          </div>

          {logoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
              title="Remove logo"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Drop zone / Upload action */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 w-full border border-dashed border-white/20 hover:border-[#7C3AED] hover:bg-[#7C3AED]/10 rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#0B0B0F]/60"
        >
          <Upload className="w-5 h-5 text-[#C084FC] mb-1" />
          <p className="text-xs font-semibold text-gray-200">
            Click to upload or drag & drop
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Recommended: 500x500 square or circular image
          </p>
          <input
            ref={fileInputRef}
            id="logo-file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Preset Logo Selectors */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] text-gray-400 shrink-0">Presets:</span>
        {PRESET_LOGOS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset.letter)}
            className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#7C3AED]/20 border border-white/10 hover:border-[#7C3AED]/50 text-gray-300 hover:text-white flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <span className="w-4 h-4 rounded-full bg-[#7C3AED]/40 flex items-center justify-center text-[10px] font-bold">
              {preset.letter}
            </span>
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
