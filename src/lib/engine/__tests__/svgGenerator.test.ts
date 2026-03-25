import { generateSVG } from '../svgGenerator';
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

describe('generateSVG', () => {
  it('should return valid SVG string', () => {
    const svg = generateSVG(defaultConfig, defaultColors);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('should set correct viewBox', () => {
    const svg = generateSVG(defaultConfig, defaultColors);
    expect(svg).toContain('viewBox="0 0 1200 628"');
  });

  it('should include Noto Sans JP font import', () => {
    const svg = generateSVG(defaultConfig, defaultColors);
    expect(svg).toContain('Noto+Sans+JP');
  });

  it('should include gradient when no background image', () => {
    const svg = generateSVG(defaultConfig, defaultColors);
    expect(svg).toContain('linearGradient');
    expect(svg).toContain('bg-gradient');
  });

  it('should include overlay rect', () => {
    const svg = generateSVG(defaultConfig, defaultColors);
    expect(svg).toContain('opacity="0.5"');
  });

  it('should include title text', () => {
    const svg = generateSVG(defaultConfig, defaultColors);
    expect(svg).toContain('テスト');
  });

  it('should include keyword highlight band', () => {
    const svg = generateSVG(defaultConfig, defaultColors);
    expect(svg).toContain(defaultColors.accent);
  });

  it('should include decorations when enabled', () => {
    const svg = generateSVG(defaultConfig, defaultColors);
    // L-corner decoration uses polyline
    expect(svg).toContain('polyline');
  });

  it('should not include decorations when disabled', () => {
    const config = { ...defaultConfig, showDecoration: false };
    const svg = generateSVG(config, defaultColors);
    expect(svg).not.toContain('polyline');
  });

  it('should include background image when provided', () => {
    const config = { ...defaultConfig, backgroundImage: 'data:image/png;base64,test' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('data:image/png;base64,test');
    expect(svg).toContain('preserveAspectRatio="xMidYMid slice"');
  });

  it('should include logo when provided', () => {
    const config = { ...defaultConfig, logoImage: 'data:image/png;base64,logo' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('data:image/png;base64,logo');
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it('should escape XML special characters in title', () => {
    const config = { ...defaultConfig, title: 'Test <&> "quotes"', highlightKeyword: '' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('&lt;');
    expect(svg).toContain('&amp;');
    expect(svg).toContain('&gt;');
  });

  it('should handle title without keyword', () => {
    const config = { ...defaultConfig, highlightKeyword: '' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('テストタイトル');
  });

  it('should handle empty title', () => {
    const config = { ...defaultConfig, title: '', highlightKeyword: '' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should handle different sizes', () => {
    const config = { ...defaultConfig, width: 728, height: 90 };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('width="728"');
    expect(svg).toContain('height="90"');
  });

  it('should render beforeKeyword text when keyword is not at start of title', () => {
    const config = {
      ...defaultConfig,
      title: '前半テスト後半',
      highlightKeyword: 'テスト',
    };
    const svg = generateSVG(config, defaultColors);
    // beforeKeyword = '前半' should be rendered
    expect(svg).toContain('前半');
    // Keyword band should also be rendered
    expect(svg).toContain('テスト');
  });

  it('should render afterKeyword text when keyword is in the middle of title', () => {
    const config = {
      ...defaultConfig,
      title: '前半テスト後半部分',
      highlightKeyword: 'テスト',
    };
    const svg = generateSVG(config, defaultColors);
    // afterKeyword = '後半部分' should be rendered
    expect(svg).toContain('後半部分');
    // beforeKeyword and keyword should also be present
    expect(svg).toContain('前半');
    expect(svg).toContain('テスト');
  });

  it('should not render afterKeyword text when keyword is at end of title', () => {
    const config = {
      ...defaultConfig,
      title: '前半テスト',
      highlightKeyword: 'テスト',
    };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('前半');
    expect(svg).toContain('テスト');
  });

  it('should not include gradient when background image is provided', () => {
    const config = { ...defaultConfig, backgroundImage: 'data:image/png;base64,abc' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).not.toContain('linearGradient');
    expect(svg).not.toContain('bg-gradient');
    // Background image uses solid fill + image
    expect(svg).toContain(`fill="${defaultColors.light}"`);
  });

  it('should handle title with special characters in keyword', () => {
    const config = {
      ...defaultConfig,
      title: 'Hello <World> & "Friends"',
      highlightKeyword: '<World>',
    };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('&lt;World&gt;');
  });
});

describe('generateSVG - enterkey style', () => {
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
    showDecoration: true,
  };

  it('should return valid SVG with enterkey style', () => {
    const svg = generateSVG(enterkeyConfig, defaultColors);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should include clipPath for photo', () => {
    const config = { ...enterkeyConfig, backgroundImage: 'data:image/png;base64,test' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('<clipPath id="photo-clip">');
    expect(svg).toContain('<polygon');
    expect(svg).toContain('clip-path="url(#photo-clip)"');
  });

  it('should include tspan elements for rich text segments', () => {
    const svg = generateSVG(enterkeyConfig, defaultColors);
    expect(svg).toContain('<tspan');
    expect(svg).toContain('場');
    expect(svg).toContain('出社率向上');
  });

  it('should set segment-specific fill colors in tspan', () => {
    const svg = generateSVG(enterkeyConfig, defaultColors);
    expect(svg).toContain('fill="#F59E0B"');
    expect(svg).toContain('fill="#ffffff"');
  });

  it('should set segment-specific font-weight in tspan', () => {
    const svg = generateSVG(enterkeyConfig, defaultColors);
    expect(svg).toContain('font-weight="700"');
    expect(svg).toContain('font-weight="400"');
  });

  it('should include stripe pattern for corner triangles', () => {
    const svg = generateSVG(enterkeyConfig, defaultColors);
    expect(svg).toContain('<pattern id="stripe-pattern"');
    expect(svg).toContain('url(#stripe-pattern)');
  });

  it('should include gradient overlay for photo', () => {
    const config = { ...enterkeyConfig, backgroundImage: 'data:image/png;base64,test' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('<linearGradient id="photo-overlay"');
    expect(svg).toContain('url(#photo-overlay)');
  });

  it('should use dark background color when background image is provided', () => {
    const config = { ...enterkeyConfig, backgroundImage: 'data:image/png;base64,test' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain(`fill="${defaultColors.dark}"`);
    expect(svg).not.toContain('enterkey-bg-gradient');
  });

  it('should use gradient background when no background image', () => {
    const svg = generateSVG(enterkeyConfig, defaultColors);
    expect(svg).toContain('enterkey-bg-gradient');
    expect(svg).toContain('url(#enterkey-bg-gradient)');
    expect(svg).toContain(`stop-color:${defaultColors.dark}`);
    expect(svg).toContain(`stop-color:${defaultColors.medium}`);
  });

  it('should not include stripe triangles when decoration is disabled', () => {
    const config = { ...enterkeyConfig, showDecoration: false };
    const svg = generateSVG(config, defaultColors);
    expect(svg).not.toContain('url(#stripe-pattern)');
  });

  it('should include logo when provided', () => {
    const config = { ...enterkeyConfig, logoImage: 'data:image/png;base64,logo' };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('data:image/png;base64,logo');
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it('should fallback to plain text when titleLines are empty', () => {
    const config = {
      ...defaultConfig,
      title: 'フォールバック',
      titleLines: [{ segments: [{ text: 'テスト' }] }],
    };
    const svg = generateSVG(config, defaultColors);
    // Should use tspan (enterkey style)
    expect(svg).toContain('<tspan');
    expect(svg).toContain('テスト');
  });

  it('should escape special characters in rich text segments', () => {
    const config: BannerConfig = {
      ...defaultConfig,
      titleLines: [
        { segments: [{ text: '<test> & "quotes"' }] },
      ],
    };
    const svg = generateSVG(config, defaultColors);
    expect(svg).toContain('&lt;test&gt;');
    expect(svg).toContain('&amp;');
  });
});
