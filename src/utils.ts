import { MovementClass, MovementDraft } from "./types";
import { MOVEMENT_CLASSES } from "./catalogs";

export const uid = () => crypto.randomUUID();

export function getTodayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function findClass(code: number | null): MovementClass | null {
  if (!code) return null;
  return MOVEMENT_CLASSES.find((c) => c.code === code) ?? null;
}

export function clampNumberString(s: string, allowNegative = false) {
  // Permite decimales con punto. (Puedes adaptar a coma si deseas)
  const cleaned = s
    .replace(/[^\d\.\-]/g, "")
    .replace(/(?!^)-/g, "") // solo un '-' al inicio
    .replace(/(\..*)\./g, "$1"); // solo un punto

  if (!allowNegative && cleaned.startsWith("-")) return cleaned.slice(1);
  return cleaned;
}

export function validateMovement(m: MovementDraft) {
  const errors: Record<string, string> = {};

  // Contexto
  if (!m.material) errors.material = "Selecciona material.";
  if (!m.centro) errors.centro = "Selecciona centro.";
  if (!m.almacen) errors.almacen = "Selecciona almacén.";

  // Movimiento
  if (!m.claseMov) errors.claseMov = "Selecciona clase de movimiento.";
  if (!m.fechaConta) errors.fechaConta = "Selecciona fecha contable.";

  // Cantidad
  const qty = Number(m.cantidad);
  if (!m.cantidad) errors.cantidad = "Ingresa cantidad.";
  else if (Number.isNaN(qty)) errors.cantidad = "Cantidad inválida.";
  else if (qty === 0) errors.cantidad = "Cantidad no puede ser 0.";

  // Traslado destino
  const cls = findClass(m.claseMov);
  if (cls?.requiresDestination) {
    if (!m.centroDestino) errors.centroDestino = "Selecciona centro destino.";
    if (!m.almacenDestino) errors.almacenDestino = "Selecciona almacén destino.";
    // opcional: impedir mismo origen/destino
    if (
      m.centroDestino &&
      m.almacenDestino &&
      m.centroDestino === m.centro &&
      m.almacenDestino === m.almacen
    ) {
      errors.almacenDestino = "Destino no puede ser igual al origen.";
    }
  }

  // Proveedor si aplica
  if (cls?.requiresVendor) {
    if (!m.lifnr) errors.lifnr = "Ingresa LIFNR (proveedor).";
  }

  // Valor opcional, pero si lo ingresan debe ser numérico
  if (m.valor) {
    const v = Number(m.valor);
    if (Number.isNaN(v)) errors.valor = "Valor inválido.";
  }

  return errors;
}

export function computeStatus(errors: Record<string, string>): "ready" | "error" {
  return Object.keys(errors).length === 0 ? "ready" : "error";
}

export function createEmptyDraft(): MovementDraft {
  return {
    id: uid(),

    claseMov: null,
    claseMovDesc: "",
    grupoKardex: "Otros",
    fechaConta: getTodayISO(),
    noDocumentoMat: "",
    noPedido: "",

    material: "",
    matDesc: "",
    centro: "",
    almacen: "",

    centroDestino: "",
    almacenDestino: "",

    cantidad: "",
    um: "",
    valor: "",
    moneda: "GTQ",

    lote: "",
    fechaFab: "",
    sgtxt: "",

    lifnr: "",
    proveedorDesc: "",

    status: "draft",
    errors: {},
  };
}
