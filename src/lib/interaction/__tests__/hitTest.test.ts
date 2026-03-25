import { hitTest } from '../hitTest';
import type { LayoutResult } from '@/types/banner';

const mockLayout: LayoutResult = {
  canvasWidth: 1200,
  canvasHeight: 628,
  safeArea: { x: 60, y: 60, width: 1080, height: 508 },
  logo: { x: 60, y: 70, width: 300, height: 80 },
  title: { x: 60, y: 300, width: 1080, height: 120 },
  highlightKeyword: {
    x: 60,
    y: 420,
    width: 1080,
    height: 60,
    bandColor: '#F59E0B',
    bandPadding: 10,
  },
  background: { x: 0, y: 0, width: 1200, height: 628 },
  overlay: { x: 0, y: 0, width: 1200, height: 628, opacity: 0.5, color: '#1A3FA0' },
  decorations: [],
  gravityCenter: { x: 0.5, y: 0.45 },
  contrastRatio: 4.5,
};

describe('hitTest', () => {
  it('ロゴ領域のヒットを検出する', () => {
    // Logo: x:60, y:70, w:300, h:80 (logical) → at scale 1.0, CSS coords match
    const result = hitTest(100, 80, mockLayout, [], 1.0);
    expect(result).toEqual({ type: 'logo' });
  });

  it('タイトル領域のヒットを検出する', () => {
    const result = hitTest(200, 350, mockLayout, [], 1.0);
    expect(result).toEqual({ type: 'title' });
  });

  it('ハイライトキーワード領域のヒットを検出する', () => {
    const result = hitTest(200, 440, mockLayout, [], 1.0);
    expect(result).toEqual({ type: 'highlightKeyword' });
  });

  it('要素外ではnullを返す', () => {
    const result = hitTest(0, 0, mockLayout, [], 1.0);
    expect(result).toBeNull();
  });

  it('canvasScale=0.5のとき座標を変換して判定する', () => {
    // Logo at logical (60,70) to (360,150). At scale 0.5: CSS coords (30,35) to (180,75)
    // Hit at CSS (50, 50) → logical (100, 100) → inside logo
    const result = hitTest(50, 50, mockLayout, [], 0.5);
    expect(result).toEqual({ type: 'logo' });
  });

  it('スケール0.5でロゴ外はnull', () => {
    // CSS (10, 20) → logical (20, 40) → before logo.x=60, so outside
    const result = hitTest(10, 20, mockLayout, [], 0.5);
    expect(result).toBeNull();
  });

  it('ロゴとタイトルが重なるときロゴ（上レイヤー）を返す', () => {
    const overlappingLayout: LayoutResult = {
      ...mockLayout,
      logo: { x: 60, y: 300, width: 300, height: 120 }, // overlap with title
    };
    const result = hitTest(100, 330, overlappingLayout, [], 1.0);
    expect(result).toEqual({ type: 'logo' });
  });

  it('ロゴ境界（右端）はヒットする', () => {
    // Logo right edge: x + width = 60 + 300 = 360
    const result = hitTest(360, 80, mockLayout, [], 1.0);
    expect(result).toEqual({ type: 'logo' });
  });

  it('ロゴ境界外（x=361）はヒットしない（タイトルもx=60なので外は外）', () => {
    // x=361 is outside logo (w=300, x=60 → right=360) and also check title
    // title: x=60, w=1080 → right=1140. y=350 for title test
    const result = hitTest(361, 80, mockLayout, [], 1.0);
    // y=80 is inside logo y-range (70 to 150), x=361 > 360, so logo miss
    // title: y=80 is NOT inside title y-range (300 to 420), so title miss
    // highlightKeyword: y=80 NOT in range (420 to 480)
    expect(result).toBeNull();
  });
});
