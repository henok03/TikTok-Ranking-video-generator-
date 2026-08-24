import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { VideoSlot, GeneratorConfig, ExportProgressState, SequentialSceneState } from '../types';

export interface FrameElements {
  logoImg?: HTMLImageElement | null;
  videoElements: (HTMLVideoElement | HTMLCanvasElement | null)[];
  currentTime: number; // overall global playback time in seconds
}

/**
 * Calculates current sequential scene state given the overall timestamp
 */
export function getSequentialSceneState(
  currentTime: number,
  slots: VideoSlot[],
  transitionDuration = 0.35
): SequentialSceneState {
  // Slots: Slot 0 = Rank 1, Slot 1 = Rank 2, Slot 2 = Rank 3
  // Order of playback: Scene 1 (Rank 3) -> Scene 2 (Rank 2) -> Scene 3 (Rank 1)
  const slot3 = slots.find((s) => s.rank === 3) || slots[2] || slots[0];
  const slot2 = slots.find((s) => s.rank === 2) || slots[1] || slots[0];
  const slot1 = slots.find((s) => s.rank === 1) || slots[0];

  const dur3 = Math.max(1, slot3.duration || 3.5);
  const dur2 = Math.max(1, slot2.duration || 3.5);
  const dur1 = Math.max(1, slot1.duration || 3.5);

  const totalDuration = dur3 + dur2 + dur1;
  const clampedTime = Math.max(0, Math.min(currentTime, totalDuration));

  if (clampedTime < dur3) {
    // Scene 1: Rank 3
    const sceneTime = clampedTime;
    const sceneProgress = sceneTime / dur3;
    const timeUntilEnd = dur3 - sceneTime;
    const transitionProgress = timeUntilEnd < transitionDuration ? 1 - timeUntilEnd / transitionDuration : 0;

    return {
      activeSlotIndex: slots.indexOf(slot3),
      activeSlot: slot3,
      sceneTime,
      sceneProgress,
      transitionProgress,
      overallTime: clampedTime,
      totalDuration,
    };
  } else if (clampedTime < dur3 + dur2) {
    // Scene 2: Rank 2
    const sceneTime = clampedTime - dur3;
    const sceneProgress = sceneTime / dur2;
    const timeUntilEnd = dur2 - sceneTime;
    const transitionProgress = timeUntilEnd < transitionDuration ? 1 - timeUntilEnd / transitionDuration : 0;

    return {
      activeSlotIndex: slots.indexOf(slot2),
      activeSlot: slot2,
      sceneTime,
      sceneProgress,
      transitionProgress,
      overallTime: clampedTime,
      totalDuration,
    };
  } else {
    // Scene 3: Rank 1 (Winner)
    const sceneTime = clampedTime - (dur3 + dur2);
    const sceneProgress = Math.min(1, sceneTime / dur1);
    const transitionProgress = 0; // Final scene

    return {
      activeSlotIndex: slots.indexOf(slot1),
      activeSlot: slot1,
      sceneTime,
      sceneProgress,
      transitionProgress,
      overallTime: clampedTime,
      totalDuration,
    };
  }
}

/**
 * Draws a single 1080x1920 sequential ranking frame
 */
export function drawSequentialRankingFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: GeneratorConfig,
  slots: VideoSlot[],
  elements: FrameElements
) {
  const sceneState = getSequentialSceneState(
    elements.currentTime,
    slots,
    config.transitionDuration || 0.35
  );

  const activeSlot = sceneState.activeSlot;
  const activeVideoElem = elements.videoElements[sceneState.activeSlotIndex];

  // 0. CLEAR ENTIRE CANVAS: Prevent any ghost/stacked frames
  ctx.clearRect(0, 0, width, height);

  // 1. BACKGROUND: Deep cinematic canvas with themed glow
  ctx.fillStyle = '#0B0B0F';
  ctx.fillRect(0, 0, width, height);

  // Radial ambient glows
  const topGlow = ctx.createRadialGradient(width / 2, 180, 20, width / 2, 180, 600);
  topGlow.addColorStop(0, 'rgba(124, 58, 237, 0.35)');
  topGlow.addColorStop(0.5, 'rgba(124, 58, 237, 0.08)');
  topGlow.addColorStop(1, 'rgba(11, 11, 15, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, width, height);

  // Dynamic bottom/center glow matching current rank theme
  const centerGlow = ctx.createRadialGradient(width / 2, 1050, 40, width / 2, 1050, 800);
  if (activeSlot.rank === 1) {
    centerGlow.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
    centerGlow.addColorStop(0.6, 'rgba(217, 119, 6, 0.04)');
  } else if (activeSlot.rank === 2) {
    centerGlow.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
    centerGlow.addColorStop(0.6, 'rgba(30, 58, 138, 0.04)');
  } else {
    centerGlow.addColorStop(0, 'rgba(249, 115, 22, 0.14)');
    centerGlow.addColorStop(0.6, 'rgba(124, 45, 18, 0.04)');
  }
  centerGlow.addColorStop(1, 'rgba(11, 11, 15, 0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, width, height);

  // High-tech subtle grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  const gridSize = 70;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. PERSISTENT HEADER (Respects 80px Top Safe Margin)
  const logoCenterX = width / 2;
  const logoRadius = 56;
  const logoCenterY = 80 + logoRadius; // 136px (starts right at 80px top safe line)

  // Outer logo glow & ring
  ctx.save();
  ctx.shadowColor = 'rgba(124, 58, 237, 0.7)';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(logoCenterX, logoCenterY, logoRadius + 4, 0, Math.PI * 2);
  ctx.fillStyle = '#7C3AED';
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(logoCenterX, logoCenterY, logoRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#171524';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // Draw Logo Image if provided
  if (elements.logoImg && elements.logoImg.complete && elements.logoImg.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCenterX, logoCenterY, logoRadius - 2, 0, Math.PI * 2);
    ctx.clip();

    const img = elements.logoImg;
    const minSide = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - minSide) / 2;
    const sy = (img.naturalHeight - minSide) / 2;
    ctx.drawImage(
      img,
      sx,
      sy,
      minSide,
      minSide,
      logoCenterX - logoRadius,
      logoCenterY - logoRadius,
      logoRadius * 2,
      logoRadius * 2
    );
    ctx.restore();
  } else {
    // Default Stylized Channel Logo Letter
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const firstLetter = (config.title || 'B').trim().charAt(0) || 'R';
    ctx.fillText(firstLetter.toUpperCase(), logoCenterX, logoCenterY + 2);
  }

  // Persistent Ranking Title centered directly below the logo (Increased by 15-20%)
  const titleY = 222;
  const titleText = (config.title || 'TOP 3 TIKTOKS').toUpperCase();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 15–20% larger bold uppercase typography
  let fontSize = 38;
  if (titleText.length > 28) fontSize = 28;
  else if (titleText.length > 20) fontSize = 32;
  else if (titleText.length > 14) fontSize = 35;

  ctx.font = `900 ${fontSize}px Montserrat, sans-serif`;

  const textMetrics = ctx.measureText(titleText);
  const titleWidth = Math.min(width - 120, textMetrics.width + 60);
  const titleHeight = fontSize + 20;

  const pillX = (width - titleWidth) / 2;
  const pillY = titleY - titleHeight / 2;
  const pillBottom = pillY + titleHeight;

  // Glass pill backdrop
  ctx.fillStyle = 'rgba(20, 18, 32, 0.88)';
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.5)';
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, pillX, pillY, titleWidth, titleHeight, 16);
  ctx.fill();
  ctx.stroke();

  // Title Text
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(titleText, width / 2, titleY + 1);
  ctx.restore();

  // 3. MAIN VIDEO FRAME (Centered 92% width = 994px, Top: 28px below title pill, Border Radius: 26px)
  const frameW = Math.round(width * 0.92); // 994px (92% width)
  const frameH = 1400;
  const frameX = (width - frameW) / 2; // 43px
  const frameY = Math.round(pillBottom + 28); // Exactly 28px space between title pill and video
  const frameRadius = 26;

  // Video Frame Card Outer Glow & Background
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  drawRoundedRect(ctx, frameX, frameY, frameW, frameH, frameRadius);
  ctx.fillStyle = '#12101D';
  ctx.fill();
  ctx.restore();

  // Clip and draw the single active video clip (object-fit: contain with blurred background, never cropped)
  ctx.save();
  drawRoundedRect(ctx, frameX, frameY, frameW, frameH, frameRadius);
  ctx.clip();

  // Fill solid dark base inside clip
  ctx.fillStyle = '#050508';
  ctx.fillRect(frameX, frameY, frameW, frameH);

  let hasDrawnVideo = false;

  if (activeVideoElem) {
    try {
      const isVideo = activeVideoElem instanceof HTMLVideoElement;
      const srcW = isVideo ? (activeVideoElem.videoWidth || 640) : activeVideoElem.width;
      const srcH = isVideo ? (activeVideoElem.videoHeight || 360) : activeVideoElem.height;

      if (srcW > 0 && srcH > 0) {
        const targetRatio = frameW / frameH;
        const srcRatio = srcW / srcH;

        // 1. BLURRED AMBIENT BACKGROUND (fills any empty space with blurred video, never raw black bars)
        let sx = 0, sy = 0, sw = srcW, sh = srcH;
        if (srcRatio > targetRatio) {
          sw = srcH * targetRatio;
          sx = (srcW - sw) / 2;
        } else {
          sh = srcW / targetRatio;
          sy = (srcH - sh) / 2;
        }

        ctx.save();
        if ('filter' in ctx) {
          ctx.filter = 'blur(32px) brightness(0.5) saturate(1.25)';
        }
        // Draw slightly enlarged background so blur edges don't show bleed inside clip
        ctx.drawImage(activeVideoElem, sx, sy, sw, sh, frameX - 35, frameY - 35, frameW + 70, frameH + 70);
        ctx.restore();

        // Dark ambient overlay for crisp foreground contrast
        ctx.fillStyle = 'rgba(10, 8, 18, 0.4)';
        ctx.fillRect(frameX, frameY, frameW, frameH);

        // 2. FOREGROUND: FULL ORIGINAL VIDEO (object-fit: contain)
        // Never cropped, perfectly centered, 100% full original aspect ratio (9:16, 3:4, 1:1, 16:9, etc.)
        const scale = Math.min(frameW / srcW, frameH / srcH);
        const dw = Math.round(srcW * scale);
        const dh = Math.round(srcH * scale);
        const dx = Math.round(frameX + (frameW - dw) / 2);
        const dy = Math.round(frameY + (frameH - dh) / 2);

        // Soft drop shadow behind foreground video when aspect ratio differs
        if (dw < frameW - 2 || dh < frameH - 2) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
          ctx.drawImage(activeVideoElem, 0, 0, srcW, srcH, dx, dy, dw, dh);
          ctx.restore();
        }

        // Draw crisp original unblurred foreground video
        ctx.drawImage(activeVideoElem, 0, 0, srcW, srcH, dx, dy, dw, dh);

        hasDrawnVideo = true;
      }
    } catch (err) {
      console.warn('Active video frame draw notice:', err);
    }
  }

  if (!hasDrawnVideo) {
    // Dynamic placeholder for current rank
    const pGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
    if (activeSlot.rank === 1) {
      pGrad.addColorStop(0, '#311F07');
      pGrad.addColorStop(0.5, '#451A03');
      pGrad.addColorStop(1, '#1A0B02');
    } else if (activeSlot.rank === 2) {
      pGrad.addColorStop(0, '#0F2338');
      pGrad.addColorStop(0.5, '#1E3A5F');
      pGrad.addColorStop(1, '#0B111A');
    } else {
      pGrad.addColorStop(0, '#2D1609');
      pGrad.addColorStop(0.5, '#451C08');
      pGrad.addColorStop(1, '#180B04');
    }
    ctx.fillStyle = pGrad;
    ctx.fillRect(frameX, frameY, frameW, frameH);

    // Centered placeholder text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`VIDEO #${activeSlot.rank}`, frameX + frameW / 2, frameY + frameH / 2 - 20);

    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(activeSlot.title || 'Upload clip to preview', frameX + frameW / 2, frameY + frameH / 2 + 35);
  }

  ctx.restore(); // End video clip

  // Thin 2px Video Frame Outer Border
  ctx.save();
  let frameBorderColor = 'rgba(255, 255, 255, 0.25)';
  if (activeSlot.rank === 1) frameBorderColor = 'rgba(245, 158, 11, 0.75)';
  else if (activeSlot.rank === 2) frameBorderColor = 'rgba(56, 189, 248, 0.65)';
  else if (activeSlot.rank === 3) frameBorderColor = 'rgba(251, 146, 60, 0.65)';

  ctx.strokeStyle = frameBorderColor;
  ctx.lineWidth = 2; // Thin 2px border
  drawRoundedRect(ctx, frameX, frameY, frameW, frameH, frameRadius);
  ctx.stroke();
  ctx.restore();

  // 4. OVERLAYS INSIDE VIDEO FRAME:
  // UNIFIED RANK + VIEWS COMBINED BADGE
  const viewCountText = (activeSlot.viewCount || '1.0M').trim();
  const viewsLabel = `• ${viewCountText} VIEWS`;

  ctx.save();
  ctx.font = '900 30px Montserrat, sans-serif';
  const viewsMetrics = ctx.measureText(viewsLabel);

  const unifiedPillH = 86;
  const rankSquareSize = 70;
  const pillPaddingLeft = 8;
  const pillPaddingRight = 24;
  const contentGap = 16;
  const unifiedPillW = pillPaddingLeft + rankSquareSize + contentGap + viewsMetrics.width + pillPaddingRight;
  
  // Safe zone placement:
  // - Left: 20px inside video frame
  // - Bottom: 90px above video bottom edge
  const unifiedPillX = frameX + 20;
  const unifiedPillY = frameY + frameH - 90 - unifiedPillH;

  let rankGradient = ctx.createLinearGradient(unifiedPillX, unifiedPillY, unifiedPillX + rankSquareSize, unifiedPillY + unifiedPillH);
  let rankBorder = '#FB923C';
  let rankGlow = 'rgba(249, 115, 22, 0.8)';
  let bgStyle = 'rgba(26, 16, 10, 0.94)';
  let borderStyle = 'rgba(251, 146, 60, 0.9)';

  if (activeSlot.rank === 1) {
    rankGradient.addColorStop(0, '#F59E0B');
    rankGradient.addColorStop(0.6, '#D97706');
    rankGradient.addColorStop(1, '#78350F');
    rankBorder = '#FDE68A';
    rankGlow = 'rgba(245, 158, 11, 0.9)';
    bgStyle = 'rgba(28, 18, 8, 0.95)';
    borderStyle = 'rgba(245, 158, 11, 0.9)';
  } else if (activeSlot.rank === 2) {
    rankGradient.addColorStop(0, '#38BDF8');
    rankGradient.addColorStop(0.6, '#0284C7');
    rankGradient.addColorStop(1, '#0F172A');
    rankBorder = '#BAE6FD';
    rankGlow = 'rgba(56, 189, 248, 0.8)';
    bgStyle = 'rgba(10, 18, 28, 0.95)';
    borderStyle = 'rgba(56, 189, 248, 0.85)';
  } else {
    rankGradient.addColorStop(0, '#EA580C');
    rankGradient.addColorStop(0.6, '#C2410C');
    rankGradient.addColorStop(1, '#431407');
    rankBorder = '#FED7AA';
    rankGlow = 'rgba(234, 88, 12, 0.8)';
    bgStyle = 'rgba(28, 14, 8, 0.95)';
    borderStyle = 'rgba(251, 146, 60, 0.9)';
  }

  // 1. Outer Rounded Rectangle with Brown/Gold Floating Glass Style
  ctx.fillStyle = bgStyle;
  ctx.strokeStyle = borderStyle;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  drawRoundedRect(ctx, unifiedPillX, unifiedPillY, unifiedPillW, unifiedPillH, 22);
  ctx.fill();
  ctx.stroke();

  // Subtle inner highlight border
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, unifiedPillX + 1.5, unifiedPillY + 1.5, unifiedPillW - 3, unifiedPillH - 3, 20.5);
  ctx.stroke();

  // 2. Left Side: Large Rank Number Badge
  const badgeX = unifiedPillX + pillPaddingLeft;
  const badgeY = unifiedPillY + (unifiedPillH - rankSquareSize) / 2;

  ctx.shadowColor = rankGlow;
  ctx.shadowBlur = 14;
  ctx.fillStyle = rankGradient;
  ctx.strokeStyle = rankBorder;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, badgeX, badgeY, rankSquareSize, rankSquareSize, 15);
  ctx.fill();
  ctx.stroke();

  // Large Bold Rank Number (3 / 2 / 1)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 46px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${activeSlot.rank}`, badgeX + rankSquareSize / 2, badgeY + rankSquareSize / 2 + 1);

  // 3. Right Side: • 5.2M VIEWS (in the same badge)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '900 30px Montserrat, sans-serif';
  ctx.fillText(viewsLabel, badgeX + rankSquareSize + contentGap, unifiedPillY + unifiedPillH / 2 + 1);
  ctx.restore();

  // 5. BOTTOM SECTION (Above TikTok Bottom Safe Zone)
  // - Thin progress bar directly under the video: y = frameY + frameH + 12
  const bottomBarY = frameY + frameH + 12;
  const bottomBarH = 6;
  const bottomBarW = frameW;
  const segW = (bottomBarW - 16) / 3;

  // Segment 1 (Rank 3)
  ctx.fillStyle = sceneState.activeSlot.rank === 3 ? '#FB923C' : '#2D2740';
  drawRoundedRect(ctx, frameX, bottomBarY, segW, bottomBarH, 3);
  ctx.fill();

  // Segment 2 (Rank 2)
  ctx.fillStyle = sceneState.activeSlot.rank === 2 ? '#38BDF8' : '#2D2740';
  drawRoundedRect(ctx, frameX + segW + 8, bottomBarY, segW, bottomBarH, 3);
  ctx.fill();

  // Segment 3 (Rank 1)
  ctx.fillStyle = sceneState.activeSlot.rank === 1 ? '#F59E0B' : '#2D2740';
  drawRoundedRect(ctx, frameX + (segW + 8) * 2, bottomBarY, segW, bottomBarH, 3);
  ctx.fill();

  // Bottom Watermark: Centered "By @username" with thin decorative lines on both sides
  const watermarkText = (config.watermarkText || 'By @bertemios').trim();
  if (watermarkText) {
    ctx.save();
    ctx.font = '700 23px "Plus Jakarta Sans", Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const wMetrics = ctx.measureText(watermarkText);
    const textHalfW = wMetrics.width / 2;
    const watermarkY = bottomBarY + 34;

    // Thin decorative lines on both sides
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;

    const lineGap = 16;
    const lineMargin = 32;

    const lineStartLeft = frameX + lineMargin;
    const lineEndLeft = (width / 2) - textHalfW - lineGap;
    if (lineEndLeft > lineStartLeft) {
      ctx.beginPath();
      ctx.moveTo(lineStartLeft, watermarkY);
      ctx.lineTo(lineEndLeft, watermarkY);
      ctx.stroke();
    }

    const lineStartRight = (width / 2) + textHalfW + lineGap;
    const lineEndRight = frameX + frameW - lineMargin;
    if (lineEndRight > lineStartRight) {
      ctx.beginPath();
      ctx.moveTo(lineStartRight, watermarkY);
      ctx.lineTo(lineEndRight, watermarkY);
      ctx.stroke();
    }

    // Watermark text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(watermarkText, width / 2, watermarkY + 1);
    ctx.restore();
  }
}

/**
 * Helper to draw a rounded rectangle
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Helper to create an offscreen video element and seek to exact timestamp
 */
export function createOffscreenVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.muted = true;
    video.preload = 'auto';
    video.src = url;

    video.onloadedmetadata = () => {
      resolve(video);
    };

    video.onerror = () => {
      reject(new Error(`Failed to load video from URL: ${url}`));
    };
  });
}

/**
 * Seeks a video element to a precise time and waits for that exact frame to actually be
 * decoded and ready to paint (not just for 'seeked' to fire).
 *
 * IMPORTANT: the 'seeked' event fires as soon as the seek *operation* completes, which in
 * most browsers happens BEFORE the new frame has finished decoding/compositing. If you
 * drawImage() the video right after 'seeked', you frequently grab the previous frame again
 * — over a whole export that shows up as duplicated/stale frames (stutter).
 *
 * The fix is requestVideoFrameCallback, but ORDER MATTERS: it must be armed BEFORE
 * `currentTime` is assigned. Arming it afterwards (e.g. inside a 'seeked' handler) can miss
 * that frame's callback window entirely on a paused, off-DOM video and hang forever — which
 * is also why this resolves faster than a fixed multi-frame wait: it fires the instant the
 * real frame is ready, no artificial padding.
 */
export function seekVideo(video: HTMLVideoElement, targetTime: number): Promise<void> {
  return new Promise((resolve) => {
    const clampedTime = Math.max(0, Math.min(targetTime, (video.duration || 10) - 0.05));

    // Close enough to skip re-seeking (covers back-to-back frames that map to the same
    // source frame at low fps), but still tight enough to avoid reusing a stale frame when
    // the target time actually moved.
    if (Math.abs(video.currentTime - clampedTime) < 0.008) {
      resolve();
      return;
    }

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    if (typeof (video as any).requestVideoFrameCallback === 'function') {
      // Arm BEFORE the seek — this is the part that must come first.
      (video as any).requestVideoFrameCallback(() => settle());
    } else {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        requestAnimationFrame(() => requestAnimationFrame(() => settle()));
      };
      video.addEventListener('seeked', onSeeked, { once: true });
    }

    video.currentTime = clampedTime;

    // Safety net in case neither fires at all (corrupt/odd source, browser quirk).
    setTimeout(settle, 400);
  });
}

/**
 * Extracts and decodes audio buffers from video URLs using Web Audio API
 */
export async function extractAudioFromVideos(
  slots: VideoSlot[],
  audioContext: AudioContext
): Promise<(AudioBuffer | null)[]> {
  const buffers: (AudioBuffer | null)[] = [];

  for (const slot of slots) {
    if (!slot.url) {
      buffers.push(null);
      continue;
    }

    try {
      const res = await fetch(slot.url);
      const arrayBuf = await res.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuf);
      buffers.push(audioBuffer);
    } catch (err) {
      console.warn(`Could not extract native audio from slot #${slot.rank}:`, err);
      buffers.push(null);
    }
  }

  return buffers;
}

/**
 * Builds sequential mixed audio buffer for the full duration:
 * [Scene 1: Video 3 Audio] -> [Scene 2: Video 2 Audio] -> [Scene 3: Video 1 Audio]
 */
export function buildSequentialAudioBuffer(
  audioBuffers: (AudioBuffer | null)[],
  slots: VideoSlot[],
  sampleRate = 48000
): AudioBuffer {
  const slot3 = slots.find((s) => s.rank === 3) || slots[2] || slots[0];
  const slot2 = slots.find((s) => s.rank === 2) || slots[1] || slots[0];
  const slot1 = slots.find((s) => s.rank === 1) || slots[0];

  const dur3 = Math.max(1, slot3.duration || 3.5);
  const dur2 = Math.max(1, slot2.duration || 3.5);
  const dur1 = Math.max(1, slot1.duration || 3.5);

  const totalDuration = dur3 + dur2 + dur1;
  const totalSamples = Math.ceil(totalDuration * sampleRate);

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate,
  });
  const outputBuffer = audioCtx.createBuffer(2, totalSamples, sampleRate);

  const leftChannel = outputBuffer.getChannelData(0);
  const rightChannel = outputBuffer.getChannelData(1);

  // Helper to copy slice into destination at sample offset
  const copyAudio = (
    buffer: AudioBuffer | null,
    startOffsetSec: number,
    durationSec: number
  ) => {
    if (!buffer) return;
    const startSample = Math.floor(startOffsetSec * sampleRate);
    const numSamples = Math.min(
      Math.floor(durationSec * sampleRate),
      Math.floor(buffer.duration * sampleRate)
    );

    const srcLeft = buffer.getChannelData(0);
    const srcRight = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : srcLeft;

    for (let i = 0; i < numSamples && startSample + i < totalSamples; i++) {
      leftChannel[startSample + i] = srcLeft[i % srcLeft.length];
      rightChannel[startSample + i] = srcRight[i % srcRight.length];
    }
  };

  const idx3 = slots.indexOf(slot3);
  const idx2 = slots.indexOf(slot2);
  const idx1 = slots.indexOf(slot1);

  copyAudio(audioBuffers[idx3], 0, dur3);
  copyAudio(audioBuffers[idx2], dur3, dur2);
  copyAudio(audioBuffers[idx1], dur3 + dur2, dur1);

  return outputBuffer;
}

export interface RenderSegment {
  rank: number;
  slot: VideoSlot;
  slotIndex: number;
  duration: number;
  startOverallTime: number;
  frameCount: number;
}

/**
 * Main sequential rendering and export controller
 */
export async function renderAndExportVideo(
  slots: VideoSlot[],
  config: GeneratorConfig,
  onProgress: (state: Partial<ExportProgressState>) => void,
  abortSignal: { aborted: boolean }
): Promise<string> {
  const width = config.resolution === '720x1280' ? 720 : 1080;
  const height = config.resolution === '720x1280' ? 1280 : 1920;
  const fps = config.fps || 30;

  onProgress({
    isExporting: true,
    stage: 'preparing',
    progress: 5,
    currentFrame: 0,
    fps,
  });

  // Calculate isolated segment durations (Sequence: Video 3 -> Video 2 -> Video 1)
  const slot3 = slots.find((s) => s.rank === 3) || slots[2] || slots[0];
  const slot2 = slots.find((s) => s.rank === 2) || slots[1] || slots[0];
  const slot1 = slots.find((s) => s.rank === 1) || slots[0];

  const dur3 = Math.max(1, slot3.duration || 3.5);
  const dur2 = Math.max(1, slot2.duration || 3.5);
  const dur1 = Math.max(1, slot1.duration || 3.5);

  const frames3 = Math.ceil(dur3 * fps);
  const frames2 = Math.ceil(dur2 * fps);
  const frames1 = Math.ceil(dur1 * fps);
  const totalFrames = frames3 + frames2 + frames1;
  const totalDuration = dur3 + dur2 + dur1;

  const segments: RenderSegment[] = [
    {
      rank: 3,
      slot: slot3,
      slotIndex: slots.indexOf(slot3),
      duration: dur3,
      startOverallTime: 0,
      frameCount: frames3,
    },
    {
      rank: 2,
      slot: slot2,
      slotIndex: slots.indexOf(slot2),
      duration: dur2,
      startOverallTime: dur3,
      frameCount: frames2,
    },
    {
      rank: 1,
      slot: slot1,
      slotIndex: slots.indexOf(slot1),
      duration: dur1,
      startOverallTime: dur3 + dur2,
      frameCount: frames1,
    },
  ];

  // 1. Prepare Logo Image
  let logoImg: HTMLImageElement | null = null;
  if (config.logoUrl) {
    logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = config.logoUrl;
    await new Promise((res) => {
      if (!logoImg) return res(null);
      logoImg.onload = () => res(logoImg);
      logoImg.onerror = () => res(null);
    });
  }

  // 2. Audio pipeline: decode and mix sequential audio
  let mixedAudioBuffer: AudioBuffer | null = null;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 48000,
    });
    const individualBuffers = await extractAudioFromVideos(slots, audioContext);
    mixedAudioBuffer = buildSequentialAudioBuffer(individualBuffers, slots, 48000);
  } catch (err) {
    console.warn('Audio preparation note:', err);
  }

  // 3. Create Offscreen Canvas for Frame Rendering
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Check if WebCodecs VideoEncoder is available
  const hasWebCodecs = typeof (window as any).VideoEncoder === 'function';

  if (hasWebCodecs) {
    return await renderWithWebCodecs(
      canvas,
      ctx,
      width,
      height,
      fps,
      segments,
      totalDuration,
      totalFrames,
      config,
      slots,
      logoImg,
      mixedAudioBuffer,
      onProgress,
      abortSignal
    );
  } else {
    return await renderWithFFmpegWasm(
      canvas,
      ctx,
      width,
      height,
      fps,
      segments,
      totalDuration,
      totalFrames,
      config,
      slots,
      logoImg,
      mixedAudioBuffer,
      onProgress,
      abortSignal
    );
  }
}

/**
 * WebCodecs + MP4 Muxer segment-isolated pipeline with forced keyframes & zero frame bleed
 */
async function renderWithWebCodecs(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fps: number,
  segments: RenderSegment[],
  totalDuration: number,
  totalFrames: number,
  config: GeneratorConfig,
  slots: VideoSlot[],
  logoImg: HTMLImageElement | null,
  mixedAudioBuffer: AudioBuffer | null,
  onProgress: (state: Partial<ExportProgressState>) => void,
  abortSignal: { aborted: boolean }
): Promise<string> {
  const target = new ArrayBufferTarget();

  const muxerConfig: any = {
    target,
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'in-memory',
  };

  if (mixedAudioBuffer) {
    muxerConfig.audio = {
      codec: 'aac',
      numberOfChannels: 2,
      sampleRate: 48000,
    };
  }

  const muxer = new Muxer(muxerConfig);

  // Initialize VideoEncoder (H.264 High Profile / yuv420p standard)
  let encoderError: Error | null = null;
  const videoEncoder = new (window as any).VideoEncoder({
    output: (chunk: any, meta: any) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e: any) => {
      console.error('VideoEncoder error:', e);
      encoderError = e;
    },
  });

  const bitrates = width === 1080 ? 12_000_000 : 7_000_000;
  videoEncoder.configure({
    codec: 'avc1.640028', // H.264 High Profile Level 4.0 (yuv420p standard)
    width,
    height,
    bitrate: bitrates,
    framerate: fps,
  });

  // AudioEncoder if audio is present
  let audioEncoder: any = null;
  if (mixedAudioBuffer && typeof (window as any).AudioEncoder === 'function') {
    try {
      audioEncoder = new (window as any).AudioEncoder({
        output: (chunk: any, meta: any) => {
          muxer.addAudioChunk(chunk, meta);
        },
        error: (e: any) => {
          console.warn('AudioEncoder warning:', e);
        },
      });

      audioEncoder.configure({
        codec: 'mp4a.40.2', // AAC LC
        numberOfChannels: 2,
        sampleRate: 48000,
        bitrate: 192_000,
      });

      const audioData = new (window as any).AudioData({
        format: 'f32-planar',
        sampleRate: 48000,
        numberOfFrames: mixedAudioBuffer.length,
        numberOfChannels: 2,
        timestamp: 0,
        data: (() => {
          const l = mixedAudioBuffer.getChannelData(0);
          const r = mixedAudioBuffer.numberOfChannels > 1 ? mixedAudioBuffer.getChannelData(1) : l;
          const merged = new Float32Array(l.length + r.length);
          merged.set(l, 0);
          merged.set(r, l.length);
          return merged;
        })(),
      });

      audioEncoder.encode(audioData);
      audioData.close();
      await audioEncoder.flush();
    } catch (err) {
      console.warn('Native AAC encoding fallback:', err);
    }
  }

  onProgress({
    stage: 'rendering',
    progress: 10,
    totalFrames,
    currentFrame: 0,
  });

  const startTime = Date.now();
  let globalFrameIndex = 0;

  // Prefetch the first segment's video before the loop begins so segment 0 is not
  // slower than the rest of the pipeline.
  let nextVideoPromise: Promise<HTMLVideoElement | null> | null =
    segments[0]?.slot.url
      ? createOffscreenVideo(segments[0].slot.url).catch((err) => {
          console.warn(`Could not load offscreen video for segment #${segments[0].rank}:`, err);
          return null;
        })
      : null;

  // Process each segment as a completely isolated video pass
  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const seg = segments[segIdx];

    if (abortSignal.aborted) {
      videoEncoder.close();
      throw new Error('Export was cancelled.');
    }

    // 1. Resolve this segment's video (was prefetched during the previous segment's
    // encoding, so there's no idle load time at the transition boundary).
    let segVideo: HTMLVideoElement | null = nextVideoPromise ? await nextVideoPromise : null;

    // Immediately kick off loading of the NEXT segment's video in the background so it's
    // ready by the time we get to it — this is what removes the stutter at scene cuts.
    const nextSeg = segments[segIdx + 1];
    nextVideoPromise = nextSeg?.slot.url
      ? createOffscreenVideo(nextSeg.slot.url).catch((err) => {
          console.warn(`Could not load offscreen video for segment #${nextSeg.rank}:`, err);
          return null;
        })
      : null;

    // 2. Clear canvas completely before segment begins
    ctx.clearRect(0, 0, width, height);

    // 3. Isolated elements array (contains ONLY this segment's video element)
    const isolatedElements: (HTMLVideoElement | null)[] = [null, null, null];
    isolatedElements[seg.slotIndex] = segVideo;

    // 4. Render all frames in this segment
    for (let frameInSeg = 0; frameInSeg < seg.frameCount; frameInSeg++) {
      if (abortSignal.aborted) {
        if (segVideo) {
          segVideo.pause();
          segVideo.removeAttribute('src');
          segVideo.load();
        }
        videoEncoder.close();
        throw new Error('Export was cancelled.');
      }

      if (encoderError) {
        if (segVideo) {
          segVideo.pause();
          segVideo.removeAttribute('src');
          segVideo.load();
        }
        throw encoderError;
      }

      const segLocalTime = frameInSeg / fps;
      const overallCurrentTime = seg.startOverallTime + segLocalTime;

      // Seek isolated video element
      if (segVideo && segVideo.src) {
        await seekVideo(segVideo, segLocalTime);
      }

      // Clear canvas on every frame to prevent ghost/stacked frames
      ctx.clearRect(0, 0, width, height);

      // Draw single frame
      drawSequentialRankingFrame(ctx, width, height, config, slots, {
        logoImg,
        videoElements: isolatedElements,
        currentTime: overallCurrentTime,
      });

      // Create timestamped VideoFrame
      const timestampMicros = Math.round((globalFrameIndex * 1_000_000) / fps);
      const videoFrame = new (window as any).VideoFrame(canvas, {
        timestamp: timestampMicros,
        duration: Math.round(1_000_000 / fps),
      });

      // KEYFRAME ENFORCEMENT: Force a clean IDR keyframe at frame 0 of EVERY segment
      const isKeyFrame = frameInSeg === 0 || globalFrameIndex % (fps * 2) === 0;

      // Backpressure: don't let the encode queue balloon. On slower machines the encoder
      // can fall behind the frame-generation loop; encoding faster than it can keep up
      // wastes memory and can itself introduce stutter/drops later in the export.
      if (videoEncoder.encodeQueueSize > 8) {
        await new Promise<void>((resolve) => {
          const onDequeue = () => {
            videoEncoder.removeEventListener('dequeue', onDequeue);
            resolve();
          };
          videoEncoder.addEventListener('dequeue', onDequeue);
        });
      }

      videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
      videoFrame.close();

      globalFrameIndex++;

      // Progress reporting
      if (globalFrameIndex % 5 === 0 || globalFrameIndex === totalFrames) {
        const percent = Math.round(10 + (globalFrameIndex / totalFrames) * 80);
        onProgress({
          progress: percent,
          currentFrame: globalFrameIndex,
          totalFrames,
          elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
          currentScene: seg.rank,
        });
      }

      // Yield to keep the tab responsive; widened interval since backpressure above
      // already prevents runaway queue growth.
      if (globalFrameIndex % 30 === 0) {
        await new Promise((res) => setTimeout(res, 0));
      }
    }

    // 5. Complete unloading of previous segment video before next clip begins
    if (segVideo) {
      segVideo.pause();
      segVideo.removeAttribute('src');
      segVideo.load();
      segVideo = null;
    }
    ctx.clearRect(0, 0, width, height);
  }

  onProgress({
    stage: 'muxing',
    progress: 94,
  });

  await videoEncoder.flush();
  videoEncoder.close();

  muxer.finalize();

  const buffer = target.buffer;
  const mp4Blob = new Blob([buffer], { type: 'video/mp4' });
  const downloadUrl = URL.createObjectURL(mp4Blob);

  const cleanTitle = (config.title || 'ranking')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const fileName = `${cleanTitle}_ranking_1080x1920.mp4`;

  onProgress({
    isExporting: false,
    stage: 'finished',
    progress: 100,
    downloadUrl,
    fileName,
    fileSizeBytes: mp4Blob.size,
  });

  return downloadUrl;
}

/**
 * Fallback MediaRecorder pipeline with segment isolation and zero frame bleeding.
 *
 * Uses manual frame-pacing (captureStream(0) + track.requestFrame()) instead of a real-time
 * captureStream + per-frame setTimeout wait. The old approach tied rendering speed to
 * roughly real-time playback (a 10s video took ~10s+ to render no matter how fast the
 * machine was); manual mode lets the loop push frames as fast as draw+encode allow.
 */
async function renderWithFFmpegWasm(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fps: number,
  segments: RenderSegment[],
  totalDuration: number,
  totalFrames: number,
  config: GeneratorConfig,
  slots: VideoSlot[],
  logoImg: HTMLImageElement | null,
  mixedAudioBuffer: AudioBuffer | null,
  onProgress: (state: Partial<ExportProgressState>) => void,
  abortSignal: { aborted: boolean }
): Promise<string> {
  onProgress({
    stage: 'preparing',
    progress: 10,
    errorMessage: undefined,
  });

  // Manual frame pacing needs feature detection BEFORE we decide the capture mode: a
  // captureStream(0) stream never auto-advances, so if requestFrame() isn't supported we
  // must fall back to captureStream(fps) (real-time) instead, or the recording would hang.
  const probeTrack = canvas.captureStream(0).getVideoTracks()[0] as any;
  const canRequestFrame = typeof probeTrack?.requestFrame === 'function';
  probeTrack?.stop?.();

  const stream = canRequestFrame ? canvas.captureStream(0) : canvas.captureStream(fps);
  const videoTrack = stream.getVideoTracks()[0] as any;

  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  if (mixedAudioBuffer) {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000,
      });
      const source = audioCtx.createBufferSource();
      source.buffer = mixedAudioBuffer;
      audioDestination = audioCtx.createMediaStreamDestination();
      source.connect(audioDestination);
      source.start();

      audioDestination.stream.getAudioTracks().forEach((track) => {
        stream.addTrack(track);
      });
    } catch (err) {
      console.warn('Stream audio track addition notice:', err);
    }
  }

  const mimeTypes = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=h264',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  const chosenMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

  const recorder = chosenMime
    ? new MediaRecorder(stream, {
        mimeType: chosenMime,
        videoBitsPerSecond: 10_000_000,
      })
    : new MediaRecorder(stream);

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/mp4' });
      resolve(blob);
    };
  });

  recorder.start(100);

  onProgress({
    stage: 'rendering',
    progress: 15,
    totalFrames,
    currentFrame: 0,
  });

  const startTime = Date.now();
  let globalFrameIndex = 0;

  // Prefetch first segment's video ahead of the loop (same fix as the WebCodecs path).
  let nextVideoPromise: Promise<HTMLVideoElement | null> | null =
    segments[0]?.slot.url
      ? createOffscreenVideo(segments[0].slot.url).catch((err) => {
          console.warn(`Could not load offscreen video for segment #${segments[0].rank}:`, err);
          return null;
        })
      : null;

  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const seg = segments[segIdx];

    if (abortSignal.aborted) {
      if (recorder.state === 'recording') recorder.stop();
      throw new Error('Export was cancelled.');
    }

    let segVideo: HTMLVideoElement | null = nextVideoPromise ? await nextVideoPromise : null;

    // Prefetch the next segment while this one renders/encodes — removes the load-time
    // stutter at scene boundaries.
    const nextSeg = segments[segIdx + 1];
    nextVideoPromise = nextSeg?.slot.url
      ? createOffscreenVideo(nextSeg.slot.url).catch((err) => {
          console.warn(`Could not load offscreen video for segment #${nextSeg.rank}:`, err);
          return null;
        })
      : null;

    ctx.clearRect(0, 0, width, height);
    const isolatedElements: (HTMLVideoElement | null)[] = [null, null, null];
    isolatedElements[seg.slotIndex] = segVideo;

    for (let frameInSeg = 0; frameInSeg < seg.frameCount; frameInSeg++) {
      if (abortSignal.aborted) {
        if (segVideo) {
          segVideo.pause();
          segVideo.removeAttribute('src');
          segVideo.load();
        }
        if (recorder.state === 'recording') recorder.stop();
        throw new Error('Export was cancelled.');
      }

      const segLocalTime = frameInSeg / fps;
      const overallCurrentTime = seg.startOverallTime + segLocalTime;

      if (segVideo && segVideo.src) {
        await seekVideo(segVideo, segLocalTime);
      }

      ctx.clearRect(0, 0, width, height);

      drawSequentialRankingFrame(ctx, width, height, config, slots, {
        logoImg,
        videoElements: isolatedElements,
        currentTime: overallCurrentTime,
      });

      // Push this frame into the recorder stream immediately instead of waiting on a
      // real-time clock. Falls back to the old timer pacing if requestFrame() isn't
      // supported by the browser.
      if (canRequestFrame) {
        videoTrack.requestFrame();
      }

      globalFrameIndex++;

      if (globalFrameIndex % 5 === 0 || globalFrameIndex === totalFrames) {
        const percent = Math.round(15 + (globalFrameIndex / totalFrames) * 75);
        onProgress({
          progress: percent,
          currentFrame: globalFrameIndex,
          totalFrames,
          elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
          currentScene: seg.rank,
        });
      }

      // Small yield to keep the tab responsive and let the MediaRecorder actually drain
      // the frame we just pushed; NOT tied to real-time playback speed anymore.
      if (canRequestFrame) {
        if (globalFrameIndex % 10 === 0) {
          await new Promise((res) => setTimeout(res, 0));
        }
      } else {
        // No manual frame pushing available on this browser — fall back to real-time pacing
        // so captureStream(fps) still produces correctly spaced frames.
        await new Promise((res) => setTimeout(res, 1000 / fps / 2));
      }
    }

    if (segVideo) {
      segVideo.pause();
      segVideo.removeAttribute('src');
      segVideo.load();
      segVideo = null;
    }
    ctx.clearRect(0, 0, width, height);
  }

  onProgress({
    stage: 'muxing',
    progress: 92,
  });

  if (recorder.state === 'recording') {
    recorder.stop();
  }

  const rawBlob = await recordingPromise;
  const downloadUrl = URL.createObjectURL(rawBlob);

  const cleanTitle = (config.title || 'ranking')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const fileName = `${cleanTitle}_ranking_1080x1920.mp4`;

  onProgress({
    isExporting: false,
    stage: 'finished',
    progress: 100,
    downloadUrl,
    fileName,
    fileSizeBytes: rawBlob.size,
  });

  return downloadUrl;
}