/**
 * Calculate the safe area (content area) within a banner.
 * Safe area = banner area minus margin on all sides.
 */
export function calculateSafeArea(
  width: number,
  height: number,
  marginRatio: number = 0.1
): { x: number; y: number; width: number; height: number } {
  const marginX = width * marginRatio;
  const marginY = height * marginRatio;

  return {
    x: marginX,
    y: marginY,
    width: width - marginX * 2,
    height: height - marginY * 2,
  };
}

/**
 * Check if an element fits within the safe area.
 */
export function isWithinSafeArea(
  elementX: number,
  elementY: number,
  elementWidth: number,
  elementHeight: number,
  safeArea: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    elementX >= safeArea.x &&
    elementY >= safeArea.y &&
    elementX + elementWidth <= safeArea.x + safeArea.width &&
    elementY + elementHeight <= safeArea.y + safeArea.height
  );
}

/**
 * Clamp an element's position to fit within the safe area.
 */
export function clampToSafeArea(
  elementX: number,
  elementY: number,
  elementWidth: number,
  elementHeight: number,
  safeArea: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  const maxX = safeArea.x + safeArea.width - elementWidth;
  const maxY = safeArea.y + safeArea.height - elementHeight;

  return {
    x: Math.max(safeArea.x, Math.min(maxX, elementX)),
    y: Math.max(safeArea.y, Math.min(maxY, elementY)),
  };
}
