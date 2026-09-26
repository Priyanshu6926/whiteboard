import {
  Editor,
  createShapeId,
  toRichText,
  TLShapeId,
  TLDefaultColorStyle,
} from "@tldraw/tldraw";
import {
  AddNodeOptions,
  CanvasNodeInfo,
  CanvasSpatialContext,
  LayoutTreeResult,
  NodeBounds,
  NodeType,
} from "../../types/canvas";
import {
  calculateRelativePosition,
  calculateTreeLayout,
  findNonOverlappingPosition,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
} from "./layoutUtils";

export function extractPlainText(richText: unknown): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (typeof richText === "object" && richText !== null && "content" in richText) {
    const doc = richText as { content?: Array<{ content?: Array<{ text?: string }>; text?: string }> };
    if (Array.isArray(doc.content)) {
      return doc.content
        .map((block) => {
          if (Array.isArray(block.content)) {
            return block.content.map((inline) => inline.text || "").join("");
          }
          return block.text || "";
        })
        .join("\n");
    }
  }
  return "";
}

export class CanvasManager {
  private editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  /**
   * Adds a new node (card, sticky note, or quiz block) to the canvas.
   */
  public addNode(options: AddNodeOptions): string {
    const shapeId = (options.id as TLShapeId) || createShapeId();
    let posX = options.x;
    let posY = options.y;

    // Relative positioning if parent node ID is specified
    if (options.relativeToNodeId) {
      const parentId = options.relativeToNodeId as TLShapeId;
      const parentBounds = this.editor.getShapePageBounds(parentId);

      if (parentBounds) {
        const bounds: NodeBounds = {
          x: parentBounds.x,
          y: parentBounds.y,
          width: parentBounds.w,
          height: parentBounds.h,
        };
        const relPos = calculateRelativePosition(bounds, options.placement || "right");
        posX = relPos.x;
        posY = relPos.y;
      }
    }

    // Default to viewport center if coordinates are still undefined
    if (posX === undefined || posY === undefined) {
      const viewport = this.editor.getViewportPageBounds();
      posX = Math.round(viewport.center.x - DEFAULT_NODE_WIDTH / 2);
      posY = Math.round(viewport.center.y - DEFAULT_NODE_HEIGHT / 2);
    }

    // SPAT-02: Apply quadrant collision avoidance to prevent node overlap
    const existingBounds = this.getSpatialContext().existingNodes.map((n) => n.bounds);
    const safePos = findNonOverlappingPosition(
      { x: posX, y: posY },
      DEFAULT_NODE_WIDTH,
      DEFAULT_NODE_HEIGHT,
      existingBounds
    );
    posX = safePos.x;
    posY = safePos.y;

    const nodeType: NodeType = options.type || "card";
    const color: TLDefaultColorStyle = (options.color as TLDefaultColorStyle) || (
      nodeType === "quiz_block" ? "violet" : nodeType === "note" ? "yellow" : "blue"
    );

    if (nodeType === "note") {
      this.editor.createShape({
        id: shapeId,
        type: "note",
        x: posX,
        y: posY,
        props: {
          color,
          richText: toRichText(options.text),
        },
      });
    } else {
      // "card" or "quiz_block" rendered as geo shape
      this.editor.createShape({
        id: shapeId,
        type: "geo",
        x: posX,
        y: posY,
        props: {
          geo: "rectangle",
          w: DEFAULT_NODE_WIDTH,
          h: DEFAULT_NODE_HEIGHT,
          color,
          fill: nodeType === "quiz_block" ? "semi" : "pattern",
          richText: toRichText(options.text),
        },
      });
    }

    return shapeId;
  }

  /**
   * Connects two shapes using a directional arrow.
   */
  public createEdge(fromId: string, toId: string, label?: string): string {
    const arrowId = createShapeId();
    const sourceBounds = this.editor.getShapePageBounds(fromId as TLShapeId);
    const targetBounds = this.editor.getShapePageBounds(toId as TLShapeId);

    const startX = sourceBounds ? sourceBounds.center.x : 0;
    const startY = sourceBounds ? sourceBounds.center.y : 0;
    const endX = targetBounds ? targetBounds.center.x : 100;
    const endY = targetBounds ? targetBounds.center.y : 100;

    this.editor.createShape({
      id: arrowId,
      type: "arrow",
      x: startX,
      y: startY,
      props: {
        start: { x: 0, y: 0 },
        end: { x: endX - startX, y: endY - startY },
        richText: label ? toRichText(label) : toRichText(""),
        arrowheadEnd: "arrow",
      },
    });

    // Bind arrow terminals to the source and target nodes
    try {
      this.editor.createBinding({
        type: "arrow",
        fromId: arrowId,
        toId: fromId as TLShapeId,
        props: {
          terminal: "start",
          normalizedAnchor: { x: 0.5, y: 0.5 },
          isExact: false,
        },
      });

      this.editor.createBinding({
        type: "arrow",
        fromId: arrowId,
        toId: toId as TLShapeId,
        props: {
          terminal: "end",
          normalizedAnchor: { x: 0.5, y: 0.5 },
          isExact: false,
        },
      });
    } catch (err) {
      console.warn("Could not bind arrow handles to shapes:", err);
    }

    return arrowId;
  }

  /**
   * Creates an entire mindmap or hierarchical tree with collision-free spacing.
   */
  public layoutTree(
    rootText: string,
    branches: string[],
    layout: "horizontal" | "radial" = "horizontal"
  ): LayoutTreeResult {
    const viewport = this.editor.getViewportPageBounds();
    const rootPos = {
      x: Math.round(viewport.center.x - DEFAULT_NODE_WIDTH / 2),
      y: Math.round(viewport.center.y - DEFAULT_NODE_HEIGHT / 2),
    };

    const tree = calculateTreeLayout(rootText, branches, layout, rootPos);

    // Create root node
    const rootId = this.addNode({
      x: tree.root.x,
      y: tree.root.y,
      text: tree.root.text,
      type: "card",
      color: "light-blue",
    });

    // Create branch nodes and link to root
    const branchIds: string[] = [];
    for (const branch of tree.branches) {
      const branchId = this.addNode({
        x: branch.x,
        y: branch.y,
        text: branch.text,
        type: "note",
        color: "yellow",
      });
      branchIds.push(branchId);
      this.createEdge(rootId, branchId);
    }

    return { rootId, branchIds };
  }

  /**
   * Creates a countdown timer node.
   */
  public setTimer(durationSeconds: number, title?: string): string {
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const timerText = `⏱ ${title || "Sprint Timer"}\n${formatted}\n(${durationSeconds}s)`;

    return this.addNode({
      text: timerText,
      type: "quiz_block",
      color: "red",
    });
  }

  /**
   * Serializes the current visible canvas viewport and existing nodes.
   */
  public getSpatialContext(): CanvasSpatialContext {
    const viewport = this.editor.getViewportPageBounds();
    const zoom = this.editor.getZoomLevel();
    const shapes = this.editor.getCurrentPageShapes();

    const existingNodes: CanvasNodeInfo[] = [];

    for (const shape of shapes) {
      if (shape.type === "arrow") continue;

      const pageBounds = this.editor.getShapePageBounds(shape);
      const bounds: NodeBounds = pageBounds
        ? {
            x: Math.round(pageBounds.x),
            y: Math.round(pageBounds.y),
            width: Math.round(pageBounds.w),
            height: Math.round(pageBounds.h),
          }
        : {
            x: Math.round(shape.x),
            y: Math.round(shape.y),
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
          };

      const shapeProps = shape.props as Record<string, unknown>;
      const text =
        extractPlainText(shapeProps?.richText) ||
        (typeof shapeProps?.text === "string" ? shapeProps.text : "");

      existingNodes.push({
        id: shape.id,
        type: shape.type,
        text,
        bounds,
      });
    }

    return {
      viewport: {
        x: Math.round(viewport.x),
        y: Math.round(viewport.y),
        width: Math.round(viewport.w),
        height: Math.round(viewport.h),
        zoom: Number(zoom.toFixed(2)),
      },
      existingNodes,
    };
  }

  /**
   * Clears all shapes on the active page.
   */
  public clearCanvas(): void {
    const shapes = this.editor.getCurrentPageShapes();
    if (shapes.length > 0) {
      this.editor.deleteShapes(shapes.map((s) => s.id));
    }
  }

  /**
   * Retrieves the raw tldraw Editor instance.
   */
  public getEditor(): Editor {
    return this.editor;
  }
}
