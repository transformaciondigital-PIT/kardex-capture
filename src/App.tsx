import React, { useMemo, useState } from "react";
import TopContextBar from "./components/TopContextBar";
import MovementForm from "./components/MovementForm";
import MovementQueueTable from "./components/MovementQueueTable";
import CaptureSummary from "./components/CaptureSummary";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { ContextState, MovementDraft } from "./types";
import { createEmptyDraft, uid, validateMovement, computeStatus } from "./utils";

const LS_CONTEXT = "kardex_context_v1";
const LS_QUEUE = "kardex_queue_v1";

export default function App() {
  const [context, setContext] = useLocalStorageState<ContextState>(LS_CONTEXT, {
    centro: "",
    almacen: "",
    material: "",
    matDesc: "",
    um: "",
    monedaDefault: "GTQ",
  });

  const [queue, setQueue] = useLocalStorageState<MovementDraft[]>(LS_QUEUE, []);
  const [draft, setDraft] = useState<MovementDraft>(() => {
    const d = createEmptyDraft();
    return {
      ...d,
      material: context.material,
      matDesc: context.matDesc,
      centro: context.centro,
      almacen: context.almacen,
      um: context.um,
      moneda: context.monedaDefault,
    };
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const onContextChange = (patch: Partial<ContextState>) => {
    const next = { ...context, ...patch };
    setContext(next);

    // si se cambia material/centro/almacen, sincroniza en draft (sin pisar campos de movimiento)
    setDraft((d) => ({
      ...d,
      material: next.material,
      matDesc: next.matDesc,
      centro: next.centro,
      almacen: next.almacen,
      um: next.um,
      moneda: next.monedaDefault,
    }));
  };

  const addToQueue = (m: MovementDraft) => {
    setQueue([m, ...queue]);
  };

  const updateQueue = (m: MovementDraft) => {
    setQueue(queue.map((x) => (x.id === m.id ? m : x)));
    setEditingId(null);
  };

  const onEdit = (id: string) => {
    const row = queue.find((q) => q.id === id);
    if (!row) return;
    setDraft(row);
    setEditingId(id);
  };

  const onCancelEdit = () => {
    setEditingId(null);
    // reset draft pero conserva contexto
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
  };

  const onDuplicate = (id: string) => {
    const row = queue.find((q) => q.id === id);
    if (!row) return;
    const copy: MovementDraft = {
      ...row,
      id: uid(),
      noDocumentoMat: "",
      status: "draft",
      errors: {},
    };
    setQueue([copy, ...queue]);
  };

  const onDelete = (id: string) => {
    setQueue(queue.filter((q) => q.id !== id));
    if (editingId === id) onCancelEdit();
  };

  const onClearQueue = () => {
    setQueue([]);
    onCancelEdit();
  };

  const onSubmit = () => {
    // Mock: solo valida todo y “registrar”
    const validated = queue.map((m) => {
      const errors = validateMovement(m);
      return { ...m, errors, status: computeStatus(errors) };
    });
    setQueue(validated);

    const hasErrors = validated.some((m) => m.status === "error");
    if (hasErrors) return;

    // Aquí conectarías tu API: POST /movimientos
    console.log("SUBMIT (mock)", validated);
    alert(`Registrado (mock): ${validated.length} movimiento(s). Revisa consola.`);

    // opcional: limpiar bandeja tras enviar
    // setQueue([]);
  };

  // Layout
  return (
    <div className="app">
      <TopContextBar context={context} onChange={onContextChange} onClearQueue={onClearQueue} />

      <div className="content">
        <div className="col-left">
          <MovementForm
            context={context}
            draft={draft}
            setDraft={setDraft}
            onAddToQueue={addToQueue}
            onUpdateQueue={updateQueue}
            editingId={editingId}
            onCancelEdit={onCancelEdit}
          />
        </div>

        <div className="col-right">
          <MovementQueueTable
            queue={queue}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      </div>

      <CaptureSummary queue={queue} onSubmit={onSubmit} />
    </div>
  );
}
