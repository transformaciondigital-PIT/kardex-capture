export type GrupoKardex =
  | "Entrada"
  | "Entrada_Reversa"
  | "Salida"
  | "Salida_Reversa"
  | "Traslado"
  | "Traslado_Reversa"
  | "Ajuste"
  | "Ajuste_Reversa"
  | "Cargo_CentroCosto"
  | "Cargo_CentroCosto_Reversa"
  | "Otros";

export type MovementStatus = "draft" | "ready" | "error";

export type ContextState = {
  centro: string;
  almacen: string;
  material: string;
  matDesc: string;
  um: string;
  monedaDefault: string;
};

export type MovementClass = {
  code: number;
  desc: string;
  grupo: GrupoKardex;
  requiresVendor?: boolean;
  requiresDestination?: boolean; // traslados
};

export type MovementDraft = {
  id: string;

  // Movimiento
  claseMov: number | null;
  claseMovDesc: string;
  grupoKardex: GrupoKardex;
  fechaConta: string; // yyyy-mm-dd
  noDocumentoMat: string;
  noPedido: string;

  // Contexto / dims
  material: string;
  matDesc: string;
  centro: string;
  almacen: string;

  // Destino (traslados)
  centroDestino: string;
  almacenDestino: string;

  // Cantidades
  cantidad: string; // input
  um: string;
  valor: string; // input
  moneda: string;

  // Trazabilidad
  lote: string;
  fechaFab: string; // yyyy-mm-dd
  sgtxt: string;

  // Proveedor
  lifnr: string;
  proveedorDesc: string;

  status: MovementStatus;
  errors: Record<string, string>;
};

export type CatalogItem = { code: string; desc: string; um: string };
