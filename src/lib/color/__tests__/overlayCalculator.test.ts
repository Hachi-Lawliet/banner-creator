import { calculateOverlayColor, generateGradientStops } from '../overlayCalculator';

describe('calculateOverlayColor', () => {
  it('should return rgba string', () => {
    const result = calculateOverlayColor('#1A3FA0', 0.5);
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
  });

  it('should clamp opacity to max 0.8', () => {
    const high = calculateOverlayColor('#000000', 1.0);
    // Should be rgba(0, 0, 0, 0.8) — opacity clamped from 1.0 to 0.8
    expect(high).toBe('rgba(0, 0, 0, 0.8)');
  });

  it('should clamp opacity to min 0', () => {
    const low = calculateOverlayColor('#000000', -0.5);
    // Should be rgba(0, 0, 0, 0) — opacity clamped from -0.5 to 0
    expect(low).toBe('rgba(0, 0, 0, 0)');
  });

  it('should use the correct color', () => {
    const result = calculateOverlayColor('#FF0000', 0.5);
    expect(result).toContain('255');
    expect(result).toContain('0.5');
  });
});

describe('generateGradientStops', () => {
  it('should return 5 stops for smoother gradient', () => {
    const stops = generateGradientStops('#AAA', '#555', '#111');
    expect(stops).toHaveLength(5);
  });

  it('should have positions at 0, 0.25, 0.5, 0.75, and 1', () => {
    const stops = generateGradientStops('#AAA', '#555', '#111');
    expect(stops[0][0]).toBe(0);
    expect(stops[1][0]).toBe(0.25);
    expect(stops[2][0]).toBe(0.5);
    expect(stops[3][0]).toBe(0.75);
    expect(stops[4][0]).toBe(1);
  });

  it('should preserve the input colors at key positions', () => {
    const stops = generateGradientStops('#AAAAAA', '#555555', '#111111');
    expect(stops[0][1]).toBe('#AAAAAA');
    expect(stops[2][1]).toBe('#555555');
    expect(stops[4][1]).toBe('#111111');
  });

  it('should generate intermediate colors between input colors', () => {
    const stops = generateGradientStops('#AAAAAA', '#555555', '#111111');
    // Intermediate colors should be different from the input colors
    expect(stops[1][1]).not.toBe('#AAAAAA');
    expect(stops[1][1]).not.toBe('#555555');
    expect(stops[3][1]).not.toBe('#555555');
    expect(stops[3][1]).not.toBe('#111111');
  });
});
