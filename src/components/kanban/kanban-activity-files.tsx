import { FileText } from "lucide-react";
import { formatFileSize } from "@/lib/kanban-stages";
import type { KanbanAttachment } from "@/types/attachment";

type KanbanActivityFilesProps = {
  attachments: KanbanAttachment[];
};

/** Files posted with one update, shown under it in the activity log: image previews and file links. */
export default function KanbanActivityFiles({ attachments }: KanbanActivityFilesProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Files posted with this update">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.mimeType.startsWith("image/") ? undefined : attachment.fileName}
            className="flex max-w-56 items-center gap-2 rounded-md border bg-muted/40 p-1 pr-2 text-xs hover:bg-muted"
            title={`${attachment.fileName} (${formatFileSize(attachment.sizeBytes)})`}
          >
            {attachment.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element -- a signed Storage URL or local object URL
              <img src={attachment.url} alt={attachment.fileName} className="size-12 shrink-0 rounded object-cover" />
            ) : (
              <FileText aria-hidden className="ml-1 size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{attachment.fileName}</span>
              <span className="text-muted-foreground">{formatFileSize(attachment.sizeBytes)}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
