/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { MinimalForm } from './components/MinimalForm';
import { LivePreview } from './components/RightPanel/LivePreview';
import { ExportModal } from './components/ExportModal';

import { VideoSlot, GeneratorConfig, ExportProgressState } from './types';
import { DEFAULT_CONFIG, INITIAL_SLOTS, createDefaultLogoUrl } from './utils/sampleData';
import { renderAndExportVideo } from './utils/videoRenderer';

export default function App() {
  const [config, setConfig] = useState<GeneratorConfig>(() => ({
    ...DEFAULT_CONFIG,
    logoUrl: createDefaultLogoUrl('B', 'BERTEMIOS'),
  }));

  const [slots, setSlots] = useState<VideoSlot[]>(INITIAL_SLOTS);

  const [exportState, setExportState] = useState<ExportProgressState>({
    isExporting: false,
    stage: 'idle',
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    fps: 30,
    elapsedSeconds: 0,
  });

  const abortControllerRef = useRef<{ aborted: boolean }>({ aborted: false });

  // Update a single slot
  const handleUpdateSlot = (index: number, updates: Partial<VideoSlot>) => {
    setSlots((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], ...updates };
      }
      return next;
    });
  };

  // Remove a video from slot
  const handleRemoveSlot = (index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      if (next[index]) {
        if (next[index].url && next[index].url.startsWith('blob:')) {
          URL.revokeObjectURL(next[index].url);
        }
        next[index] = {
          ...next[index],
          file: null,
          url: '',
          title: `Video #${next[index].rank}`,
          isVideoLoaded: false,
          duration: 3.5,
        };
      }
      return next;
    });
  };

  // Helper to generate animated video demo clips with synthesized audio tone
  const generateDemoClipBlob = async (rank: number, title: string, color: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const dest = audioCtx.createMediaStreamDestination();

    osc.type = rank === 1 ? 'sine' : rank === 2 ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(rank === 1 ? 523.25 : rank === 2 ? 440 : 329.63, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    const canvasStream = canvas.captureStream(30);
    dest.stream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));

    const mimeTypes = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    const chosenMime = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

    return new Promise((resolve) => {
      let recorder: MediaRecorder;
      try {
        recorder = chosenMime ? new MediaRecorder(canvasStream, { mimeType: chosenMime }) : new MediaRecorder(canvasStream);
      } catch {
        osc.stop();
        return resolve('');
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        osc.stop();
        audioCtx.close().catch(() => {});
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        resolve(URL.createObjectURL(blob));
      };

      recorder.start();

      let frame = 0;
      const totalFrames = 90; // 3 seconds demo

      const draw = () => {
        if (frame >= totalFrames) {
          if (recorder.state === 'recording') recorder.stop();
          return;
        }

        const t = frame / 30;
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (rank === 1) {
          grad.addColorStop(0, '#B45309');
          grad.addColorStop(0.5, '#78350F');
          grad.addColorStop(1, '#1C1917');
        } else if (rank === 2) {
          grad.addColorStop(0, '#1D4ED8');
          grad.addColorStop(0.5, '#1E3A8A');
          grad.addColorStop(1, '#0F172A');
        } else {
          grad.addColorStop(0, '#C2410C');
          grad.addColorStop(0.5, '#7C2D12');
          grad.addColorStop(1, '#18181B');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 14; i++) {
          const x = (Math.sin(t * 1.5 + i * 0.9) * 0.45 + 0.5) * canvas.width;
          const y = (Math.cos(t * 1.8 + i * 1.2) * 0.45 + 0.5) * canvas.height;
          const radius = 12 + Math.sin(t * 3 + i) * 8;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(3, radius), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 32px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 12;
        ctx.fillText(title.toUpperCase(), canvas.width / 2, canvas.height / 2 - 15);

        ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(`Rank #${rank} • ${Math.round(t * 10) / 10}s`, canvas.width / 2, canvas.height / 2 + 25);
        ctx.shadowBlur = 0;

        frame++;
        requestAnimationFrame(draw);
      };

      draw();
    });
  };

  // Load sample presets
  const handleLoadPreset = async (presetName: string) => {
    if (presetName === 'viral') {
      const [u1, u2, u3] = await Promise.all([
        generateDemoClipBlob(1, 'Insane 1v4 Clutch Win', '#F59E0B'),
        generateDemoClipBlob(2, 'Impossible Trickshot', '#38BDF8'),
        generateDemoClipBlob(3, 'Viral Comedy Moment', '#EA580C'),
      ]);

      setConfig({
        ...DEFAULT_CONFIG,
        title: 'TOP 3 VIRAL TIKTOKS',
        logoUrl: createDefaultLogoUrl('B', 'BERTEMIOS'),
        watermarkText: 'By @bertemios',
      });

      setSlots([
        {
          id: 'slot-1',
          rank: 1,
          file: null,
          url: u1,
          title: 'Insane 1v4 Clutch Win',
          viewCount: '18.4M',
          duration: 3,
          currentTime: 0,
          volume: 1,
          isMuted: false,
          isVideoLoaded: true,
        },
        {
          id: 'slot-2',
          rank: 2,
          file: null,
          url: u2,
          title: 'Impossible Trickshot',
          viewCount: '9.8M',
          duration: 3,
          currentTime: 0,
          volume: 1,
          isMuted: false,
          isVideoLoaded: true,
        },
        {
          id: 'slot-3',
          rank: 3,
          file: null,
          url: u3,
          title: 'Viral Comedy Moment',
          viewCount: '5.2M',
          duration: 3,
          currentTime: 0,
          volume: 1,
          isMuted: false,
          isVideoLoaded: true,
        },
      ]);
    } else if (presetName === 'gaming') {
      const [u1, u2, u3] = await Promise.all([
        generateDemoClipBlob(1, 'World Record Speedrun', '#F59E0B'),
        generateDemoClipBlob(2, 'Epic Boss Fight Kill', '#38BDF8'),
        generateDemoClipBlob(3, 'Unbelievable Glitch', '#EA580C'),
      ]);

      setConfig({
        ...DEFAULT_CONFIG,
        title: 'TOP 3 GAMING CLUTCHES',
        logoUrl: createDefaultLogoUrl('🎮', 'GAMING'),
        watermarkText: 'By @esports_hub',
      });

      setSlots([
        {
          id: 'slot-1',
          rank: 1,
          file: null,
          url: u1,
          title: 'World Record Speedrun',
          viewCount: '24.1M',
          duration: 3,
          currentTime: 0,
          volume: 1,
          isMuted: false,
          isVideoLoaded: true,
        },
        {
          id: 'slot-2',
          rank: 2,
          file: null,
          url: u2,
          title: 'Epic Boss Fight Kill',
          viewCount: '11.5M',
          duration: 3,
          currentTime: 0,
          volume: 1,
          isMuted: false,
          isVideoLoaded: true,
        },
        {
          id: 'slot-3',
          rank: 3,
          file: null,
          url: u3,
          title: 'Unbelievable Glitch',
          viewCount: '6.8M',
          duration: 3,
          currentTime: 0,
          volume: 1,
          isMuted: false,
          isVideoLoaded: true,
        },
      ]);
    }
  };

  // Reset to default template
  const handleReset = () => {
    setConfig({
      ...DEFAULT_CONFIG,
      logoUrl: createDefaultLogoUrl('B', 'BERTEMIOS'),
    });
    setSlots(INITIAL_SLOTS);
    setExportState({
      isExporting: false,
      stage: 'idle',
      progress: 0,
      currentFrame: 0,
      totalFrames: 0,
      fps: 30,
      elapsedSeconds: 0,
    });
  };

  // Generate MP4 video
  const handleGenerate = async () => {
    abortControllerRef.current = { aborted: false };

    // Auto-generate demo clips for any empty slots so export always succeeds
    const effectiveSlots = [...slots];
    for (let i = 0; i < effectiveSlots.length; i++) {
      if (!effectiveSlots[i].url) {
        const demoUrl = await generateDemoClipBlob(
          effectiveSlots[i].rank,
          effectiveSlots[i].title || `Clip #${effectiveSlots[i].rank}`,
          effectiveSlots[i].rank === 1 ? '#F59E0B' : effectiveSlots[i].rank === 2 ? '#38BDF8' : '#EA580C'
        );
        effectiveSlots[i] = {
          ...effectiveSlots[i],
          url: demoUrl,
          duration: 3,
          isVideoLoaded: true,
        };
      }
    }
    setSlots(effectiveSlots);

    try {
      await renderAndExportVideo(
        effectiveSlots,
        config,
        (progressUpdates) => {
          setExportState((prev) => ({ ...prev, ...progressUpdates }));
        },
        abortControllerRef.current
      );
    } catch (err: any) {
      if (err.message !== 'Export was cancelled.') {
        console.error('Video generation error:', err);
        setExportState((prev) => ({
          ...prev,
          isExporting: false,
          stage: 'error',
          errorMessage: err?.message || 'Failed to render video',
        }));
      } else {
        setExportState((prev) => ({
          ...prev,
          isExporting: false,
          stage: 'idle',
          progress: 0,
        }));
      }
    }
  };

  const handleCancelExport = () => {
    abortControllerRef.current.aborted = true;
    setExportState((prev) => ({
      ...prev,
      isExporting: false,
      stage: 'idle',
      progress: 0,
    }));
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F8FAFC] flex flex-col selection:bg-[#7C3AED] selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        onLoadPreset={handleLoadPreset}
        onReset={handleReset}
        isExporting={exportState.isExporting}
      />

      {/* Main Minimal Generator: Clean Form + One Preview */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Clean Minimal Form with 6 controls */}
          <div className="lg:col-span-7">
            <MinimalForm
              config={config}
              slots={slots}
              onUpdateConfig={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
              onUpdateSlot={handleUpdateSlot}
              onRemoveSlot={handleRemoveSlot}
              onGenerate={handleGenerate}
              onCancel={handleCancelExport}
              exportState={exportState}
            />
          </div>

          {/* Right Column: Live TikTok 1080x1920 Preview */}
          <div className="lg:col-span-5 flex justify-center sticky top-24">
            <LivePreview slots={slots} config={config} />
          </div>
        </div>
      </main>

      {/* Export Download Modal */}
      <ExportModal
        exportState={exportState}
        onClose={() => setExportState((prev) => ({ ...prev, stage: 'idle' }))}
      />
    </div>
  );
}
