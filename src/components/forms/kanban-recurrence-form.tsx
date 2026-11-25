"use client";

import { CalendarDays, CalendarRange, Clock, Repeat, Repeat1, Settings2, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  buildPresetRule,
  describeRecurrence,
  getIsoWeekday,
  getMatchingPresetId,
  getRecurrencePresets,
  getWeekdayName,
} from "@/lib/kanban-recurrence";
import { cn } from "@/lib/utils";
import type {
  KanbanIsoWeekday,
  KanbanRecurrenceEndsKind,
  KanbanRecurrenceFormProps,
  KanbanRecurrenceFrequency,
  KanbanRecurrenceMonthlyBy,
  KanbanRecurrencePresetId,
  KanbanRecurrenceRule,
} from "@/types/kanban-recurrence";

const ALL_WEEKDAYS: KanbanIsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];
const DEFAULT_TIME = "00:00";
const MAX_INTERVAL = 99;
const MAX_ENDS_AFTER_COUNT = 999;

const PRESET_ICONS: Record<KanbanRecurrencePresetId, typeof Repeat> = {
  none: X,
  daily: Repeat,
  weekly: Repeat1,
  monthly: CalendarDays,
  yearly: CalendarRange,
  weekdays: Repeat,
  custom: Settings2,
};

const FREQUENCY_OPTIONS: { value: KanbanRecurrenceFrequency; singular: string; plural: string }[] = [
  { value: "daily", singular: "day", plural: "days" },
  { value: "weekly", singular: "week", plural: "weeks" },
  { value: "monthly", singular: "month", plural: "months" },
  { value: "yearly", singular: "year", plural: "years" },
];

const ENDS_OPTIONS: { value: KanbanRecurrenceEndsKind; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "on-date", label: "On" },
  { value: "after-count", label: "After" },
];

/**
 * Sets how a card repeats (US-1.3 to 1.5), like Google Calendar: quick choices or a custom rule,
 * an end, and the time it comes back (US Central). Not tied to a dialog, so it can be reused.
 */
export default function KanbanRecurrenceForm({ initialRecurrence, today, onSubmit, onCancel }: KanbanRecurrenceFormProps) {
  const initialRule = initialRecurrence?.rule;
  // Changing an existing repeat keeps its start date, so intervals keep their rhythm (US-1.5).
  const startDate = initialRule?.startDate ?? today;

  const [presetId, setPresetId] = useState<KanbanRecurrencePresetId>(
    initialRule ? getMatchingPresetId(initialRule) : "none",
  );
  const [frequency, setFrequency] = useState<KanbanRecurrenceFrequency>(initialRule?.frequency ?? "weekly");
  const [intervalText, setIntervalText] = useState(String(initialRule?.interval ?? 1));
  const [weekdays, setWeekdays] = useState<KanbanIsoWeekday[]>(initialRule?.weekdays ?? [getIsoWeekday(startDate)]);
  const [monthlyBy, setMonthlyBy] = useState<KanbanRecurrenceMonthlyBy>(initialRule?.monthlyBy ?? "day-of-month");
  const [endsKind, setEndsKind] = useState<KanbanRecurrenceEndsKind>(
    initialRule?.endsOn ? "on-date" : initialRule?.endsAfterCount ? "after-count" : "never",
  );
  const [endsOn, setEndsOn] = useState(initialRule?.endsOn ?? "");
  const [endsAfterCountText, setEndsAfterCountText] = useState(String(initialRule?.endsAfterCount ?? 10));
  const [time, setTime] = useState(initialRecurrence?.time ?? DEFAULT_TIME);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presets = useMemo(() => getRecurrencePresets(startDate), [startDate]);
  const presetItems = useMemo(
    () => presets.map((preset) => ({ value: preset.id, label: preset.label })),
    [presets],
  );
  const interval = Number(intervalText);
  const frequencyItems = useMemo(
    () =>
      FREQUENCY_OPTIONS.map((frequencyOption) => ({
        value: frequencyOption.value,
        label: interval === 1 ? frequencyOption.singular : frequencyOption.plural,
      })),
    [interval],
  );
  const monthlyByItems = useMemo(
    () => [
      { value: "day-of-month", label: `Monthly on day ${Number(startDate.slice(8, 10))}` },
      {
        value: "weekday-of-month",
        label: describeRecurrence({ frequency: "monthly", interval: 1, monthlyBy: "weekday-of-month", startDate }, DEFAULT_TIME)
          .replace(/ at .*$/, "")
          .replace(/^monthly/, "Monthly"),
      },
    ],
    [startDate],
  );

  const isCustom = presetId === "custom";

  /** The rule the form describes right now, or a plain-language reason it isn't complete. */
  function buildRule(): KanbanRecurrenceRule | string {
    if (!isCustom) {
      return buildPresetRule(presetId, startDate) ?? "Pick how often the card repeats.";
    }
    if (!Number.isInteger(interval) || interval < 1 || interval > MAX_INTERVAL) {
      return `Repeat every 1 to ${MAX_INTERVAL} ${FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.plural}.`;
    }
    if (frequency === "weekly" && weekdays.length === 0) {
      return "Pick at least one weekday.";
    }
    const endsAfterCount = Number(endsAfterCountText);
    if (endsKind === "on-date" && (!endsOn || endsOn < today)) {
      return "Pick an end date from today on.";
    }
    if (
      endsKind === "after-count" &&
      (!Number.isInteger(endsAfterCount) || endsAfterCount < 1 || endsAfterCount > MAX_ENDS_AFTER_COUNT)
    ) {
      return `End after 1 to ${MAX_ENDS_AFTER_COUNT} times.`;
    }
    return {
      frequency,
      interval,
      startDate,
      ...(frequency === "weekly" ? { weekdays } : {}),
      ...(frequency === "monthly" ? { monthlyBy } : {}),
      endsOn: endsKind === "on-date" ? endsOn : null,
      endsAfterCount: endsKind === "after-count" ? endsAfterCount : null,
    };
  }

  const previewRule = presetId === "none" ? null : buildRule();

  function handleChangePreset(selectedPresetId: KanbanRecurrencePresetId | null) {
    if (selectedPresetId) {
      setPresetId(selectedPresetId);
      setFormError(null);
    }
  }

  function handleClickWeekday(weekday: KanbanIsoWeekday) {
    setWeekdays((currentWeekdays) =>
      currentWeekdays.includes(weekday)
        ? currentWeekdays.filter((currentWeekday) => currentWeekday !== weekday)
        : [...currentWeekdays, weekday],
    );
    setFormError(null);
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (presetId === "none") {
      setIsSubmitting(true);
      try {
        await onSubmit(null);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    const rule = buildRule();
    if (typeof rule === "string") {
      setFormError(rule);
      return;
    }
    if (!time) {
      setFormError("Pick the time the card comes back.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ rule, time });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitForm} noValidate className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="kanban-recurrence-preset">Repeat</FieldLabel>
        <Select items={presetItems} value={presetId} onValueChange={handleChangePreset}>
          <SelectTrigger id="kanban-recurrence-preset" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => {
              const PresetIcon = PRESET_ICONS[preset.id];
              return (
                <SelectItem key={preset.id} value={preset.id}>
                  <PresetIcon aria-hidden />
                  {preset.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </Field>

      {isCustom && (
        <fieldset className="flex flex-col gap-4 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Custom repeat</legend>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="kanban-recurrence-interval" className="text-sm">
              Repeat every
            </label>
            <Input
              id="kanban-recurrence-interval"
              type="number"
              min={1}
              max={MAX_INTERVAL}
              value={intervalText}
              onChange={(changeEvent) => {
                setIntervalText(changeEvent.target.value);
                setFormError(null);
              }}
              className="w-20"
            />
            <Select
              items={frequencyItems}
              value={frequency}
              onValueChange={(selectedFrequency: KanbanRecurrenceFrequency | null) => {
                if (selectedFrequency) {
                  setFrequency(selectedFrequency);
                  setFormError(null);
                }
              }}
            >
              <SelectTrigger aria-label="Repeat unit" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyItems.map((frequencyItem) => (
                  <SelectItem key={frequencyItem.value} value={frequencyItem.value}>
                    <CalendarDays aria-hidden />
                    {frequencyItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {frequency === "weekly" && (
            <div className="flex flex-col gap-2">
              <span id="kanban-recurrence-weekdays" className="text-sm">
                Repeat on
              </span>
              <div role="group" aria-labelledby="kanban-recurrence-weekdays" className="flex flex-wrap gap-1.5">
                {ALL_WEEKDAYS.map((weekday) => {
                  const isPicked = weekdays.includes(weekday);
                  return (
                    <button
                      key={weekday}
                      type="button"
                      aria-pressed={isPicked}
                      aria-label={getWeekdayName(weekday)}
                      onClick={() => handleClickWeekday(weekday)}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                        isPicked ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      {getWeekdayName(weekday).charAt(0)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {frequency === "monthly" && (
            <Select
              items={monthlyByItems}
              value={monthlyBy}
              onValueChange={(selectedMonthlyBy: KanbanRecurrenceMonthlyBy | null) => {
                if (selectedMonthlyBy) {
                  setMonthlyBy(selectedMonthlyBy);
                }
              }}
            >
              <SelectTrigger aria-label="Monthly on" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthlyByItems.map((monthlyByItem) => (
                  <SelectItem key={monthlyByItem.value} value={monthlyByItem.value}>
                    <CalendarDays aria-hidden />
                    {monthlyByItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm">Ends</legend>
            {ENDS_OPTIONS.map((endsOption) => (
              <div key={endsOption.value} className="flex min-h-9 items-center gap-2">
                <input
                  id={`kanban-recurrence-ends-${endsOption.value}`}
                  type="radio"
                  name="kanban-recurrence-ends"
                  value={endsOption.value}
                  checked={endsKind === endsOption.value}
                  onChange={() => {
                    setEndsKind(endsOption.value);
                    setFormError(null);
                  }}
                  className="size-4 accent-primary"
                />
                <label htmlFor={`kanban-recurrence-ends-${endsOption.value}`} className="w-12 text-sm">
                  {endsOption.label}
                </label>
                {endsOption.value === "on-date" && (
                  <Input
                    type="date"
                    aria-label="End date"
                    min={today}
                    value={endsOn}
                    disabled={endsKind !== "on-date"}
                    onChange={(changeEvent) => {
                      setEndsOn(changeEvent.target.value);
                      setFormError(null);
                    }}
                    className="w-44"
                  />
                )}
                {endsOption.value === "after-count" && (
                  <>
                    <Input
                      type="number"
                      aria-label="Number of times"
                      min={1}
                      max={MAX_ENDS_AFTER_COUNT}
                      value={endsAfterCountText}
                      disabled={endsKind !== "after-count"}
                      onChange={(changeEvent) => {
                        setEndsAfterCountText(changeEvent.target.value);
                        setFormError(null);
                      }}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">times</span>
                  </>
                )}
              </div>
            ))}
          </fieldset>
        </fieldset>
      )}

      {presetId !== "none" && (
        <Field>
          <FieldLabel htmlFor="kanban-recurrence-time">
            <Clock aria-hidden className="size-3.5" />
            Comes back at
          </FieldLabel>
          <Input
            id="kanban-recurrence-time"
            type="time"
            value={time}
            onChange={(changeEvent) => {
              setTime(changeEvent.target.value);
              setFormError(null);
            }}
            className="w-36"
          />
          <FieldDescription>
            US Central. A Done card moves back to Working on It; an unfinished one stays put and the miss is logged.
          </FieldDescription>
        </Field>
      )}

      {previewRule && typeof previewRule !== "string" && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">
          Repeats {describeRecurrence(previewRule, time || DEFAULT_TIME)}.
        </p>
      )}
      <FieldError>{formError}</FieldError>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || (presetId === "none" && !initialRecurrence)}>
          {presetId === "none" ? "Stop repeating" : "Save repeat"}
        </Button>
      </div>
    </form>
  );
}
