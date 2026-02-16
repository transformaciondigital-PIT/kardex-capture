import { useEffect, useRef, useState } from "react";
import TopContextBar from "./components/TopContextBar";
import MovementForm from "./components/MovementForm";
import MovementQueueTable from "./components/MovementQueueTable";
import CaptureSummary from "./components/CaptureSummary";
import { parseKardexCsv, movementUniqueKey } from "./csvImport";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import type { ContextState, MovementDraft } from "./types";
import { createEmptyDraft, uid, validateMovement, computeStatus } from "./utils";

const LS_CONTEXT = "kardex_context_v1";
const LS_QUEUE = "kardex_queue_v1";
const DEFAULT_CSV_PATH = "/data/mb51.csv";

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
  const [importMessage, setImportMessage] = useState("");

  const createDraftFromContext = (): MovementDraft => {
    const empty = createEmptyDraft();
    return {
      ...empty,
      material: context.material,
      matDesc: context.matDesc,
      centro: context.centro,
      almacen: context.almacen,
      um: context.um,
      moneda: context.monedaDefault,
    };
  };

  const [draft, setDraft] = useState<MovementDraft>(() => {
    return createDraftFromContext();
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const initialContextRef = useRef(context);

  const onContextChange = (patch: Partial<ContextState>) => {
    const next = { ...context, ...patch };
    setContext(next);

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

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(DEFAULT_CSV_PATH, { cache: "no-store" });
        if (!response.ok) {
          setImportMessage(`No se encontró ${DEFAULT_CSV_PATH}. Guarda ahí tu archivo CSV.`);
          return;
        }

        const text = await response.text();
        const parsed = parseKardexCsv(text, initialContextRef.current);

        if (parsed.errors.length > 0 && parsed.imported === 0) {
          setImportMessage(`Error de CSV (${DEFAULT_CSV_PATH}): ${parsed.errors[0]}`);
          return;
        }

        setQueue((prev) => {
          const merged = [...parsed.movements, ...prev];
          const deduped: MovementDraft[] = [];
          const seen = new Set<string>();

          for (const m of merged) {
            const key = movementUniqueKey(m);
            if (seen.has(key)) continue;
            seen.add(key);
            deduped.push(m);
          }

          return deduped;
        });

        const issues = parsed.errors.length > 0 ? ` Avisos: ${parsed.errors[0]}` : "";
        setImportMessage(
          `Cargado ${DEFAULT_CSV_PATH}: ${parsed.imported} fila(s), ${parsed.skipped} omitidas.${issues}`,
        );
      } catch {
        setImportMessage(`Error leyendo ${DEFAULT_CSV_PATH}. Verifica codificación UTF-8.`);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [setQueue]);

  const addToQueue = (m: MovementDraft) => {
    setQueue((prev) => [m, ...prev]);
  };

  const updateQueue = (m: MovementDraft) => {
    setQueue((prev) => prev.map((x) => (x.id === m.id ? m : x)));
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
    setDraft(createDraftFromContext());
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
    setQueue((prev) => [copy, ...prev]);
  };

  const onDelete = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
    if (editingId === id) onCancelEdit();
  };

  const onClearQueue = () => {
    setQueue([]);
    onCancelEdit();
    setImportMessage("Bandeja limpiada.");
  };

  const onSubmit = () => {
    const validated = queue.map((m) => {
      const errors = validateMovement(m);
      return { ...m, errors, status: computeStatus(errors) };
    });
    setQueue(validated);

    const hasErrors = validated.some((m) => m.status === "error");
    if (hasErrors) return;

    console.log("SUBMIT (mock)", validated);
    alert(`Registrado (mock): ${validated.length} movimiento(s). Revisa consola.`);
  };

  return (
    <div className="app">
      <TopContextBar
        context={context}
        onChange={onContextChange}
        onClearQueue={onClearQueue}
        importMessage={importMessage}
      />

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
