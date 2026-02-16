import type { ContextState, GrupoKardex, MovementDraft } from "./types";
import { computeStatus, createEmptyDraft, findClass, uid, validateMovement } from "./utils";

export type CsvImportMode = "append" | "replace";

export type CsvImportResult = {
  movements: MovementDraft[];
  imported: number;
  skipped: number;
  errors: string[];
};

const GRUPOS: GrupoKardex[] = [
  "Entrada",
  "Entrada_Reversa",
  "Salida",
  "Salida_Reversa",
  "Traslado",
  "Traslado_Reversa",
  "Ajuste",
  "Ajuste_Reversa",
  "Cargo_CentroCosto",
  "Cargo_CentroCosto_Reversa",
  "Otros",
];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_\-.]/g, "");
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

function detectDelimiter(header: string): string {
  const commas = (header.match(/,/g) || []).length;
  const semicolons = (header.match(/;/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

function normalizeDate(value: string): string {
  const raw = value.trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashFormat = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashFormat) {
    const [, d, m, y] = slashFormat;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseNumeric(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) return "";

  const normalized = cleaned.includes(",") && !cleaned.includes(".") ? cleaned.replace(",", ".") : cleaned;
  const number = Number(normalized);
  if (Number.isNaN(number)) return "";
  return String(Math.abs(number));
}

function mapHeaderIndexes(headers: string[]): Record<string, number> {
  const indexes: Record<string, number> = {};

  headers.forEach((header, index) => {
    indexes[normalizeHeader(header)] = index;
  });

  return indexes;
}

function hasAnyHeader(indexes: Record<string, number>, possibleHeaders: string[]): boolean {
  return possibleHeaders.some((header) => indexes[normalizeHeader(header)] !== undefined);
}

function getCell(cells: string[], indexes: Record<string, number>, ...possibleHeaders: string[]): string {
  for (const header of possibleHeaders) {
    const idx = indexes[normalizeHeader(header)];
    if (idx !== undefined) return cells[idx]?.trim() ?? "";
  }
  return "";
}

function toGrupoKardex(value: string, fallback: GrupoKardex): GrupoKardex {
  return GRUPOS.includes(value as GrupoKardex) ? (value as GrupoKardex) : fallback;
}

export function parseKardexCsv(text: string, context: ContextState): CsvImportResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length <= 1) {
    return { movements: [], imported: 0, skipped: 0, errors: ["El CSV no contiene filas de datos."] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const indexes = mapHeaderIndexes(headers);

  const required: Array<{ label: string; aliases: string[] }> = [
    { label: "claseMov", aliases: ["claseMov"] },
    { label: "material", aliases: ["material"] },
    { label: "centro/centroLogistico", aliases: ["centro", "centroLogistico"] },
    { label: "almacen", aliases: ["almacen"] },
    { label: "cantidad", aliases: ["cantidad"] },
    { label: "fechaConta", aliases: ["fechaConta"] },
  ];

  const missing = required
    .filter((req) => !hasAnyHeader(indexes, req.aliases))
    .map((req) => req.label);
  if (missing.length > 0) {
    return {
      movements: [],
      imported: 0,
      skipped: 0,
      errors: [`Faltan columnas requeridas en CSV: ${missing.join(", ")}`],
    };
  }

  const movements: MovementDraft[] = [];
  const errors: string[] = [];

  for (let row = 1; row < lines.length; row += 1) {
    const lineNumber = row + 1;
    const cells = parseCsvLine(lines[row], delimiter);

    const claseMovRaw = getCell(cells, indexes, "claseMov");
    const claseMov = claseMovRaw ? Number(claseMovRaw) : null;

    if (!claseMov || Number.isNaN(claseMov)) {
      errors.push(`Fila ${lineNumber}: claseMov inválida.`);
      continue;
    }

    const cls = findClass(claseMov);
    const empty = createEmptyDraft();

    const mapped: MovementDraft = {
      ...empty,
      id: uid(),
      claseMov,
      claseMovDesc: getCell(cells, indexes, "claseMovDesc") || cls?.desc || "",
      grupoKardex: toGrupoKardex(getCell(cells, indexes, "grupoKardex"), cls?.grupo ?? "Otros"),
      fechaConta: normalizeDate(getCell(cells, indexes, "fechaConta")),
      noDocumentoMat: getCell(cells, indexes, "noDocumentoMat"),
      noPedido: getCell(cells, indexes, "noPedido"),
      material: getCell(cells, indexes, "material"),
      matDesc: getCell(cells, indexes, "matDesc"),
      centro: getCell(cells, indexes, "centro", "centroLogistico"),
      almacen: getCell(cells, indexes, "almacen"),
      centroDestino: getCell(cells, indexes, "centroDestino"),
      almacenDestino: getCell(cells, indexes, "almacenDestino"),
      cantidad: parseNumeric(getCell(cells, indexes, "cantidad")),
      um: getCell(cells, indexes, "um") || context.um,
      valor: parseNumeric(getCell(cells, indexes, "valor")),
      moneda: getCell(cells, indexes, "moneda") || context.monedaDefault,
      lote: getCell(cells, indexes, "lote"),
      fechaFab: normalizeDate(getCell(cells, indexes, "fechaFab")),
      sgtxt: getCell(cells, indexes, "sgtxt"),
      lifnr: getCell(cells, indexes, "lifnr"),
      proveedorDesc: getCell(cells, indexes, "proveedorDesc"),
    };

    const rowErrors = validateMovement(mapped);
    mapped.errors = rowErrors;
    mapped.status = computeStatus(rowErrors);
    movements.push(mapped);
  }

  return {
    movements,
    imported: movements.length,
    skipped: lines.length - 1 - movements.length,
    errors: errors.slice(0, 20),
  };
}

export function movementUniqueKey(m: MovementDraft): string {
  return [m.noDocumentoMat, m.claseMov, m.material, m.fechaConta, m.cantidad, m.valor, m.lote].join("|");
}
