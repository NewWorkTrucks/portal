import {
  MAX_MONDAY_IMPORT_ITEMS,
  MONDAY_STATUS_TO_KANBAN_STATUS,
  MONDAY_STATUSES_NEEDING_DETAILS,
} from "@/constants/monday-import";
import type {
  MondayBoard,
  MondayBoardItem,
  MondayImportFormValues,
  MondayImportRequestItem,
  MondayImportStatus,
} from "@/types/monday-import";
import type { TeamMember } from "@/types/team";

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MILLISECONDS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EXCEL_SERIAL_PATTERN = /^\d{4,6}(\.\d+)?$/;

type ColumnIndexes = {
  person: number;
  status: number;
  date: number;
};

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getFilledCellCount(row: string[]): number {
  return row.filter(Boolean).length;
}

function isItemHeaderRow(row: string[]): boolean {
  return row[0] === "Name" && row.includes("Status");
}

function isSubitemHeaderRow(row: string[]): boolean {
  return row[0] === "Subitems" && row[1] === "Name";
}

function getColumnIndexes(headerRow: string[]): ColumnIndexes {
  const person = headerRow.findIndex((header) => header === "Person" || header === "Owner");
  const status = headerRow.indexOf("Status");
  const date = headerRow.indexOf("Date");
  if (person < 0 || status < 0) {
    throw new Error("This doesn't look like a Monday board export: the Person and Status columns are missing.");
  }
  return { person, status, date };
}

function parsePeopleNames(peopleCell: string | undefined): string[] {
  return (peopleCell ?? "")
    .split(",")
    .map((personName) => personName.trim())
    .filter(Boolean);
}

function parseMondayDate(dateCell: string | undefined): string | null {
  const dateText = dateCell?.trim() ?? "";
  if (ISO_DATE_PATTERN.test(dateText)) {
    return dateText;
  }
  if (EXCEL_SERIAL_PATTERN.test(dateText)) {
    return new Date(EXCEL_EPOCH_UTC + Math.floor(Number(dateText)) * MILLISECONDS_PER_DAY).toISOString().slice(0, 10);
  }
  return null;
}

function mapMondayStatus(mondayStatus: string): { status: MondayImportStatus; isStatusAdjusted: boolean } {
  const normalizedStatus = normalizeText(mondayStatus);
  const mappedStatus = MONDAY_STATUS_TO_KANBAN_STATUS[normalizedStatus];
  if (mappedStatus) {
    return { status: mappedStatus, isStatusAdjusted: false };
  }
  return {
    status: MONDAY_STATUSES_NEEDING_DETAILS.includes(normalizedStatus) ? "working-on-it" : "not-started",
    isStatusAdjusted: true,
  };
}

/** Reads Monday's export layout: board title, group rows, item tables and nested subitem tables. */
export function parseMondayBoard(rows: string[][]): MondayBoard {
  const firstHeaderIndex = rows.findIndex(isItemHeaderRow);
  if (firstHeaderIndex < 0) {
    throw new Error("This doesn't look like a Monday board export: no item table was found.");
  }

  const items: MondayBoardItem[] = [];
  const importKeyCounts = new Map<string, number>();
  let groupName = rows[firstHeaderIndex - 1]?.[0] || "Board";
  let itemColumns = getColumnIndexes(rows[firstHeaderIndex]);
  let subitemColumns: ColumnIndexes | null = null;
  let parentItem: MondayBoardItem | null = null;

  function addItem(title: string, row: string[], columns: ColumnIndexes, parent: MondayBoardItem | null) {
    const baseKey = [groupName, parent?.title, title]
      .filter((keyPart): keyPart is string => Boolean(keyPart))
      .map((keyPart) => normalizeText(keyPart))
      .join("/");
    const keyOccurrence = (importKeyCounts.get(baseKey) ?? 0) + 1;
    importKeyCounts.set(baseKey, keyOccurrence);
    const mondayStatus = row[columns.status] ?? "";
    const ownPeopleNames = parsePeopleNames(row[columns.person]);
    const boardItem: MondayBoardItem = {
      importKey: keyOccurrence === 1 ? baseKey : `${baseKey}#${keyOccurrence}`,
      title,
      groupName,
      parentTitle: parent?.title ?? null,
      peopleNames: ownPeopleNames.length > 0 ? ownPeopleNames : (parent?.peopleNames ?? []),
      mondayStatus,
      ...mapMondayStatus(mondayStatus),
      dueDate: columns.date >= 0 ? parseMondayDate(row[columns.date]) : null,
    };
    items.push(boardItem);
    return boardItem;
  }

  for (let rowIndex = firstHeaderIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const nextRow = rows[rowIndex + 1];

    if (isItemHeaderRow(row)) {
      itemColumns = getColumnIndexes(row);
      subitemColumns = null;
      parentItem = null;
    } else if (isSubitemHeaderRow(row)) {
      subitemColumns = getColumnIndexes(row);
    } else if (row[0] && getFilledCellCount(row) === 1 && nextRow && isItemHeaderRow(nextRow)) {
      groupName = row[0];
    } else if (row[0]) {
      subitemColumns = null;
      parentItem = addItem(row[0], row, itemColumns, null);
    } else if (subitemColumns && parentItem && row[1]) {
      addItem(row[1], row, subitemColumns, parentItem);
    }
  }

  if (items.length === 0) {
    throw new Error("No cards were found in this file.");
  }
  if (items.length > MAX_MONDAY_IMPORT_ITEMS) {
    throw new Error(`Import up to ${MAX_MONDAY_IMPORT_ITEMS.toLocaleString()} cards at a time.`);
  }
  return { boardName: rows[0]?.[0] || "Monday board", items };
}

export function formatCardCount(cardCount: number): string {
  return `${cardCount.toLocaleString()} ${cardCount === 1 ? "card" : "cards"}`;
}

/** The first person on the item who has a portal account in this business. */
export function findMondayItemOwner(boardItem: MondayBoardItem, businessMembers: TeamMember[]): TeamMember | null {
  for (const personName of boardItem.peopleNames) {
    const matchingMember = businessMembers.find((teamMember) => normalizeText(teamMember.name) === normalizeText(personName));
    if (matchingMember) {
      return matchingMember;
    }
  }
  return null;
}

export function getUnmatchedMondayPeople(items: MondayBoardItem[], businessMembers: TeamMember[]): string[] {
  const memberNames = new Set(businessMembers.map((teamMember) => normalizeText(teamMember.name)));
  const unmatchedPeople = new Set(
    items.flatMap((boardItem) => boardItem.peopleNames).filter((personName) => !memberNames.has(normalizeText(personName))),
  );
  return [...unmatchedPeople].sort((firstName, secondName) => firstName.localeCompare(secondName));
}

function buildImportedDescription(boardItem: MondayBoardItem): string {
  return [
    `Imported from Monday.com · ${boardItem.groupName}`,
    boardItem.parentTitle && `Subitem of: ${boardItem.parentTitle}`,
    boardItem.peopleNames.length > 0 && `Monday people: ${boardItem.peopleNames.join(", ")}`,
    boardItem.isStatusAdjusted && `Monday status: ${boardItem.mondayStatus}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildMondayImportRequest(
  items: MondayBoardItem[],
  businessMembers: TeamMember[],
  formValues: MondayImportFormValues,
): MondayImportRequestItem[] {
  return items.map((boardItem) => ({
    importKey: boardItem.importKey,
    title: boardItem.title,
    description: buildImportedDescription(boardItem),
    status: boardItem.status,
    ownerId: findMondayItemOwner(boardItem, businessMembers)?.id ?? formValues.fallbackOwnerId,
    dueDate: boardItem.dueDate,
    reviewerId: boardItem.status === "needs-review" ? formValues.reviewerId : null,
    revisitDate: boardItem.status === "deferred" ? formValues.revisitDate : null,
  }));
}
