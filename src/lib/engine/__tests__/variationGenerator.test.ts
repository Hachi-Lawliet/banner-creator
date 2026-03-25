import { generateVariations } from '../variationGenerator';
import type { BannerConfig, DerivedColors } from '@/types/banner';

const baseConfig: BannerConfig = {
  width: 1200,
  height: 628,
  brandColor: '#2563EB',
  accentColor: '#F59E0B',
  title: 'Test Title',
  highlightKeyword: 'Test',
  titleLines: [],
  logoPosition: 'top-left',
  photoClipStyle: 'none',
  photoClipSkewAngle: 15,
  logoImage: null,
  backgroundImage: null,
  backgroundImage2: null,
  overlayOpacity: 0.5,
  showDecoration: true,
  templateStyle: 'classic' as const,
  stamps: [],
  manualAdjustments: {
    logo: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 },
    title: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 },
    titleLines: {},
    backgroundImage: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 },
    photoClip: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 },
    stamps: {},
  },
};

const baseDerivedColors: DerivedColors = {
  light: '#93B4F5',
  medium: '#2563EB',
  dark: '#1A3FA0',
  accent: '#F59E0B',
};

describe('generateVariations', () => {
  it('returns exactly 4 variations', () => {
    const variations = generateVariations(baseConfig, baseDerivedColors);
    expect(variations).toHaveLength(4);
  });

  it('first variation is the original config unchanged', () => {
    const variations = generateVariations(baseConfig, baseDerivedColors);
    const original = variations[0];
    expect(original.label).toBe('オリジナル');
    expect(original.config.brandColor).toBe(baseConfig.brandColor);
    expect(original.config.accentColor).toBe(baseConfig.accentColor);
    expect(original.config.logoPosition).toBe(baseConfig.logoPosition);
    expect(original.config.overlayOpacity).toBe(baseConfig.overlayOpacity);
  });

  it('second variation uses complementary accent color', () => {
    const variations = generateVariations(baseConfig, baseDerivedColors);
    const variation2 = variations[1];
    expect(variation2.label).toBe('補色アクセント');
    // Complementary color differs from original accent
    expect(variation2.config.accentColor).not.toBe(baseConfig.accentColor);
    // Brand color remains the same
    expect(variation2.config.brandColor).toBe(baseConfig.brandColor);
  });

  it('third variation changes brand color (triadic)', () => {
    const variations = generateVariations(baseConfig, baseDerivedColors);
    const variation3 = variations[2];
    expect(variation3.config.brandColor).not.toBe(baseConfig.brandColor);
    expect(variation3.label).toBe('トライアドカラー');
  });

  it('fourth variation increases overlay opacity', () => {
    const variations = generateVariations(baseConfig, baseDerivedColors);
    const variation4 = variations[3];
    expect(variation4.config.overlayOpacity).toBeGreaterThan(baseConfig.overlayOpacity);
    expect(variation4.config.overlayOpacity).toBeLessThanOrEqual(0.8);
  });

  it('fourth variation overlay opacity does not exceed 0.8 when base is near max', () => {
    const highOpacityConfig = { ...baseConfig, overlayOpacity: 0.75 };
    const variations = generateVariations(highOpacityConfig, baseDerivedColors);
    expect(variations[3].config.overlayOpacity).toBe(0.8);
  });

  it('third variation uses different brand and accent colors', () => {
    const variations = generateVariations(baseConfig, baseDerivedColors);
    const v3 = variations[2];
    expect(v3.config.brandColor).not.toBe(baseConfig.brandColor);
    expect(v3.config.accentColor).not.toBe(v3.config.brandColor);
  });

  it('each variation has a non-empty label', () => {
    const variations = generateVariations(baseConfig, baseDerivedColors);
    for (const v of variations) {
      expect(v.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('each variation has valid derivedColors with accent field', () => {
    const variations = generateVariations(baseConfig, baseDerivedColors);
    for (const v of variations) {
      expect(v.derivedColors).toHaveProperty('light');
      expect(v.derivedColors).toHaveProperty('medium');
      expect(v.derivedColors).toHaveProperty('dark');
      expect(v.derivedColors).toHaveProperty('accent');
    }
  });

  it('does not mutate the original config', () => {
    const configCopy = { ...baseConfig };
    generateVariations(baseConfig, baseDerivedColors);
    expect(baseConfig.logoPosition).toBe(configCopy.logoPosition);
    expect(baseConfig.accentColor).toBe(configCopy.accentColor);
    expect(baseConfig.overlayOpacity).toBe(configCopy.overlayOpacity);
  });
});
