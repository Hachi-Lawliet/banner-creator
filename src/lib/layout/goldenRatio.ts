const PHI = 1.618;

/**
 * Split a dimension into golden ratio segments.
 * Returns [major, minor] where major/minor ≈ 1.618
 */
export function goldenSplit(total: number): [number, number] {
  const major = total * (PHI / (1 + PHI)); // ≈ 61.8%
  const minor = total - major; // ≈ 38.2%
  return [major, minor];
}

/**
 * Get the golden ratio position along a dimension.
 * Useful for placing elements at aesthetically pleasing positions.
 */
export function goldenPosition(total: number, fromStart: boolean = true): number {
  const [major] = goldenSplit(total);
  return fromStart ? major : total - major;
}

/**
 * Calculate font size ratio based on golden ratio.
 * Title : Subtitle ≈ 1.618 : 1
 */
export function goldenFontRatio(titleSize: number): number {
  return titleSize / PHI;
}
