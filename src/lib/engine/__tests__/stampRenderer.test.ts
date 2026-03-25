/**
 * stampRenderer.ts tests
 */
import { renderStampToCanvas, renderStampToSVG, resolveStampColor } from '../stampRenderer';
import type { StampConfig } from '@/types/banner';
import { setupJestCanvasMock } from 'jest-canvas-mock';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 628;

const derivedColors = {
  light: '#93B4F5',
  medium: '#2563EB',
  dark: '#1A3FA0',
  accent: '#F59E0B',
};

function makeStamp(overrides: Partial<StampConfig> = {}): StampConfig {
  return {
    id: 'stamp-1',
    type: 'stamp-circle',
    position: 'auto',
    size: 0.1,
    color: 'brand',
    opacity: 1.0,
    rotation: 0,
    ...overrides,
  };
}

describe('resolveStampColor', () => {
  it('returns medium for brand color', () => {
    const stamp = makeStamp({ color: 'brand' });
    expect(resolveStampColor(stamp, derivedColors)).toBe(derivedColors.medium);
  });

  it('returns accent for accent color', () => {
    const stamp = makeStamp({ color: 'accent' });
    expect(resolveStampColor(stamp, derivedColors)).toBe(derivedColors.accent);
  });

  it('returns light for light color', () => {
    const stamp = makeStamp({ color: 'light' });
    expect(resolveStampColor(stamp, derivedColors)).toBe(derivedColors.light);
  });

  it('returns customColor for custom color when set', () => {
    const stamp = makeStamp({ color: 'custom', customColor: '#ABCDEF' });
    expect(resolveStampColor(stamp, derivedColors)).toBe('#ABCDEF');
  });

  it('falls back to medium for custom color when customColor is undefined', () => {
    const stamp = makeStamp({ color: 'custom' });
    expect(resolveStampColor(stamp, derivedColors)).toBe(derivedColors.medium);
  });
});

describe('renderStampToCanvas', () => {
  beforeEach(() => {
    setupJestCanvasMock();
  });

  const stampTypes: StampConfig['type'][] = [
    'stamp-circle',
    'stamp-triangle',
    'stamp-line',
    'stamp-dot-grid',
    'stamp-gradient-band',
    'stamp-ring',
  ];

  for (const type of stampTypes) {
    it(`renders ${type} without throwing`, () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const stamp = makeStamp({ type });

      expect(() => {
        renderStampToCanvas(ctx, stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 300, 200);
      }).not.toThrow();
    });
  }

  it('applies opacity via globalAlpha', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const alphaValues: number[] = [];
    const origSave = ctx.save.bind(ctx);
    ctx.save = jest.fn(() => origSave()) as typeof ctx.save;

    Object.defineProperty(ctx, 'globalAlpha', {
      set(value: number) { alphaValues.push(value); },
      get() { return alphaValues[alphaValues.length - 1] ?? 1; },
    });

    const stamp = makeStamp({ opacity: 0.5 });
    renderStampToCanvas(ctx, stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 300, 200);

    expect(alphaValues).toContain(0.5);
  });

  it('applies rotation via ctx.rotate', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const rotations: number[] = [];
    const origRotate = ctx.rotate.bind(ctx);
    ctx.rotate = jest.fn((angle: number) => {
      rotations.push(angle);
      return origRotate(angle);
    }) as typeof ctx.rotate;

    const stamp = makeStamp({ rotation: 45 });
    renderStampToCanvas(ctx, stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 300, 200);

    expect(rotations.length).toBeGreaterThan(0);
    expect(rotations[0]).toBeCloseTo((45 * Math.PI) / 180);
  });

  it('scales size relative to canvasWidth', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const arcCalls: number[] = [];
    const origArc = ctx.arc.bind(ctx);
    ctx.arc = jest.fn((x: number, y: number, r: number, ...rest: unknown[]) => {
      arcCalls.push(r);
      return origArc(x, y, r, ...(rest as [number, number, boolean?]));
    }) as typeof ctx.arc;

    const stamp = makeStamp({ type: 'stamp-circle', size: 0.1 });
    renderStampToCanvas(ctx, stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 0, 0);

    // size = 0.1 * 1200 = 120, radius = size / 2 = 60
    expect(arcCalls).toContain(60);
  });

  it('calls save and restore for state isolation', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const saveCalls: boolean[] = [];
    const restoreCalls: boolean[] = [];
    const origSave = ctx.save.bind(ctx);
    const origRestore = ctx.restore.bind(ctx);

    ctx.save = jest.fn(() => { saveCalls.push(true); return origSave(); }) as typeof ctx.save;
    ctx.restore = jest.fn(() => { restoreCalls.push(true); return origRestore(); }) as typeof ctx.restore;

    const stamp = makeStamp();
    renderStampToCanvas(ctx, stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 300, 200);

    expect(saveCalls.length).toBeGreaterThanOrEqual(1);
    expect(restoreCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe('renderStampToSVG', () => {
  const stampTypes: StampConfig['type'][] = [
    'stamp-circle',
    'stamp-triangle',
    'stamp-line',
    'stamp-dot-grid',
    'stamp-gradient-band',
    'stamp-ring',
  ];

  for (const type of stampTypes) {
    it(`returns non-empty SVG string for ${type}`, () => {
      const stamp = makeStamp({ type });
      const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 300, 200);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it(`${type} SVG contains transform with correct coordinates`, () => {
      const stamp = makeStamp({ type });
      const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 300, 200);

      expect(result).toContain('translate(300, 200)');
    });
  }

  it('applies opacity in SVG output', () => {
    const stamp = makeStamp({ opacity: 0.7 });
    const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 0, 0);

    expect(result).toContain('opacity="0.7"');
  });

  it('applies rotation in SVG transform', () => {
    const stamp = makeStamp({ rotation: 30 });
    const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 0, 0);

    expect(result).toContain('rotate(30)');
  });

  it('stamp-gradient-band includes defs element with linearGradient', () => {
    const stamp = makeStamp({ type: 'stamp-gradient-band', id: 'grad-test' });
    const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 0, 0);

    expect(result).toContain('<defs>');
    expect(result).toContain('linearGradient');
    expect(result).toContain('stamp-grad-grad-test');
  });

  it('stamp-circle SVG contains circle element', () => {
    const stamp = makeStamp({ type: 'stamp-circle' });
    const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 0, 0);

    expect(result).toContain('<circle');
  });

  it('stamp-triangle SVG contains polygon element', () => {
    const stamp = makeStamp({ type: 'stamp-triangle' });
    const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 0, 0);

    expect(result).toContain('<polygon');
  });

  it('stamp-line SVG contains line element', () => {
    const stamp = makeStamp({ type: 'stamp-line' });
    const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 0, 0);

    expect(result).toContain('<line');
  });

  it('stamp-dot-grid SVG contains multiple circle elements', () => {
    const stamp = makeStamp({ type: 'stamp-dot-grid' });
    const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 0, 0);

    // 4x4 = 16 dots
    const circleCount = (result.match(/<circle/g) || []).length;
    expect(circleCount).toBe(16);
  });

  it('stamp-ring SVG contains two circle elements', () => {
    const stamp = makeStamp({ type: 'stamp-ring' });
    const result = renderStampToSVG(stamp, CANVAS_WIDTH, CANVAS_HEIGHT, '#2563EB', 0, 0);

    const circleCount = (result.match(/<circle/g) || []).length;
    expect(circleCount).toBe(2);
  });
});
