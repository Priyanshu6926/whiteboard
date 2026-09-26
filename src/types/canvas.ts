export type NodeType = "note" | "card" | "quiz_block";

export type LayoutDirection = "horizontal" | "radial" | "vertical";

export type Placement = "right" | "bottom" | "left" | "top";

export interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasNodeInfo {
  id: string;
  type: NodeType | string;
  text: string;
  bounds: NodeBounds;
}

export interface CanvasSpatialContext {
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
  existingNodes: CanvasNodeInfo[];
}

export interface AddNodeOptions {
  id?: string;
  x?: number;
  y?: number;
  text: string;
  type?: NodeType;
  relativeToNodeId?: string;
  placement?: Placement;
  color?: string;
}

export interface LayoutTreeResult {
  rootId: string;
  branchIds: string[];
}
