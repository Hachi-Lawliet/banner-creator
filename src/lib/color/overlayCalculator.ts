import chroma from 'chroma-js';

/**
 * Calculate the overlay RGBA color to apply over a background image.
 */
export function calculateOverlayColor(
  brandDarkColor: string,
  opacity: number
): string {
  const clampedOpacity = Math.min(0.8, Math.max(0, opacity));
  const rgb = chroma(brandDarkColor).rgb();
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${clampedOpacity})`;
}

/**
 * Generate canvas-compatible gradient stops for when no background image is provided.
 * Returns an array of [position, color] tuples with smoother multi-stop transitions.
 */
export function generateGradientStops(
  lightColor: string,
  mediumColor: string,
  darkColor: string
): Array<[number, string]> {
  // Generate intermediate colors for smoother gradients
  const midLight = chroma.mix(lightColor, mediumColor, 0.5).hex();
  const midDark = chroma.mix(mediumColor, darkColor, 0.5).hex();

  return [
    [0, lightColor],
    [0.25, midLight],
    [0.5, mediumColor],
    [0.75, midDark],
    [1, darkColor],
  ];
}
