import { calculateZPatternZones } from './eyeFlow';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Determine auto-placement position for a stamp.
 * Prefers topRight then bottomLeft zones with overlap avoidance.
 */
export function placeStamp(
  stampSize: number, // actual pixel size (stamp.size * canvasWidth)
  canvasWidth: number,
  canvasHeight: number,
  existingElements: BoundingBox[]
): { x: number; y: number } {
  const safeArea = {
    x: canvasWidth * 0.04,
    y: canvasHeight * 0.04,
    width: canvasWidth * 0.92,
    height: canvasHeight * 0.92,
  };

  const zones = calculateZPatternZones(safeArea);
  const preferredZones = [zones.topRight, zones.bottomLeft, zones.topLeft, zones.bottomRight];

  for (const zone of preferredZones) {
    const candidateX = zone.x + zone.width / 2;
    const candidateY = zone.y + zone.height / 2;
    const candidateBox: BoundingBox = {
      x: candidateX - stampSize / 2,
      y: candidateY - stampSize / 2,
      width: stampSize,
      height: stampSize,
    };

    if (!hasOverlap(candidateBox, existingElements)) {
      return { x: candidateX, y: candidateY };
    }
  }

  // Fallback: use topRight corner regardless of overlap
  return {
    x: zones.topRight.x + zones.topRight.width / 2,
    y: zones.topRight.y + zones.topRight.height / 2,
  };
}

function hasOverlap(box: BoundingBox, others: BoundingBox[]): boolean {
  for (const other of others) {
    if (
      box.x < other.x + other.width &&
      box.x + box.width > other.x &&
      box.y < other.y + other.height &&
      box.y + box.height > other.y
    ) {
      return true;
    }
  }
  return false;
}
