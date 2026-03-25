import { goldenSplit, goldenPosition, goldenFontRatio } from '../goldenRatio';

describe('goldenSplit', () => {
  it('should split 1000 into approximately 618 and 382', () => {
    const [major, minor] = goldenSplit(1000);
    expect(major).toBeCloseTo(618, 0);
    expect(minor).toBeCloseTo(382, 0);
  });

  it('major + minor should equal the total', () => {
    const total = 1200;
    const [major, minor] = goldenSplit(total);
    expect(major + minor).toBeCloseTo(total, 5);
  });

  it('major/minor should approximate phi (1.618)', () => {
    const [major, minor] = goldenSplit(1000);
    expect(major / minor).toBeCloseTo(1.618, 2);
  });

  it('should handle 0', () => {
    const [major, minor] = goldenSplit(0);
    expect(major).toBe(0);
    expect(minor).toBe(0);
  });

  it('should handle small values', () => {
    const [major, minor] = goldenSplit(10);
    expect(major + minor).toBeCloseTo(10, 5);
  });
});

describe('goldenPosition', () => {
  it('should return major position from start by default', () => {
    const pos = goldenPosition(1000);
    expect(pos).toBeCloseTo(618, 0);
  });

  it('should return minor position from end', () => {
    const pos = goldenPosition(1000, false);
    expect(pos).toBeCloseTo(382, 0);
  });
});

describe('goldenFontRatio', () => {
  it('should return title/phi for subtitle size', () => {
    const subtitle = goldenFontRatio(48);
    expect(subtitle).toBeCloseTo(48 / 1.618, 1);
  });
});
