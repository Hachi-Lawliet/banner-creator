import type { StampConfig } from '@/types/banner';

/**
 * Resolve stamp color from DerivedColors.
 * brand → medium, accent → accent, light → light, custom → customColor
 */
export function resolveStampColor(
  stamp: StampConfig,
  derivedColors: { light: string; medium: string; dark: string; accent: string }
): string {
  switch (stamp.color) {
    case 'brand':
      return derivedColors.medium;
    case 'accent':
      return derivedColors.accent;
    case 'light':
      return derivedColors.light;
    case 'custom':
      return stamp.customColor || derivedColors.medium;
    default:
      return derivedColors.medium;
  }
}

/**
 * Render a stamp onto a canvas context.
 */
export function renderStampToCanvas(
  ctx: CanvasRenderingContext2D,
  stamp: StampConfig,
  canvasWidth: number,
  canvasHeight: number,
  resolvedColor: string,
  x: number,
  y: number
): void {
  const size = stamp.size * canvasWidth;

  ctx.save();
  ctx.globalAlpha = stamp.opacity;
  ctx.translate(x, y);
  ctx.rotate((stamp.rotation * Math.PI) / 180);

  switch (stamp.type) {
    case 'stamp-circle':
      renderCircle(ctx, size, resolvedColor);
      break;
    case 'stamp-triangle':
      renderTriangle(ctx, size, resolvedColor);
      break;
    case 'stamp-line':
      renderLine(ctx, size, resolvedColor);
      break;
    case 'stamp-dot-grid':
      renderDotGrid(ctx, size, resolvedColor);
      break;
    case 'stamp-gradient-band':
      renderGradientBand(ctx, size, resolvedColor);
      break;
    case 'stamp-ring':
      renderRing(ctx, size, resolvedColor);
      break;
  }

  ctx.restore();
}

function renderCircle(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const radius = size / 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.06;
  ctx.fillStyle = color + '33'; // ~20% opacity fill
  ctx.fill();
  ctx.stroke();
}

function renderTriangle(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const h = size * 0.866; // sqrt(3)/2
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(size / 2, h / 2);
  ctx.lineTo(-size / 2, h / 2);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.05;
  ctx.fillStyle = color + '33';
  ctx.fill();
  ctx.stroke();
}

function renderLine(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  ctx.beginPath();
  ctx.moveTo(-size / 2, 0);
  ctx.lineTo(size / 2, 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function renderDotGrid(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const dotRadius = size * 0.04;
  const spacing = size / 4;
  const count = 4;
  const offset = -(spacing * (count - 1)) / 2;

  ctx.fillStyle = color;
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      ctx.beginPath();
      ctx.arc(offset + col * spacing, offset + row * spacing, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderGradientBand(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const width = size;
  const height = size * 0.3;
  const gradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  gradient.addColorStop(0, color + '00');
  gradient.addColorStop(0.3, color + 'cc');
  gradient.addColorStop(0.7, color + 'cc');
  gradient.addColorStop(1, color + '00');
  ctx.fillStyle = gradient;
  ctx.fillRect(-width / 2, -height / 2, width, height);
}

function renderRing(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const outerRadius = size / 2;
  const innerRadius = size * 0.3;
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2, true); // counter-clockwise for hole
  ctx.fillStyle = color + '66'; // ~40% opacity
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Render a stamp as SVG elements.
 * Returns an SVG group string.
 */
export function renderStampToSVG(
  stamp: StampConfig,
  canvasWidth: number,
  canvasHeight: number,
  resolvedColor: string,
  x: number,
  y: number
): string {
  const size = stamp.size * canvasWidth;
  const transform = `translate(${x}, ${y}) rotate(${stamp.rotation})`;
  const opacity = stamp.opacity;

  let inner = '';
  switch (stamp.type) {
    case 'stamp-circle':
      inner = svgCircle(size, resolvedColor);
      break;
    case 'stamp-triangle':
      inner = svgTriangle(size, resolvedColor);
      break;
    case 'stamp-line':
      inner = svgLine(size, resolvedColor);
      break;
    case 'stamp-dot-grid':
      inner = svgDotGrid(size, resolvedColor);
      break;
    case 'stamp-gradient-band': {
      const gradId = `stamp-grad-${stamp.id}`;
      inner = svgGradientBand(size, resolvedColor, gradId);
      break;
    }
    case 'stamp-ring':
      inner = svgRing(size, resolvedColor);
      break;
  }

  // For gradient-band, defs must be included; wrap everything in a group
  if (stamp.type === 'stamp-gradient-band') {
    const gradId = `stamp-grad-${stamp.id}`;
    const { defs, shape } = svgGradientBandParts(size, resolvedColor, gradId);
    return `<defs>${defs}</defs><g transform="${transform}" opacity="${opacity}">${shape}</g>`;
  }

  return `<g transform="${transform}" opacity="${opacity}">${inner}</g>`;
}

function svgCircle(size: number, color: string): string {
  const r = size / 2;
  const lw = size * 0.06;
  return `<circle cx="0" cy="0" r="${r}" fill="${color}33" stroke="${color}" stroke-width="${lw}" />`;
}

function svgTriangle(size: number, color: string): string {
  const h = size * 0.866;
  const lw = size * 0.05;
  const points = `0,${-h / 2} ${size / 2},${h / 2} ${-size / 2},${h / 2}`;
  return `<polygon points="${points}" fill="${color}33" stroke="${color}" stroke-width="${lw}" />`;
}

function svgLine(size: number, color: string): string {
  const lw = size * 0.08;
  return `<line x1="${-size / 2}" y1="0" x2="${size / 2}" y2="0" stroke="${color}" stroke-width="${lw}" stroke-linecap="round" />`;
}

function svgDotGrid(size: number, color: string): string {
  const dotR = size * 0.04;
  const spacing = size / 4;
  const count = 4;
  const offset = -(spacing * (count - 1)) / 2;
  let circles = '';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const cx = offset + col * spacing;
      const cy = offset + row * spacing;
      circles += `<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="${color}" />`;
    }
  }
  return circles;
}

function svgGradientBand(size: number, color: string, gradId: string): string {
  const { defs, shape } = svgGradientBandParts(size, color, gradId);
  return `${defs}${shape}`;
}

function svgGradientBandParts(
  size: number,
  color: string,
  gradId: string
): { defs: string; shape: string } {
  const w = size;
  const h = size * 0.3;
  const defs = `<linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="${color}" stop-opacity="0" />
    <stop offset="30%" stop-color="${color}" stop-opacity="0.8" />
    <stop offset="70%" stop-color="${color}" stop-opacity="0.8" />
    <stop offset="100%" stop-color="${color}" stop-opacity="0" />
  </linearGradient>`;
  const shape = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#${gradId})" />`;
  return { defs, shape };
}

function svgRing(size: number, color: string): string {
  const outer = size / 2;
  const inner = size * 0.3;
  const lw = size * 0.04;
  // Use two circles: outer filled ring and inner cutout via mask, or use stroke trick
  const strokeWidth = outer - inner;
  const strokeR = (outer + inner) / 2;
  return `<circle cx="0" cy="0" r="${strokeR}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-opacity="0.4" />
<circle cx="0" cy="0" r="${outer}" fill="none" stroke="${color}" stroke-width="${lw}" />`;
}
