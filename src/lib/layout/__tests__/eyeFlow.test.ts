import { calculateZPatternZones, getPatternType } from '../eyeFlow';

describe('calculateZPatternZones', () => {
  const safeArea = { x: 100, y: 50, width: 1000, height: 500 };

  it('should return 5 zones', () => {
    const zones = calculateZPatternZones(safeArea);
    expect(zones).toHaveProperty('topLeft');
    expect(zones).toHaveProperty('topRight');
    expect(zones).toHaveProperty('center');
    expect(zones).toHaveProperty('bottomLeft');
    expect(zones).toHaveProperty('bottomRight');
  });

  it('zones should be within safe area', () => {
    const zones = calculateZPatternZones(safeArea);
    for (const zone of [zones.topLeft, zones.topRight, zones.center, zones.bottomLeft, zones.bottomRight]) {
      expect(zone.x).toBeGreaterThanOrEqual(safeArea.x);
      expect(zone.y).toBeGreaterThanOrEqual(safeArea.y);
    }
  });

  it('top zones should be above bottom zones', () => {
    const zones = calculateZPatternZones(safeArea);
    expect(zones.topLeft.y).toBeLessThan(zones.bottomLeft.y);
    expect(zones.topRight.y).toBeLessThan(zones.bottomRight.y);
  });

  it('left zones should be left of right zones', () => {
    const zones = calculateZPatternZones(safeArea);
    expect(zones.topLeft.x).toBeLessThan(zones.topRight.x);
    expect(zones.bottomLeft.x).toBeLessThan(zones.bottomRight.x);
  });
});

describe('getPatternType', () => {
  it('should return z-pattern for horizontal banners', () => {
    expect(getPatternType(1200, 628)).toBe('z-pattern');
  });

  it('should return f-pattern for vertical banners', () => {
    expect(getPatternType(400, 800)).toBe('f-pattern');
  });

  it('should return z-pattern for square', () => {
    expect(getPatternType(500, 500)).toBe('z-pattern');
  });
});
