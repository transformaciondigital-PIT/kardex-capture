import type { CatalogItem, MovementClass } from "./types";

/** Catálogo de materiales (mock). Sustituye con tu API cuando conectes. */
export const MATERIALS: CatalogItem[] = [
  { code: "1004D", desc: "Queso Domino's", um: "LB" },
  { code: "1003P", desc: "Pepperoni", um: "LB" },
  { code: "4002D", desc: "Condimento Guajillo", um: "LB" },
];

/** Centros/almacenes (mock) */
export const CENTROS = ["0014", "0015", "0016"];
export const ALMACENES = ["0001", "0002", "0003", "0004"];
export const MONEDAS = ["GTQ", "USD"];

/** Clases de movimiento (tu lista) */
export const MOVEMENT_CLASSES: MovementClass[] = [
  { code: 101, desc: "Compras", grupo: "Entrada", requiresVendor: true },
  { code: 102, desc: "Anulación compras", grupo: "Entrada_Reversa", requiresVendor: true },
  { code: 161, desc: "NC", grupo: "Entrada", requiresVendor: true },
  { code: 162, desc: "Anulaciones NC", grupo: "Entrada_Reversa", requiresVendor: true },

  { code: 201, desc: "Cargas a Centro de costo", grupo: "Cargo_CentroCosto" },
  { code: 202, desc: "Anulación cargas a centro de costo", grupo: "Cargo_CentroCosto_Reversa" },

  { code: 251, desc: "Consumo de venta tienda", grupo: "Salida" },
  { code: 252, desc: "Anulación consumo de venta tienda", grupo: "Salida_Reversa" },

  { code: 261, desc: "Mov a orden CO", grupo: "Salida" },
  { code: 262, desc: "Consumo de producción de planta", grupo: "Salida" },
  { code: 263, desc: "Anulación consumo de producción planta", grupo: "Salida_Reversa" },

  { code: 301, desc: "Traslado entre almacenes (a un paso)", grupo: "Traslado", requiresDestination: true },
  { code: 302, desc: "Anulación traslado entre almacenes", grupo: "Traslado_Reversa", requiresDestination: true },
  { code: 303, desc: "Traslado entre almacenes (a dos pasos)", grupo: "Traslado", requiresDestination: true },
  { code: 304, desc: "Anulación traslado entre centros", grupo: "Traslado_Reversa", requiresDestination: true },
  { code: 305, desc: "Confirmación traslados estadísticas", grupo: "Traslado", requiresDestination: true },

  { code: 311, desc: "Traslado entre almacenes (a un paso)", grupo: "Traslado", requiresDestination: true },
  { code: 312, desc: "Anulación traslado entre almacenes", grupo: "Traslado_Reversa", requiresDestination: true },
  { code: 313, desc: "Traslado entre almacenes (a dos pasos)", grupo: "Traslado", requiresDestination: true },
  { code: 314, desc: "Anulación traslado entre centros", grupo: "Traslado_Reversa", requiresDestination: true },
  { code: 315, desc: "Movimiento entre almacenes planta", grupo: "Traslado", requiresDestination: true },

  { code: 601, desc: "Facturación directa", grupo: "Salida" },
  { code: 602, desc: "Anulación factura directa", grupo: "Salida_Reversa" },

  { code: 641, desc: "Traslados entre bodega y tienda", grupo: "Traslado", requiresDestination: true },
  { code: 642, desc: "Anulación traslados bodega y tienda", grupo: "Traslado_Reversa", requiresDestination: true },

  { code: 701, desc: "Ajuste de inventario", grupo: "Ajuste" },
  { code: 702, desc: "Anulación ajuste de inventario", grupo: "Ajuste_Reversa" },

  { code: 531, desc: "Creación de orden de fabricación", grupo: "Entrada" },
  { code: 532, desc: "Anulación orden de fabricación", grupo: "Entrada_Reversa" },
];
