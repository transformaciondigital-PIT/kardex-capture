import type { MovementDraft } from "../types";

type Props = {
  queue: MovementDraft[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

function badgeClass(status: string) {
  if (status === "ready") return "badge badge-ok";
  if (status === "error") return "badge badge-err";
  return "badge badge-draft";
}

export default function MovementQueueTable({ queue, onEdit, onDuplicate, onDelete }: Props) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Bandeja de movimientos</div>
        <div className="panel-subtitle">{queue.length} registro(s)</div>
      </div>

      {queue.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No hay movimientos cargados</div>
          <div className="empty-text">Ingresa tu primer movimiento en el formulario.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Clase</th>
                <th>Descripción</th>
                <th>Grupo</th>
                <th>Material</th>
                <th>Centro</th>
                <th>Almacén</th>
                <th>Lote</th>
                <th className="num">Cantidad</th>
                <th>UM</th>
                <th className="num">Valor</th>
                <th>Moneda</th>
                <th>Documento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {queue.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className={badgeClass(m.status)}>{m.status}</span>
                    {m.status === "error" && (
                      <div className="row-errors" title="Errores">
                        {Object.values(m.errors).slice(0, 2).join(" | ")}
                        {Object.values(m.errors).length > 2 ? "..." : ""}
                      </div>
                    )}
                  </td>
                  <td>{m.fechaConta || "-"}</td>
                  <td>{m.claseMov ? `${m.claseMov}` : "-"}</td>
                  <td>{m.claseMovDesc || "-"}</td>
                  <td>{m.grupoKardex}</td>
                  <td title={m.matDesc}>{m.material || "-"}</td>
                  <td>{m.centro || "-"}</td>
                  <td>{m.almacen || "-"}</td>
                  <td>{m.lote || "-"}</td>
                  <td className="num">{m.cantidad || "-"}</td>
                  <td>{m.um || "-"}</td>
                  <td className="num">{m.valor || "-"}</td>
                  <td>{m.moneda || "-"}</td>
                  <td>{m.noDocumentoMat || "-"}</td>
                  <td className="actions">
                    <button className="btn btn-mini" onClick={() => onEdit(m.id)}>Editar</button>
                    <button className="btn btn-mini" onClick={() => onDuplicate(m.id)}>Duplicar</button>
                    <button className="btn btn-mini btn-danger" onClick={() => onDelete(m.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
