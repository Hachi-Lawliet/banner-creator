import chroma from 'chroma-js';

interface WeightedElement {
  yCenterRatio: number; // Y center as ratio of banner height (0-1)
  area: number; // area in px^2
  color: string; // hex color for calculating visual weight
}

/**
 * Calculate the visual gravity center Y position.
 * Formula: gravityY = Σ(Y中心 × 面積 × 色濃度) / Σ(面積 × 色濃度)
 * Returns a ratio (0-1) where 0 is top and 1 is bottom.
 * Target range: 0.4 - 0.5 (middle to slightly above center)
 */
export function calculateGravityCenter(elements: WeightedElement[]): number {
  if (elements.length === 0) return 0.5;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const el of elements) {
    const luminance = 1 - chroma(el.color).luminance(); // darker = heavier
    const weight = el.area * luminance;
    weightedSum += el.yCenterRatio * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0.5;
  return weightedSum / totalWeight;
}

/**
 * Check if gravity center is within the target range.
 */
export function isGravityCenterBalanced(
  gravityY: number,
  targetMin: number = 0.4,
  targetMax: number = 0.5
): boolean {
  return gravityY >= targetMin && gravityY <= targetMax;
}

/**
 * Suggest adjustment direction to bring gravity center into target range.
 * Returns a value: negative means "move elements up", positive means "move elements down".
 */
export function suggestGravityAdjustment(
  gravityY: number,
  targetMin: number = 0.4,
  targetMax: number = 0.5
): number {
  const targetCenter = (targetMin + targetMax) / 2;
  return targetCenter - gravityY;
}
