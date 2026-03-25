import { calculateSafeArea, isWithinSafeArea, clampToSafeArea } from '../safeArea';

describe('calculateSafeArea', () => {
  it('should calculate 10% margin by default', () => {
    const sa = calculateSafeArea(1200, 628);
    expect(sa.x).toBe(120);
    expect(sa.y).toBeCloseTo(62.8);
    expect(sa.width).toBe(960);
    expect(sa.height).toBeCloseTo(502.4);
  });

  it('should respect custom margin ratio', () => {
    const sa = calculateSafeArea(1000, 500, 0.05);
    expect(sa.x).toBe(50);
    expect(sa.y).toBe(25);
    expect(sa.width).toBe(900);
    expect(sa.height).toBe(450);
  });

  it('safe area should be smaller than canvas', () => {
    const sa = calculateSafeArea(1200, 628);
    expect(sa.width).toBeLessThan(1200);
    expect(sa.height).toBeLessThan(628);
  });

  it('safe area + margins should equal canvas', () => {
    const sa = calculateSafeArea(1200, 628, 0.1);
    expect(sa.x * 2 + sa.width).toBeCloseTo(1200);
    expect(sa.y * 2 + sa.height).toBeCloseTo(628);
  });
});

describe('isWithinSafeArea', () => {
  const sa = calculateSafeArea(1200, 628);

  it('should return true for element inside safe area', () => {
    expect(isWithinSafeArea(200, 100, 100, 50, sa)).toBe(true);
  });

  it('should return false for element outside safe area', () => {
    expect(isWithinSafeArea(0, 0, 100, 50, sa)).toBe(false);
  });

  it('should return false for element partially outside', () => {
    expect(isWithinSafeArea(sa.x + sa.width - 50, sa.y, 100, 50, sa)).toBe(false);
  });

  it('should return true for element at safe area boundary', () => {
    expect(isWithinSafeArea(sa.x, sa.y, sa.width, sa.height, sa)).toBe(true);
  });
});

describe('clampToSafeArea', () => {
  const sa = calculateSafeArea(1200, 628);

  it('should not change position if already inside', () => {
    const clamped = clampToSafeArea(200, 100, 50, 30, sa);
    expect(clamped.x).toBe(200);
    expect(clamped.y).toBe(100);
  });

  it('should clamp to left/top boundary', () => {
    const clamped = clampToSafeArea(0, 0, 50, 30, sa);
    expect(clamped.x).toBe(sa.x);
    expect(clamped.y).toBe(sa.y);
  });

  it('should clamp to right/bottom boundary', () => {
    const clamped = clampToSafeArea(2000, 2000, 50, 30, sa);
    expect(clamped.x).toBe(sa.x + sa.width - 50);
    expect(clamped.y).toBe(sa.y + sa.height - 30);
  });
});
