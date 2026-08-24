import { VideoSlot, GeneratorConfig } from '../types';

export const DEFAULT_CONFIG: GeneratorConfig = {
  title: 'TOP 3  VIDEOS',
  logoUrl: '',
  logoFile: null,
  watermarkText: 'By MR RANK',
  themeColor: '#7C3AED',
  fontFamily: 'Montserrat',
  badgeStyle: 'modern-glass',
  resolution: '1080x1920',
  fps: 30,
  transitionDuration: 0.35,
  videoFit: 'contain',
  renderEngine: 'ffmpeg-wasm',
};

// Generate an SVG-based default logo data URL
export function createDefaultLogoUrl(letter = 'B', text = 'BERTEMIOS'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#7C3AED;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#A855F7;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#7C3AED" flood-opacity="0.5"/>
      </filter>
    </defs>
    <circle cx="100" cy="100" r="92" fill="url(#grad1)" stroke="#FFFFFF" stroke-width="6" filter="url(#glow)"/>
    <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="6,6"/>
    <text x="100" y="112" font-family="Montserrat, sans-serif" font-size="70" font-weight="900" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${letter}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_SLOTS: VideoSlot[] = [
  {
    id: 'slot-1',
    rank: 1,
    file: null,
    url: '',
    title: 'Unbelievable 1v5 Clutch',
    viewCount: '7M',
    duration: 3.5,
    currentTime: 0,
    volume: 1,
    isMuted: false,
    isVideoLoaded: false,
  },
  {
    id: 'slot-2',
    rank: 2,
    file: null,
    url: '',
    title: 'Insane Trickshot Finale',
    viewCount: '9M',
    duration: 3.5,
    currentTime: 0,
    volume: 1,
    isMuted: false,
    isVideoLoaded: false,
  },
  {
    id: 'slot-3',
    rank: 3,
    file: null,
    url: '',
    title: 'Viral Comedy Masterpiece',
    viewCount: '5M',
    duration: 3.5,
    currentTime: 0,
    volume: 1,
    isMuted: false,
    isVideoLoaded: false,
  },
];
