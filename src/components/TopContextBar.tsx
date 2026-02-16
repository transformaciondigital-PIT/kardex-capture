import { useRef, useState } from "react";
import { ALMACENES, CENTROS, MATERIALS, MONEDAS } from "../catalogs";
import type { CsvImportMode } from "../csvImport";
import type { ContextState } from "../types";

type Props = {
  context: ContextState;
  onChange: (patch: Partial<ContextState>) => void;
  onClearQueue: () => void;
  onImportCsv: (file: File, mode: CsvImportMode) => Promise<void>;
  importMessage: string;
  isImporting: boolean;
};

export default function TopContextBar({
  context,
  onChange,
  onClearQueue,
  onImportCsv,
  importMessage,
  isImporting,
}: Props) {
  const selectedMat = MATERIALS.find((m) => m.code === context.material);
  const isContextReady = Boolean(context.centro && context.almacen && context.material);
  const [importMode, setImportMode] = useState<CsvImportMode>("append");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const triggerImport = (mode: CsvImportMode) => {
    if (isImporting) return;
    setImportMode(mode);
    fileRef.current?.click();
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="title-row">
          <div className="title">Kardex — Captura de Movimientos</div>
          <span className={`context-badge ${isContextReady ? "ok" : "warn"}`}>
            {isContextReady ? "Contexto listo" : "Contexto incompleto"}
          </span>
        </div>
        <div className="subtitle">Fase 1 · En espera de ingresar datos</div>
        {importMessage && <div className="import-message">{importMessage}</div>}
      </div>

      <div className="topbar-controls">
        <div className="field">
          <label>Centro</label>
          <select value={context.centro} onChange={(e) => onChange({ centro: e.target.value })}>
            <option value="">Seleccionar...</option>
            {CENTROS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Almacén</label>
          <select value={context.almacen} onChange={(e) => onChange({ almacen: e.target.value })}>
            <option value="">Seleccionar...</option>
            {ALMACENES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Material</label>
          <select
            value={context.material}
            onChange={(e) => {
              const code = e.target.value;
              const mat = MATERIALS.find((m) => m.code === code);
              onChange({
                material: code,
                matDesc: mat?.desc ?? "",
                um: mat?.um ?? "",
              });
            }}
          >
            <option value="">Seleccionar...</option>
            {MATERIALS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.code} — {m.desc}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>UMB</label>
          <input value={selectedMat?.um ?? context.um ?? ""} readOnly />
        </div>

        <div className="field">
          <label>Moneda</label>
          <select value={context.monedaDefault} onChange={(e) => onChange({ monedaDefault: e.target.value })}>
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="import-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden-input"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await onImportCsv(file, importMode);
              e.currentTarget.value = "";
            }}
          />

          <button className="btn btn-primary" onClick={() => triggerImport("append")} disabled={isImporting}>
            {isImporting ? "Cargando..." : "Cargar CSV"}
          </button>
          <button className="btn btn-ghost" onClick={() => triggerImport("replace")} disabled={isImporting}>
            Reemplazar por CSV
          </button>
          <button className="btn btn-ghost" onClick={onClearQueue} title="Limpia bandeja y borradores">
            Limpiar bandeja
          </button>
        </div>
      </div>
    </div>
  );
}
