export interface VideoSlot {
  id: string;
  rank: 1 | 2 | 3;
  file: File | null;
  url: string;
  title: string;
  viewCount: string;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isVideoLoaded: boolean;
  aspectRatio?: number;
}

export interface GeneratorConfig {
  title: string;
  logoUrl: string;
  logoFile: File | null;
  watermarkText: string;
  themeColor: string;
  fontFamily: string;
  badgeStyle: 'modern-glass' | 'neon-glow' | 'solid-bold' | 'gold-tier';
  resolution: '1080x1920' | '720x1280';
  fps: 30 | 60;
  transitionDuration: number; // in seconds, default 0.3s
  videoFit: 'cover' | 'contain';
  renderEngine: 'ffmpeg-wasm' | 'hardware-accelerated';
}

export interface ExportProgressState {
  isExporting: boolean;
  stage: 'idle' | 'preparing' | 'rendering' | 'muxing' | 'finished' | 'error';
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  fps: number;
  elapsedSeconds: number;
  errorMessage?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  currentScene?: number; // 3, 2, or 1
}

export interface SequentialSceneState {
  activeSlotIndex: number; // 2 for Rank 3, 1 for Rank 2, 0 for Rank 1
  activeSlot: VideoSlot;
  sceneTime: number; // time relative to current clip (0 to activeSlot.duration)
  sceneProgress: number; // 0 to 1 for current clip
  transitionProgress: number; // 0 (normal) to 1 (peak transition)
  overallTime: number;
  totalDuration: number;
}
