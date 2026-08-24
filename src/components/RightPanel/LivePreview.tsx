import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { VideoSlot, GeneratorConfig } from '../../types';
import { drawSequentialRankingFrame, getSequentialSceneState } from '../../utils/videoRenderer';

interface LivePreviewProps {
  slots: VideoSlot[];
  config: GeneratorConfig;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ slots, config }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Compute durations
  const slot3 = slots.find((s) => s.rank === 3) || slots[2] || slots[0];
  const slot2 = slots.find((s) => s.rank === 2) || slots[1] || slots[0];
  const slot1 = slots.find((s) => s.rank === 1) || slots[0];

  const dur3 = Math.max(1, slot3.duration || 3.5);
  const dur2 = Math.max(1, slot2.duration || 3.5);
  const dur1 = Math.max(1, slot1.duration || 3.5);
  const totalDuration = dur3 + dur2 + dur1;

  // Scene state for indicator
  const sceneState = getSequentialSceneState(
    currentTime,
    slots,
    config.transitionDuration || 0.35
  );

  // Track currently mounted slot index
  const currentSlotIndexRef = useRef<number>(-1);
  const currentSlotUrlRef = useRef<string>('');

  // Refs for loop
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const totalDurationRef = useRef(totalDuration);
  totalDurationRef.current = totalDuration;

  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  const configRef = useRef(config);
  configRef.current = config;

  // Helper: completely unload current video element to release memory & eliminate ghost frames
  const unloadCurrentVideo = useCallback(() => {
    const v = activeVideoRef.current;
    if (v) {
      v.pause();
      v.removeAttribute('src');
      v.load();
    }
    currentSlotIndexRef.current = -1;
    currentSlotUrlRef.current = '';
  }, []);

  // Render single frame on canvas with full clearing
  const renderCanvasFrame = useCallback((timeOverride?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const time = timeOverride !== undefined ? timeOverride : currentTimeRef.current;
    const currentScene = getSequentialSceneState(
      time,
      slotsRef.current,
      configRef.current.transitionDuration || 0.35
    );

    // Provide single active video element in array mapped by index
    const videoElements: (HTMLVideoElement | null)[] = [null, null, null];
    if (
      currentSlotIndexRef.current === currentScene.activeSlotIndex &&
      activeVideoRef.current &&
      activeVideoRef.current.readyState >= 2
    ) {
      videoElements[currentScene.activeSlotIndex] = activeVideoRef.current;
    }

    drawSequentialRankingFrame(ctx, 1080, 1920, configRef.current, slotsRef.current, {
      logoImg: logoImageRef.current,
      videoElements,
      currentTime: time,
    });
  }, []);

  // Load logo image
  useEffect(() => {
    if (config.logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = config.logoUrl;
      img.onload = () => {
        logoImageRef.current = img;
        renderCanvasFrame();
      };
      img.onerror = () => {
        logoImageRef.current = null;
        renderCanvasFrame();
      };
    } else {
      logoImageRef.current = null;
      renderCanvasFrame();
    }
  }, [config.logoUrl, config.title, renderCanvasFrame]);

  // Update audio muting on active video
  useEffect(() => {
    const v = activeVideoRef.current;
    if (v) {
      const activeSlot = slots[sceneState.activeSlotIndex];
      v.muted = isMuted || (activeSlot?.isMuted ?? false);
    }
  }, [isMuted, sceneState.activeSlotIndex, slots]);

  // Clean teardown on unmount
  useEffect(() => {
    return () => {
      unloadCurrentVideo();
    };
  }, [unloadCurrentVideo]);

  // Sync / Load single video when slot url changes
  useEffect(() => {
    const targetSlotIndex = sceneState.activeSlotIndex;
    const targetSlot = slots[targetSlotIndex];
    const targetUrl = targetSlot?.url || '';

    const v = activeVideoRef.current;
    if (!v) return;

    if (!targetUrl) {
      unloadCurrentVideo();
      renderCanvasFrame();
      return;
    }

    if (currentSlotIndexRef.current !== targetSlotIndex || currentSlotUrlRef.current !== targetUrl) {
      // Transition: Pause, remove previous source, load new source
      v.pause();
      v.removeAttribute('src');
      v.load();

      v.src = targetUrl;
      v.currentTime = Math.max(0, sceneState.sceneTime);
      v.muted = isMutedRef.current || targetSlot.isMuted || false;
      currentSlotIndexRef.current = targetSlotIndex;
      currentSlotUrlRef.current = targetUrl;
      v.load();
    }

    renderCanvasFrame();
  }, [slots, sceneState.activeSlotIndex, unloadCurrentVideo, renderCanvasFrame, sceneState.sceneTime]);

  // High-performance render loop using requestVideoFrameCallback (with requestAnimationFrame fallback)
  useEffect(() => {
    const v = activeVideoRef.current;

    if (!isPlaying) {
      if (v && !v.paused) {
        v.pause();
      }
      renderCanvasFrame(currentTimeRef.current);
      return;
    }

    let isRunning = true;
    let lastPerfTime = performance.now();
    let animHandle: number | null = null;
    let rvfcHandle: number | null = null;

    const tick = (now: number) => {
      if (!isRunning || !isPlayingRef.current) return;

      const deltaSec = (now - lastPerfTime) / 1000;
      lastPerfTime = now;

      // Advance virtual timeline
      let nextTime = currentTimeRef.current + deltaSec;
      if (nextTime >= totalDurationRef.current) {
        nextTime = 0; // Seamless loop back to Video 3
      }
      currentTimeRef.current = nextTime;
      setCurrentTime(nextTime);

      const currentScene = getSequentialSceneState(
        nextTime,
        slotsRef.current,
        configRef.current.transitionDuration || 0.35
      );

      const targetSlotIndex = currentScene.activeSlotIndex;
      const targetSlot = slotsRef.current[targetSlotIndex];
      const targetUrl = targetSlot?.url || '';

      const video = activeVideoRef.current;
      if (video) {
        // Scene switch: completely unload old clip and switch source cleanly
        if (currentSlotIndexRef.current !== targetSlotIndex || currentSlotUrlRef.current !== targetUrl) {
          video.pause();
          video.removeAttribute('src');
          video.load();

          if (targetUrl) {
            video.src = targetUrl;
            video.currentTime = Math.max(0, currentScene.sceneTime);
            video.muted = isMutedRef.current || targetSlot.isMuted || false;
            currentSlotIndexRef.current = targetSlotIndex;
            currentSlotUrlRef.current = targetUrl;
            video.load();
            video.play().catch(() => {});
          } else {
            currentSlotIndexRef.current = -1;
            currentSlotUrlRef.current = '';
          }
        } else if (targetUrl) {
          // Keep audio / video in sync
          video.muted = isMutedRef.current || targetSlot.isMuted || false;
          if (Math.abs(video.currentTime - currentScene.sceneTime) > 0.25) {
            video.currentTime = Math.max(0, currentScene.sceneTime);
          }
          if (video.paused) {
            video.play().catch(() => {});
          }
        }
      }

      renderCanvasFrame(nextTime);

      // Schedule next frame
      if (video && typeof (video as any).requestVideoFrameCallback === 'function' && targetUrl && !video.paused) {
        rvfcHandle = (video as any).requestVideoFrameCallback(() => {
          if (isRunning) {
            tick(performance.now());
          }
        });
      } else {
        animHandle = requestAnimationFrame(tick);
      }
    };

    animHandle = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animHandle !== null) cancelAnimationFrame(animHandle);
      if (rvfcHandle !== null && v && typeof (v as any).cancelVideoFrameCallback === 'function') {
        (v as any).cancelVideoFrameCallback(rvfcHandle);
      }
    };
  }, [isPlaying, renderCanvasFrame]);

  const togglePlay = () => {
    if (isPlaying) {
      if (activeVideoRef.current) activeVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setCurrentTime(0);
    currentTimeRef.current = 0;
    const v = activeVideoRef.current;
    if (v) {
      v.currentTime = 0;
    }
    renderCanvasFrame(0);
  };

  const activeRank = sceneState.activeSlot.rank;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Single Dedicated Offscreen Video Element */}
      <video
        ref={activeVideoRef}
        className="hidden"
        playsInline
        muted={isMuted}
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* 9:16 Mobile Phone Canvas Frame */}
      <div className="relative w-full max-w-[340px] sm:max-w-[370px] aspect-[9/16] rounded-[28px] overflow-hidden bg-black shadow-2xl shadow-purple-950/60 border-4 border-[#242038] group">
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className="w-full h-full object-contain cursor-pointer select-none"
          onClick={togglePlay}
        />

        {/* Play Overlay if Paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center cursor-pointer transition-all hover:bg-black/20"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-105 backdrop-blur-md">
              <Play className="w-8 h-8 ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Subtle Bottom Bar Inside Canvas Area */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-black text-white pointer-events-auto">
            Scene #{activeRank}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer"
              title="Restart preview"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-green-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
