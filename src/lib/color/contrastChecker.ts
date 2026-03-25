import chroma from 'chroma-js';

/**
 * Calculate contrast ratio between two colors (WCAG formula).
 * Returns a value >= 1, where 1 means no contrast and 21 means maximum contrast.
 */
export function getContrastRatio(color1: string, color2: string): number {
  return chroma.contrast(color1, color2);
}

/**
 * Check if two colors meet WCAG AA contrast requirements.
 * Normal text: 4.5:1, Large text: 3:1
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Find the minimum overlay opacity needed to achieve WCAG AA contrast
 * between text color and background color with an overlay in between.
 */
export function findMinOverlayOpacity(
  textColor: string,
  backgroundColor: string,
  overlayColor: string,
  targetRatio: number = 4.5
): number {
  let low = 0;
  let high = 0.8;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const blended = chroma.mix(backgroundColor, overlayColor, mid, 'rgb').hex();
    const ratio = getContrastRatio(textColor, blended);

    if (ratio >= targetRatio) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.ceil(high * 100) / 100;
}
