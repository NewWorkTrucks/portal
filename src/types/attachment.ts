/** A file attached to a Kanban card as work or evidence (E1-4). */
export type KanbanAttachment = {
  id: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedByName: string;
  uploadedAt: string;
  /** Where to download it. A local object URL until Supabase Storage is connected. */
  url: string;
};
