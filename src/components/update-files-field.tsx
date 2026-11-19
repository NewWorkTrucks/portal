"use client";

import { FileText, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import AttachmentPicker from "@/components/attachment-picker";
import { Button } from "@/components/ui/button";
import { MAX_ATTACHMENT_SIZE_BYTES, MAX_FILES_PER_UPDATE } from "@/constants/attachments";
import { formatFileSize } from "@/lib/kanban-stages";

type UpdateFilesFieldProps = {
  files: File[];
  onChangeFiles: (files: File[]) => void;
  disabled?: boolean;
};

/** Files to post with an update (E1-4): pick, preview images, and remove before posting. */
export default function UpdateFilesField({ files, onChangeFiles, disabled = false }: UpdateFilesFieldProps) {
  const previewUrls = useMemo(
    () => files.map((file) => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null)),
    [files],
  );

  const remainingFileSlots = MAX_FILES_PER_UPDATE - files.length;

  function handleSelectFiles(selectedFiles: File[]) {
    onChangeFiles([...files, ...selectedFiles].slice(0, MAX_FILES_PER_UPDATE));
  }

  function handleClickRemoveFile(fileIndex: number) {
    onChangeFiles(files.filter((_file, index) => index !== fileIndex));
  }

  useEffect(
    () => () => previewUrls.forEach((previewUrl) => previewUrl && URL.revokeObjectURL(previewUrl)),
    [previewUrls],
  );

  return (
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Files to post">
          {files.map((file, fileIndex) => (
            <li
              key={`${file.name}-${fileIndex}`}
              className="flex max-w-56 items-center gap-2 rounded-md border bg-muted/40 py-1 pr-1 pl-1.5 text-xs"
            >
              {previewUrls[fileIndex] ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local preview of a picked file
                <img src={previewUrls[fileIndex] ?? undefined} alt="" className="size-8 shrink-0 rounded object-cover" />
              ) : (
                <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{file.name}</span>
                <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                aria-label={`Remove ${file.name}`}
                onClick={() => handleClickRemoveFile(fileIndex)}
                disabled={disabled}
              >
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <AttachmentPicker
        maxFileSizeBytes={MAX_ATTACHMENT_SIZE_BYTES}
        disabled={disabled || remainingFileSlots <= 0}
        onSelectFiles={handleSelectFiles}
      />
      {remainingFileSlots <= 0 && (
        <p className="text-xs text-muted-foreground">Up to {MAX_FILES_PER_UPDATE} files per update.</p>
      )}
    </div>
  );
}
