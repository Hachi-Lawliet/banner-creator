import { generateDerivedColors, generateBrandGradient } from '../colorGenerator';
import chroma from 'chroma-js';

describe('generateDerivedColors', () => {
  const brandColor = '#2563EB';
  const accentColor = '#F59E0B';

  it('should return 4 colors (light, medium, dark, accent)', () => {
    const result = generateDerivedColors(brandColor, accentColor);
    expect(result).toHaveProperty('light');
    expect(result).toHaveProperty('medium');
    expect(result).toHaveProperty('dark');
    expect(result).toHaveProperty('accent');
  });

  it('should return the original brand color as medium', () => {
    const result = generateDerivedColors(brandColor, accentColor);
    expect(chroma(result.medium).hex()).toBe(chroma(brandColor).hex());
  });

  it('should return harmonized accent color preserving hue', () => {
    const result = generateDerivedColors(brandColor, accentColor);
    // Accent hue should be preserved (within rounding tolerance)
    const originalHue = chroma(accentColor).hsl()[0];
    const resultHue = chroma(result.accent).hsl()[0];
    expect(Math.abs(resultHue - originalHue)).toBeLessThan(2);
    // Accent should be a valid color
    expect(chroma.valid(result.accent)).toBe(true);
  });

  it('light color should be lighter than medium', () => {
    const result = generateDerivedColors(brandColor, accentColor);
    const lightLum = chroma(result.light).luminance();
    const mediumLum = chroma(result.medium).luminance();
    expect(lightLum).toBeGreaterThan(mediumLum);
  });

  it('dark color should be darker than medium', () => {
    const result = generateDerivedColors(brandColor, accentColor);
    const darkLum = chroma(result.dark).luminance();
    const mediumLum = chroma(result.medium).luminance();
    expect(darkLum).toBeLessThan(mediumLum);
  });

  it('should handle black brand color', () => {
    const result = generateDerivedColors('#000000', accentColor);
    expect(result.light).toBeDefined();
    expect(result.medium).toBeDefined();
    expect(result.dark).toBeDefined();
  });

  it('should handle white brand color', () => {
    const result = generateDerivedColors('#FFFFFF', accentColor);
    expect(result.light).toBeDefined();
    expect(result.medium).toBeDefined();
    expect(result.dark).toBeDefined();
  });

  it('should handle gray (no hue) brand color', () => {
    const result = generateDerivedColors('#808080', accentColor);
    expect(result.light).toBeDefined();
    expect(result.dark).toBeDefined();
  });
});

describe('generateBrandGradient', () => {
  it('should return a CSS linear-gradient string', () => {
    const colors = generateDerivedColors('#2563EB', '#F59E0B');
    const gradient = generateBrandGradient(colors);
    expect(gradient).toContain('linear-gradient');
    expect(gradient).toContain('135deg');
  });
});
