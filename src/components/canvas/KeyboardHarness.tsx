"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CanvasManager } from "@/services/canvas/CanvasManager";
import HarnessHUD from "./HarnessHUD";

interface KeyboardHarnessProps {
  canvasManager: CanvasManager | null;
}

export default function KeyboardHarness({ canvasManager }: KeyboardHarnessProps) {
  const [nodeCount, setNodeCount] = useState<number>(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const recentNodesRef = useRef<string[]>([]);
  const countRef = useRef<number>(1);

  const updateStats = useCallback(() => {
    if (!canvasManager) return;
    const ctx = canvasManager.getSpatialContext();
    setNodeCount(ctx.existingNodes.length);
  }, [canvasManager]);

  const executeAction = useCallback(
    (action: string) => {
      if (!canvasManager) return;

      try {
        switch (action) {
          case "node": {
            const currentCount = countRef.current++;
            const shapeId = canvasManager.addNode({
              text: `Idea Note #${currentCount}`,
              type: "note",
            });
            recentNodesRef.current.push(shapeId);
            setLastAction(`Added note #${currentCount}`);
            break;
          }
          case "mindmap": {
            const topics = [
              "Web Speech API",
              "Zod Validation",
              "Hybrid Routing",
              "IndexedDB Sync",
            ];
            const result = canvasManager.layoutTree(
              "Spatial Intelligence",
              topics,
              "horizontal"
            );
            recentNodesRef.current.push(result.rootId, ...result.branchIds);
            setLastAction(`Generated Mindmap (${topics.length} branches)`);
            break;
          }
          case "connect": {
            const history = recentNodesRef.current;
            if (history.length >= 2) {
              const toId = history[history.length - 1];
              const fromId = history[history.length - 2];
              canvasManager.createEdge(fromId, toId, "links to");
              setLastAction("Connected last two nodes");
            } else {
              setLastAction("Need at least 2 nodes to connect");
            }
            break;
          }
          case "timer": {
            canvasManager.setTimer(60, "Classroom Sprint");
            setLastAction("Started 60s countdown timer");
            break;
          }
          default:
            break;
        }

        updateStats();
      } catch (err) {
        console.error("Error executing harness action:", err);
        setLastAction("Error executing action");
      }
    },
    [canvasManager, updateStats]
  );

  const handleClear = useCallback(() => {
    if (!canvasManager) return;
    canvasManager.clearCanvas();
    recentNodesRef.current = [];
    countRef.current = 1;
    setLastAction("Canvas cleared");
    updateStats();
  }, [canvasManager, updateStats]);

  useEffect(() => {
    if (!canvasManager) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting keystrokes if typing inside text fields or tldraw rich-text editors
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest(".tl-text-editor"))
      ) {
        return;
      }

      // Ignore if modifier keys are pressed (e.g. Cmd+C, Ctrl+Z)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          executeAction("node");
          break;
        case "m":
          e.preventDefault();
          executeAction("mindmap");
          break;
        case "c":
          e.preventDefault();
          executeAction("connect");
          break;
        case "t":
          e.preventDefault();
          executeAction("timer");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    updateStats();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvasManager, executeAction, updateStats]);

  return (
    <HarnessHUD
      nodeCount={nodeCount}
      lastAction={lastAction}
      onActionClick={executeAction}
      onClear={handleClear}
    />
  );
}
