import chroma from 'chroma-js';
import type { DerivedColors } from '@/types/banner';

/**
 * Generate derived colors from a brand color using HSL manipulation.
 * - Light: H, S-10%, L+20% (background/overlay)
 * - Medium: original brand color (main text/band)
 * - Dark: H, S+5%, L-20% (emphasis/border)
 */
export function generateDerivedColors(
  brandColor: string,
  accentColor: string
): DerivedColors {
  const base = chroma(brandColor);
  const [h, s, l] = base.hsl();

  const hue = isNaN(h) ? 0 : h;

  const light = chroma.hsl(
    hue,
    Math.max(0, s - 0.1),
    Math.min(1, l + 0.2)
  ).hex();

  const medium = base.hex();

  const dark = chroma.hsl(
    hue,
    Math.min(1, s + 0.05),
    Math.max(0, l - 0.2)
  ).hex();

  // Harmonize accent color: ensure brightness/saturation difference stays within 20-40%
  const harmonizedAccent = harmonizeAccentColor(brandColor, accentColor);

  return {
    light,
    medium,
    dark,
    accent: harmonizedAccent,
  };
}

/**
 * Harmonize accent color with brand color.
 * Ensures brightness difference is 20-40% and saturation difference is within ±20%.
 * Preserves the hue of the accent color.
 */
export function harmonizeAccentColor(brandColor: string, accentColor: string): string {
  const brand = chroma(brandColor);
  const accent = chroma(accentColor);

  const [brandH, brandS, brandL] = brand.hsl();
  const [accentH, accentS, accentL] = accent.hsl();

  const hue = isNaN(accentH) ? 0 : accentH;

  // Adjust saturation: keep within ±20% of brand saturation
  const maxSatDiff = 0.20;
  let newS = accentS;
  if (Math.abs(accentS - brandS) > maxSatDiff) {
    newS = accentS > brandS
      ? Math.min(brandS + maxSatDiff, 1)
      : Math.max(brandS - maxSatDiff, 0);
  }

  // Adjust lightness: keep difference between 20-40%
  const bL = isNaN(brandL) ? 0.5 : brandL;
  let newL = accentL;
  const lightDiff = Math.abs(accentL - bL);
  if (lightDiff < 0.20) {
    // Too close — push apart
    newL = accentL > bL ? Math.min(bL + 0.25, 0.85) : Math.max(bL - 0.25, 0.15);
  } else if (lightDiff > 0.40) {
    // Too far — pull closer
    newL = accentL > bL ? Math.min(bL + 0.35, 0.85) : Math.max(bL - 0.35, 0.15);
  }

  return chroma.hsl(hue, newS, newL).hex();
}

/**
 * Generate a gradient string for use when no background image is provided.
 * Uses the brand color derivatives to create a subtle gradient.
 */
export function generateBrandGradient(derivedColors: DerivedColors): string {
  return `linear-gradient(135deg, ${derivedColors.light} 0%, ${derivedColors.medium} 50%, ${derivedColors.dark} 100%)`;
}
