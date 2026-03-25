import type { BannerConfig, DerivedColors, LayoutResult, TextLineLayout } from '@/types/banner';
import { calculateLayout, calculateEnterkeyLayout, calculateCaseStudyLayout } from './layoutCalculator';
import { generateGradientStops } from '@/lib/color/overlayCalculator';
import layoutParamsJson from '@/config/layout.json';
import { renderStampToCanvas, resolveStampColor } from './stampRenderer';
import { placeStamp } from '@/lib/layout/stampPlacer';

const enterkeyConfig = layoutParamsJson.enterkeyStyle;

/**
 * Load a font and wait for it to be available.
 */
async function ensureFontLoaded(fontFamily: string, weight: string = '700'): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    await document.fonts.load(`${weight} 48px "${fontFamily}"`);
  } catch {
    // Font loading failed, fallback to system font
  }
}

/**
 * Load an image from a data URL or URL string.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Apply text shadow to canvas context.
 */
function applyTextShadow(
  ctx: CanvasRenderingContext2D,
  color: string = 'rgba(0, 0, 0, 0.5)',
  blur: number = 4,
  offsetX: number = 1,
  offsetY: number = 2
): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = offsetX;
  ctx.shadowOffsetY = offsetY;
}

/**
 * Clear text shadow from canvas context.
 */
function clearTextShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Draw text with word wrapping support.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fontSize: number,
  color: string,
  letterSpacing: number = 0,
  enableShadow: boolean = true
): void {
  ctx.fillStyle = color;
  ctx.font = `700 ${fontSize}px "Noto Sans JP", sans-serif`;
  ctx.textBaseline = 'top';

  if (enableShadow) {
    applyTextShadow(ctx, 'rgba(0, 0, 0, 0.45)', fontSize * 0.08, 1, 2);
  }

  if (letterSpacing > 0) {
    // Draw character by character for letter spacing
    const chars = [...text];
    let currentX = x;
    let currentY = y;

    for (const char of chars) {
      const charWidth = ctx.measureText(char).width;
      if (currentX + charWidth > x + maxWidth) {
        currentX = x;
        currentY += lineHeight;
      }
      ctx.fillText(char, currentX, currentY);
      currentX += charWidth + letterSpacing;
    }
  } else {
    ctx.fillText(text, x, y, maxWidth);
  }

  if (enableShadow) {
    clearTextShadow(ctx);
  }
}

/**
 * Draw rich text lines with per-segment styling and text shadow.
 */
function drawRichTextLines(
  ctx: CanvasRenderingContext2D,
  titleLineLayouts: TextLineLayout[]
): void {
  ctx.textBaseline = 'top';

  for (const line of titleLineLayouts) {
    for (const seg of line.segments) {
      ctx.font = `${seg.fontWeight} ${seg.fontSize}px "Noto Sans JP", sans-serif`;
      ctx.fillStyle = seg.color;
      applyTextShadow(ctx, 'rgba(0, 0, 0, 0.45)', seg.fontSize * 0.08, 1, 2);
      ctx.fillText(seg.text, seg.x, seg.y);
    }
  }
  clearTextShadow(ctx);
}

/**
 * Draw a striped triangle in a corner with improved visual quality.
 * corner: 'top-right' or 'bottom-left'
 */
function drawStripedTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  corner: string
): void {
  ctx.save();

  // Define triangle clip path
  ctx.beginPath();
  if (corner === 'top-right') {
    ctx.moveTo(x + size, y);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y);
  } else {
    // bottom-left
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y + size);
  }
  ctx.closePath();
  ctx.clip();

  // Semi-transparent fill behind stripes for depth
  ctx.fillStyle = color.replace(')', ', 0.08)').replace('rgb(', 'rgba(');
  if (color.startsWith('#')) {
    ctx.fillStyle = `${color}14`; // ~8% opacity hex
  }
  ctx.fillRect(x, y, size, size);

  // Draw 45-degree stripes with anti-aliased rendering
  ctx.strokeStyle = color;
  ctx.lineWidth = enterkeyConfig.stripeWidth;
  ctx.lineCap = 'square';
  const step = enterkeyConfig.stripeWidth + enterkeyConfig.stripeGap;
  const diagonal = size * 2;

  for (let i = -diagonal; i < diagonal; i += step) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + diagonal, y + diagonal);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw professional default background when no image is provided.
 * Uses subtle geometric pattern and multi-stop gradient.
 */
function drawProfessionalBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  derivedColors: DerivedColors
): void {
  // Multi-stop gradient for richer background
  const gradient = ctx.createLinearGradient(0, 0, width * 0.7, height);
  gradient.addColorStop(0, derivedColors.dark);
  gradient.addColorStop(0.3, derivedColors.medium);
  gradient.addColorStop(0.7, derivedColors.dark);
  gradient.addColorStop(1, derivedColors.medium);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle radial glow in center
  const radial = ctx.createRadialGradient(
    width * 0.4, height * 0.5, 0,
    width * 0.4, height * 0.5, width * 0.5
  );
  radial.addColorStop(0, `${derivedColors.medium}30`);
  radial.addColorStop(1, 'transparent');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // Subtle dot pattern for texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  const dotSpacing = 24;
  const dotRadius = 1;
  for (let px = 0; px < width; px += dotSpacing) {
    for (let py = 0; py < height; py += dotSpacing) {
      ctx.beginPath();
      ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Check if enterkey style should be used.
 * Uses enterkey layout when titleLines are provided.
 */
function useEnterkeyStyle(config: BannerConfig): boolean {
  return (config.titleLines && config.titleLines.length > 0) || config.photoClipStyle === 'skew';
}

/**
 * Render the banner onto a canvas element.
 * Layer order: background-color → background-image → overlay → decoration → title → logo
 */
export async function renderToCanvas(
  canvas: HTMLCanvasElement,
  config: BannerConfig,
  derivedColors: DerivedColors
): Promise<LayoutResult> {
  await ensureFontLoaded('Noto Sans JP');

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  canvas.width = config.width;
  canvas.height = config.height;

  const isCaseStudy = config.templateStyle === 'casestudy';
  const isEnterkey = !isCaseStudy && useEnterkeyStyle(config);
  const layout = isCaseStudy
    ? calculateCaseStudyLayout(config, derivedColors, ctx)
    : isEnterkey
      ? calculateEnterkeyLayout(config, derivedColors, ctx)
      : calculateLayout(config, derivedColors, ctx);

  if (isCaseStudy) {
    await renderCaseStudyStyle(ctx, canvas, config, derivedColors, layout);
  } else if (isEnterkey) {
    await renderEnterkeyStyle(ctx, canvas, config, derivedColors, layout);
  } else {
    await renderClassicStyle(ctx, canvas, config, derivedColors, layout);
  }

  return layout;
}

/**
 * Render classic (legacy) style banner.
 */
async function renderClassicStyle(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: BannerConfig,
  derivedColors: DerivedColors,
  layout: LayoutResult
): Promise<void> {
  // Layer 1: Background color
  ctx.fillStyle = derivedColors.light;
  ctx.fillRect(0, 0, config.width, config.height);

  // Layer 1b: Professional gradient background (when no background image)
  if (!config.backgroundImage) {
    drawProfessionalBackground(ctx, config.width, config.height, derivedColors);
  }

  // Layer 2: Background image (with manual adjustments)
  if (config.backgroundImage) {
    try {
      const img = await loadImage(config.backgroundImage);
      const bgAdj = config.manualAdjustments?.backgroundImage ?? { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };
      const baseScale = Math.max(
        config.width / img.width,
        config.height / img.height
      );
      const scale = baseScale * bgAdj.scaleX;
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const offsetX = (config.width - scaledW) / 2 + bgAdj.dx;
      const offsetY = (config.height - scaledH) / 2 + bgAdj.dy;
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
    } catch {
      // Failed to load image, keep gradient background
    }
  }

  // Layer 3: Overlay
  ctx.fillStyle = `rgba(${hexToRgb(layout.overlay.color)}, ${layout.overlay.opacity})`;
  ctx.fillRect(0, 0, config.width, config.height);

  // Layer 4: Decorations
  for (const decoration of layout.decorations) {
    if (!decoration.visible) continue;

    if (decoration.type.startsWith('stamp-')) {
      const resolvedColor = decoration.color || derivedColors.accent;
      renderStampToCanvas(
        ctx,
        {
          id: '',
          type: decoration.type,
          position: { x: decoration.x, y: decoration.y },
          size: decoration.width / config.width,
          color: 'custom',
          customColor: resolvedColor,
          opacity: decoration.opacity ?? 1,
          rotation: decoration.rotation ?? 0,
        },
        config.width,
        config.height,
        resolvedColor,
        decoration.x + decoration.width / 2,
        decoration.y + decoration.height / 2
      );
    } else {
      switch (decoration.type) {
        case 'stripe-border': {
          // L-shaped corner decoration (professional alternative to dashed border)
          const color = decoration.color || derivedColors.accent;
          const cornerLen = Math.min(decoration.width, decoration.height) * 0.15;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.setLineDash([]);

          // Top-left corner
          ctx.beginPath();
          ctx.moveTo(decoration.x, decoration.y + cornerLen);
          ctx.lineTo(decoration.x, decoration.y);
          ctx.lineTo(decoration.x + cornerLen, decoration.y);
          ctx.stroke();

          // Top-right corner
          ctx.beginPath();
          ctx.moveTo(decoration.x + decoration.width - cornerLen, decoration.y);
          ctx.lineTo(decoration.x + decoration.width, decoration.y);
          ctx.lineTo(decoration.x + decoration.width, decoration.y + cornerLen);
          ctx.stroke();

          // Bottom-left corner
          ctx.beginPath();
          ctx.moveTo(decoration.x, decoration.y + decoration.height - cornerLen);
          ctx.lineTo(decoration.x, decoration.y + decoration.height);
          ctx.lineTo(decoration.x + cornerLen, decoration.y + decoration.height);
          ctx.stroke();

          // Bottom-right corner
          ctx.beginPath();
          ctx.moveTo(decoration.x + decoration.width - cornerLen, decoration.y + decoration.height);
          ctx.lineTo(decoration.x + decoration.width, decoration.y + decoration.height);
          ctx.lineTo(decoration.x + decoration.width, decoration.y + decoration.height - cornerLen);
          ctx.stroke();
          break;
        }
        case 'accent-line': {
          ctx.fillStyle = derivedColors.accent;
          ctx.fillRect(decoration.x, decoration.y, decoration.width, decoration.height);
          break;
        }
      }
    }
  }

  // Render stamps from config.stamps array
  const placedBoxes: Array<{ x: number; y: number; width: number; height: number }> = [];
  for (const stamp of config.stamps) {
    const stampSize = stamp.size * config.width;
    let cx: number;
    let cy: number;

    if (stamp.position === 'auto') {
      const pos = placeStamp(stampSize, config.width, config.height, placedBoxes);
      cx = pos.x;
      cy = pos.y;
    } else {
      cx = stamp.position.x;
      cy = stamp.position.y;
    }

    placedBoxes.push({ x: cx - stampSize / 2, y: cy - stampSize / 2, width: stampSize, height: stampSize });
    const resolvedColor = resolveStampColor(stamp, derivedColors);
    renderStampToCanvas(ctx, stamp, config.width, config.height, resolvedColor, cx, cy);
  }

  // Layer 5: Title with highlight keyword (or placeholder)
  if (!config.title && (!config.titleLines || config.titleLines.length === 0)) {
    // Draw placeholder text when no title is set
    const titleLayout = layout.title;
    const placeholderFontSize = titleLayout.fontSize || 36;
    ctx.font = `400 ${placeholderFontSize}px "Noto Sans JP", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textBaseline = 'top';
    ctx.fillText('タイトルを入力してください', titleLayout.x, titleLayout.y, titleLayout.width);
  }
  if (config.title) {
    const titleLayout = layout.title;

    // Draw highlight keyword band first (behind text)
    if (config.highlightKeyword && config.title.includes(config.highlightKeyword)) {
      const kw = layout.highlightKeyword;
      ctx.font = `700 ${kw.fontSize}px "Noto Sans JP", sans-serif`;
      const kwMetrics = ctx.measureText(config.highlightKeyword);
      const bandWidth = kwMetrics.width + kw.bandPadding * 2;
      const bandHeight = (kw.fontSize || 0) + kw.bandPadding * 2;

      // Center the band
      const bandX = kw.x + (kw.width - bandWidth) / 2;
      ctx.fillStyle = kw.bandColor;
      ctx.fillRect(bandX, kw.y, bandWidth, bandHeight);

      // Draw keyword text on band
      ctx.fillStyle = kw.color || '#ffffff';
      ctx.textBaseline = 'top';
      ctx.fillText(
        config.highlightKeyword,
        bandX + kw.bandPadding,
        kw.y + kw.bandPadding
      );

      // Draw rest of title (before keyword)
      const parts = config.title.split(config.highlightKeyword);
      const beforeKeyword = parts[0];
      const afterKeyword = parts.slice(1).join(config.highlightKeyword);
      if (beforeKeyword) {
        drawWrappedText(
          ctx,
          beforeKeyword.trim(),
          titleLayout.x,
          titleLayout.y,
          titleLayout.width,
          titleLayout.lineHeight || titleLayout.height,
          titleLayout.fontSize || 48,
          titleLayout.color || '#ffffff',
          titleLayout.letterSpacing
        );
      }
      // Draw text after keyword
      if (afterKeyword) {
        const kwWidth = ctx.measureText(config.highlightKeyword).width + kw.bandPadding * 2;
        const bandX2 = kw.x + (kw.width - (ctx.measureText(config.highlightKeyword).width + kw.bandPadding * 2)) / 2;
        drawWrappedText(
          ctx,
          afterKeyword.trim(),
          bandX2 + kwWidth + 4,
          kw.y + kw.bandPadding,
          titleLayout.width,
          titleLayout.lineHeight || titleLayout.height,
          titleLayout.fontSize || 48,
          titleLayout.color || '#ffffff',
          titleLayout.letterSpacing
        );
      }
    } else {
      // No keyword, draw title normally
      drawWrappedText(
        ctx,
        config.title,
        titleLayout.x,
        titleLayout.y,
        titleLayout.width,
        titleLayout.lineHeight || titleLayout.height,
        titleLayout.fontSize || 48,
        titleLayout.color || '#ffffff',
        titleLayout.letterSpacing
      );
    }
  }

  // Layer 6: Logo
  if (config.logoImage) {
    try {
      const logoImg = await loadImage(config.logoImage);
      const logoLayout = layout.logo;

      // Maintain aspect ratio
      const logoAspect = logoImg.width / logoImg.height;
      let drawW = logoLayout.width;
      let drawH = drawW / logoAspect;
      if (drawH > logoLayout.height) {
        drawH = logoLayout.height;
        drawW = drawH * logoAspect;
      }

      const drawX = logoLayout.x + (logoLayout.width - drawW) / 2;
      const drawY = logoLayout.y + (logoLayout.height - drawH) / 2;

      ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
    } catch {
      // Failed to load logo
    }
  }
}

/**
 * Render enterkey-style banner with skewed photo, rich text, and striped corners.
 */
async function renderEnterkeyStyle(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: BannerConfig,
  derivedColors: DerivedColors,
  layout: LayoutResult
): Promise<void> {
  const { width, height } = config;

  // Layer 1: Dark background (professional when no background image)
  if (!config.backgroundImage) {
    drawProfessionalBackground(ctx, width, height, derivedColors);
  } else {
    ctx.fillStyle = derivedColors.dark;
    ctx.fillRect(0, 0, width, height);
  }

  // Layer 2: Background image with skewed clip
  if (config.backgroundImage && layout.photoClip) {
    try {
      const img = await loadImage(config.backgroundImage);

      ctx.save();
      // Clip to parallelogram
      ctx.beginPath();
      const pts = layout.photoClip.points;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.clip();

      // Draw image covering the clip area (with manual adjustments)
      const bgAdj = config.manualAdjustments?.backgroundImage ?? { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };
      const baseScale = Math.max(width / img.width, height / img.height);
      const scale = baseScale * bgAdj.scaleX;
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const offsetX = (width - scaledW) / 2 + bgAdj.dx;
      const offsetY = (height - scaledH) / 2 + bgAdj.dy;
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

      // Gradient overlay on photo (left dark → right transparent)
      const gradient = ctx.createLinearGradient(0, 0, width * enterkeyConfig.photoWidthRatio, 0);
      for (const stop of layout.photoClip.gradientStops) {
        gradient.addColorStop(stop.offset, `rgba(${hexToRgb(derivedColors.dark)}, ${stop.opacity})`);
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();
    } catch {
      // Failed to load image
    }
  }

  // Layer 3: Decorations (striped triangles + stamp-* types)
  for (const decoration of layout.decorations) {
    if (!decoration.visible) continue;

    if (decoration.type === 'stripe-triangle-corner') {
      drawStripedTriangle(
        ctx,
        decoration.x,
        decoration.y,
        decoration.width,
        decoration.color || derivedColors.accent,
        decoration.text || 'top-right'
      );
    } else if (decoration.type.startsWith('stamp-')) {
      const resolvedColor = decoration.color || derivedColors.accent;
      renderStampToCanvas(
        ctx,
        {
          id: '',
          type: decoration.type,
          position: { x: decoration.x, y: decoration.y },
          size: decoration.width / width,
          color: 'custom',
          customColor: resolvedColor,
          opacity: decoration.opacity ?? 1,
          rotation: decoration.rotation ?? 0,
        },
        width,
        height,
        resolvedColor,
        decoration.x + decoration.width / 2,
        decoration.y + decoration.height / 2
      );
    }
  }

  // Render stamps from config.stamps (enterkey style)
  const ekPlacedBoxes: Array<{ x: number; y: number; width: number; height: number }> = [];
  for (const stamp of config.stamps) {
    const stampSize = stamp.size * width;
    let cx: number;
    let cy: number;

    if (stamp.position === 'auto') {
      const pos = placeStamp(stampSize, width, height, ekPlacedBoxes);
      cx = pos.x;
      cy = pos.y;
    } else {
      cx = stamp.position.x;
      cy = stamp.position.y;
    }

    ekPlacedBoxes.push({ x: cx - stampSize / 2, y: cy - stampSize / 2, width: stampSize, height: stampSize });
    const resolvedColor = resolveStampColor(stamp, derivedColors);
    renderStampToCanvas(ctx, stamp, width, height, resolvedColor, cx, cy);
  }

  // Layer 4: Rich text lines (or placeholder)
  if (layout.titleLineLayouts && layout.titleLineLayouts.length > 0) {
    drawRichTextLines(ctx, layout.titleLineLayouts);
  } else if (config.title) {
    // Fallback to legacy title rendering
    const titleLayout = layout.title;
    drawWrappedText(
      ctx,
      config.title,
      titleLayout.x,
      titleLayout.y,
      titleLayout.width,
      titleLayout.lineHeight || titleLayout.height,
      titleLayout.fontSize || 48,
      titleLayout.color || '#ffffff'
    );
  } else {
    // Placeholder text for enterkey style
    const titleLayout = layout.title;
    const placeholderFontSize = titleLayout.fontSize || 36;
    ctx.font = `400 ${placeholderFontSize}px "Noto Sans JP", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textBaseline = 'top';
    ctx.fillText('タイトルを入力してください', titleLayout.x, titleLayout.y, titleLayout.width);
  }

  // Layer 5: Logo (top-left on dark overlay)
  if (config.logoImage) {
    try {
      const logoImg = await loadImage(config.logoImage);
      const logoLayout = layout.logo;

      const logoAspect = logoImg.width / logoImg.height;
      let drawW = logoLayout.width;
      let drawH = drawW / logoAspect;
      if (drawH > logoLayout.height) {
        drawH = logoLayout.height;
        drawW = drawH * logoAspect;
      }

      ctx.drawImage(logoImg, logoLayout.x, logoLayout.y, drawW, drawH);
    } catch {
      // Failed to load logo
    }
  }
}

/**
 * Render casestudy-style banner.
 * White bg top 22%, brand color rectangle bottom 78%.
 * With photo: parallelogram clip. Without: straight rectangle.
 * Striped corners, white text band at bottom.
 */
async function renderCaseStudyStyle(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: BannerConfig,
  derivedColors: DerivedColors,
  layout: LayoutResult
): Promise<void> {
  const { width, height } = config;
  const colorRectTop = 150;

  // Layer 1: White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Layer 1.5: Top-right striped rectangle (behind brand color / photo)
  for (const decoration of layout.decorations) {
    if (!decoration.visible || decoration.type !== 'stripe-triangle-corner') continue;
    if (decoration.text !== 'top-right') continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(decoration.x, decoration.y, decoration.width, decoration.height);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(decoration.x, decoration.y, decoration.width, decoration.height);
    ctx.strokeStyle = decoration.color || derivedColors.medium;
    ctx.lineWidth = 2;
    ctx.lineCap = 'square';
    const step = 14;
    const diagonal = decoration.width + decoration.height;
    for (let i = -diagonal; i < diagonal; i += step) {
      ctx.beginPath();
      ctx.moveTo(decoration.x + decoration.width - i, decoration.y);
      ctx.lineTo(decoration.x + decoration.width - i - diagonal, decoration.y + diagonal);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Layer 2: Brand color rectangle (always drawn)
  ctx.fillStyle = derivedColors.medium;
  ctx.fillRect(0, colorRectTop, width, height - colorRectTop);

  // Layer 2.5: Bottom-left striped rectangle (behind photo)
  for (const decoration of layout.decorations) {
    if (!decoration.visible) continue;
    if (decoration.type === 'stripe-triangle-corner' && decoration.text === 'bottom-left') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(decoration.x, decoration.y, decoration.width, decoration.height);
      ctx.clip();

      ctx.fillStyle = decoration.color || derivedColors.medium;
      ctx.fillRect(decoration.x, decoration.y, decoration.width, decoration.height);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'square';
      const step = 14;
      const diagonal = decoration.width + decoration.height;

      for (let i = -diagonal; i < diagonal; i += step) {
        ctx.beginPath();
        ctx.moveTo(decoration.x + decoration.width - i, decoration.y);
        ctx.lineTo(decoration.x + decoration.width - i - diagonal, decoration.y + diagonal);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Layer 3: Photo on top of brand color + stripes (parallelogram clip)
  if (config.backgroundImage && layout.photoClip) {
    ctx.save();
    ctx.beginPath();
    const pts = layout.photoClip.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.clip();

    try {
      const img = await loadImage(config.backgroundImage);
      const bgAdj = config.manualAdjustments?.backgroundImage ?? { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };
      // Fit image to clip area, centered on clip center
      const clipTop = Math.min(...pts.map(p => p.y));
      const clipBottom2 = Math.max(...pts.map(p => p.y));
      const clipLeft = Math.min(...pts.map(p => p.x));
      const clipRight = Math.max(...pts.map(p => p.x));
      const clipW2 = clipRight - clipLeft;
      const clipH2 = clipBottom2 - clipTop;
      const baseScale = Math.max(clipW2 / img.width, clipH2 / img.height);
      const scale = baseScale * bgAdj.scaleX;
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const clipCenterX = (clipLeft + clipRight) / 2;
      const clipCenterY = (clipTop + clipBottom2) / 2;
      const offsetX = clipCenterX - scaledW / 2 + bgAdj.dx;
      const offsetY = clipCenterY - scaledH / 2 + bgAdj.dy;
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

      // Gradient overlay on bottom 1/3 of photo clip area (follows clip bounds)
      const gradClipH = clipBottom2 - clipTop;
      const gradTop = clipTop + gradClipH * 0.66;
      const gradient = ctx.createLinearGradient(0, gradTop, 0, clipBottom2);
      const gradOpacity = config.overlayOpacity;
      gradient.addColorStop(0, `rgba(${hexToRgb(derivedColors.medium)}, 0)`);
      gradient.addColorStop(1, `rgba(${hexToRgb(derivedColors.medium)}, ${gradOpacity})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, gradTop, width, clipBottom2 - gradTop);
    } catch {
      // Failed to load image, brand color rectangle is already drawn
    }
    ctx.restore();
  }

  // Layer 3.5: Second photo (photoClip2)
  if (config.backgroundImage2 && layout.photoClip2) {
    ctx.save();
    ctx.beginPath();
    const pts2 = layout.photoClip2.points;
    ctx.moveTo(pts2[0].x, pts2[0].y);
    for (let i = 1; i < pts2.length; i++) {
      ctx.lineTo(pts2[i].x, pts2[i].y);
    }
    ctx.closePath();
    ctx.clip();

    try {
      const img2 = await loadImage(config.backgroundImage2);
      const c2Top = Math.min(...pts2.map(p => p.y));
      const c2Bottom = Math.max(...pts2.map(p => p.y));
      const c2Left = Math.min(...pts2.map(p => p.x));
      const c2Right = Math.max(...pts2.map(p => p.x));
      const c2W = c2Right - c2Left;
      const c2H = c2Bottom - c2Top;
      const scale2 = Math.max(c2W / img2.width, c2H / img2.height);
      const sw2 = img2.width * scale2;
      const sh2 = img2.height * scale2;
      const ox2 = (c2Left + c2Right) / 2 - sw2 / 2;
      const oy2 = (c2Top + c2Bottom) / 2 - sh2 / 2;
      ctx.drawImage(img2, ox2, oy2, sw2, sh2);

      // Gradient overlay
      const g2H = c2Bottom - c2Top;
      const g2Top = c2Top + g2H * 0.66;
      const grad2 = ctx.createLinearGradient(0, g2Top, 0, c2Bottom);
      grad2.addColorStop(0, `rgba(${hexToRgb(derivedColors.medium)}, 0)`);
      grad2.addColorStop(1, `rgba(${hexToRgb(derivedColors.medium)}, ${config.overlayOpacity})`);
      ctx.fillStyle = grad2;
      ctx.fillRect(0, g2Top, width, c2Bottom - g2Top);
    } catch {
      // Failed to load second image
    }
    ctx.restore();
  }

  // Layer 5 + 6: Per-line white bands + text
  const tl = layout.title;
  if (layout.titleLineLayouts && layout.titleLineLayouts.length > 0) {
    const fs = tl.fontSize || 36;
    const padX = fs * 0.4;
    const padY = fs * 0.15;
    const shadowOffsetX = -12;
    const shadowOffsetY = 12;

    // Calculate per-line bounding boxes (all lines: text width + padding)
    const lineBands = layout.titleLineLayouts.map((line) => {
      if (line.segments.length === 0) return null;
      const firstSeg = line.segments[0];
      const lastSeg = line.segments[line.segments.length - 1];
      const textRight = lastSeg.x + lastSeg.width;
      const lineX = firstSeg.x - padX;
      const lineY = line.y - padY;
      const lineW = textRight - firstSeg.x + padX * 2;
      const lineH = fs + padY * 2;
      return { x: lineX, y: lineY, w: lineW, h: lineH };
    });

    // Draw brand color shadows (per-line)
    ctx.fillStyle = derivedColors.medium;
    for (const band of lineBands) {
      if (!band) continue;
      ctx.fillRect(band.x + shadowOffsetX, band.y + shadowOffsetY, band.w, band.h);
    }

    // Draw white bands (per-line)
    ctx.fillStyle = '#ffffff';
    for (const band of lineBands) {
      if (!band) continue;
      ctx.fillRect(band.x, band.y, band.w, band.h);
    }

    // Draw text
    ctx.textBaseline = 'top';
    for (const line of layout.titleLineLayouts) {
      for (const seg of line.segments) {
        ctx.font = `${seg.fontWeight} ${seg.fontSize}px "Noto Sans JP", sans-serif`;
        ctx.fillStyle = seg.color;
        ctx.fillText(seg.text, seg.x, seg.y);
      }
    }
  } else if (config.title) {
    const tl = layout.title;
    drawWrappedText(
      ctx, config.title, tl.x, tl.y, tl.width,
      tl.lineHeight || tl.height, tl.fontSize || 48,
      tl.color || '#1a1a2e', tl.letterSpacing, false
    );
  } else {
    const placeholderFs = tl.fontSize || 36;
    ctx.font = `400 ${placeholderFs}px "Noto Sans JP", sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.textBaseline = 'top';
    ctx.fillText('タイトルを入力してください', tl.x, tl.y, tl.width);
  }

  // Layer 7: Logo
  if (config.logoImage) {
    try {
      const logoImg = await loadImage(config.logoImage);
      const ll = layout.logo;
      const logoAspect = logoImg.width / logoImg.height;
      let drawW = ll.width;
      let drawH = drawW / logoAspect;
      if (drawH > ll.height) {
        drawH = ll.height;
        drawW = drawH * logoAspect;
      }
      ctx.drawImage(logoImg, ll.x, ll.y, drawW, drawH);
    } catch {
      // Failed to load logo
    }
  }
}

/**
 * Convert hex color to RGB string.
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
