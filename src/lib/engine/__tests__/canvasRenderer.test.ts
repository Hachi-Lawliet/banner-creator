/**
 * canvasRenderer.ts tests
 * Uses jest-canvas-mock to provide Canvas API in jsdom environment.
 */
import { renderToCanvas } from '../canvasRenderer';
import type { BannerConfig, DerivedColors } from '@/types/banner';
import { setupJestCanvasMock } from 'jest-canvas-mock';

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

// Mock Image to immediately trigger onload
class MockImage {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  private _src = '';

  get src() {
    return this._src;
  }
  set src(value: string) {
    this._src = value;
    // Trigger onload asynchronously
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}

describe('renderToCanvas', () => {
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

  it('should render and return layout with correct dimensions', async () => {
    const canvas = document.createElement('canvas');
    const layout = await renderToCanvas(canvas, defaultConfig, defaultColors);

    expect(layout).toBeDefined();
    expect(layout.canvasWidth).toBe(1200);
    expect(layout.canvasHeight).toBe(628);
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(628);
  });

  it('should throw when getContext returns null', async () => {
    const canvas = document.createElement('canvas');
    jest.spyOn(canvas, 'getContext').mockReturnValue(null);

    await expect(
      renderToCanvas(canvas, defaultConfig, defaultColors)
    ).rejects.toThrow('Failed to get canvas context');
  });

  it('should render without background image (gradient path)', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, backgroundImage: null };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
    expect(layout.background.width).toBe(1200);
  });

  it('should render with background image set', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, backgroundImage: 'data:image/png;base64,iVBORw0KGgo=' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should handle background image load failure gracefully', async () => {
    // Override MockImage to trigger onerror
    class FailImage {
      onload: (() => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;
      private _src = '';
      get src() { return this._src; }
      set src(value: string) {
        this._src = value;
        setTimeout(() => { if (this.onerror) this.onerror(new Error('fail')); }, 0);
      }
    }
    // @ts-expect-error mock Image
    global.Image = FailImage;

    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, backgroundImage: 'data:image/png;base64,bad' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should render with decorations enabled', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, showDecoration: true };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.decorations.length).toBeGreaterThan(0);
  });

  it('should render without decorations', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, showDecoration: false };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.decorations.length).toBe(0);
  });

  it('should render title with keyword highlight', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...defaultConfig,
      title: 'テストタイトル',
      highlightKeyword: 'テスト',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.highlightKeyword.bandColor).toBe(defaultColors.accent);
  });

  it('should render title without keyword (empty keyword)', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, highlightKeyword: '' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.title.text).toBe('テストタイトル');
  });

  it('should render title when keyword is not found in title', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, highlightKeyword: '存在しない' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should handle empty title', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, title: '', highlightKeyword: '' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should handle very long title', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...defaultConfig,
      title: 'これはとても長いタイトルです。テキストの折り返し処理が正しく動作するかテストします。',
      highlightKeyword: '',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should render title with beforeKeyword text', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...defaultConfig,
      title: '前半テスト後半',
      highlightKeyword: 'テスト',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should render afterKeyword text when keyword is in middle of title', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const fillTextCalls: string[] = [];
    const origFillText = ctx.fillText.bind(ctx);
    ctx.fillText = jest.fn((text: string, ...rest: unknown[]) => {
      fillTextCalls.push(text);
      return origFillText(text, ...(rest as [number, number]));
    }) as typeof ctx.fillText;

    const config = {
      ...defaultConfig,
      title: '前半テスト後半部分',
      highlightKeyword: 'テスト',
    };
    await renderToCanvas(canvas, config, defaultColors);

    // afterKeyword '後半部分' is drawn char-by-char when letterSpacing > 0
    // Check that each character of afterKeyword appears in fillTextCalls
    for (const char of ['後', '半', '部', '分']) {
      expect(fillTextCalls).toContain(char);
    }
    // keyword is drawn as a single string (via fillText, not drawWrappedText)
    expect(fillTextCalls).toContain('テスト');
  });

  it('should attempt to load logo image when provided', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, logoImage: 'data:image/png;base64,iVBORw0KGgo=' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should handle logo load failure gracefully', async () => {
    class FailImage {
      onload: (() => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;
      private _src = '';
      get src() { return this._src; }
      set src(value: string) {
        this._src = value;
        setTimeout(() => { if (this.onerror) this.onerror(new Error('fail')); }, 0);
      }
    }
    // @ts-expect-error mock Image
    global.Image = FailImage;

    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, logoImage: 'data:image/png;base64,bad' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should handle square banner size', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, width: 1080, height: 1080 };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.canvasWidth).toBe(1080);
    expect(layout.canvasHeight).toBe(1080);
  });

  it('should handle wide banner size', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, width: 728, height: 90 };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.canvasWidth).toBe(728);
  });

  it('should handle very small banner', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, width: 50, height: 50, title: 'A' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.canvasWidth).toBe(50);
  });

  it('should return layout with all required properties', async () => {
    const canvas = document.createElement('canvas');
    const layout = await renderToCanvas(canvas, defaultConfig, defaultColors);

    expect(layout).toHaveProperty('safeArea');
    expect(layout).toHaveProperty('logo');
    expect(layout).toHaveProperty('title');
    expect(layout).toHaveProperty('highlightKeyword');
    expect(layout).toHaveProperty('background');
    expect(layout).toHaveProperty('overlay');
    expect(layout).toHaveProperty('decorations');
    expect(layout).toHaveProperty('gravityCenter');
    expect(layout).toHaveProperty('contrastRatio');
  });

  it('should set overlay opacity from config', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, overlayOpacity: 0.7 };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.overlay.opacity).toBe(0.7);
  });

  it('should handle both logo and background image', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...defaultConfig,
      logoImage: 'data:image/png;base64,logo',
      backgroundImage: 'data:image/png;base64,bg',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should handle logo with different aspect ratios', async () => {
    // Wide logo
    class WideImage {
      width = 400;
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
    // @ts-expect-error mock Image
    global.Image = WideImage;

    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, logoImage: 'data:image/png;base64,logo' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should handle tall logo aspect ratio', async () => {
    // Tall logo - drawH > logoLayout.height case
    class TallImage {
      width = 50;
      height = 500;
      onload: (() => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;
      private _src = '';
      get src() { return this._src; }
      set src(value: string) {
        this._src = value;
        setTimeout(() => { if (this.onload) this.onload(); }, 0);
      }
    }
    // @ts-expect-error mock Image
    global.Image = TallImage;

    const canvas = document.createElement('canvas');
    const config = { ...defaultConfig, logoImage: 'data:image/png;base64,logo' };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });
});

describe('renderToCanvas - layer order verification', () => {
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

  it('should draw layers in correct order: bg → gradient → overlay → decorations → title → logo', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const drawOrder: string[] = [];
    const origFillRect = ctx.fillRect.bind(ctx);
    const origStrokeRect = ctx.strokeRect.bind(ctx);
    const origFillText = ctx.fillText.bind(ctx);
    const origDrawImage = ctx.drawImage.bind(ctx);

    ctx.fillRect = jest.fn((...args: Parameters<typeof ctx.fillRect>) => {
      drawOrder.push(`fillRect:${args[0]},${args[1]},${args[2]},${args[3]}`);
      return origFillRect(...args);
    }) as typeof ctx.fillRect;

    ctx.strokeRect = jest.fn((...args: Parameters<typeof ctx.strokeRect>) => {
      drawOrder.push(`strokeRect`);
      return origStrokeRect(...args);
    }) as typeof ctx.strokeRect;

    const origStroke = ctx.stroke.bind(ctx);
    ctx.stroke = jest.fn((...args: unknown[]) => {
      drawOrder.push(`stroke`);
      return origStroke(...(args as Parameters<typeof ctx.stroke>));
    }) as typeof ctx.stroke;

    ctx.fillText = jest.fn((...args: Parameters<typeof ctx.fillText>) => {
      drawOrder.push(`fillText:${args[0]}`);
      return origFillText(...args);
    }) as typeof ctx.fillText;

    ctx.drawImage = jest.fn((...args: Parameters<typeof ctx.drawImage>) => {
      drawOrder.push(`drawImage`);
      return origDrawImage(...(args as unknown as [CanvasImageSource, number, number]));
    }) as unknown as typeof ctx.drawImage;

    const config = {
      ...defaultConfig,
      logoImage: 'data:image/png;base64,logo',
      showDecoration: true,
    };
    await renderToCanvas(canvas, config, defaultColors);

    // First fillRect: background color (0,0,1200,628)
    expect(drawOrder[0]).toBe('fillRect:0,0,1200,628');
    // Second fillRect: gradient (0,0,1200,628)
    expect(drawOrder[1]).toBe('fillRect:0,0,1200,628');
    // Third fillRect: overlay (0,0,1200,628)
    expect(drawOrder[2]).toBe('fillRect:0,0,1200,628');

    // Decoration (stroke for L-corner) comes after overlay
    const strokeIdx = drawOrder.findIndex(op => op === 'stroke');
    expect(strokeIdx).toBeGreaterThan(2);

    // Title text comes after decoration
    const firstTextIdx = drawOrder.findIndex(op => op.startsWith('fillText:'));
    expect(firstTextIdx).toBeGreaterThan(strokeIdx);

    // Logo (drawImage) is last
    const drawImageIdx = drawOrder.findIndex(op => op === 'drawImage');
    expect(drawImageIdx).toBeGreaterThan(firstTextIdx);
  });

  it('should draw background image before overlay', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const drawOrder: string[] = [];
    const origFillRect = ctx.fillRect.bind(ctx);
    const origDrawImage = ctx.drawImage.bind(ctx);

    ctx.fillRect = jest.fn((...args: Parameters<typeof ctx.fillRect>) => {
      drawOrder.push(`fillRect`);
      return origFillRect(...args);
    }) as typeof ctx.fillRect;

    ctx.drawImage = jest.fn((...args: Parameters<typeof ctx.drawImage>) => {
      drawOrder.push(`drawImage`);
      return origDrawImage(...(args as unknown as [CanvasImageSource, number, number]));
    }) as unknown as typeof ctx.drawImage;

    const config = {
      ...defaultConfig,
      backgroundImage: 'data:image/png;base64,bg',
      showDecoration: false,
      title: '',
    };
    await renderToCanvas(canvas, config, defaultColors);

    const drawImageIdx = drawOrder.indexOf('drawImage');
    expect(drawImageIdx).toBeGreaterThan(0);
    // Overlay fillRect after drawImage
    const fillRectAfterImage = drawOrder.indexOf('fillRect', drawImageIdx);
    expect(fillRectAfterImage).toBeGreaterThan(drawImageIdx);
  });

  it('should use light color as initial background fill', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const fillStyles: string[] = [];
    Object.defineProperty(ctx, 'fillStyle', {
      set(value: string) { fillStyles.push(value); },
      get() { return fillStyles[fillStyles.length - 1] || ''; },
    });

    const config = { ...defaultConfig, showDecoration: false, title: '' };
    await renderToCanvas(canvas, config, defaultColors);

    expect(fillStyles[0]).toBe(defaultColors.light);
  });

  it('should draw L-corner decoration for stripe-border', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    let strokeCount = 0;
    const origStroke = ctx.stroke.bind(ctx);
    ctx.stroke = jest.fn((...args: unknown[]) => {
      strokeCount++;
      return origStroke(...(args as Parameters<typeof ctx.stroke>));
    }) as typeof ctx.stroke;

    await renderToCanvas(canvas, defaultConfig, defaultColors);

    // L-corner draws 4 corners (4 stroke calls)
    expect(strokeCount).toBeGreaterThanOrEqual(4);
  });

  it('should not draw english-text decoration (removed)', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const fillTextCalls: Array<{ text: string; font: string }> = [];
    let currentFont = '';
    Object.defineProperty(ctx, 'font', {
      set(value: string) { currentFont = value; },
      get() { return currentFont; },
    });

    const origFillText = ctx.fillText.bind(ctx);
    ctx.fillText = jest.fn((text: string, ...rest: unknown[]) => {
      fillTextCalls.push({ text, font: currentFont });
      return origFillText(text, ...(rest as [number, number]));
    }) as typeof ctx.fillText;

    await renderToCanvas(canvas, defaultConfig, defaultColors);

    const caseStudies = fillTextCalls.find(c => c.text === 'Case studies');
    expect(caseStudies).toBeUndefined();
  });

  it('should draw keyword band with accent color', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const fillRectStyles: string[] = [];
    let currentFillStyle = '';
    Object.defineProperty(ctx, 'fillStyle', {
      set(value: string) { currentFillStyle = value; },
      get() { return currentFillStyle; },
    });

    const origFillRect = ctx.fillRect.bind(ctx);
    ctx.fillRect = jest.fn((...args: Parameters<typeof ctx.fillRect>) => {
      fillRectStyles.push(currentFillStyle);
      return origFillRect(...args);
    }) as typeof ctx.fillRect;

    await renderToCanvas(canvas, defaultConfig, defaultColors);

    expect(fillRectStyles).toContain(defaultColors.accent);
  });
});

describe('renderToCanvas - drawWrappedText coverage', () => {
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

  it('should trigger line wrap when char exceeds maxWidth', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Mock measureText to return large widths forcing line wrap
    ctx.measureText = jest.fn(() => ({ width: 9999 })) as unknown as typeof ctx.measureText;

    const config = {
      ...defaultConfig,
      title: '前半部分テスト後半',
      highlightKeyword: 'テスト',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
    expect(ctx.measureText).toHaveBeenCalled();
  });
});

describe('renderToCanvas - enterkey style', () => {
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
    backgroundImage: 'data:image/png;base64,iVBORw0KGgo=',
    showDecoration: true,
  };

  it('should render enterkey style when titleLines are provided', async () => {
    const canvas = document.createElement('canvas');
    const layout = await renderToCanvas(canvas, enterkeyConfig, defaultColors);

    expect(layout).toBeDefined();
    expect(layout.photoClip).toBeDefined();
    expect(layout.titleLineLayouts).toBeDefined();
    expect(layout.titleLineLayouts!.length).toBe(2);
  });

  it('should use classic style when titleLines are empty and photoClipStyle is none', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...enterkeyConfig, titleLines: [], photoClipStyle: 'none' as const };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.photoClip).toBeUndefined();
  });

  it('should clip photo to parallelogram shape', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const clipCalls: boolean[] = [];
    const origClip = ctx.clip.bind(ctx);
    ctx.clip = jest.fn((...args: unknown[]) => {
      clipCalls.push(true);
      return origClip(...(args as Parameters<typeof ctx.clip>));
    }) as typeof ctx.clip;

    await renderToCanvas(canvas, enterkeyConfig, defaultColors);

    // Should clip at least once (for photo)
    expect(clipCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should render rich text segments with different styles', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const fillTextCalls: Array<{ text: string; fillStyle: string }> = [];
    let currentFillStyle = '';
    Object.defineProperty(ctx, 'fillStyle', {
      set(value: string) { currentFillStyle = value; },
      get() { return currentFillStyle; },
    });

    const origFillText = ctx.fillText.bind(ctx);
    ctx.fillText = jest.fn((text: string, ...rest: unknown[]) => {
      fillTextCalls.push({ text, fillStyle: currentFillStyle });
      return origFillText(text, ...(rest as [number, number]));
    }) as typeof ctx.fillText;

    await renderToCanvas(canvas, enterkeyConfig, defaultColors);

    // Should have drawn text segments
    const segmentTexts = fillTextCalls.map(c => c.text);
    expect(segmentTexts).toContain('場');
    expect(segmentTexts).toContain('出社率向上');
  });

  it('should draw striped triangle decorations', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const saveCalls: boolean[] = [];
    const origSave = ctx.save.bind(ctx);
    ctx.save = jest.fn(() => {
      saveCalls.push(true);
      return origSave();
    }) as typeof ctx.save;

    await renderToCanvas(canvas, enterkeyConfig, defaultColors);

    // save() should be called at least for clip and for striped triangles
    expect(saveCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('should render enterkey style without background image', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...enterkeyConfig, backgroundImage: null };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
    expect(layout.photoClip).toBeDefined();
  });

  it('should use gradient background when no background image in enterkey mode', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const gradientCalls: boolean[] = [];
    const origCreateLinearGradient = ctx.createLinearGradient.bind(ctx);
    ctx.createLinearGradient = jest.fn((...args: [number, number, number, number]) => {
      gradientCalls.push(true);
      return origCreateLinearGradient(...args);
    }) as typeof ctx.createLinearGradient;

    const config = { ...enterkeyConfig, backgroundImage: null };
    await renderToCanvas(canvas, config, defaultColors);

    // Should have created a gradient for background
    expect(gradientCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should not use gradient background when background image is provided in enterkey mode', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const gradientCalls: Array<[number, number, number, number]> = [];
    const origCreateLinearGradient = ctx.createLinearGradient.bind(ctx);
    ctx.createLinearGradient = jest.fn((...args: [number, number, number, number]) => {
      gradientCalls.push(args);
      return origCreateLinearGradient(...args);
    }) as typeof ctx.createLinearGradient;

    await renderToCanvas(canvas, enterkeyConfig, defaultColors);

    // Gradient calls should only be for photo overlay, not background
    // Background gradient would go from (0,0) to (width,height) diagonally
    const bgGradients = gradientCalls.filter(
      ([x1, y1, x2, y2]) => x1 === 0 && y1 === 0 && x2 === 1200 && y2 === 628
    );
    expect(bgGradients.length).toBe(0);
  });

  it('should render enterkey style without decorations', async () => {
    const canvas = document.createElement('canvas');
    const config = { ...enterkeyConfig, showDecoration: false };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.decorations.length).toBe(0);
  });

  it('should fallback to legacy title when titleLines exist but title is also set', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...defaultConfig,
      title: 'フォールバックタイトル',
      titleLines: [
        { segments: [{ text: 'リッチテキスト' }] },
      ],
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout.titleLineLayouts!.length).toBe(1);
  });

  it('should handle enterkey style with logo image', async () => {
    const canvas = document.createElement('canvas');
    const config = {
      ...enterkeyConfig,
      logoImage: 'data:image/png;base64,logo',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should handle background image load failure in enterkey mode', async () => {
    class FailImage {
      onload: (() => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;
      private _src = '';
      get src() { return this._src; }
      set src(value: string) {
        this._src = value;
        setTimeout(() => { if (this.onerror) this.onerror(new Error('fail')); }, 0);
      }
    }
    // @ts-expect-error mock Image
    global.Image = FailImage;

    const canvas = document.createElement('canvas');
    const layout = await renderToCanvas(canvas, enterkeyConfig, defaultColors);

    expect(layout).toBeDefined();
  });

  it('should use enterkey style when photoClipStyle is skew and titleLines is empty', async () => {
    const canvas = document.createElement('canvas');
    // titleLines is empty but photoClipStyle is 'skew' — should still trigger enterkey path
    const config: BannerConfig = {
      ...defaultConfig,
      photoClipStyle: 'skew',
      titleLines: [],
      backgroundImage: 'data:image/png;base64,iVBORw0KGgo=',
    };
    const layout = await renderToCanvas(canvas, config, defaultColors);

    expect(layout).toBeDefined();
    // photoClip should be defined because photoClipStyle='skew'
    expect(layout.photoClip).toBeDefined();
  });
});
