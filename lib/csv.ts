/** CSV que Excel abre bien en español: BOM, comas y comillas escapadas. */
export function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvResponse(header: string[], rows: unknown[][], filename: string): Response {
  const lines = rows.map((r) => r.map(cell).join(","));
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n") + "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
