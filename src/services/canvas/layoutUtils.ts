import { NodeBounds, Placement } from "../../types/canvas";

export const DEFAULT_NODE_WIDTH = 200;
export const DEFAULT_NODE_HEIGHT = 120;
export const DEFAULT_GAP = 60;

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
