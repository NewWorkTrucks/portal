"use client";

import { useEffect, useRef } from "react";
import { useDevicePreferences } from "@/components/device-preferences-provider";
import {
  TARGET_CURSOR_CORNER_SIZE,
  TARGET_CURSOR_IDLE_OFFSET,
  TARGET_CURSOR_SELECTOR,
  TARGET_CURSOR_SPIN_DURATION_MS,
  TARGET_CURSOR_TARGET_PADDING,
} from "@/constants/target-cursor";
import { cn } from "@/lib/utils";

// Top-left, top-right, bottom-right, bottom-left: which side of the point each bracket opens to.
const CORNER_DIRECTIONS = [
  { horizontal: -1, vertical: -1, borderClassName: "border-t-2 border-l-2" },
  { horizontal: 1, vertical: -1, borderClassName: "border-t-2 border-r-2" },
  { horizontal: 1, vertical: 1, borderClassName: "border-b-2 border-r-2" },
  { horizontal: -1, vertical: 1, borderClassName: "border-b-2 border-l-2" },
] as const;

/**
 * A crosshair that follows the mouse and snaps four brackets around a hovered Kanban card.
 * The normal cursor stays visible. It hides while a button is held (dragging a card), and only
 * runs when turned on in Settings with low spec mode off, on devices with a mouse or trackpad.
 */
export default function TargetCursor() {
  const { isTargetCursorActive } = useDevicePreferences();

  const containerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const cornerRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const dot = dotRef.current;
    if (!isTargetCursorActive || !container || !dot) {
      return;
    }

    let pointerX = 0;
    let pointerY = 0;
    let hasPointer = false;
    let isPointerPressed = false;
    let animationFrameId = 0;

    function handlePointerMove(event: PointerEvent) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      hasPointer = event.pointerType === "mouse" || event.pointerType === "pen";
    }

    function handlePointerDown() {
      isPointerPressed = true;
    }

    function handlePointerUp() {
      isPointerPressed = false;
    }

    function handlePointerLeavePage() {
      hasPointer = false;
    }

    function findHoveredTarget(): Element | null {
      return document.elementFromPoint(pointerX, pointerY)?.closest(TARGET_CURSOR_SELECTOR) ?? null;
    }

    function renderFrame(timestamp: number) {
      const isVisible = hasPointer && !isPointerPressed;
      container!.style.opacity = isVisible ? "1" : "0";

      if (isVisible) {
        dot!.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
        const targetRect = findHoveredTarget()?.getBoundingClientRect();
        // Not wrapped at 360°, so the eased transition never spins backwards.
        const spinAngle = (timestamp / TARGET_CURSOR_SPIN_DURATION_MS) * 2 * Math.PI;

        CORNER_DIRECTIONS.forEach((cornerDirection, cornerIndex) => {
          const corner = cornerRefs.current[cornerIndex];
          if (!corner) {
            return;
          }

          let cornerX: number;
          let cornerY: number;
          let rotationDegrees = 0;
          if (targetRect) {
            // Snap to the card's corners.
            cornerX =
              cornerDirection.horizontal < 0
                ? targetRect.left - TARGET_CURSOR_TARGET_PADDING
                : targetRect.right + TARGET_CURSOR_TARGET_PADDING - TARGET_CURSOR_CORNER_SIZE;
            cornerY =
              cornerDirection.vertical < 0
                ? targetRect.top - TARGET_CURSOR_TARGET_PADDING
                : targetRect.bottom + TARGET_CURSOR_TARGET_PADDING - TARGET_CURSOR_CORNER_SIZE;
          } else {
            // Spin slowly around the pointer.
            const offsetX = cornerDirection.horizontal * TARGET_CURSOR_IDLE_OFFSET;
            const offsetY = cornerDirection.vertical * TARGET_CURSOR_IDLE_OFFSET;
            cornerX = pointerX + offsetX * Math.cos(spinAngle) - offsetY * Math.sin(spinAngle) - TARGET_CURSOR_CORNER_SIZE / 2;
            cornerY = pointerY + offsetX * Math.sin(spinAngle) + offsetY * Math.cos(spinAngle) - TARGET_CURSOR_CORNER_SIZE / 2;
            rotationDegrees = (spinAngle * 180) / Math.PI;
          }
          corner.style.transform = `translate3d(${cornerX}px, ${cornerY}px, 0) rotate(${rotationDegrees}deg)`;
        });
      }

      animationFrameId = window.requestAnimationFrame(renderFrame);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeavePage);
    animationFrameId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeavePage);
    };
  }, [isTargetCursorActive]);

  if (!isTargetCursorActive) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden
      // White, with a thin dark shadow so it still shows on light cards.
      className="pointer-events-none fixed inset-0 z-[9999] opacity-0 drop-shadow-[0_0_1px_rgb(0_0_0/0.8)] transition-opacity duration-150"
    >
      <span ref={dotRef} className="absolute top-0 left-0 size-1 rounded-full bg-white" />
      {CORNER_DIRECTIONS.map((cornerDirection, cornerIndex) => (
        <span
          key={cornerIndex}
          ref={(cornerElement) => {
            cornerRefs.current[cornerIndex] = cornerElement;
          }}
          className={cn(
            "absolute top-0 left-0 border-white transition-transform duration-150 ease-out",
            cornerDirection.borderClassName,
          )}
          style={{ width: TARGET_CURSOR_CORNER_SIZE, height: TARGET_CURSOR_CORNER_SIZE }}
        />
      ))}
    </div>
  );
}
