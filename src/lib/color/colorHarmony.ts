import chroma from 'chroma-js';

export interface ColorSuggestion {
  color: string;
  label: string;
  type: 'complementary' | 'analogous' | 'triadic' | 'split-complementary';
}

/**
 * Generate color harmony suggestions based on a brand color.
 * Returns accent color candidates using color theory rules.
 */
export function generateColorHarmony(brandColor: string): ColorSuggestion[] {
  const hsl = chroma(brandColor).hsl();
  const h = hsl[0] || 0;
  const s = hsl[1];
  const l = hsl[2];

  const suggestions: ColorSuggestion[] = [];

  // Complementary (opposite on color wheel)
  suggestions.push({
    color: chroma.hsl((h + 180) % 360, Math.min(s * 1.1, 1), Math.max(l, 0.4)).hex(),
    label: '補色',
    type: 'complementary',
  });

  // Analogous (30 degrees away)
  suggestions.push({
    color: chroma.hsl((h + 30) % 360, s, Math.max(l, 0.4)).hex(),
    label: '類似色+',
    type: 'analogous',
  });
  suggestions.push({
    color: chroma.hsl((h + 330) % 360, s, Math.max(l, 0.4)).hex(),
    label: '類似色-',
    type: 'analogous',
  });

  // Triadic (120 degrees away)
  suggestions.push({
    color: chroma.hsl((h + 120) % 360, Math.min(s * 1.05, 1), Math.max(l, 0.4)).hex(),
    label: 'トライアド',
    type: 'triadic',
  });

  // Split complementary (150 and 210 degrees away)
  suggestions.push({
    color: chroma.hsl((h + 150) % 360, s, Math.max(l, 0.45)).hex(),
    label: '分裂補色A',
    type: 'split-complementary',
  });
  suggestions.push({
    color: chroma.hsl((h + 210) % 360, s, Math.max(l, 0.45)).hex(),
    label: '分裂補色B',
    type: 'split-complementary',
  });

  return suggestions;
}
