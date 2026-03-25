/**
 * Z-pattern eye flow positioning for horizontal banners.
 *
 * Z-pattern:
 * ① Top-left → ② Top-right
 *       ↘
 *          ↘
 * ③ Bottom-left → ④ Bottom-right
 *
 * Template B mapping:
 * ① Logo (top-left to center-top)
 * ② Sub-info / decoration (top-right)
 * ③ Supporting info (bottom-left)
 * ④ CTA / brand (bottom-right)
 * Center: Title + keyword highlight
 */

interface ZonePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SafeArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate Z-pattern zones within the safe area.
 * Returns 4 zones: topLeft, topRight, bottomLeft, bottomRight, plus a center zone.
 */
export function calculateZPatternZones(safeArea: SafeArea): {
  topLeft: ZonePosition;
  topRight: ZonePosition;
  bottomLeft: ZonePosition;
  bottomRight: ZonePosition;
  center: ZonePosition;
} {
  const halfW = safeArea.width / 2;
  const halfH = safeArea.height / 2;
  const thirdH = safeArea.height / 3;

  return {
    topLeft: {
      x: safeArea.x,
      y: safeArea.y,
      width: halfW,
      height: thirdH,
    },
    topRight: {
      x: safeArea.x + halfW,
      y: safeArea.y,
      width: halfW,
      height: thirdH,
    },
    center: {
      x: safeArea.x + safeArea.width * 0.1,
      y: safeArea.y + thirdH,
      width: safeArea.width * 0.8,
      height: thirdH,
    },
    bottomLeft: {
      x: safeArea.x,
      y: safeArea.y + thirdH * 2,
      width: halfW,
      height: thirdH,
    },
    bottomRight: {
      x: safeArea.x + halfW,
      y: safeArea.y + thirdH * 2,
      width: halfW,
      height: thirdH,
    },
  };
}

/**
 * Determine which Z-pattern is more appropriate based on aspect ratio.
 * Horizontal banners → Z-pattern, Vertical banners → F-pattern
 */
export function getPatternType(
  width: number,
  height: number
): 'z-pattern' | 'f-pattern' {
  return width >= height ? 'z-pattern' : 'f-pattern';
}
