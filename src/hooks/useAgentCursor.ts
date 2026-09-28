"use client";

import { useCallback, useRef, useState } from "react";
import {
  Point2D,
  calculateCubicBezier,
  calculateTangentAngle,
  easeOutCubic,
  generateControlPoints,
} from "@/services/animation/bezierPath";

export interface TrailPoint extends Point2D {
  id: number;
  opacity: number;
}

export interface AgentCursorState {
  x: number;
  y: number;
  angle: number;
  isAnimating: boolean;
  isVisible: boolean;
  label: string;
  trail: TrailPoint[];
  showRipple: boolean;
  ripplePos: Point2D;
}

export interface UseAgentCursorReturn {
  cursorState: AgentCursorState;
  animateTo: (target: Point2D, label: string, durationMs?: number) => Promise<void>;
  teleportTo: (pos: Point2D) => void;
  hideCursor: () => void;
}

export function useAgentCursor(initialPos?: Point2D): UseAgentCursorReturn {
  const [cursorState, setCursorState] = useState<AgentCursorState>(() => ({
    x: initialPos?.x ?? 400,
    y: initialPos?.y ?? 300,
    angle: 0,
    isAnimating: false,
    isVisible: false,
    label: "Thinking...",
    trail: [],
    showRipple: false,
    ripplePos: { x: initialPos?.x ?? 400, y: initialPos?.y ?? 300 },
  }));

  const positionRef = useRef<Point2D>({
    x: initialPos?.x ?? 400,
    y: initialPos?.y ?? 300,
  });
  const trailCounterRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const teleportTo = useCallback((pos: Point2D) => {
    positionRef.current = { ...pos };
    setCursorState((prev) => ({
      ...prev,
      x: pos.x,
      y: pos.y,
      isVisible: true,
      trail: [],
    }));
  }, []);

  const hideCursor = useCallback(() => {
    setCursorState((prev) => ({ ...prev, isVisible: false, isAnimating: false }));
  }, []);

  const animateTo = useCallback(
    (target: Point2D, label: string, durationMs = 400): Promise<void> => {
      return new Promise<void>((resolve) => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }

        const start = { ...positionRef.current };
        const curve = generateControlPoints(start, target);
        const startTime = performance.now();
        const activeTrail: TrailPoint[] = [];

        setCursorState((prev) => ({
          ...prev,
          isVisible: true,
          isAnimating: true,
          label,
          showRipple: false,
        }));

        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / durationMs);
          const eased = easeOutCubic(progress);

          const currentPt = calculateCubicBezier(
            curve.p0,
            curve.p1,
            curve.p2,
            curve.p3,
            eased
          );
          const currentAngle = calculateTangentAngle(
            curve.p0,
            curve.p1,
            curve.p2,
            curve.p3,
            eased
          );

          positionRef.current = currentPt;

          // Add trail point every frame, fading out older trail points
          trailCounterRef.current++;
          activeTrail.push({
            x: currentPt.x,
            y: currentPt.y,
            id: trailCounterRef.current,
            opacity: 0.8,
          });

          // Keep trail limited to last 14 points
          if (activeTrail.length > 14) {
            activeTrail.shift();
          }

          // Dim older trail points
          for (let i = 0; i < activeTrail.length; i++) {
            activeTrail[i].opacity = (i + 1) / activeTrail.length;
          }

          if (progress < 1) {
            setCursorState((prev) => ({
              ...prev,
              x: currentPt.x,
              y: currentPt.y,
              angle: currentAngle,
              trail: [...activeTrail],
            }));
            animFrameRef.current = requestAnimationFrame(tick);
          } else {
            // Animation finished at destination target
            positionRef.current = { ...target };
            setCursorState((prev) => ({
              ...prev,
              x: target.x,
              y: target.y,
              angle: currentAngle,
              isAnimating: false,
              showRipple: true,
              ripplePos: { ...target },
              trail: [],
            }));

            // Auto-hide ripple after impact wave finishes
            setTimeout(() => {
              setCursorState((prev) => ({ ...prev, showRipple: false }));
            }, 600);

            // Auto-hide cursor after idle period if not actively thinking
            setTimeout(() => {
              setCursorState((prev) => {
                if (!prev.isAnimating) {
                  return { ...prev, isVisible: false };
                }
                return prev;
              });
            }, 1200);

            resolve();
          }
        };

        animFrameRef.current = requestAnimationFrame(tick);
      });
    },
    []
  );

  return {
    cursorState,
    animateTo,
    teleportTo,
    hideCursor,
  };
}
