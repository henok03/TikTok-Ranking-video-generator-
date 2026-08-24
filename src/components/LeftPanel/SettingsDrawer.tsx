import React from 'react';
import { Sliders, Gauge, Monitor, Sparkles, Wand2, Layers } from 'lucide-react';
import { GeneratorConfig } from '../../types';

interface SettingsDrawerProps {
  config: GeneratorConfig;
  onChange: (updates: Partial<GeneratorConfig>) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="bg-[#141221]/90 border border-white/10 rounded-[20px] p-4 lg:p-5 shadow-xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#A855F7] group-hover:rotate-45 transition-transform" />
          <span className="text-sm font-semibold text-gray-200">
            Export & Rendering Engine Settings
          </span>
        </div>
        <span className="text-xs font-semibold text-[#C084FC] px-2.5 py-1 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/40">
          {config.resolution} • {config.fps}fps • H.264 MP4
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          {/* Resolution Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
              <Monitor className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>Export Resolution (Vertical 9:16)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ resolution: '1080x1920' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  config.resolution === '1080x1920'
                    ? 'bg-[#7C3AED] border-[#A855F7] text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                1080x1920 (TikTok Crisp 1080p)
              </button>
              <button
                type="button"
                onClick={() => onChange({ resolution: '720x1280' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  config.resolution === '720x1280'
                    ? 'bg-[#7C3AED] border-[#A855F7] text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                720x1280 (Fast Draft 720p)
              </button>
            </div>
          </div>

          {/* Video Fit Mode */}
          <div>
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>Video Frame Fit</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ videoFit: 'contain' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  config.videoFit === 'contain'
                    ? 'bg-[#7C3AED] border-[#A855F7] text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                Contain (Full Video + Blurred BG)
              </button>
              <button
                type="button"
                onClick={() => onChange({ videoFit: 'cover' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  config.videoFit === 'cover'
                    ? 'bg-[#7C3AED] border-[#A855F7] text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                Cover (Cropped Fill)
              </button>
            </div>
          </div>

          {/* Framerate Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
              <Gauge className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>Frame Rate</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ fps: 30 })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  config.fps === 30
                    ? 'bg-[#7C3AED] border-[#A855F7] text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                30 FPS (Standard H.264)
              </button>
              <button
                type="button"
                onClick={() => onChange({ fps: 60 })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  config.fps === 60
                    ? 'bg-[#7C3AED] border-[#A855F7] text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                60 FPS (Pro Fluid Motion)
              </button>
            </div>
          </div>

          {/* Transition Duration Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#A855F7]" />
                Scene Transition Smoothness
              </span>
              <span className="text-[#C084FC]">{config.transitionDuration || 0.35}s</span>
            </div>
            <input
              type="range"
              min={0.15}
              max={0.8}
              step={0.05}
              value={config.transitionDuration || 0.35}
              onChange={(e) => onChange({ transitionDuration: parseFloat(e.target.value) })}
              className="w-full accent-[#7C3AED] cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
