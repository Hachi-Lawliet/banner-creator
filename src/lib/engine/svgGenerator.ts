import type { BannerConfig, DerivedColors, LayoutResult } from '@/types/banner';
import { calculateLayout, calculateEnterkeyLayout, calculateCaseStudyLayout } from './layoutCalculator';
import layoutParamsJson from '@/config/layout.json';
import chroma from 'chroma-js';
import { renderStampToSVG, resolveStampColor } from './stampRenderer';
import { placeStamp } from '@/lib/layout/stampPlacer';

const enterkeyConfig = layoutParamsJson.enterkeyStyle;

/**
 * Escape XML special characters.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert an image data URL to base64 for SVG embedding.
 */
function imageToBase64Href(dataUrl: string): string {
  return dataUrl; // data URLs can be used directly in SVG href
}

/**
 * Check if enterkey style should be used.
 */
function useEnterkeyStyle(config: BannerConfig): boolean {
  return (config.titleLines && config.titleLines.length > 0) || config.photoClipStyle === 'skew';
}

/**
 * Generate SVG string from banner configuration.
 * Follows the same layer order as canvas renderer:
 * background-color → background-image → overlay → decoration → title → logo
 */
export function generateSVG(
  config: BannerConfig,
  derivedColors: DerivedColors
): string {
  const isCaseStudy = config.templateStyle === 'casestudy';
  const isEnterkey = !isCaseStudy && useEnterkeyStyle(config);
  const layout = isCaseStudy
    ? calculateCaseStudyLayout(config, derivedColors)
    : isEnterkey
      ? calculateEnterkeyLayout(config, derivedColors)
      : calculateLayout(config, derivedColors);

  if (isCaseStudy) {
    return generateCaseStudySVG(config, derivedColors, layout);
  }
  return isEnterkey
    ? generateEnterkeySVG(config, derivedColors, layout)
    : generateClassicSVG(config, derivedColors, layout);
}

/**
 * Generate classic-style SVG.
 */
function generateClassicSVG(
  config: BannerConfig,
  derivedColors: DerivedColors,
  layout: LayoutResult
): string {
  const { width, height } = config;
  const parts: string[] = [];

  // SVG header
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  );

  // Defs
  parts.push('<defs>');
  if (!config.backgroundImage) {
    // Multi-stop gradient for professional background
    const midLight = chroma.mix(derivedColors.light, derivedColors.medium, 0.5).hex();
    const midDark = chroma.mix(derivedColors.medium, derivedColors.dark, 0.5).hex();
    parts.push(
      `<linearGradient id="bg-gradient" x1="0%" y1="0%" x2="70%" y2="100%">`,
      `  <stop offset="0%" style="stop-color:${derivedColors.dark}" />`,
      `  <stop offset="30%" style="stop-color:${derivedColors.medium}" />`,
      `  <stop offset="70%" style="stop-color:${derivedColors.dark}" />`,
      `  <stop offset="100%" style="stop-color:${derivedColors.medium}" />`,
      `</linearGradient>`,
      `<radialGradient id="bg-glow" cx="40%" cy="50%" r="50%">`,
      `  <stop offset="0%" style="stop-color:${derivedColors.medium};stop-opacity:0.19" />`,
      `  <stop offset="100%" style="stop-color:${derivedColors.medium};stop-opacity:0" />`,
      `</radialGradient>`
    );
  }
  // Text shadow filter
  parts.push(
    `<filter id="text-shadow" x="-5%" y="-5%" width="110%" height="120%">`,
    `  <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.45)" />`,
    `</filter>`
  );
  parts.push(
    `<style>`,
    `  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&amp;display=swap');`,
    `  .title { font-family: 'Noto Sans JP', sans-serif; font-weight: 700; filter: url(#text-shadow); }`,
    `  .decoration { font-family: 'Noto Sans JP', sans-serif; font-weight: 400; }`,
    `</style>`
  );
  parts.push('</defs>');

  // Layer 1: Background
  if (config.backgroundImage) {
    parts.push(`<rect width="${width}" height="${height}" fill="${derivedColors.light}" />`);
  } else {
    parts.push(`<rect width="${width}" height="${height}" fill="url(#bg-gradient)" />`);
    parts.push(`<rect width="${width}" height="${height}" fill="url(#bg-glow)" />`);
  }

  // Layer 2: Background image
  if (config.backgroundImage) {
    parts.push(
      `<image href="${imageToBase64Href(config.backgroundImage)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />`
    );
  }

  // Layer 3: Overlay
  const overlayColor = layout.overlay.color;
  const overlayOpacity = layout.overlay.opacity;
  parts.push(
    `<rect width="${width}" height="${height}" fill="${overlayColor}" opacity="${overlayOpacity}" />`
  );

  // Layer 4: Decorations
  for (const decoration of layout.decorations) {
    if (!decoration.visible) continue;

    if (decoration.type.startsWith('stamp-')) {
      const resolvedColor = decoration.color || derivedColors.accent;
      const cx = decoration.x + decoration.width / 2;
      const cy = decoration.y + decoration.height / 2;
      const svgStamp = renderStampToSVG(
        {
          id: `dec-${cx}-${cy}`,
          type: decoration.type,
          position: { x: cx, y: cy },
          size: decoration.width / width,
          color: 'custom',
          customColor: resolvedColor,
          opacity: decoration.opacity ?? 1,
          rotation: decoration.rotation ?? 0,
        },
        width,
        height,
        resolvedColor,
        cx,
        cy
      );
      parts.push(svgStamp);
    } else {
      switch (decoration.type) {
        case 'stripe-border': {
          // L-shaped corner decoration
          const sc = decoration.color || derivedColors.accent;
          const cl = Math.min(decoration.width, decoration.height) * 0.15;
          const dx = decoration.x;
          const dy = decoration.y;
          const dw = decoration.width;
          const dh = decoration.height;
          parts.push(
            `<g stroke="${sc}" stroke-width="2" fill="none">`,
            `  <polyline points="${dx},${dy + cl} ${dx},${dy} ${dx + cl},${dy}" />`,
            `  <polyline points="${dx + dw - cl},${dy} ${dx + dw},${dy} ${dx + dw},${dy + cl}" />`,
            `  <polyline points="${dx},${dy + dh - cl} ${dx},${dy + dh} ${dx + cl},${dy + dh}" />`,
            `  <polyline points="${dx + dw - cl},${dy + dh} ${dx + dw},${dy + dh} ${dx + dw},${dy + dh - cl}" />`,
            `</g>`
          );
          break;
        }
        case 'accent-line':
          parts.push(
            `<rect x="${decoration.x}" y="${decoration.y}" width="${decoration.width}" height="${decoration.height}" fill="${derivedColors.accent}" />`
          );
          break;
      }
    }
  }

  // Render stamps from config.stamps
  {
    const placedBoxes: Array<{ x: number; y: number; width: number; height: number }> = [];
    for (const stamp of config.stamps) {
      const stampSize = stamp.size * width;
      let cx: number;
      let cy: number;

      if (stamp.position === 'auto') {
        const pos = placeStamp(stampSize, width, height, placedBoxes);
        cx = pos.x;
        cy = pos.y;
      } else {
        cx = stamp.position.x;
        cy = stamp.position.y;
      }

      placedBoxes.push({ x: cx - stampSize / 2, y: cy - stampSize / 2, width: stampSize, height: stampSize });
      const resolvedColor = resolveStampColor(stamp, derivedColors);
      parts.push(renderStampToSVG(stamp, width, height, resolvedColor, cx, cy));
    }
  }

  // Layer 5: Title with keyword highlight
  if (config.title) {
    const tl = layout.title;
    const fontSize = tl.fontSize || 48;

    if (config.highlightKeyword && config.title.includes(config.highlightKeyword)) {
      const kw = layout.highlightKeyword;
      const titleParts = config.title.split(config.highlightKeyword);
      const beforeKeyword = titleParts[0];
      const afterKeyword = titleParts.slice(1).join(config.highlightKeyword);

      // Title text before keyword
      if (beforeKeyword) {
        parts.push(
          `<text class="title" x="${tl.x + tl.width / 2}" y="${tl.y + fontSize}" fill="${tl.color || '#ffffff'}" font-size="${fontSize}" text-anchor="middle" letter-spacing="${tl.letterSpacing || 0}">${escapeXml(beforeKeyword.trim())}</text>`
        );
      }

      // Keyword highlight band
      const kwFontSize = kw.fontSize || fontSize;
      const bandPadding = kw.bandPadding || 10;
      const approxKwWidth = config.highlightKeyword.length * kwFontSize * 0.6 + bandPadding * 2;
      const bandX = kw.x + (kw.width - approxKwWidth) / 2;

      parts.push(
        `<rect x="${bandX}" y="${kw.y}" width="${approxKwWidth}" height="${kwFontSize + bandPadding * 2}" fill="${kw.bandColor}" rx="4" />`
      );
      parts.push(
        `<text class="title" x="${kw.x + kw.width / 2}" y="${kw.y + bandPadding + kwFontSize * 0.85}" fill="${kw.color || '#ffffff'}" font-size="${kwFontSize}" text-anchor="middle">${escapeXml(config.highlightKeyword)}</text>`
      );

      // Text after keyword
      if (afterKeyword) {
        const afterX = bandX + approxKwWidth + 4;
        parts.push(
          `<text class="title" x="${afterX}" y="${kw.y + bandPadding + kwFontSize * 0.85}" fill="${tl.color || '#ffffff'}" font-size="${kwFontSize}">${escapeXml(afterKeyword.trim())}</text>`
        );
      }
    } else {
      parts.push(
        `<text class="title" x="${tl.x + tl.width / 2}" y="${tl.y + fontSize}" fill="${tl.color || '#ffffff'}" font-size="${fontSize}" text-anchor="middle" letter-spacing="${tl.letterSpacing || 0}">${escapeXml(config.title)}</text>`
      );
    }
  }

  // Layer 6: Logo
  if (config.logoImage) {
    const ll = layout.logo;
    parts.push(
      `<image href="${imageToBase64Href(config.logoImage)}" x="${ll.x}" y="${ll.y}" width="${ll.width}" height="${ll.height}" preserveAspectRatio="xMidYMid meet" />`
    );
  }

  parts.push('</svg>');
  return parts.join('\n');
}

/**
 * Generate enterkey-style SVG with clip paths, rich text, and striped triangles.
 */
function generateEnterkeySVG(
  config: BannerConfig,
  derivedColors: DerivedColors,
  layout: LayoutResult
): string {
  const { width, height } = config;
  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  );

  // Defs: clip path, gradient, stripe pattern
  parts.push('<defs>');

  // Photo clip path (parallelogram)
  if (layout.photoClip) {
    const pts = layout.photoClip.points;
    const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
    parts.push(
      `<clipPath id="photo-clip">`,
      `  <polygon points="${pointsStr}" />`,
      `</clipPath>`
    );

    // Gradient overlay for photo
    parts.push(
      `<linearGradient id="photo-overlay" x1="0%" y1="0%" x2="100%" y2="0%">`
    );
    for (const stop of layout.photoClip.gradientStops) {
      parts.push(
        `  <stop offset="${stop.offset * 100}%" stop-color="${derivedColors.dark}" stop-opacity="${stop.opacity}" />`
      );
    }
    parts.push(`</linearGradient>`);
  }

  // Background gradient (used when no background image)
  if (!config.backgroundImage) {
    parts.push(
      `<linearGradient id="enterkey-bg-gradient" x1="0%" y1="0%" x2="70%" y2="100%">`,
      `  <stop offset="0%" style="stop-color:${derivedColors.dark}" />`,
      `  <stop offset="30%" style="stop-color:${derivedColors.medium}" />`,
      `  <stop offset="70%" style="stop-color:${derivedColors.dark}" />`,
      `  <stop offset="100%" style="stop-color:${derivedColors.medium}" />`,
      `</linearGradient>`,
      `<radialGradient id="enterkey-bg-glow" cx="40%" cy="50%" r="50%">`,
      `  <stop offset="0%" style="stop-color:${derivedColors.medium};stop-opacity:0.19" />`,
      `  <stop offset="100%" style="stop-color:${derivedColors.medium};stop-opacity:0" />`,
      `</radialGradient>`
    );
  }

  // Stripe pattern for triangles
  const sw = enterkeyConfig.stripeWidth;
  const sg = enterkeyConfig.stripeGap;
  const patternSize = sw + sg;
  parts.push(
    `<pattern id="stripe-pattern" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}" patternTransform="rotate(45)">`,
    `  <line x1="0" y1="0" x2="0" y2="${patternSize}" stroke="${derivedColors.accent}" stroke-width="${sw}" />`,
    `</pattern>`
  );

  // Text shadow filter
  parts.push(
    `<filter id="enterkey-text-shadow" x="-5%" y="-5%" width="110%" height="120%">`,
    `  <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.45)" />`,
    `</filter>`
  );

  parts.push(
    `<style>`,
    `  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&amp;display=swap');`,
    `  .title { font-family: 'Noto Sans JP', sans-serif; filter: url(#enterkey-text-shadow); }`,
    `</style>`
  );
  parts.push('</defs>');

  // Layer 1: Dark background (professional when no background image)
  if (!config.backgroundImage) {
    parts.push(`<rect width="${width}" height="${height}" fill="url(#enterkey-bg-gradient)" />`);
    parts.push(`<rect width="${width}" height="${height}" fill="url(#enterkey-bg-glow)" />`);
  } else {
    parts.push(`<rect width="${width}" height="${height}" fill="${derivedColors.dark}" />`);
  }

  // Layer 2: Background image with clip
  if (config.backgroundImage && layout.photoClip) {
    parts.push(
      `<image href="${imageToBase64Href(config.backgroundImage)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip)" />`
    );
    // Gradient overlay on photo
    const pts = layout.photoClip.points;
    const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
    parts.push(
      `<polygon points="${pointsStr}" fill="url(#photo-overlay)" />`
    );
  }

  // Layer 3: Decorations (striped triangles + stamp-* types)
  for (const decoration of layout.decorations) {
    if (!decoration.visible) continue;

    if (decoration.type === 'stripe-triangle-corner') {
      const dx = decoration.x;
      const dy = decoration.y;
      const s = decoration.width;
      let triPoints: string;

      if (decoration.text === 'top-right') {
        triPoints = `${dx + s},${dy} ${dx + s},${dy + s} ${dx},${dy}`;
      } else {
        triPoints = `${dx},${dy} ${dx + s},${dy + s} ${dx},${dy + s}`;
      }

      parts.push(
        `<polygon points="${triPoints}" fill="url(#stripe-pattern)" />`
      );
    } else if (decoration.type.startsWith('stamp-')) {
      const resolvedColor = decoration.color || derivedColors.accent;
      const cx = decoration.x + decoration.width / 2;
      const cy = decoration.y + decoration.height / 2;
      parts.push(
        renderStampToSVG(
          {
            id: `ek-dec-${cx}-${cy}`,
            type: decoration.type,
            position: { x: cx, y: cy },
            size: decoration.width / width,
            color: 'custom',
            customColor: resolvedColor,
            opacity: decoration.opacity ?? 1,
            rotation: decoration.rotation ?? 0,
          },
          width,
          height,
          resolvedColor,
          cx,
          cy
        )
      );
    }
  }

  // Render stamps from config.stamps (enterkey style)
  {
    const placedBoxes: Array<{ x: number; y: number; width: number; height: number }> = [];
    for (const stamp of config.stamps) {
      const stampSize = stamp.size * width;
      let cx: number;
      let cy: number;

      if (stamp.position === 'auto') {
        const pos = placeStamp(stampSize, width, height, placedBoxes);
        cx = pos.x;
        cy = pos.y;
      } else {
        cx = stamp.position.x;
        cy = stamp.position.y;
      }

      placedBoxes.push({ x: cx - stampSize / 2, y: cy - stampSize / 2, width: stampSize, height: stampSize });
      const resolvedColor = resolveStampColor(stamp, derivedColors);
      parts.push(renderStampToSVG(stamp, width, height, resolvedColor, cx, cy));
    }
  }

  // Layer 4: Rich text
  if (layout.titleLineLayouts && layout.titleLineLayouts.length > 0) {
    for (const line of layout.titleLineLayouts) {
      parts.push(`<text class="title" y="${line.y}">`);
      for (const seg of line.segments) {
        parts.push(
          `  <tspan x="${seg.x}" y="${seg.y + seg.fontSize * 0.85}" fill="${seg.color}" font-size="${seg.fontSize}" font-weight="${seg.fontWeight}">${escapeXml(seg.text)}</tspan>`
        );
      }
      parts.push(`</text>`);
    }
  } else if (config.title) {
    // Legacy fallback
    const tl = layout.title;
    const fontSize = tl.fontSize || 48;
    parts.push(
      `<text class="title" x="${tl.x}" y="${tl.y + fontSize}" fill="${tl.color || '#ffffff'}" font-size="${fontSize}" font-weight="700">${escapeXml(config.title)}</text>`
    );
  }

  // Layer 5: Logo
  if (config.logoImage) {
    const ll = layout.logo;
    parts.push(
      `<image href="${imageToBase64Href(config.logoImage)}" x="${ll.x}" y="${ll.y}" width="${ll.width}" height="${ll.height}" preserveAspectRatio="xMidYMid meet" />`
    );
  }

  parts.push('</svg>');
  return parts.join('\n');
}

/**
 * Generate casestudy-style SVG.
 */
function generateCaseStudySVG(
  config: BannerConfig,
  derivedColors: DerivedColors,
  layout: LayoutResult
): string {
  const { width, height } = config;
  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  );

  parts.push('<defs>');
  if (layout.photoClip) {
    const pts = layout.photoClip.points;
    const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
    parts.push(
      `<clipPath id="cs-photo-clip">`,
      `  <polygon points="${pointsStr}" />`,
      `</clipPath>`
    );
  }

  const sw = enterkeyConfig.stripeWidth;
  const sg = enterkeyConfig.stripeGap;
  const patternSize = sw + sg;
  parts.push(
    `<pattern id="cs-stripe-pattern" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(-45)">`,
    `  <line x1="0" y1="0" x2="0" y2="14" stroke="${derivedColors.medium}" stroke-width="2" />`,
    `</pattern>`,
    `<pattern id="cs-stripe-pattern-inv" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(-45)">`,
    `  <line x1="0" y1="0" x2="0" y2="14" stroke="#ffffff" stroke-width="2" />`,
    `</pattern>`
  );

  parts.push(
    `<style>`,
    `  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&amp;display=swap');`,
    `  .cs-title { font-family: 'Noto Sans JP', sans-serif; }`,
    `</style>`
  );
  parts.push('</defs>');

  const colorRectTop = 150;
  parts.push(`<rect width="${width}" height="${height}" fill="#ffffff" />`);

  // Top-right striped rectangle (behind brand color / photo)
  for (const decoration of layout.decorations) {
    if (!decoration.visible || decoration.type !== 'stripe-triangle-corner') continue;
    if (decoration.text !== 'top-right') continue;
    const dx = decoration.x, dy = decoration.y, dw = decoration.width, dh = decoration.height;
    parts.push(`<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="#ffffff" />`);
    parts.push(`<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="url(#cs-stripe-pattern)" />`);
  }

  // Brand color rectangle (always drawn)
  parts.push(`<rect x="0" y="${colorRectTop}" width="${width}" height="${height - colorRectTop}" fill="${derivedColors.medium}" />`);

  // Bottom-left striped rectangle (behind photo)
  for (const decoration of layout.decorations) {
    if (!decoration.visible || decoration.type !== 'stripe-triangle-corner') continue;
    if (decoration.text !== 'bottom-left') continue;
    const dx = decoration.x, dy = decoration.y, dw = decoration.width, dh = decoration.height;
    parts.push(`<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="${derivedColors.medium}" />`);
    parts.push(`<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="url(#cs-stripe-pattern-inv)" />`);
  }

  // Photo on top of brand color + stripes (parallelogram clip)
  if (config.backgroundImage && layout.photoClip) {
    const clipH = height * 0.78;
    parts.push(
      `<image href="${imageToBase64Href(config.backgroundImage)}" x="0" y="${colorRectTop}" width="${width}" height="${clipH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cs-photo-clip)" />`
    );
    // Gradient overlay on bottom 1/3 of photo clip area (follows clip bounds)
    const clipPts = layout.photoClip.points;
    const clipBottom = Math.max(...clipPts.map(p => p.y));
    const clipTopY = Math.min(...clipPts.map(p => p.y));
    const clipHeight = clipBottom - clipTopY;
    const gradTop = clipTopY + clipHeight * 0.66;
    parts.push(
      `<defs><linearGradient id="cs-photo-grad" x1="0" y1="${gradTop}" x2="0" y2="${clipBottom}" gradientUnits="userSpaceOnUse">`,
      `  <stop offset="0%" stop-color="${derivedColors.medium}" stop-opacity="0" />`,
      `  <stop offset="100%" stop-color="${derivedColors.medium}" stop-opacity="${config.overlayOpacity}" />`,
      `</linearGradient></defs>`,
      `<rect x="0" y="${gradTop}" width="${width}" height="${clipBottom - gradTop}" fill="url(#cs-photo-grad)" clip-path="url(#cs-photo-clip)" />`
    );
  }

  // Per-line white bands + text
  const tl = layout.title;
  if (layout.titleLineLayouts && layout.titleLineLayouts.length > 0) {
    const fs = tl.fontSize || 36;
    const padX = fs * 0.4;
    const padY = fs * 0.15;

    // All lines: text width + padding
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

    // Brand color shadows
    for (const band of lineBands) {
      if (!band) continue;
      parts.push(`<rect x="${band.x - 12}" y="${band.y + 12}" width="${band.w}" height="${band.h}" fill="${derivedColors.medium}" />`);
    }

    // White bands
    for (const band of lineBands) {
      if (!band) continue;
      parts.push(`<rect x="${band.x}" y="${band.y}" width="${band.w}" height="${band.h}" fill="#ffffff" />`);
    }

    // Text
    for (const line of layout.titleLineLayouts) {
      parts.push(`<text class="cs-title" y="${line.y}">`);
      for (const seg of line.segments) {
        parts.push(
          `  <tspan x="${seg.x}" y="${seg.y + seg.fontSize * 0.85}" fill="${seg.color}" font-size="${seg.fontSize}" font-weight="${seg.fontWeight}">${escapeXml(seg.text)}</tspan>`
        );
      }
      parts.push(`</text>`);
    }
  } else if (config.title) {
    const tl = layout.title;
    const fontSize = tl.fontSize || 48;
    parts.push(
      `<text class="cs-title" x="${tl.x}" y="${tl.y + fontSize}" fill="${tl.color || '#1a1a2e'}" font-size="${fontSize}" font-weight="700">${escapeXml(config.title)}</text>`
    );
  }

  if (config.logoImage) {
    const ll = layout.logo;
    parts.push(
      `<image href="${imageToBase64Href(config.logoImage)}" x="${ll.x}" y="${ll.y}" width="${ll.width}" height="${ll.height}" preserveAspectRatio="xMidYMid meet" />`
    );
  }

  parts.push('</svg>');
  return parts.join('\n');
}
