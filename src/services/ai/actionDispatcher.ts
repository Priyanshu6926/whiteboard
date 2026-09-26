import { CanvasAction } from "@/types/actions";
import { CanvasManager } from "@/services/canvas/CanvasManager";

export interface DispatchResult {
  success: boolean;
  details: string;
  createdIds: string[];
}

/**
 * Dispatches a strictly validated CanvasAction directly to CanvasManager methods.
 */
export function dispatchCanvasAction(
  action: CanvasAction,
  canvasManager: CanvasManager
): DispatchResult {
  try {
    switch (action.action) {
      case "create_mindmap": {
        const result = canvasManager.layoutTree(
          action.rootTitle,
          action.branches,
          action.suggestedLayout
        );
        return {
          success: true,
          details: `Mindmap: "${action.rootTitle}" (${action.branches.length} branches)`,
          createdIds: [result.rootId, ...result.branchIds],
        };
      }

      case "create_node": {
        const shapeId = canvasManager.addNode({
          text: action.label,
          type: action.nodeType,
          relativeToNodeId: action.relativeToNodeId,
          placement: action.placement,
        });
        return {
          success: true,
          details: `Added ${action.nodeType}: "${action.label}"`,
          createdIds: [shapeId],
        };
      }

      case "connect_nodes": {
        const edgeId = canvasManager.createEdge(
          action.sourceNodeId,
          action.targetNodeId,
          action.label
        );
        return {
          success: true,
          details: `Connected nodes${action.label ? ` ("${action.label}")` : ""}`,
          createdIds: [edgeId],
        };
      }

      case "set_countdown_timer": {
        const timerId = canvasManager.setTimer(
          action.durationSeconds,
          action.title
        );
        return {
          success: true,
          details: `Started ${action.durationSeconds}s timer${action.title ? ` ("${action.title}")` : ""}`,
          createdIds: [timerId],
        };
      }

      default: {
        const exhaustiveCheck: never = action;
        return {
          success: false,
          details: `Unsupported action: ${JSON.stringify(exhaustiveCheck)}`,
          createdIds: [],
        };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Canvas execution failed";
    console.error("[VoxCanvas:Dispatcher] Error executing action:", error);
    return {
      success: false,
      details: `Execution error: ${message}`,
      createdIds: [],
    };
  }
}
