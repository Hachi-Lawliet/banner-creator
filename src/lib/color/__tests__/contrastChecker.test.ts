import { getContrastRatio, meetsWCAG_AA, findMinOverlayOpacity } from '../contrastChecker';

describe('getContrastRatio', () => {
  it('should return 21 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should return 1 for same color', () => {
    const ratio = getContrastRatio('#2563EB', '#2563EB');
    expect(ratio).toBeCloseTo(1, 0);
  });

  it('should be symmetric', () => {
    const ratio1 = getContrastRatio('#2563EB', '#FFFFFF');
    const ratio2 = getContrastRatio('#FFFFFF', '#2563EB');
    expect(ratio1).toBeCloseTo(ratio2, 2);
  });

  it('should return a value >= 1', () => {
    const ratio = getContrastRatio('#333333', '#666666');
    expect(ratio).toBeGreaterThanOrEqual(1);
  });
});

describe('meetsWCAG_AA', () => {
  it('should pass for black on white (normal text)', () => {
    expect(meetsWCAG_AA('#000000', '#FFFFFF')).toBe(true);
  });

  it('should fail for similar colors', () => {
    expect(meetsWCAG_AA('#777777', '#888888')).toBe(false);
  });

  it('should use 3:1 ratio for large text', () => {
    // #767676 on white has contrast ~4.54:1, right at the boundary
    // #777777 on white has contrast ~4.48:1 — fails normal but passes large
    const fg = '#777777';
    const bg = '#FFFFFF';
    const ratio = getContrastRatio(fg, bg);
    // Verify the ratio is in the range where large/normal differ
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThan(4.5);
    // Large text: 3:1 threshold → should pass
    expect(meetsWCAG_AA(fg, bg, true)).toBe(true);
    // Normal text: 4.5:1 threshold → should fail
    expect(meetsWCAG_AA(fg, bg, false)).toBe(false);
  });

  it('should pass for white on dark blue', () => {
    expect(meetsWCAG_AA('#FFFFFF', '#1A1A2E')).toBe(true);
  });
});

describe('findMinOverlayOpacity', () => {
  it('should return a value between 0 and 0.8', () => {
    const opacity = findMinOverlayOpacity('#FFFFFF', '#CCCCCC', '#000000');
    expect(opacity).toBeGreaterThanOrEqual(0);
    expect(opacity).toBeLessThanOrEqual(0.8);
  });

  it('should return low opacity when contrast is already good', () => {
    const opacity = findMinOverlayOpacity('#FFFFFF', '#000000', '#000000');
    expect(opacity).toBeLessThan(0.1);
  });

  it('should return higher opacity for low contrast scenarios', () => {
    const opacity = findMinOverlayOpacity('#FFFFFF', '#EEEEEE', '#000000');
    expect(opacity).toBeGreaterThan(0.1);
  });
});
