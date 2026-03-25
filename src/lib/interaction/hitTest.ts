import type { LayoutResult, DraggableElement, StampConfig } from '@/types/banner';

export interface HitTestResult {
  type: DraggableElement;
  id?: string;
}

/**
 * Test which element in the layout is at the given canvas coordinates.
 * Tests in layer order: stamp (top) → logo → title → highlightKeyword (bottom)
 *
 * @param x - Mouse X in container CSS pixels
 * @param y - Mouse Y in container CSS pixels
 * @param layout - Current layout result from calculateLayout
 * @param stamps - Current stamp configurations
 * @param canvasScale - CSS display scale (canvas CSS pixels / canvas logical pixels)
 * @returns matched element or null
 */
export function hitTest(
  x: number,
  y: number,
  layout: LayoutResult,
  stamps: StampConfig[],
  canvasScale: number,
  hasBackgroundImage: boolean = false
): HitTestResult | null {
  // Convert CSS pixel coords to logical canvas coords
  const lx = x / canvasScale;
  const ly = y / canvasScale;

  // Stamps: rendered on top, check first (reverse order = topmost stamp first)
  for (let i = stamps.length - 1; i >= 0; i--) {
    const stamp = stamps[i];
    const dec = layout.decorations.find((d) => {
      // Stamp decorations are the non-stripe-border / non-accent-line types placed from stamps config.
      // We match by index because decorations array includes stamps in order.
      return false; // placeholder — stamps from config.stamps are separate from layout.decorations
    });
    // Stamps from StampConfig don't have a direct layout entry in LayoutResult yet,
    // but when manualAdjustments are applied they may. For now we skip stamp hit-test
    // if no decoration matches. This will be integrated once layout-dev adds stamp layout.
    void dec;
    void stamp;
  }

  // Logo
  if (layout.logo) {
    const { x: ex, y: ey, width: ew, height: eh } = layout.logo;
    if (lx >= ex && lx <= ex + ew && ly >= ey && ly <= ey + eh) {
      return { type: 'logo' };
    }
  }

  // Title lines (per-line hit test including white band + shadow area)
  if (layout.titleLineLayouts && layout.titleLineLayouts.length > 0) {
    const fs = layout.title.fontSize || 36;
    const hPadX = fs * 0.4;
    const hPadY = fs * 0.15;
    const hShadowOX = -12;
    const hShadowOY = 12;
    for (let i = 0; i < layout.titleLineLayouts.length; i++) {
      const line = layout.titleLineLayouts[i];
      if (line.segments.length === 0) continue;
      const firstSeg = line.segments[0];
      const lastSeg = line.segments[line.segments.length - 1];
      const bandX = firstSeg.x - hPadX;
      const bandY = line.y - hPadY;
      const bandW = lastSeg.x + lastSeg.width - firstSeg.x + hPadX * 2;
      const bandH = fs + hPadY * 2;
      // Include shadow in hit area
      const hitX = Math.min(bandX, bandX + hShadowOX);
      const hitY = Math.min(bandY, bandY + hShadowOY);
      const hitRight = Math.max(bandX + bandW, bandX + hShadowOX + bandW);
      const hitBottom = Math.max(bandY + bandH, bandY + hShadowOY + bandH);
      if (lx >= hitX && lx <= hitRight && ly >= hitY && ly <= hitBottom) {
        return { type: 'titleLine', id: String(i) };
      }
    }
  } else if (layout.title) {
    const { x: ex, y: ey, width: ew, height: eh } = layout.title;
    if (lx >= ex && lx <= ex + ew && ly >= ey && ly <= ey + eh) {
      return { type: 'title' };
    }
  }

  // Highlight keyword
  if (layout.highlightKeyword) {
    const { x: ex, y: ey, width: ew, height: eh } = layout.highlightKeyword;
    if (lx >= ex && lx <= ex + ew && ly >= ey && ly <= ey + eh) {
      return { type: 'highlightKeyword' };
    }
  }

  // Photo clip window (parallelogram bounding box)
  if (layout.photoClip && layout.photoClip.points.length >= 4) {
    const pts = layout.photoClip.points;
    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));
    if (lx >= minX && lx <= maxX && ly >= minY && ly <= maxY) {
      return { type: 'photoClip' };
    }
  }

  // Background image (entire canvas area, lowest priority, only when image is set)
  if (hasBackgroundImage && layout.background) {
    const { x: ex, y: ey, width: ew, height: eh } = layout.background;
    if (lx >= ex && lx <= ex + ew && ly >= ey && ly <= ey + eh) {
      return { type: 'backgroundImage' };
    }
  }

  return null;
}
