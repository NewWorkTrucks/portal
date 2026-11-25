"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AccessLogFilterFormProps, AccessLogFilterValues } from "@/types/access-log";

/** Date range and person for the access log. The range is limited to 7 days, counting both ends. */
export default function AccessLogFilterForm({ initialValues, personNames, onSubmit }: AccessLogFilterFormProps) {
  const [filterValues, setFilterValues] = useState<AccessLogFilterValues>(initialValues);

  function handleChangeFilterField(fieldName: keyof AccessLogFilterValues, fieldValue: string) {
    setFilterValues((previousValues) => ({ ...previousValues, [fieldName]: fieldValue }));
  }

  function handleSubmitFilterForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(filterValues);
  }

  return (
    <form onSubmit={handleSubmitFilterForm}>
      <FieldGroup className="sm:grid sm:grid-cols-3 sm:gap-4">
        <Field>
          <FieldLabel htmlFor="access-log-from-date">From</FieldLabel>
          <Input
            id="access-log-from-date"
            type="date"
            value={filterValues.fromDate}
            onChange={(event) => handleChangeFilterField("fromDate", event.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="access-log-to-date">To</FieldLabel>
          <Input
            id="access-log-to-date"
            type="date"
            value={filterValues.toDate}
            onChange={(event) => handleChangeFilterField("toDate", event.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="access-log-person">Person</FieldLabel>
          <select
            id="access-log-person"
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
            value={filterValues.personName}
            onChange={(event) => handleChangeFilterField("personName", event.target.value)}
          >
            <option value="">Everyone</option>
            {personNames.map((personName) => (
              <option key={personName} value={personName}>
                {personName}
              </option>
            ))}
          </select>
        </Field>
      </FieldGroup>
      <div className="mt-4 flex justify-end">
        <Button type="submit">Show activity</Button>
      </div>
    </form>
  );
}
