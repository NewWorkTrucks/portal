"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { findTaskById } from "@/lib/kanban";
import type { KanbanTask, KanbanTasksByStatus } from "@/types/kanban";

type KanbanOpenTaskFromUrlProps = {
  tasksByStatus: KanbanTasksByStatus;
  onOpenTask: (task: KanbanTask) => void;
};

/**
 * Opens the card named in ?task= (from a notification link) once it's on the board, then
 * removes the parameter. Rendered inside <Suspense> so the rest of the board can prerender.
 */
export default function KanbanOpenTaskFromUrl({
  tasksByStatus,
  onOpenTask,
}: KanbanOpenTaskFromUrlProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const taskIdToOpen = searchParams.get("task");

  useEffect(() => {
    if (!taskIdToOpen) {
      return;
    }
    const taskToOpen = findTaskById(tasksByStatus, taskIdToOpen);
    if (taskToOpen) {
      onOpenTask(taskToOpen);
      router.replace(pathname, { scroll: false });
    }
  }, [taskIdToOpen, tasksByStatus, onOpenTask, router, pathname]);

  return null;
}
