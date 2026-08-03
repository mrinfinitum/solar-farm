import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import { TERM_SHEET_PATH } from "@/lib/project-data";

export function isTermSheetAvailable() {
  // Place the approved PDF at public/documents/cornerstone-solar-indicative-term-sheet.pdf.
  return existsSync(path.join(process.cwd(), "public", TERM_SHEET_PATH));
}
