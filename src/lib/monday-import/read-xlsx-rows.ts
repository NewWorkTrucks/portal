import { MAX_MONDAY_UNCOMPRESSED_BYTES } from "@/constants/monday-import";

const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;
const END_OF_CENTRAL_DIRECTORY_SIZE = 22;
const MAX_ZIP_COMMENT_SIZE = 65535;
const STORED_COMPRESSION = 0;
const DEFLATE_COMPRESSION = 8;
const FIRST_WORKSHEET_PATTERN = /^xl\/worksheets\/[^/]+\.xml$/;
const INVALID_FILE_MESSAGE = "This isn't a readable .xlsx file.";

type ZipEntry = {
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

function findEndOfCentralDirectory(zipView: DataView): number {
  const earliestOffset = Math.max(0, zipView.byteLength - END_OF_CENTRAL_DIRECTORY_SIZE - MAX_ZIP_COMMENT_SIZE);
  for (let offset = zipView.byteLength - END_OF_CENTRAL_DIRECTORY_SIZE; offset >= earliestOffset; offset -= 1) {
    if (zipView.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }
  throw new Error(INVALID_FILE_MESSAGE);
}

function readZipEntries(zipBuffer: ArrayBuffer): Map<string, ZipEntry> {
  const zipView = new DataView(zipBuffer);
  const endOffset = findEndOfCentralDirectory(zipView);
  const entryCount = zipView.getUint16(endOffset + 10, true);
  const textDecoder = new TextDecoder();
  const zipEntries = new Map<string, ZipEntry>();
  let entryOffset = zipView.getUint32(endOffset + 16, true);

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (zipView.getUint32(entryOffset, true) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error(INVALID_FILE_MESSAGE);
    }
    const fileNameLength = zipView.getUint16(entryOffset + 28, true);
    const extraLength = zipView.getUint16(entryOffset + 30, true);
    const commentLength = zipView.getUint16(entryOffset + 32, true);
    const fileName = textDecoder.decode(new Uint8Array(zipBuffer, entryOffset + 46, fileNameLength));
    zipEntries.set(fileName, {
      compressionMethod: zipView.getUint16(entryOffset + 10, true),
      compressedSize: zipView.getUint32(entryOffset + 20, true),
      uncompressedSize: zipView.getUint32(entryOffset + 24, true),
      localHeaderOffset: zipView.getUint32(entryOffset + 42, true),
    });
    entryOffset += 46 + fileNameLength + extraLength + commentLength;
  }
  return zipEntries;
}

async function readZipText(zipBuffer: ArrayBuffer, zipEntry: ZipEntry): Promise<string> {
  if (zipEntry.uncompressedSize > MAX_MONDAY_UNCOMPRESSED_BYTES) {
    throw new Error("This spreadsheet is too large to import.");
  }
  const zipView = new DataView(zipBuffer);
  const headerOffset = zipEntry.localHeaderOffset;
  if (zipView.getUint32(headerOffset, true) !== LOCAL_FILE_SIGNATURE) {
    throw new Error(INVALID_FILE_MESSAGE);
  }
  const dataOffset = headerOffset + 30 + zipView.getUint16(headerOffset + 26, true) + zipView.getUint16(headerOffset + 28, true);
  const compressedBytes = new Uint8Array(zipBuffer, dataOffset, zipEntry.compressedSize);

  if (zipEntry.compressionMethod === STORED_COMPRESSION) {
    return new TextDecoder().decode(compressedBytes);
  }
  if (zipEntry.compressionMethod !== DEFLATE_COMPRESSION) {
    throw new Error(INVALID_FILE_MESSAGE);
  }
  const inflatedStream = new Blob([compressedBytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const inflatedText = await new Response(inflatedStream).text();
  if (inflatedText.length > MAX_MONDAY_UNCOMPRESSED_BYTES) {
    throw new Error("This spreadsheet is too large to import.");
  }
  return inflatedText;
}

function parseXml(xmlText: string): Document {
  const xmlDocument = new DOMParser().parseFromString(xmlText, "application/xml");
  if (xmlDocument.getElementsByTagName("parsererror").length > 0) {
    throw new Error(INVALID_FILE_MESSAGE);
  }
  return xmlDocument;
}

function getColumnIndex(cellReference: string): number {
  const columnLetters = cellReference.match(/^[A-Z]+/)?.[0] ?? "";
  return [...columnLetters].reduce((columnNumber, letter) => columnNumber * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function getTextContent(parentElement: Element): string {
  return Array.from(parentElement.getElementsByTagNameNS("*", "t"))
    .map((textElement) => textElement.textContent ?? "")
    .join("");
}

function getCellValue(cellElement: Element, sharedStrings: string[]): string {
  const cellType = cellElement.getAttribute("t");
  if (cellType === "inlineStr") {
    return getTextContent(cellElement).trim();
  }
  const rawValue = cellElement.getElementsByTagNameNS("*", "v")[0]?.textContent ?? "";
  return (cellType === "s" ? (sharedStrings[Number(rawValue)] ?? "") : rawValue).trim();
}

/** Reads the first worksheet as rows of text, using the browser's own unzip and XML parsers. */
export async function readXlsxRows(xlsxFile: File): Promise<string[][]> {
  const zipBuffer = await xlsxFile.arrayBuffer();
  let zipEntries: Map<string, ZipEntry>;
  try {
    zipEntries = readZipEntries(zipBuffer);
  } catch {
    throw new Error(INVALID_FILE_MESSAGE);
  }

  const worksheetPath = [...zipEntries.keys()].filter((path) => FIRST_WORKSHEET_PATTERN.test(path)).sort()[0];
  if (!worksheetPath) {
    throw new Error(INVALID_FILE_MESSAGE);
  }

  const sharedStringsEntry = zipEntries.get("xl/sharedStrings.xml");
  const sharedStrings = sharedStringsEntry
    ? Array.from(parseXml(await readZipText(zipBuffer, sharedStringsEntry)).getElementsByTagNameNS("*", "si")).map(getTextContent)
    : [];
  const worksheetDocument = parseXml(await readZipText(zipBuffer, zipEntries.get(worksheetPath) as ZipEntry));

  return Array.from(worksheetDocument.getElementsByTagNameNS("*", "row")).map((rowElement) => {
    const rowValues: string[] = [];
    for (const cellElement of Array.from(rowElement.getElementsByTagNameNS("*", "c"))) {
      rowValues[getColumnIndex(cellElement.getAttribute("r") ?? "A")] = getCellValue(cellElement, sharedStrings);
    }
    return Array.from(rowValues, (cellValue) => cellValue ?? "");
  });
}
