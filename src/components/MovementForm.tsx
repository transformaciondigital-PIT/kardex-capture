import React, { useMemo } from "react";
import { ALMACENES, CENTROS, MOVEMENT_CLASSES } from "../catalogs";
import { ContextState, MovementDraft } from "../types";
import { clampNumberString, findClass, validateMovement, computeStatus, createEmptyDraft } from "../utils";

type Props = {
  context: ContextState;
  draft: MovementDraft;
  setDraft: (d: MovementDraft) => void;

  onAddToQueue: (m: MovementDraft) => void;
  onUpdateQueue: (m: MovementDraft) => void;

  editingId: string | null; // si no null, actualiza esa fila
  onCancelEdit: () => void;
};

export default function MovementForm({
  context,
  draft,
  setDraft,
  onAddToQueue,
  onUpdateQueue,
  editingId,
  onCancelEdit,
}: Props) {
  const cls = useMemo(() => findClass(draft.claseMov), [draft.claseMov]);

  // Sincroniza contexto a draft (cuando ya hay selección)
  const canWork = Boolean(context.material && context.centro && context.almacen);

  const patch = (p: Partial<MovementDraft>) => setDraft({ ...draft, ...p });

  const applyClass = (code: number | null) => {
    const c = findClass(code);
    patch({
      claseMov: code,
      claseMovDesc: c?.desc ?? "",
      grupoKardex: c?.grupo ?? "Otros",
      // reset destino si no aplica
      centroDestino: c?.requiresDestination ? draft.centroDestino : "",
      almacenDestino: c?.requiresDestination ? draft.almacenDestino : "",
      // reset proveedor si no aplica
      lifnr: c?.requiresVendor ? draft.lifnr : "",
      proveedorDesc: c?.requiresVendor ? draft.proveedorDesc : "",
    });
  };

  const syncFromContext = () => {
    patch({
      material: context.material,
      matDesc: context.matDesc,
      centro: context.centro,
      almacen: context.almacen,
      um: context.um,
      moneda: context.monedaDefault,
    });
  };

  const handleValidateAndStore = (mode: "add" | "update") => {
    // asegura contexto dentro del draft
    const merged: MovementDraft = {
      ...draft,
      material: context.material,
      matDesc: context.matDesc,
      centro: context.centro,
      almacen: context.almacen,
      um: context.um,
      moneda: draft.moneda || context.monedaDefault,
    };

    const errors = validateMovement(merged);
    const status = computeStatus(errors);

    const finalM: MovementDraft = {
      ...merged,
      errors,
      status,
    };

    if (mode === "add") {
      onAddToQueue(finalM);
      // nuevo draft limpio pero conserva contexto
      const next = createEmptyDraft();
      setDraft({
        ...next,
        material: context.material,
        matDesc: context.matDesc,
        centro: context.centro,
        almacen: context.almacen,
        um: context.um,
        moneda: context.monedaDefault,
      });
    } else {
      onUpdateQueue(finalM);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">{editingId ? "Editar movimiento" : "Nuevo movimiento"}</div>
        <div className="panel-actions">
          <button className="btn btn-ghost" onClick={syncFromContext} disabled={!canWork}>
            Cargar contexto
          </button>
          {editingId && (
            <button className="btn btn-ghost" onClick={onCancelEdit}>
              Cancelar edición
            </button>
          )}
        </div>
      </div>

      {!canWork && (
        <div className="empty-hint">
          Selecciona <b>Centro</b>, <b>Almacén</b> y <b>Material</b> para comenzar.
        </div>
      )}

      <div className="form-grid">
        {/* Movimiento */}
        <div className="section">
          <div className="section-title">Movimiento</div>

          <div className="field">
            <label>Clase movimiento *</label>
            <select
              value={draft.claseMov ?? ""}
              onChange={(e) => applyClass(e.target.value ? Number(e.target.value) : null)}
              disabled={!canWork}
            >
              <option value="">Seleccionar...</option>
              {MOVEMENT_CLASSES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.desc}
                </option>
              ))}
            </select>
            {draft.errors.claseMov && <div className="error">{draft.errors.claseMov}</div>}
          </div>

          <div className="field">
            <label>Grupo</label>
            <input value={draft.grupoKardex} readOnly />
          </div>

          <div className="field">
            <label>Fecha contable *</label>
            <input
              type="date"
              value={draft.fechaConta}
              onChange={(e) => patch({ fechaConta: e.target.value })}
              disabled={!canWork}
            />
            {draft.errors.fechaConta && <div className="error">{draft.errors.fechaConta}</div>}
          </div>

          <div className="field">
            <label>No. documento material</label>
            <input
              value={draft.noDocumentoMat}
              onChange={(e) => patch({ noDocumentoMat: e.target.value })}
              placeholder="Ej: 4917406604"
              disabled={!canWork}
            />
          </div>

          <div className="field">
            <label>No. pedido</label>
            <input
              value={draft.noPedido}
              onChange={(e) => patch({ noPedido: e.target.value })}
              placeholder="Ej: 4500xxxxx"
              disabled={!canWork}
            />
          </div>
        </div>

        {/* Cantidades */}
        <div className="section">
          <div className="section-title">Cantidades</div>

          <div className="field">
            <label>Cantidad *</label>
            <input
              value={draft.cantidad}
              onChange={(e) => patch({ cantidad: clampNumberString(e.target.value, true) })}
              placeholder="Ej: 10.5"
              disabled={!canWork}
            />
            {draft.errors.cantidad && <div className="error">{draft.errors.cantidad}</div>}
          </div>

          <div className="field">
            <label>UM</label>
            <input value={context.um || draft.um} readOnly />
          </div>

          <div className="field">
            <label>Valor</label>
            <input
              value={draft.valor}
              onChange={(e) => patch({ valor: clampNumberString(e.target.value, true) })}
              placeholder="Ej: 23020.20"
              disabled={!canWork}
            />
            {draft.errors.valor && <div className="error">{draft.errors.valor}</div>}
          </div>

          <div className="field">
            <label>Moneda</label>
            <input value={draft.moneda || context.monedaDefault} readOnly />
          </div>
        </div>

        {/* Traslado destino (condicional) */}
        {cls?.requiresDestination && (
          <div className="section">
            <div className="section-title">Destino (traslado)</div>

            <div className="field">
              <label>Centro destino *</label>
              <select
                value={draft.centroDestino}
                onChange={(e) => patch({ centroDestino: e.target.value })}
                disabled={!canWork}
              >
                <option value="">Seleccionar...</option>
                {CENTROS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {draft.errors.centroDestino && <div className="error">{draft.errors.centroDestino}</div>}
            </div>

            <div className="field">
              <label>Almacén destino *</label>
              <select
                value={draft.almacenDestino}
                onChange={(e) => patch({ almacenDestino: e.target.value })}
                disabled={!canWork}
              >
                <option value="">Seleccionar...</option>
                {ALMACENES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              {draft.errors.almacenDestino && <div className="error">{draft.errors.almacenDestino}</div>}
            </div>
          </div>
        )}

        {/* Trazabilidad */}
        <div className="section">
          <div className="section-title">Trazabilidad</div>

          <div className="field">
            <label>Lote</label>
            <input
              value={draft.lote}
              onChange={(e) => patch({ lote: e.target.value })}
              disabled={!canWork}
            />
          </div>

          <div className="field">
            <label>Fecha fabricación</label>
            <input
              type="date"
              value={draft.fechaFab}
              onChange={(e) => patch({ fechaFab: e.target.value })}
              disabled={!canWork}
            />
          </div>

          <div className="field field-span-2">
            <label>Texto (SGTXT)</label>
            <textarea
              value={draft.sgtxt}
              onChange={(e) => patch({ sgtxt: e.target.value })}
              rows={3}
              disabled={!canWork}
            />
          </div>
        </div>

        {/* Proveedor (condicional) */}
        {cls?.requiresVendor && (
          <div className="section">
            <div className="section-title">Proveedor</div>

            <div className="field">
              <label>LIFNR *</label>
              <input
                value={draft.lifnr}
                onChange={(e) => patch({ lifnr: e.target.value })}
                placeholder="Ej: 0000123456"
                disabled={!canWork}
              />
              {draft.errors.lifnr && <div className="error">{draft.errors.lifnr}</div>}
            </div>

            <div className="field">
              <label>Proveedor (desc)</label>
              <input
                value={draft.proveedorDesc}
                onChange={(e) => patch({ proveedorDesc: e.target.value })}
                disabled={!canWork}
              />
            </div>
          </div>
        )}
      </div>

      <div className="form-footer">
        {!editingId ? (
          <button
            className="btn btn-primary"
            onClick={() => handleValidateAndStore("add")}
            disabled={!canWork}
          >
            Agregar a bandeja
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => handleValidateAndStore("update")}
            disabled={!canWork}
          >
            Guardar cambios
          </button>
        )}

        <div className="hint">
          Estado: <b>{draft.status}</b> {draft.claseMov ? `— ${draft.claseMov} ${draft.claseMovDesc}` : ""}
        </div>
      </div>
    </div>
  );
}
