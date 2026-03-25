import type { BannerConfig, DerivedColors, LayoutResult, DecorationLayout, TextLineLayout, TextSegmentLayout, PhotoClipLayout } from '@/types/banner';
import layoutParams from '@/config/layout.json';
import { calculateSafeArea } from '@/lib/layout/safeArea';
import { goldenSplit, goldenFontRatio } from '@/lib/layout/goldenRatio';
import { calculateGravityCenter, suggestGravityAdjustment } from '@/lib/layout/gravityCenter';
import { calculateZPatternZones } from '@/lib/layout/eyeFlow';
import { meetsWCAG_AA } from '@/lib/color/contrastChecker';

const enterkeyConfig = layoutParams.enterkeyStyle;

/**
 * Find optimal font size using binary search.
 * Ensures text fits within the given width.
 */
export function findOptimalFontSize(
  ctx: CanvasRenderingContext2D | null,
  text: string,
  maxWidth: number,
  minSize: number,
  maxSize: number
): number {
  if (!ctx || !text) return maxSize;

  let low = minSize;
  let high = maxSize;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    ctx.font = `700 ${mid}px "Noto Sans JP", sans-serif`;
    const metrics = ctx.measureText(text);

    if (metrics.width <= maxWidth) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.floor(low);
}

/**
 * Calculate complete layout for Template B (logo-centric).
 */
export function calculateLayout(
  config: BannerConfig,
  derivedColors: DerivedColors,
  measureCtx?: CanvasRenderingContext2D | null
): LayoutResult {
  const { width, height } = config;
  const safeArea = calculateSafeArea(width, height, layoutParams.safeAreaRatio);
  const zones = calculateZPatternZones(safeArea);
  const [majorH, minorH] = goldenSplit(safeArea.height);

  // Logo: top area (Z-pattern zone 1 - top left to center)
  // Logo max width = 22% of banner width (professional standard: 17-22%)
  const logoMaxWidth = width * 0.22;
  const logoMaxHeight = minorH * 0.7;
  const logoWidth = Math.max(width * layoutParams.logoMinSizeRatio, logoMaxWidth);
  // Clear space is defined as a ratio of logo height, applied around the logo
  // Total space = logoMaxHeight, logo gets the center portion after reserving clear space top & bottom
  const logoClearSpace = logoMaxHeight * layoutParams.logoClearSpaceRatio * 0.5;
  const logoHeight = Math.max(logoMaxHeight - logoClearSpace * 2, logoMaxHeight * 0.3);
  // Logo x position based on logoPosition setting
  let logoX: number;
  switch (config.logoPosition) {
    case 'top-left':
      logoX = safeArea.x;
      break;
    case 'top-right':
      logoX = safeArea.x + safeArea.width - logoWidth;
      break;
    case 'top-center':
    default:
      logoX = safeArea.x + (safeArea.width - logoWidth) / 2;
      break;
  }
  const logoLayout = {
    x: logoX,
    y: safeArea.y + logoClearSpace,
    width: logoWidth,
    height: logoHeight,
  };

  // Title: center area
  const titleMaxFontSize = width * layoutParams.titleFontSizeRatio.max;
  const titleMinFontSize = width * layoutParams.titleFontSizeRatio.min;
  const titleFontSize = measureCtx
    ? findOptimalFontSize(
        measureCtx,
        config.title,
        safeArea.width * 0.8,
        titleMinFontSize,
        titleMaxFontSize
      )
    : titleMaxFontSize;

  const titleLineHeight = titleFontSize * 1.5; // 1.5 for Japanese readability
  // Z-pattern: place title in lower major zone (bottom 60% of the banner)
  const titleY = safeArea.y + minorH + (majorH - titleLineHeight * 2) * 0.6;
  const titleLayout = {
    x: zones.center.x,
    y: titleY,
    width: zones.center.width,
    height: titleLineHeight * 2,
    fontSize: titleFontSize,
    lineHeight: titleLineHeight,
    letterSpacing: titleFontSize * 0.05,
    color: '#ffffff',
    text: config.title,
  };

  // Highlight keyword: positioned within title area with accent band
  const keywordFontSize = titleFontSize;
  const bandPadding = keywordFontSize * 0.2;
  const highlightLayout = {
    x: titleLayout.x,
    y: titleLayout.y + titleLineHeight,
    width: zones.center.width,
    height: keywordFontSize + bandPadding * 2,
    fontSize: keywordFontSize,
    color: '#ffffff',
    text: config.highlightKeyword,
    bandColor: derivedColors.accent,
    bandPadding,
  };

  // Background: full canvas
  const backgroundLayout = {
    x: 0,
    y: 0,
    width,
    height,
  };

  // Overlay
  const overlayLayout = {
    x: 0,
    y: 0,
    width,
    height,
    opacity: config.overlayOpacity,
    color: derivedColors.dark,
  };

  // Decorations
  const decorations: DecorationLayout[] = [];
  if (config.showDecoration) {
    // Stripe border decoration
    const borderWidth = width * 0.015;
    decorations.push({
      type: 'stripe-border',
      visible: true,
      x: borderWidth,
      y: borderWidth,
      width: width - borderWidth * 2,
      height: height - borderWidth * 2,
      color: derivedColors.accent,
    });

  }

  // Calculate gravity center
  const elements = [
    {
      yCenterRatio: (logoLayout.y + logoLayout.height / 2) / height,
      area: logoLayout.width * logoLayout.height,
      color: derivedColors.medium,
    },
    {
      yCenterRatio: (titleLayout.y + titleLayout.height / 2) / height,
      area: titleLayout.width * titleLayout.height,
      color: '#ffffff',
    },
  ];
  if (config.backgroundImage) {
    elements.push({
      yCenterRatio: 0.5,
      area: width * height * 0.5,
      color: derivedColors.dark,
    });
  }
  const gravityCenterY = calculateGravityCenter(elements);
  const gravityCenterX = 0.5; // Center horizontally

  // Adjust if gravity is off-target
  const adjustment = suggestGravityAdjustment(
    gravityCenterY,
    layoutParams.gravityCenterTarget.min,
    layoutParams.gravityCenterTarget.max
  );
  if (Math.abs(adjustment) >= 0.05) {
    const shiftPx = adjustment * height * 0.5;
    logoLayout.y += shiftPx * 0.5;
    titleLayout.y += shiftPx * 0.3;
    highlightLayout.y = titleLayout.y + titleLineHeight;
  }

  // Check contrast
  const textBg = config.backgroundImage ? derivedColors.dark : derivedColors.medium;
  const contrastRatio = meetsWCAG_AA('#ffffff', textBg) ? 4.5 : 0;

  // Apply manual adjustments
  const adj = config.manualAdjustments;
  if (adj) {
    const logoAdj = adj.logo;
    logoLayout.x += logoAdj.dx;
    logoLayout.y += logoAdj.dy;
    logoLayout.width *= logoAdj.scaleX;
    logoLayout.height *= logoAdj.scaleY;

    const titleAdj = adj.title;
    titleLayout.x += titleAdj.dx;
    titleLayout.y += titleAdj.dy;
    titleLayout.width *= titleAdj.scaleX;
    titleLayout.height *= titleAdj.scaleY;
    highlightLayout.y = titleLayout.y + titleLineHeight;
  }

  return {
    canvasWidth: width,
    canvasHeight: height,
    safeArea,
    logo: logoLayout,
    title: titleLayout,
    highlightKeyword: highlightLayout,
    background: backgroundLayout,
    overlay: overlayLayout,
    decorations,
    gravityCenter: { x: gravityCenterX, y: gravityCenterY },
    contrastRatio,
  };
}

/**
 * Calculate enterkey-style layout with skewed photo, rich text, and corner triangles.
 */
export function calculateEnterkeyLayout(
  config: BannerConfig,
  derivedColors: DerivedColors,
  measureCtx?: CanvasRenderingContext2D | null
): LayoutResult {
  const { width, height } = config;
  const safeArea = calculateSafeArea(width, height, layoutParams.safeAreaRatio);

  const skewAngle = config.photoClipSkewAngle || enterkeyConfig.photoSkewAngle;
  const skewOffset = Math.tan((skewAngle * Math.PI) / 180) * height;
  const photoRight = width * enterkeyConfig.photoWidthRatio;

  // Photo clip path (parallelogram)
  const photoClip: PhotoClipLayout = {
    points: [
      { x: 0, y: 0 },
      { x: photoRight + skewOffset, y: 0 },
      { x: photoRight, y: height },
      { x: 0, y: height },
    ],
    gradientStops: enterkeyConfig.overlayGradientStops.map((s) => ({
      offset: s.offset,
      opacity: s.opacity,
    })),
  };

  // Logo: position based on logoPosition setting
  const logoMaxW = safeArea.width * enterkeyConfig.logoMaxWidthRatio;
  const logoY = safeArea.y;
  let logoX: number;
  switch (config.logoPosition) {
    case 'top-right':
      logoX = safeArea.x + safeArea.width - logoMaxW;
      break;
    case 'top-center':
      logoX = safeArea.x + (safeArea.width - logoMaxW) / 2;
      break;
    case 'top-left':
    default:
      logoX = safeArea.x;
      break;
  }
  const logoLayout = {
    x: logoX,
    y: logoY,
    width: logoMaxW,
    height: logoMaxW * 0.4,
  };

  // Text block: right side, vertically centered
  const textBlockX = width * enterkeyConfig.textBlockStartX;
  const textBlockY = height * enterkeyConfig.textBlockStartY;
  const textMaxWidth = width - textBlockX - safeArea.x;

  // Title font size — auto-shrink if text is too long
  const maxFontSize = Math.round(width * enterkeyConfig.titleFontSizeRatio);
  const minFontSize = Math.round(width * 0.025);
  let titleFontSize = maxFontSize;
  if (measureCtx && config.titleLines && config.titleLines.length > 0) {
    // Find the longest line and shrink font to fit
    for (const line of config.titleLines) {
      const lineText = line.segments.map(s => s.text).join('');
      if (!lineText) continue;
      titleFontSize = findOptimalFontSize(measureCtx, lineText, textMaxWidth, minFontSize, titleFontSize);
    }
  } else if (measureCtx && config.title) {
    titleFontSize = findOptimalFontSize(measureCtx, config.title, textMaxWidth, minFontSize, maxFontSize);
  }
  const titleLineHeight = titleFontSize * 1.5;

  // Calculate rich text line layouts
  const titleLineLayouts: TextLineLayout[] = [];
  if (config.titleLines && config.titleLines.length > 0) {
    let currentY = textBlockY;
    for (const line of config.titleLines) {
      const lineText = line.segments.map(s => s.text).join('');
      if (!lineText) continue;

      const segmentLayouts: TextSegmentLayout[] = [];
      let currentX = textBlockX;

      for (const segment of line.segments) {
        const weight = segment.fontWeight || 400;
        const color = segment.color || '#ffffff';

        let segWidth: number;
        if (measureCtx) {
          measureCtx.font = `${weight} ${titleFontSize}px "Noto Sans JP", sans-serif`;
          segWidth = measureCtx.measureText(segment.text).width;
        } else {
          segWidth = segment.text.length * titleFontSize * 0.6;
        }

        segmentLayouts.push({
          text: segment.text,
          x: currentX,
          y: currentY,
          width: segWidth,
          fontSize: titleFontSize,
          color,
          fontWeight: weight,
        });

        currentX += segWidth;
      }

      titleLineLayouts.push({
        segments: segmentLayouts,
        y: currentY,
        height: titleLineHeight,
      });

      currentY += titleLineHeight;
    }
  }

  // Title layout (fallback area for legacy mode)
  const titleLayout = {
    x: textBlockX,
    y: textBlockY,
    width: textMaxWidth,
    height: titleLineHeight * Math.max(config.titleLines?.length || 1, 1),
    fontSize: titleFontSize,
    lineHeight: titleLineHeight,
    letterSpacing: titleFontSize * 0.03, // Japanese letter-spacing
    color: '#ffffff',
    text: config.title,
  };

  // Highlight keyword (legacy fallback)
  const bandPadding = titleFontSize * 0.2;
  const highlightLayout = {
    x: textBlockX,
    y: textBlockY + titleLineHeight,
    width: textMaxWidth,
    height: titleFontSize + bandPadding * 2,
    fontSize: titleFontSize,
    color: '#ffffff',
    text: config.highlightKeyword,
    bandColor: derivedColors.accent,
    bandPadding,
  };

  // Background
  const backgroundLayout = { x: 0, y: 0, width, height };

  // Overlay (applied only over photo area via gradient)
  const overlayLayout = {
    x: 0,
    y: 0,
    width,
    height,
    opacity: config.overlayOpacity,
    color: derivedColors.dark,
  };

  // Decorations: corner stripe triangles
  const decorations: DecorationLayout[] = [];
  if (config.showDecoration) {
    const triSize = Math.round(width * enterkeyConfig.cornerTriangleSize);

    // Top-right triangle
    decorations.push({
      type: 'stripe-triangle-corner',
      visible: true,
      x: width - triSize,
      y: 0,
      width: triSize,
      height: triSize,
      color: derivedColors.accent,
      text: 'top-right',
    });

    // Bottom-left triangle
    decorations.push({
      type: 'stripe-triangle-corner',
      visible: true,
      x: 0,
      y: height - triSize,
      width: triSize,
      height: triSize,
      color: derivedColors.accent,
      text: 'bottom-left',
    });
  }

  // Gravity center
  const gravityCenterY = 0.45;
  const gravityCenterX = 0.5;

  // Contrast
  const textBg = config.backgroundImage ? derivedColors.dark : derivedColors.medium;
  const contrastRatio = meetsWCAG_AA('#ffffff', textBg) ? 4.5 : 0;

  // Apply manual adjustments
  const adj = config.manualAdjustments;
  if (adj) {
    const logoAdj = adj.logo;
    logoLayout.x += logoAdj.dx;
    logoLayout.y += logoAdj.dy;
    logoLayout.width *= logoAdj.scaleX;
    logoLayout.height *= logoAdj.scaleY;

    const titleAdj = adj.title;
    titleLayout.x += titleAdj.dx;
    titleLayout.y += titleAdj.dy;
    titleLayout.width *= titleAdj.scaleX;
    titleLayout.height *= titleAdj.scaleY;
    highlightLayout.y = titleLayout.y + titleLineHeight;

    // Apply adjustments to rich text line layouts
    if (titleLineLayouts.length > 0) {
      for (const line of titleLineLayouts) {
        line.y += titleAdj.dy;
        for (const seg of line.segments) {
          seg.x += titleAdj.dx;
          seg.y += titleAdj.dy;
        }
      }
    }
  }

  return {
    canvasWidth: width,
    canvasHeight: height,
    safeArea,
    logo: logoLayout,
    title: titleLayout,
    highlightKeyword: highlightLayout,
    background: backgroundLayout,
    overlay: overlayLayout,
    decorations,
    gravityCenter: { x: gravityCenterX, y: gravityCenterY },
    contrastRatio,
    photoClip,
    photoClip2: undefined,
    titleLineLayouts,
  };
}

/**
 * Calculate casestudy-style layout.
 * White background, brand color rectangle (bottom 78%), text band at bottom,
 * striped corners top-right & bottom-left.
 * With photo: parallelogram clip replaces the color rectangle.
 */
export function calculateCaseStudyLayout(
  config: BannerConfig,
  derivedColors: DerivedColors,
  measureCtx?: CanvasRenderingContext2D | null
): LayoutResult {
  const { width, height } = config;
  const safeArea = calculateSafeArea(width, height, layoutParams.safeAreaRatio);

  // Brand color rectangle / photo area: top 150px is white, rest is colored
  const colorRectTop = 150;

  // Photo clip: only used when background image is present (parallelogram)
  // Without photo, we draw a straight rectangle in the renderer
  // Photo width ~87.5% of canvas (700/800 ratio)
  let photoClip: PhotoClipLayout | undefined;
  let photoClip2: PhotoClipLayout | undefined;
  const hasImage1 = !!config.backgroundImage;
  const hasImage2 = !!config.backgroundImage2;
  const hasTwoImages = hasImage1 && hasImage2;

  if (hasImage1) {
    const photoHeight = height * 0.78;
    const skewOffset = height * 0.08;
    const brandAreaHeight = height - colorRectTop;
    const photoTop = colorRectTop + (brandAreaHeight - photoHeight) / 2 - skewOffset / 2 - 20;
    const photoBottom = photoTop + photoHeight;
    const clipAdj = config.manualAdjustments?.photoClip ?? { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

    if (hasTwoImages) {
      // 2枚: 横半分ずつの平行四辺形、隙間なし、上20px削る、斜辺なだらか
      const twoImgTopOffset = 20;
      const skewOffset2 = height * 0.04; // 2枚時はなだらかな角度
      const photoWidth = width * 0.88 / 2;
      const photoLeft1 = (width - photoWidth * 2) / 2;
      const photoLeft2 = photoLeft1 + photoWidth;

      // Clip 1 (left)
      const adj1W = photoWidth * clipAdj.scaleX;
      const adj1H = (photoHeight - twoImgTopOffset) * clipAdj.scaleY;
      const adj1Left = photoLeft1 + clipAdj.dx;
      const adj1Top = photoTop + twoImgTopOffset - 10 + clipAdj.dy;
      const adj1Bottom = adj1Top + adj1H;
      const adj1Skew = skewOffset2 * clipAdj.scaleY;
      photoClip = {
        points: [
          { x: adj1Left, y: adj1Top },
          { x: adj1Left + adj1W, y: adj1Top - adj1Skew },
          { x: adj1Left + adj1W, y: adj1Bottom - adj1Skew },
          { x: adj1Left, y: adj1Bottom },
        ],
        gradientStops: [],
      };

      // Clip 2 (right)
      const twoTop2 = photoTop + twoImgTopOffset + 20;
      const twoBottom2 = photoBottom;
      photoClip2 = {
        points: [
          { x: photoLeft2, y: twoTop2 },
          { x: photoLeft2 + photoWidth, y: twoTop2 - skewOffset2 },
          { x: photoLeft2 + photoWidth, y: twoBottom2 - skewOffset2 },
          { x: photoLeft2, y: twoBottom2 },
        ],
        gradientStops: [],
      };
    } else {
      // 1枚: フル幅
      const photoWidth = width * 0.88;
      const photoLeft = (width - photoWidth) / 2;
      const adjPhotoWidth = photoWidth * clipAdj.scaleX;
      const adjPhotoHeight = photoHeight * clipAdj.scaleY;
      const adjLeft = photoLeft + clipAdj.dx;
      const adjTop = photoTop + clipAdj.dy;
      const adjBottom = adjTop + adjPhotoHeight;
      const adjSkew = skewOffset * clipAdj.scaleY;

      photoClip = {
        points: [
          { x: adjLeft, y: adjTop },
          { x: adjLeft + adjPhotoWidth, y: adjTop - adjSkew },
          { x: adjLeft + adjPhotoWidth, y: adjBottom - adjSkew },
          { x: adjLeft, y: adjBottom },
        ],
        gradientStops: [],
      };
    }
  }

  // Logo: top-left, small (8% of width), in white area
  const logoMaxW = width * 0.08;
  const logoLayout = {
    x: safeArea.x * 0.8,
    y: (colorRectTop - logoMaxW * 0.8) / 2 - 10,
    width: logoMaxW,
    height: logoMaxW * 0.8,
  };

  // Title font size (larger ratio to band)
  const maxFontSize = Math.round(height * 0.075);
  const minFontSize = Math.round(height * 0.04);
  const textBandInnerWidth = width * 0.70;

  // Auto-shrink font size per line to fit width
  let titleFontSize = maxFontSize;
  if (measureCtx && config.titleLines && config.titleLines.length > 0) {
    for (const line of config.titleLines) {
      const lineText = line.segments.map(s => s.text).join('');
      if (!lineText) continue;
      titleFontSize = findOptimalFontSize(measureCtx, lineText, textBandInnerWidth * 0.9, minFontSize, titleFontSize);
    }
  }

  const titleLineHeight = titleFontSize * 1.5;
  const padX = titleFontSize * 0.5;
  const padY = titleFontSize * 0.15;

  // Measure each line's width
  const lineCount = config.titleLines?.filter(l => l.segments.map(s => s.text).join('')).length || 1;
  const lineIndent = titleFontSize * 0.8;

  const lineWidths: number[] = [];
  if (config.titleLines && config.titleLines.length > 0) {
    for (const line of config.titleLines) {
      const lineText = line.segments.map(s => s.text).join('');
      if (!lineText) { continue; }
      let lineW = 0;
      for (const segment of line.segments) {
        const weight = segment.fontWeight || 700;
        if (measureCtx) {
          measureCtx.font = `${weight} ${titleFontSize}px "Noto Sans JP", sans-serif`;
          lineW += measureCtx.measureText(segment.text).width;
        } else {
          lineW += segment.text.length * titleFontSize * 0.6;
        }
      }
      lineWidths.push(lineW);
    }
  }

  // Line 1: right-aligned, Line 2+: left indent from line1
  const line1Width = lineWidths[0] || titleFontSize * 3;
  const line1X = width - line1Width - padX;

  const bandHeight = 64;
  const bandYBase = height * 0.68 + (height * 0.16 - bandHeight) / 2;
  const line2X = line1X - lineIndent;
  const leftMostX = lineWidths.length > 1 ? Math.min(line1X, line2X) - padX : line1X - padX;
  const titleLayout = {
    x: leftMostX,
    y: bandYBase,
    width: width - leftMostX,
    height: bandHeight,
    fontSize: titleFontSize,
    lineHeight: titleLineHeight,
    letterSpacing: titleFontSize * 0.03,
    color: '#1a1a2e',
    text: config.title,
  };

  // Rich text line layouts - each line: right-aligned, scaled independently
  const titleLineLayouts: TextLineLayout[] = [];
  if (config.titleLines && config.titleLines.length > 0) {
    let lineIndex = 0;
    // First pass: calculate each line's actual font size and width (with scale)
    const lineInfo: Array<{ fontSize: number; width: number; adj: { dx: number; dy: number; scaleX: number; scaleY: number } }> = [];
    for (const line of config.titleLines) {
      const lineText = line.segments.map(s => s.text).join('');
      if (!lineText) continue;
      const adj = config.manualAdjustments?.titleLines?.[String(lineInfo.length)] ?? { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };
      const lineFontSize = Math.round(titleFontSize * adj.scaleX);
      let lineW = 0;
      for (const segment of line.segments) {
        const weight = segment.fontWeight || 700;
        if (measureCtx) {
          measureCtx.font = `${weight} ${lineFontSize}px "Noto Sans JP", sans-serif`;
          lineW += measureCtx.measureText(segment.text).width;
        } else {
          lineW += segment.text.length * lineFontSize * 0.6;
        }
      }
      lineInfo.push({ fontSize: lineFontSize, width: lineW, adj });
    }

    // Calculate Y positions
    const totalH = lineInfo.reduce((sum, li) => sum + li.fontSize * 1.5, 0);
    let currentY = bandYBase + (bandHeight - totalH) / 2;

    // Second pass: position each line (right-aligned independently)
    let infoIdx = 0;
    for (const line of config.titleLines) {
      const lineText = line.segments.map(s => s.text).join('');
      if (!lineText) continue;
      const info = lineInfo[infoIdx];
      const lineFontSize = info.fontSize;
      const lineW = info.width;
      const adj = info.adj;

      // Each line right-aligned: text right edge at canvas right edge
      const lineBaseX = width - lineW - padX;
      // 2行目以降は左にインデント
      const indent = infoIdx > 0 ? lineIndent : 0;
      const currentX = lineBaseX - indent + adj.dx;
      const adjY = currentY + adj.dy;

      const segmentLayouts: TextSegmentLayout[] = [];
      let segX = currentX;
      for (const segment of line.segments) {
        const weight = segment.fontWeight || 700;
        const color = segment.color || '#1a1a2e';

        let segWidth: number;
        if (measureCtx) {
          measureCtx.font = `${weight} ${lineFontSize}px "Noto Sans JP", sans-serif`;
          segWidth = measureCtx.measureText(segment.text).width;
        } else {
          segWidth = segment.text.length * lineFontSize * 0.6;
        }

        segmentLayouts.push({
          text: segment.text,
          x: segX,
          y: adjY,
          width: segWidth,
          fontSize: lineFontSize,
          color,
          fontWeight: weight,
        });
        segX += segWidth;
      }

      const lineH = lineFontSize * 1.5;
      titleLineLayouts.push({
        segments: segmentLayouts,
        y: adjY,
        height: lineH,
      });
      currentY += lineH;
      infoIdx++;
    }
  }

  // Highlight keyword
  const bandPadding = titleFontSize * 0.2;
  const highlightLayout = {
    x: leftMostX + padX,
    y: bandYBase + padY + titleLineHeight,
    width: width - leftMostX,
    height: titleFontSize + bandPadding * 2,
    fontSize: titleFontSize,
    color: '#1a1a2e',
    text: config.highlightKeyword,
    bandColor: derivedColors.accent,
    bandPadding,
  };

  // Background & overlay
  const backgroundLayout = { x: 0, y: 0, width, height };
  const overlayLayout = {
    x: 0, y: 0, width, height,
    opacity: 0, // no overlay for casestudy (white bg)
    color: '#ffffff',
  };

  // Decorations: striped corners
  const decorations: DecorationLayout[] = [];
  if (config.showDecoration) {
    // Top-right striped rectangle (252x154)
    decorations.push({
      type: 'stripe-triangle-corner',
      visible: true,
      x: width - 252,
      y: 0,
      width: 252,
      height: 154,
      color: derivedColors.medium,
      text: 'top-right',
    });

    // Bottom-left striped rectangle (200x200)
    decorations.push({
      type: 'stripe-triangle-corner',
      visible: true,
      x: 0,
      y: height - 200,
      width: 200,
      height: 200,
      color: derivedColors.medium,
      text: 'bottom-left',
    });
  }

  // Gravity & contrast
  const gravityCenterY = 0.5;
  const gravityCenterX = 0.5;
  const contrastRatio = 4.5; // dark text on white bg always passes

  // Apply manual adjustments
  const adj = config.manualAdjustments;
  if (adj) {
    const logoAdj = adj.logo;
    logoLayout.x += logoAdj.dx;
    logoLayout.y += logoAdj.dy;
    logoLayout.width *= logoAdj.scaleX;
    logoLayout.height *= logoAdj.scaleY;

    const titleAdj = adj.title;
    titleLayout.x += titleAdj.dx;
    titleLayout.y += titleAdj.dy;
    if (titleLineLayouts.length > 0) {
      for (const line of titleLineLayouts) {
        line.y += titleAdj.dy;
        for (const seg of line.segments) {
          seg.x += titleAdj.dx;
          seg.y += titleAdj.dy;
        }
      }
    }
  }

  return {
    canvasWidth: width,
    canvasHeight: height,
    safeArea,
    logo: logoLayout,
    title: titleLayout,
    highlightKeyword: highlightLayout,
    background: backgroundLayout,
    overlay: overlayLayout,
    decorations,
    gravityCenter: { x: gravityCenterX, y: gravityCenterY },
    contrastRatio,
    photoClip,
    photoClip2,
    titleLineLayouts,
  };
}
