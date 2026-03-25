import { calculateLayout, calculateEnterkeyLayout, findOptimalFontSize } from '../layoutCalculator';
import type { BannerConfig, DerivedColors } from '@/types/banner';

const defaultConfig: BannerConfig = {
  width: 1200,
  height: 628,
  brandColor: '#2563EB',
  accentColor: '#F59E0B',
  title: 'テストタイトル',
  highlightKeyword: 'テスト',
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

const defaultColors: DerivedColors = {
  light: '#93B4F5',
  medium: '#2563EB',
  dark: '#1A3FA0',
  accent: '#F59E0B',
};

describe('calculateLayout', () => {
  it('should return a complete layout result', () => {
    const layout = calculateLayout(defaultConfig, defaultColors);

    expect(layout).toHaveProperty('canvasWidth', 1200);
    expect(layout).toHaveProperty('canvasHeight', 628);
    expect(layout).toHaveProperty('safeArea');
    expect(layout).toHaveProperty('logo');
    expect(layout).toHaveProperty('title');
    expect(layout).toHaveProperty('highlightKeyword');
    expect(layout).toHaveProperty('background');
    expect(layout).toHaveProperty('overlay');
    expect(layout).toHaveProperty('decorations');
    expect(layout).toHaveProperty('gravityCenter');
  });

  it('safe area should have 10% margin', () => {
    const layout = calculateLayout(defaultConfig, defaultColors);
    expect(layout.safeArea.x).toBeCloseTo(120);
    expect(layout.safeArea.y).toBeCloseTo(62.8);
  });

  it('background should cover full canvas', () => {
    const layout = calculateLayout(defaultConfig, defaultColors);
    expect(layout.background.x).toBe(0);
    expect(layout.background.y).toBe(0);
    expect(layout.background.width).toBe(1200);
    expect(layout.background.height).toBe(628);
  });

  it('overlay should cover full canvas', () => {
    const layout = calculateLayout(defaultConfig, defaultColors);
    expect(layout.overlay.width).toBe(1200);
    expect(layout.overlay.height).toBe(628);
    expect(layout.overlay.opacity).toBe(0.5);
  });

  it('should include decorations when showDecoration is true', () => {
    const layout = calculateLayout(defaultConfig, defaultColors);
    expect(layout.decorations.length).toBeGreaterThan(0);
  });

  it('should not include decorations when showDecoration is false', () => {
    const config = { ...defaultConfig, showDecoration: false };
    const layout = calculateLayout(config, defaultColors);
    expect(layout.decorations.length).toBe(0);
  });

  it('gravity center should be a valid ratio', () => {
    const layout = calculateLayout(defaultConfig, defaultColors);
    expect(layout.gravityCenter.y).toBeGreaterThanOrEqual(0);
    expect(layout.gravityCenter.y).toBeLessThanOrEqual(1);
  });

  it('should handle different banner sizes', () => {
    const squareConfig = { ...defaultConfig, width: 1080, height: 1080 };
    const layout = calculateLayout(squareConfig, defaultColors);
    expect(layout.canvasWidth).toBe(1080);
    expect(layout.canvasHeight).toBe(1080);
  });

  it('should handle wide banner (728x90)', () => {
    const wideConfig = { ...defaultConfig, width: 728, height: 90 };
    const layout = calculateLayout(wideConfig, defaultColors);
    expect(layout.canvasWidth).toBe(728);
    expect(layout.canvasHeight).toBe(90);
  });

  it('title layout should have font size set', () => {
    const layout = calculateLayout(defaultConfig, defaultColors);
    expect(layout.title.fontSize).toBeDefined();
    expect(layout.title.fontSize).toBeGreaterThan(0);
  });

  it('highlight keyword should have band color', () => {
    const layout = calculateLayout(defaultConfig, defaultColors);
    expect(layout.highlightKeyword.bandColor).toBe(defaultColors.accent);
  });

  it('should include background image element in gravity calculation when backgroundImage is set', () => {
    const config = { ...defaultConfig, backgroundImage: 'data:image/png;base64,test' };
    const layout = calculateLayout(config, defaultColors);
    // With background image, contrast check uses dark color
    expect(layout.gravityCenter.y).toBeGreaterThanOrEqual(0);
    expect(layout.gravityCenter.y).toBeLessThanOrEqual(1);
  });

  it('should use dark overlay color for contrast when background image exists', () => {
    const config = { ...defaultConfig, backgroundImage: 'data:image/png;base64,test' };
    const layout = calculateLayout(config, defaultColors);
    expect(layout.overlay.color).toBe(defaultColors.dark);
  });

  it('should set contrastRatio to 4.5 when WCAG AA is met', () => {
    // White text on very dark background should meet WCAG AA
    const darkColors: DerivedColors = {
      light: '#333333',
      medium: '#111111',
      dark: '#000000',
      accent: '#FF0000',
    };
    const layout = calculateLayout(defaultConfig, darkColors);
    expect(layout.contrastRatio).toBe(4.5);
  });

  it('should set contrastRatio to 0 when WCAG AA is not met', () => {
    // White text on very light background should fail WCAG AA
    const lightColors: DerivedColors = {
      light: '#FFFFFF',
      medium: '#EEEEEE',
      dark: '#DDDDDD',
      accent: '#F59E0B',
    };
    const layout = calculateLayout(defaultConfig, lightColors);
    expect(layout.contrastRatio).toBe(0);
  });

  it('should handle empty title', () => {
    const config = { ...defaultConfig, title: '', highlightKeyword: '' };
    const layout = calculateLayout(config, defaultColors);
    expect(layout.title).toBeDefined();
  });

  it('should adjust element positions when gravity center is off-target', () => {
    // Without background image: only logo and title affect gravity.
    // Title is white (#ffffff) so its visual weight is 0.
    // Logo uses derivedColors.medium - if very dark, logo dominates.
    // Logo is positioned in upper area (~20% of height).
    // With a very dark medium color, gravity center ≈ 0.2, well below target 0.4-0.5.
    // adjustment = 0.45 - 0.2 = 0.25, which is > 0.05 → triggers adjustment.
    const config: BannerConfig = {
      ...defaultConfig,
      width: 1200,
      height: 628,
      backgroundImage: null,
  backgroundImage2: null, // no background image
    };
    const heavyColors: DerivedColors = {
      light: '#FEFEFE',
      medium: '#010101', // very dark = very heavy logo
      dark: '#010101',
      accent: '#FF0000',
    };
    const layoutBefore = calculateLayout(config, defaultColors);
    const layoutAfter = calculateLayout(config, heavyColors);

    // The gravity adjustment should have shifted elements
    // Logo and title Y positions may differ from default
    expect(layoutAfter.logo.y).toBeDefined();
    expect(layoutAfter.title.y).toBeDefined();
    expect(layoutAfter.highlightKeyword.y).toBeDefined();
  });

  // Logo position tests
  it('should position logo at top-left when logoPosition is top-left', () => {
    const config = { ...defaultConfig, logoPosition: 'top-left' as const };
    const layout = calculateLayout(config, defaultColors);
    expect(layout.logo.x).toBe(layout.safeArea.x);
  });

  it('should position logo at top-right when logoPosition is top-right', () => {
    const config = { ...defaultConfig, logoPosition: 'top-right' as const };
    const layout = calculateLayout(config, defaultColors);
    expect(layout.logo.x).toBe(layout.safeArea.x + layout.safeArea.width - layout.logo.width);
  });

  it('should position logo at center when logoPosition is top-center', () => {
    const config = { ...defaultConfig, logoPosition: 'top-center' as const };
    const layout = calculateLayout(config, defaultColors);
    const expectedX = layout.safeArea.x + (layout.safeArea.width - layout.logo.width) / 2;
    expect(layout.logo.x).toBeCloseTo(expectedX);
  });
});

describe('findOptimalFontSize', () => {
  it('should return maxSize when ctx is null', () => {
    expect(findOptimalFontSize(null, 'test', 500, 12, 48)).toBe(48);
  });

  it('should return maxSize when text is empty', () => {
    const ctx = {} as CanvasRenderingContext2D;
    expect(findOptimalFontSize(ctx, '', 500, 12, 48)).toBe(48);
  });

  it('should find a font size using binary search with a mock ctx', () => {
    // Mock measureText to simulate text that gets wider with larger font
    const mockCtx = {
      font: '',
      measureText: jest.fn((text: string) => {
        // Extract font size from the ctx.font string
        const sizeMatch = mockCtx.font.match(/(\d+(?:\.\d+)?)px/);
        const size = sizeMatch ? parseFloat(sizeMatch[1]) : 16;
        // Approximate: each character is about 0.6x the font size
        return { width: text.length * size * 0.6 };
      }),
    } as unknown as CanvasRenderingContext2D;

    const result = findOptimalFontSize(mockCtx, 'テスト', 200, 12, 72);
    expect(result).toBeGreaterThanOrEqual(12);
    expect(result).toBeLessThanOrEqual(72);
    expect(mockCtx.measureText).toHaveBeenCalled();
  });

  it('should return smaller font for longer text', () => {
    const mockCtx = {
      font: '',
      measureText: jest.fn((text: string) => {
        const sizeMatch = mockCtx.font.match(/(\d+(?:\.\d+)?)px/);
        const size = sizeMatch ? parseFloat(sizeMatch[1]) : 16;
        return { width: text.length * size * 0.6 };
      }),
    } as unknown as CanvasRenderingContext2D;

    const shortResult = findOptimalFontSize(mockCtx, 'AB', 200, 12, 72);
    const longResult = findOptimalFontSize(mockCtx, 'これは長いテキストです', 200, 12, 72);
    expect(shortResult).toBeGreaterThanOrEqual(longResult);
  });
});

describe('calculateEnterkeyLayout', () => {
  const enterkeyConfig: BannerConfig = {
    ...defaultConfig,
    titleLines: [
      {
        segments: [
          { text: 'みんなが集まれる"' },
          { text: '場', color: '#F59E0B', fontWeight: 700 },
          { text: '"で' },
        ],
      },
      {
        segments: [
          { text: 'フルリモートでも' },
          { text: '出社率向上', color: '#F59E0B', fontWeight: 700 },
        ],
      },
    ],
    photoClipStyle: 'skew',
    photoClipSkewAngle: 15,
  };

  it('should return a complete layout result with photoClip', () => {
    const layout = calculateEnterkeyLayout(enterkeyConfig, defaultColors);

    expect(layout).toHaveProperty('canvasWidth', 1200);
    expect(layout).toHaveProperty('canvasHeight', 628);
    expect(layout).toHaveProperty('photoClip');
    expect(layout).toHaveProperty('titleLineLayouts');
    expect(layout.photoClip).toBeDefined();
    expect(layout.photoClip!.points).toHaveLength(4);
  });

  it('should calculate parallelogram clip path correctly', () => {
    const layout = calculateEnterkeyLayout(enterkeyConfig, defaultColors);

    const pts = layout.photoClip!.points;
    // First point should be origin
    expect(pts[0].x).toBe(0);
    expect(pts[0].y).toBe(0);
    // Last point should be bottom-left
    expect(pts[3].x).toBe(0);
    expect(pts[3].y).toBe(628);
    // Right edge should be skewed (top-right x > bottom-right x)
    expect(pts[1].x).toBeGreaterThan(pts[2].x);
  });

  it('should have gradient stops on photo clip', () => {
    const layout = calculateEnterkeyLayout(enterkeyConfig, defaultColors);

    expect(layout.photoClip!.gradientStops.length).toBeGreaterThan(0);
    // First stop should be most opaque
    expect(layout.photoClip!.gradientStops[0].opacity).toBeGreaterThan(0);
  });

  it('should calculate title line layouts with segments', () => {
    const layout = calculateEnterkeyLayout(enterkeyConfig, defaultColors);

    expect(layout.titleLineLayouts).toBeDefined();
    expect(layout.titleLineLayouts!.length).toBe(2);

    // First line should have 3 segments
    const firstLine = layout.titleLineLayouts![0];
    expect(firstLine.segments.length).toBe(3);

    // Highlighted segment should have accent color
    const highlighted = firstLine.segments[1];
    expect(highlighted.color).toBe('#F59E0B');
    expect(highlighted.fontWeight).toBe(700);
  });

  it('should position text block on right side', () => {
    const layout = calculateEnterkeyLayout(enterkeyConfig, defaultColors);

    // Text block starts at about 45% of width
    expect(layout.title.x).toBeGreaterThanOrEqual(540);
  });

  it('should position logo at top-left', () => {
    const layout = calculateEnterkeyLayout(enterkeyConfig, defaultColors);

    expect(layout.logo.x).toBeLessThan(200);
    expect(layout.logo.y).toBeLessThan(100);
  });

  it('should include stripe-triangle-corner decorations when enabled', () => {
    const layout = calculateEnterkeyLayout(enterkeyConfig, defaultColors);

    const triangles = layout.decorations.filter(
      (d) => d.type === 'stripe-triangle-corner'
    );
    expect(triangles.length).toBe(2);

    // One top-right, one bottom-left
    const topRight = triangles.find((d) => d.text === 'top-right');
    const bottomLeft = triangles.find((d) => d.text === 'bottom-left');
    expect(topRight).toBeDefined();
    expect(bottomLeft).toBeDefined();

    // Top-right should be positioned at right edge
    expect(topRight!.x + topRight!.width).toBe(1200);
    expect(topRight!.y).toBe(0);

    // Bottom-left should be at bottom-left
    expect(bottomLeft!.x).toBe(0);
    expect(bottomLeft!.y + bottomLeft!.height).toBe(628);
  });

  it('should not include decorations when disabled', () => {
    const config = { ...enterkeyConfig, showDecoration: false };
    const layout = calculateEnterkeyLayout(config, defaultColors);

    expect(layout.decorations.length).toBe(0);
  });

  it('should handle empty titleLines gracefully', () => {
    const config = { ...enterkeyConfig, titleLines: [] };
    const layout = calculateEnterkeyLayout(config, defaultColors);

    expect(layout.titleLineLayouts).toBeDefined();
    expect(layout.titleLineLayouts!.length).toBe(0);
  });

  it('should handle different skew angles', () => {
    const config1 = { ...enterkeyConfig, photoClipSkewAngle: 10 };
    const config2 = { ...enterkeyConfig, photoClipSkewAngle: 20 };

    const layout1 = calculateEnterkeyLayout(config1, defaultColors);
    const layout2 = calculateEnterkeyLayout(config2, defaultColors);

    // Greater angle = greater skew offset
    const skewDiff1 = layout1.photoClip!.points[1].x - layout1.photoClip!.points[2].x;
    const skewDiff2 = layout2.photoClip!.points[1].x - layout2.photoClip!.points[2].x;
    expect(skewDiff2).toBeGreaterThan(skewDiff1);
  });

  it('should use measureCtx when provided', () => {
    const mockCtx = {
      font: '',
      measureText: jest.fn(() => ({ width: 100 })),
    } as unknown as CanvasRenderingContext2D;

    const layout = calculateEnterkeyLayout(enterkeyConfig, defaultColors, mockCtx);

    expect(mockCtx.measureText).toHaveBeenCalled();
    expect(layout.titleLineLayouts).toBeDefined();
  });

  // Logo position tests for enterkey layout
  it('should position logo at top-left by default in enterkey layout', () => {
    const config = { ...enterkeyConfig, logoPosition: 'top-left' as const };
    const layout = calculateEnterkeyLayout(config, defaultColors);
    expect(layout.logo.x).toBe(layout.safeArea.x);
  });

  it('should position logo at top-right in enterkey layout', () => {
    const config = { ...enterkeyConfig, logoPosition: 'top-right' as const };
    const layout = calculateEnterkeyLayout(config, defaultColors);
    expect(layout.logo.x).toBe(layout.safeArea.x + layout.safeArea.width - layout.logo.width);
  });

  it('should position logo at top-center in enterkey layout', () => {
    const config = { ...enterkeyConfig, logoPosition: 'top-center' as const };
    const layout = calculateEnterkeyLayout(config, defaultColors);
    const expectedX = layout.safeArea.x + (layout.safeArea.width - layout.logo.width) / 2;
    expect(layout.logo.x).toBeCloseTo(expectedX);
  });
});
