import type { BannerConfig, DerivedColors } from '@/types/banner';
import { generateColorHarmony } from '@/lib/color/colorHarmony';
import { generateDerivedColors } from '@/lib/color/colorGenerator';

export interface BannerVariation {
  config: BannerConfig;
  derivedColors: DerivedColors;
  label: string;
}

/**
 * Update titleLines accent colors when accent color changes.
 */
function updateTitleLinesAccent(config: BannerConfig, oldAccent: string, newAccent: string): BannerConfig {
  const updatedTitleLines = config.titleLines.map((line) => ({
    segments: line.segments.map((seg) => {
      if (seg.color && seg.color.toLowerCase() === oldAccent.toLowerCase()) {
        return { ...seg, color: newAccent };
      }
      return seg;
    }),
  }));
  return { ...config, titleLines: updatedTitleLines };
}

/**
 * Generate 4 variations from a base config for comparison view.
 * Variation 1: Original (current user edits)
 * Variation 2: Complementary accent color
 * Variation 3: Triadic brand color
 * Variation 4: Higher gradient + analogous accent color
 */
export function generateVariations(
  baseConfig: BannerConfig,
  baseDerivedColors: DerivedColors
): BannerVariation[] {
  const harmonySuggestions = generateColorHarmony(baseConfig.brandColor);
  const complementary = harmonySuggestions.find(s => s.type === 'complementary');
  const analogous = harmonySuggestions.find(s => s.type === 'analogous');
  const triadic = harmonySuggestions.find(s => s.type === 'triadic');
  const splitCompA = harmonySuggestions.find(s => s.type === 'split-complementary');

  // Variation 1: Original (reflects current user edits)
  const original: BannerVariation = {
    config: { ...baseConfig },
    derivedColors: { ...baseDerivedColors },
    label: 'オリジナル',
  };

  // Variation 2: Complementary accent
  const comp = complementary?.color ?? baseDerivedColors.accent;
  let v2Config = { ...baseConfig, accentColor: comp };
  v2Config = updateTitleLinesAccent(v2Config, baseConfig.accentColor, comp);
  const variation2: BannerVariation = {
    config: v2Config,
    derivedColors: generateDerivedColors(baseConfig.brandColor, comp),
    label: '補色アクセント',
  };

  // Variation 3: Triadic - brand=+120°, accent=split-comp for contrast
  const triadicBrand = triadic?.color ?? baseDerivedColors.medium;
  const triadicAccent = splitCompA?.color ?? complementary?.color ?? baseDerivedColors.accent;
  let v3Config = { ...baseConfig, brandColor: triadicBrand, accentColor: triadicAccent };
  v3Config = updateTitleLinesAccent(v3Config, baseConfig.accentColor, triadicAccent);
  const variation3: BannerVariation = {
    config: v3Config,
    derivedColors: generateDerivedColors(triadicBrand, triadicAccent),
    label: 'トライアドカラー',
  };

  // Variation 4: Higher gradient + analogous accent
  const analog = analogous?.color ?? baseDerivedColors.accent;
  const newOpacity = Math.min(0.8, baseConfig.overlayOpacity + 0.2);
  let v4Config = { ...baseConfig, overlayOpacity: newOpacity, accentColor: analog };
  v4Config = updateTitleLinesAccent(v4Config, baseConfig.accentColor, analog);
  const variation4: BannerVariation = {
    config: v4Config,
    derivedColors: generateDerivedColors(baseConfig.brandColor, analog),
    label: '高グラデ + 類似色',
  };

  return [original, variation2, variation3, variation4];
}
