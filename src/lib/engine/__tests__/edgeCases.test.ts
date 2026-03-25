/**
 * Edge case tests for rendering engine
 */
import { renderToCanvas } from '../canvasRenderer';
import { generateSVG } from '../svgGenerator';
import { findOptimalFontSize } from '../layoutCalculator';
import type { BannerConfig, DerivedColors } from '@/types/banner';
import { setupJestCanvasMock } from 'jest-canvas-mock';

const defaultConfig: BannerConfig = {
  width: 1200,
  height: 628,
  brandColor: '#2563EB',
  accentColor: '#F59E0B',
  title: '',
  highlightKeyword: '',
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

class MockImage {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  private _src = '';
  get src() { return this._src; }
  set src(value: string) {
    this._src = value;
    setTimeout(() => { if (this.onload) this.onload(); }, 0);
  }
}

describe('Edge cases - empty and extreme inputs', () => {
  const originalImage = global.Image;

  beforeEach(() => {
    jest.restoreAllMocks();
    setupJestCanvasMock();
    // @ts-expect-error mock Image
    global.Image = MockImage;
  });

  afterEach(() => {
    global.Image = originalImage;
  });

  it('should handle empty title and empty keyword', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, title: '', highlightKeyword: '' };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout).toBeDefined();
  });

  it('should handle title with only whitespace', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, title: '   ', highlightKeyword: '' };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout).toBeDefined();
  });

  it('should handle extremely long title (500 chars)', async () => {
    const canvas = document.createElement('canvas');
    const longTitle = 'あ'.repeat(500);
    const config = { ...defaultConfig, title: longTitle, highlightKeyword: '' };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout).toBeDefined();
  });

  it('should handle title with special characters', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...defaultConfig,
      title: '<script>alert("XSS")</script>&<>"\'',
      highlightKeyword: '',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout).toBeDefined();
  });

  it('should handle title with emoji', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, title: 'テスト🎉🚀✨' };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout).toBeDefined();
  });

  it('should handle minimum size banner (200x200)', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, width: 200, height: 200, title: 'Small' };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout.canvasWidth).toBe(200);
    expect(layout.canvasHeight).toBe(200);
  });

  it('should handle very wide banner (3000x100)', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, width: 3000, height: 100 };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout.canvasWidth).toBe(3000);
    expect(layout.canvasHeight).toBe(100);
  });

  it('should handle very tall banner (300x2000)', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, width: 300, height: 2000 };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout.canvasWidth).toBe(300);
    expect(layout.canvasHeight).toBe(2000);
  });

  it('should handle overlayOpacity at boundary values', async () => {
    const canvas = document.createElement('canvas');

    // opacity 0
    const config0 = { ...defaultConfig, overlayOpacity: 0 };
    const layout0 = await renderToCanvas(canvas, config0, defaultColors);
    expect(layout0.overlay.opacity).toBe(0);

    // opacity 0.8
    const config8 = { ...defaultConfig, overlayOpacity: 0.8 };
    const layout8 = await renderToCanvas(canvas, config8, defaultColors);
    expect(layout8.overlay.opacity).toBe(0.8);
  });

  it('should handle all logo positions', async () => {
    const canvas = document.createElement('canvas');

    for (const pos of ['top-left', 'top-center', 'top-right'] as const) {
      const config = { ...defaultConfig, logoPosition: pos };
      const layout = await renderToCanvas(canvas, config, defaultColors);
      expect(layout.logo).toBeDefined();
    }
  });

  it('should handle keyword that equals the entire title', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...defaultConfig,
      title: 'テスト',
      highlightKeyword: 'テスト',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout).toBeDefined();
  });

  it('should handle keyword at start of title', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...defaultConfig,
      title: 'テスト後半',
      highlightKeyword: 'テスト',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout).toBeDefined();
  });

  it('should handle keyword at end of title', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...defaultConfig,
      title: '前半テスト',
      highlightKeyword: 'テスト',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);
    expect(layout).toBeDefined();
  });
});

describe('Edge cases - SVG generation', () => {
  it('should escape XML special characters in SVG', () => {
    const config = {
      ...defaultConfig,
      title: '<script>alert("XSS")</script>&',
      highlightKeyword: '',
    };
    const svg = generateSVG(config, defaultColors);

    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&amp;');
  });

  it('should generate valid SVG for empty title', () => {
    const config = { ...defaultConfig, title: '', highlightKeyword: '' };
    const svg = generateSVG(config, defaultColors);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should generate valid SVG for enterkey style', () => {
    const config = {
      ...defaultConfig,
      titleLines: [
        { segments: [{ text: 'テスト', fontWeight: 700, color: '#FF0000' }] },
      ],
      showDecoration: true,
    };
    const svg = generateSVG(config, defaultColors);

    expect(svg).toContain('<svg');
    expect(svg).toContain('テスト');
    expect(svg).toContain('stripe-pattern');
  });

  it('should handle very long text in SVG without breaking', () => {
    const config = {
      ...defaultConfig,
      title: 'あ'.repeat(200),
    };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('</svg>');
  });
});

describe('Edge cases - findOptimalFontSize', () => {
  beforeEach(() => {
    setupJestCanvasMock();
  });

  it('should return maxSize when text is empty', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const result = findOptimalFontSize(ctx, '', 500, 12, 72);
    expect(result).toBe(72);
  });

  it('should return maxSize when ctx is null', () => {
    const result = findOptimalFontSize(null, 'テスト', 500, 12, 72);
    expect(result).toBe(72);
  });

  it('should find optimal size for fitting text', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const result = findOptimalFontSize(ctx, 'テスト', 500, 12, 72);
    expect(result).toBeGreaterThanOrEqual(12);
    expect(result).toBeLessThanOrEqual(72);
  });

  it('should return minSize when text is very long', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    // Mock measureText to always return large width
    ctx.measureText = jest.fn(() => ({ width: 99999 })) as unknown as typeof ctx.measureText;
    const result = findOptimalFontSize(ctx, 'very long text', 100, 12, 72);
    expect(result).toBe(12);
  });
});
