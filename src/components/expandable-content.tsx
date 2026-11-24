"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ExpandableContentProps } from "@/types/expandable-content";

const DEFAULT_COLLAPSED_HEIGHT_REM = 6;

/**
 * Shows the first few lines of content that could run long, faded out at the cut, with a
 * Show more / Show less toggle. The toggle only appears when the content really is cut off.
 */
export default function ExpandableContent({
  children,
  collapsedHeightRem = DEFAULT_COLLAPSED_HEIGHT_REM,
  className,
}: ExpandableContentProps) {
  const contentId = useId();
  const clampRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCutOff, setIsCutOff] = useState(false);

  function handleClickToggle() {
    setIsExpanded((wasExpanded) => !wasExpanded);
  }

  useEffect(() => {
    const clamp = clampRef.current;
    const content = contentRef.current;
    if (!clamp || !content) {
      return;
    }
    function measureCutOff() {
      if (clamp && content) {
        setIsCutOff(content.offsetHeight > clamp.clientHeight + 1);
      }
    }
    measureCutOff();
    // Content grows when images load or the panel is resized, so measure again then.
    const resizeObserver = new ResizeObserver(measureCutOff);
    resizeObserver.observe(content);
    resizeObserver.observe(clamp);
    return () => resizeObserver.disconnect();
  }, [collapsedHeightRem, isExpanded]);

  const isCollapsedAndCutOff = !isExpanded && isCutOff;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div
        ref={clampRef}
        id={contentId}
        style={isExpanded ? undefined : { maxHeight: `${collapsedHeightRem}rem` }}
        className={cn(
          "min-w-0 overflow-hidden",
          isCollapsedAndCutOff && "[mask-image:linear-gradient(to_bottom,black_calc(100%-1.75rem),transparent)]",
        )}
      >
        <div ref={contentRef} className="min-w-0 break-words">
          {children}
        </div>
      </div>

      {(isCutOff || isExpanded) && (
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={handleClickToggle}
          className="-ml-1 flex min-h-6 items-center gap-1 self-start rounded px-1 text-xs font-medium text-foreground/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11"
        >
          {isExpanded ? (
            <ChevronUp aria-hidden className="size-3.5" />
          ) : (
            <ChevronDown aria-hidden className="size-3.5" />
          )}
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
