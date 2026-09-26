import { z } from "zod";
import { CanvasSpatialContext } from "./canvas";

export const CreateMindmapActionSchema = z.object({
  action: z.literal("create_mindmap"),
  rootTitle: z.string().min(1).max(80),
  branches: z.array(z.string().min(1).max(100)).min(1).max(8),
  suggestedLayout: z.enum(["radial", "horizontal"]).default("horizontal"),
});

export const CreateNodeActionSchema = z.object({
  action: z.literal("create_node"),
  label: z.string().min(1),
  nodeType: z.enum(["note", "card", "quiz_block"]).default("note"),
  relativeToNodeId: z.string().optional(),
  placement: z.enum(["right", "bottom", "left", "top"]).default("right"),
});

export const ConnectNodesActionSchema = z.object({
  action: z.literal("connect_nodes"),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  label: z.string().optional(),
});

export const SetCountdownTimerActionSchema = z.object({
  action: z.literal("set_countdown_timer"),
  durationSeconds: z.number().int().positive().max(3600),
  title: z.string().optional(),
});

export const CanvasActionSchema = z.discriminatedUnion("action", [
  CreateMindmapActionSchema,
  CreateNodeActionSchema,
  ConnectNodesActionSchema,
  SetCountdownTimerActionSchema,
]);

export type CanvasAction = z.infer<typeof CanvasActionSchema>;

export type CreateMindmapAction = z.infer<typeof CreateMindmapActionSchema>;
export type CreateNodeAction = z.infer<typeof CreateNodeActionSchema>;
export type ConnectNodesAction = z.infer<typeof ConnectNodesActionSchema>;
export type SetCountdownTimerAction = z.infer<typeof SetCountdownTimerActionSchema>;

export interface LLMRequest {
  transcript: string;
  spatialContext: CanvasSpatialContext;
}

export interface LLMResponse {
  success: boolean;
  action?: CanvasAction;
  error?: string;
  raw?: unknown;
}
