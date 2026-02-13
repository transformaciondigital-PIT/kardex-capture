import React, { useMemo } from "react";
import { MovementDraft } from "../types";

type Props = {
  queue: MovementDraft[];
  onSubmit: () => void;
};

export default function CaptureSummary({ queue, onSubmit }: Props) {
  const { count, totalQty, totalVal, errorsCount, readyCount } = useMemo(() => {
    const qty = queue.reduce((acc, m) => acc + (Number(m.cantidad) || 0), 0);
    const val = queue.reduce((acc, m) => acc + (Number(m.valor) || 0), 0);
    const err = queue.filter((m) => m.status === "error").length;
    const ok = queue.filter((m) => m.status === "ready").length;
    return { count: queue.length, totalQty: qty, totalVal: val, errorsCount: err, readyCount: ok };
  }, [queue]);

  const canSubmit = count > 0 && errorsCount === 0;

  return (
    <div className="summary">
      <div className="card">
        <div className="card-k">Movimientos</div>
        <div className="card-v">{count}</div>
      </div>
      <div className="card">
        <div className="card-k">Listos</div>
        <div className="card-v">{readyCount}</div>
      </div>
      <div className="card">
        <div className="card-k">Con error</div>
        <div className="card-v">{errorsCount}</div>
      </div>
      <div className="card">
        <div className="card-k">Total cantidad</div>
        <div className="card-v">{totalQty.toFixed(3)}</div>
      </div>
      <div className="card">
        <div className="card-k">Total valor</div>
        <div className="card-v">{totalVal.toFixed(2)}</div>
      </div>

      <button className="btn btn-primary" onClick={onSubmit} disabled={!canSubmit}>
        Registrar (mock)
      </button>

      {!canSubmit && count > 0 && (
        <div className="summary-hint">
          Corrige los registros con estado <b>error</b> antes de registrar.
        </div>
      )}
    </div>
  );
}
