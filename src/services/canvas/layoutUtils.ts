import { NodeBounds, Placement } from "../../types/canvas";

export const DEFAULT_NODE_WIDTH = 200;
export const DEFAULT_NODE_HEIGHT = 120;
export const DEFAULT_GAP = 60;

/**
 * Checks whether two 2D bounding boxes overlap, accounting for safety padding.
 */
export function boxesOverlap(
  b1: { x: number; y: number; width: number; height: number },
  b2: { x: number; y: number; width: number; height: number },
  padding: number = 24
): boolean {
  return !(
    b1.x + b1.width + padding <= b2.x ||
    b1.x >= b2.x + b2.width + padding ||
    b1.y + b1.height + padding <= b2.y ||
    b1.y >= b2.y + b2.height + padding
  );
}

/**
 * Calculates non-overlapping coordinates for a new node placed relative to an existing node.
 */
export function calculateRelativePosition(
  parentBounds: NodeBounds,
  placement: Placement = "right",
  gap: number = DEFAULT_GAP
): { x: number; y: number } {
  switch (placement) {
    case "right":
      return {
        x: parentBounds.x + parentBounds.width + gap,
        y: parentBounds.y,
      };
    case "left":
      return {
        x: parentBounds.x - DEFAULT_NODE_WIDTH - gap,
        y: parentBounds.y,
      };
    case "bottom":
      return {
        x: parentBounds.x,
        y: parentBounds.y + parentBounds.height + gap,
      };
    case "top":
      return {
        x: parentBounds.x,
        y: parentBounds.y - DEFAULT_NODE_HEIGHT - gap,
      };
    default:
      return {
        x: parentBounds.x + parentBounds.width + gap,
        y: parentBounds.y,
      };
  }
}

/**
 * Quadrant collision avoidance heuristic: scans radial offsets around proposed coordinates
 * to ensure newly placed nodes never visually collide or overlap existing nodes.
 */
export function findNonOverlappingPosition(
  proposed: { x: number; y: number },
  width: number,
  height: number,
  existingBounds: NodeBounds[],
  padding: number = 28
): { x: number; y: number } {
  const currentBox = { x: proposed.x, y: proposed.y, width, height };

  const hasCollision = (box: { x: number; y: number; width: number; height: number }) => {
    return existingBounds.some((existing) => boxesOverlap(box, existing, padding));
  };

  if (!hasCollision(currentBox)) {
    return proposed;
  }

  // Spiral search across quadrants to find the closest non-overlapping position
  const stepX = width + padding;
  const stepY = height + padding;

  for (let ring = 1; ring <= 6; ring++) {
    const candidatePositions = [
      { x: proposed.x + ring * stepX, y: proposed.y }, // Right
      { x: proposed.x - ring * stepX, y: proposed.y }, // Left
      { x: proposed.x, y: proposed.y + ring * stepY }, // Bottom
      { x: proposed.x, y: proposed.y - ring * stepY }, // Top
      { x: proposed.x + ring * stepX, y: proposed.y + ring * stepY }, // Bottom-Right
      { x: proposed.x - ring * stepX, y: proposed.y + ring * stepY }, // Bottom-Left
      { x: proposed.x + ring * stepX, y: proposed.y - ring * stepY }, // Top-Right
      { x: proposed.x - ring * stepX, y: proposed.y - ring * stepY }, // Top-Left
    ];

    for (const cand of candidatePositions) {
      if (!hasCollision({ x: cand.x, y: cand.y, width, height })) {
        return cand;
      }
    }
  }

  return proposed;
}

export interface TreeLayoutOutput {
  root: { x: number; y: number; text: string };
  branches: Array<{ x: number; y: number; text: string }>;
}

/**
 * Generates collision-free spatial coordinates for a root node and its branches.
 * Supports horizontal and radial tree structures.
 */
export function calculateTreeLayout(
  rootText: string,
  branchTexts: string[],
  layout: "horizontal" | "radial" = "horizontal",
  rootPos: { x: number; y: number } = { x: 400, y: 300 }
): TreeLayoutOutput {
  const root = {
    x: rootPos.x,
    y: rootPos.y,
    text: rootText,
  };

  const branches: Array<{ x: number; y: number; text: string }> = [];
  const branchCount = branchTexts.length;

  if (branchCount === 0) {
    return { root, branches };
  }

  if (layout === "horizontal") {
    const horizontalDistance = 320;
    const verticalSpacing = 160;
    const totalHeight = (branchCount - 1) * verticalSpacing;
    const startY = rootPos.y - totalHeight / 2;

    branchTexts.forEach((text, index) => {
      branches.push({
        x: rootPos.x + horizontalDistance,
        y: startY + index * verticalSpacing,
        text,
      });
    });
  } else if (layout === "radial") {
    const radius = Math.max(260, branchCount * 45);
    const angleStep = (2 * Math.PI) / branchCount;

    branchTexts.forEach((text, index) => {
      const angle = index * angleStep - Math.PI / 2; // start from top
      const x = Math.round(rootPos.x + radius * Math.cos(angle));
      const y = Math.round(rootPos.y + radius * Math.sin(angle));
      branches.push({
        x,
        y,
        text,
      });
    });
  }

  return { root, branches };
}
