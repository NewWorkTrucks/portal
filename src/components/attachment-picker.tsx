"use client";

import { Paperclip } from "lucide-react";
import { type ChangeEvent, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/kanban-stages";

type AttachmentPickerProps = {
  maxFileSizeBytes: number;
  disabled?: boolean;
  onSelectFiles: (files: File[]) => void;
};

/** A button that picks one or more files and rejects any over the size limit (E1-4). */
export default function AttachmentPicker({
  maxFileSizeBytes,
  disabled = false,
  onSelectFiles,
}: AttachmentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  const [sizeError, setSizeError] = useState<string | null>(null);

  function handleChangeFileInput(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    // Reset so picking the same file again still fires a change event.
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const oversizedFiles = selectedFiles.filter((file) => file.size > maxFileSizeBytes);

    if (oversizedFiles.length > 0) {
      setSizeError(
        `${oversizedFiles.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(", ")} ${
          oversizedFiles.length === 1 ? "is" : "are"
        } over the ${formatFileSize(maxFileSizeBytes)} limit.`,
      );
      return;
    }

    setSizeError(null);
    onSelectFiles(selectedFiles);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleChangeFileInput}
      />
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        aria-describedby={sizeError ? errorId : undefined}
      >
        <Paperclip aria-hidden />
        Add files
      </Button>
      <p className="text-xs text-muted-foreground">Up to {formatFileSize(maxFileSizeBytes)} per file.</p>
      {sizeError && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {sizeError}
        </p>
      )}
    </div>
  );
}
