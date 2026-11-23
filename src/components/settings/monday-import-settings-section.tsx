"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { importMondayTasks } from "@/api/monday-import";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDataMode } from "@/components/data-mode-provider";
import MondayImportForm from "@/components/forms/monday-import-form";
import SettingsSection from "@/components/settings/settings-section";
import { Input } from "@/components/ui/input";
import { MAX_MONDAY_FILE_SIZE_BYTES } from "@/constants/monday-import";
import { buildMondayImportRequest, formatCardCount, parseMondayBoard } from "@/lib/monday-import/monday-board";
import { readXlsxRows } from "@/lib/monday-import/read-xlsx-rows";
import type { MondayBoard, MondayImportFormValues, MondayImportResult } from "@/types/monday-import";

type MondayImportFlowProps = {
  businessId: string;
};

function MondayImportFlow({ businessId }: MondayImportFlowProps) {
  const { currentUser, teamMembers } = useCurrentUser();
  const { dataMode } = useDataMode();

  const [mondayBoard, setMondayBoard] = useState<MondayBoard | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<MondayImportResult | null>(null);

  const businessMembers = useMemo(
    () => teamMembers.filter((teamMember) => teamMember.businessIds.includes(businessId)),
    [teamMembers, businessId],
  );

  async function handleChangeFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    setMondayBoard(null);
    setFileError(null);
    setImportResult(null);
    if (!selectedFile) {
      return;
    }
    if (selectedFile.size > MAX_MONDAY_FILE_SIZE_BYTES) {
      setFileError("Choose a file under 10 MB.");
      return;
    }
    try {
      setMondayBoard(parseMondayBoard(await readXlsxRows(selectedFile)));
    } catch (readError) {
      setFileError(readError instanceof Error ? readError.message : "Couldn't read this file.");
    }
  }

  async function handleSubmitImport(formValues: MondayImportFormValues) {
    if (!mondayBoard) {
      return;
    }
    const result = await importMondayTasks(
      businessId,
      buildMondayImportRequest(mondayBoard.items, businessMembers, formValues),
    );
    setImportResult(result);
    setMondayBoard(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="monday-import-file" className="text-sm font-medium">
          Monday export (.xlsx)
        </label>
        <Input
          id="monday-import-file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => void handleChangeFile(event)}
        />
      </div>

      {fileError && (
        <p role="alert" className="text-sm text-destructive">
          {fileError}
        </p>
      )}
      {importResult && (
        <p role="status" className="rounded-md border p-3 text-sm">
          Imported {formatCardCount(importResult.importedCount)}. Skipped {formatCardCount(importResult.skippedCount)} already on the board.
        </p>
      )}
      {mondayBoard && (
        <MondayImportForm
          mondayBoard={mondayBoard}
          businessMembers={businessMembers}
          initialValues={{ fallbackOwnerId: currentUser.id, reviewerId: "", revisitDate: "" }}
          isImportAvailable={dataMode === "live"}
          onSubmit={handleSubmitImport}
          onCancel={() => setMondayBoard(null)}
        />
      )}
    </div>
  );
}

/** Admins only: brings a Monday.com board export into the current business (E5-1). */
export default function MondayImportSettingsSection() {
  const { currentBusiness } = useCurrentUser();

  return (
    <SettingsSection
      title={`Import from Monday · ${currentBusiness.shortName}`}
      description="Upload a board export, review the cards, then add them to this business."
      isBeta
    >
      <MondayImportFlow key={currentBusiness.id} businessId={currentBusiness.id} />
    </SettingsSection>
  );
}
