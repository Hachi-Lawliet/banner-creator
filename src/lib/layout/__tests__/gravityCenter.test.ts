import { calculateGravityCenter, isGravityCenterBalanced, suggestGravityAdjustment } from '../gravityCenter';

describe('calculateGravityCenter', () => {
  it('should return 0.5 for empty elements', () => {
    expect(calculateGravityCenter([])).toBe(0.5);
  });

  it('should return element position for single element', () => {
    const result = calculateGravityCenter([
      { yCenterRatio: 0.3, area: 1000, color: '#000000' },
    ]);
    expect(result).toBeCloseTo(0.3, 1);
  });

  it('should weight by area', () => {
    const result = calculateGravityCenter([
      { yCenterRatio: 0.2, area: 10000, color: '#000000' },
      { yCenterRatio: 0.8, area: 1000, color: '#000000' },
    ]);
    // Should be closer to 0.2 (larger area)
    expect(result).toBeLessThan(0.5);
  });

  it('should weight by color darkness', () => {
    const result = calculateGravityCenter([
      { yCenterRatio: 0.2, area: 1000, color: '#000000' }, // dark = heavy
      { yCenterRatio: 0.8, area: 1000, color: '#FFFFFF' }, // light = lightweight
    ]);
    // Should be closer to 0.2 (darker color)
    expect(result).toBeLessThan(0.5);
  });

  it('should return center for equal weights at opposite positions', () => {
    const result = calculateGravityCenter([
      { yCenterRatio: 0.3, area: 1000, color: '#808080' },
      { yCenterRatio: 0.7, area: 1000, color: '#808080' },
    ]);
    expect(result).toBeCloseTo(0.5, 1);
  });

  it('should return 0.5 when all elements have zero visual weight (white color)', () => {
    // White (#FFFFFF) has luminance ≈ 1, so 1 - luminance ≈ 0, making weight = 0
    const result = calculateGravityCenter([
      { yCenterRatio: 0.2, area: 1000, color: '#FFFFFF' },
      { yCenterRatio: 0.8, area: 1000, color: '#FFFFFF' },
    ]);
    expect(result).toBe(0.5);
  });

  it('gravity center should be in 0-1 range', () => {
    const result = calculateGravityCenter([
      { yCenterRatio: 0.1, area: 5000, color: '#333333' },
      { yCenterRatio: 0.9, area: 3000, color: '#666666' },
      { yCenterRatio: 0.5, area: 8000, color: '#111111' },
    ]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe('isGravityCenterBalanced', () => {
  it('should return true for 0.45 (within 0.4-0.5)', () => {
    expect(isGravityCenterBalanced(0.45)).toBe(true);
  });

  it('should return false for 0.3 (below target)', () => {
    expect(isGravityCenterBalanced(0.3)).toBe(false);
  });

  it('should return false for 0.6 (above target)', () => {
    expect(isGravityCenterBalanced(0.6)).toBe(false);
  });

  it('should accept boundary values', () => {
    expect(isGravityCenterBalanced(0.4)).toBe(true);
    expect(isGravityCenterBalanced(0.5)).toBe(true);
  });

  it('should accept custom target range', () => {
    expect(isGravityCenterBalanced(0.35, 0.3, 0.4)).toBe(true);
  });
});

describe('suggestGravityAdjustment', () => {
  it('should return 0 when gravity is at target center', () => {
    expect(suggestGravityAdjustment(0.45)).toBeCloseTo(0, 1);
  });

  it('should return negative when gravity is too low (move elements down)', () => {
    const adjustment = suggestGravityAdjustment(0.6);
    expect(adjustment).toBeLessThan(0);
  });

  it('should return positive when gravity is too high (move elements up)', () => {
    const adjustment = suggestGravityAdjustment(0.2);
    expect(adjustment).toBeGreaterThan(0);
  });
});
