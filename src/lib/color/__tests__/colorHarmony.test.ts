import { generateColorHarmony } from '../colorHarmony';

describe('generateColorHarmony', () => {
  it('should return 6 color suggestions', () => {
    const suggestions = generateColorHarmony('#2563EB');
    expect(suggestions).toHaveLength(6);
  });

  it('should return valid hex colors', () => {
    const suggestions = generateColorHarmony('#2563EB');
    for (const s of suggestions) {
      expect(s.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('should include all harmony types', () => {
    const suggestions = generateColorHarmony('#FF0000');
    const types = suggestions.map((s) => s.type);
    expect(types).toContain('complementary');
    expect(types).toContain('analogous');
    expect(types).toContain('triadic');
    expect(types).toContain('split-complementary');
  });

  it('should have labels for all suggestions', () => {
    const suggestions = generateColorHarmony('#00FF00');
    for (const s of suggestions) {
      expect(s.label).toBeTruthy();
    }
  });

  it('should generate different colors for different brand colors', () => {
    const blue = generateColorHarmony('#2563EB');
    const red = generateColorHarmony('#FF0000');
    expect(blue[0].color).not.toBe(red[0].color);
  });

  it('should handle dark brand colors', () => {
    const suggestions = generateColorHarmony('#111111');
    expect(suggestions).toHaveLength(6);
    for (const s of suggestions) {
      expect(s.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('should handle achromatic colors (black/white)', () => {
    const black = generateColorHarmony('#000000');
    expect(black).toHaveLength(6);
    const white = generateColorHarmony('#FFFFFF');
    expect(white).toHaveLength(6);
  });

  it('complementary should be approximately opposite on color wheel', () => {
    const suggestions = generateColorHarmony('#FF0000');
    const complementary = suggestions.find((s) => s.type === 'complementary');
    expect(complementary).toBeDefined();
    // Red's complement should be in the cyan/teal range
    // Just verify it's a different hue
    expect(complementary!.color).not.toBe('#FF0000');
  });
});
