"use client";

import { ChevronDown, Flag, ListFilter, Search, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/user-avatar";
import { KANBAN_COLUMNS } from "@/constants/kanban-columns";
import { EMPTY_KANBAN_TASK_FILTERS, KANBAN_DUE_DATE_FILTER_OPTIONS } from "@/constants/kanban-filters";
import { KANBAN_TASK_PRIORITY_OPTIONS } from "@/constants/kanban-task-priorities";
import { countActiveKanbanTaskFilters, toggleListValue } from "@/lib/kanban-filters";
import { cn } from "@/lib/utils";
import type { KanbanDueDateFilter, KanbanTaskFilters } from "@/types/kanban-filters";
import type { TeamMember } from "@/types/team";

type KanbanBoardFiltersProps = {
  filters: KanbanTaskFilters;
  onChangeFilters: (filters: KanbanTaskFilters) => void;
  teamMembers: TeamMember[];
  visibleTaskCount: number;
  totalTaskCount: number;
};

type FilterDropdownProps = {
  label: string;
  Icon: typeof UserRound;
  selectedSummary: string | null;
  children: ReactNode;
};

/** A filter button that shows what is selected, e.g. "Owner: Edward, Casey". */
function FilterDropdown({ label, Icon, selectedSummary, children }: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className={cn(selectedSummary && "border-primary/50 bg-primary/5")}
          />
        }
      >
        <Icon aria-hidden />
        <span className="max-w-40 truncate">
          {label}
          {selectedSummary && `: ${selectedSummary}`}
        </span>
        <ChevronDown aria-hidden className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function summarizeSelection(selectedLabels: string[]): string | null {
  if (selectedLabels.length === 0) {
    return null;
  }

  return selectedLabels.length <= 2
    ? selectedLabels.join(", ")
    : `${selectedLabels[0]} +${selectedLabels.length - 1}`;
}

/** E1-6: search and filter the board by owner, stage, priority and due date. */
export default function KanbanBoardFilters({
  filters,
  onChangeFilters,
  teamMembers,
  visibleTaskCount,
  totalTaskCount,
}: KanbanBoardFiltersProps) {
  const activeFilterCount = countActiveKanbanTaskFilters(filters);
  const dueDateOption =
    KANBAN_DUE_DATE_FILTER_OPTIONS.find((option) => option.value === filters.dueDate) ??
    KANBAN_DUE_DATE_FILTER_OPTIONS[0];

  function updateFilters(changedFilters: Partial<KanbanTaskFilters>) {
    onChangeFilters({ ...filters, ...changedFilters });
  }

  return (
    <section
      aria-label="Filter cards"
      data-tour="filters"
      className="mx-6 mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2"
    >
      <div className="relative min-w-48 flex-1 sm:max-w-64">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={filters.searchText}
          onChange={(event) => updateFilters({ searchText: event.target.value })}
          placeholder="Search cards"
          aria-label="Search cards by title, description or note"
          className="pl-8"
        />
      </div>

      <FilterDropdown
        label="Owner"
        Icon={UserRound}
        selectedSummary={summarizeSelection(filters.ownerNames)}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Owner</DropdownMenuLabel>
          {teamMembers.map((teamMember) => (
            <DropdownMenuCheckboxItem
              key={teamMember.id}
              checked={filters.ownerNames.includes(teamMember.name)}
              onCheckedChange={() =>
                updateFilters({ ownerNames: toggleListValue(filters.ownerNames, teamMember.name) })
              }
            >
              <UserAvatar name={teamMember.name} className="size-5" />
              {teamMember.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </FilterDropdown>

      <FilterDropdown
        label="Stage"
        Icon={ListFilter}
        selectedSummary={summarizeSelection(
          KANBAN_COLUMNS.filter((column) => filters.statuses.includes(column.status)).map(
            (column) => column.title,
          ),
        )}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Stage</DropdownMenuLabel>
          {KANBAN_COLUMNS.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.status}
              checked={filters.statuses.includes(column.status)}
              onCheckedChange={() =>
                updateFilters({ statuses: toggleListValue(filters.statuses, column.status) })
              }
            >
              <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", column.accentClassName)} />
              {column.title}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </FilterDropdown>

      <FilterDropdown
        label="Priority"
        Icon={Flag}
        selectedSummary={summarizeSelection(
          KANBAN_TASK_PRIORITY_OPTIONS.filter((option) => filters.priorities.includes(option.value)).map(
            (option) => option.label,
          ),
        )}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          {KANBAN_TASK_PRIORITY_OPTIONS.map((priorityOption) => (
            <DropdownMenuCheckboxItem
              key={priorityOption.value}
              checked={filters.priorities.includes(priorityOption.value)}
              onCheckedChange={() =>
                updateFilters({
                  priorities: toggleListValue(filters.priorities, priorityOption.value),
                })
              }
            >
              <Flag aria-hidden />
              {priorityOption.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </FilterDropdown>

      <FilterDropdown
        label="Due"
        Icon={dueDateOption.Icon}
        selectedSummary={filters.dueDate === "any" ? null : dueDateOption.label}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Due date</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={filters.dueDate}
            onValueChange={(dueDate: KanbanDueDateFilter) => updateFilters({ dueDate })}
          >
            {KANBAN_DUE_DATE_FILTER_OPTIONS.map((dueDateFilterOption) => (
              <DropdownMenuRadioItem
                key={dueDateFilterOption.value}
                value={dueDateFilterOption.value}
                closeOnClick
              >
                <dueDateFilterOption.Icon aria-hidden />
                {dueDateFilterOption.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </FilterDropdown>

      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={() => onChangeFilters(EMPTY_KANBAN_TASK_FILTERS)}>
          <X aria-hidden />
          Clear filters ({activeFilterCount})
        </Button>
      )}

      <p role="status" className="ml-auto text-xs text-muted-foreground tabular-nums">
        {activeFilterCount > 0
          ? `Showing ${visibleTaskCount} of ${totalTaskCount} cards`
          : `${totalTaskCount} cards`}
      </p>
    </section>
  );
}
