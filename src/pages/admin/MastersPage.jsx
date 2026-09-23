import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable } from "../../components/DataTable";
import { Banner } from "../../components/Banner";
import { Drawer } from "../../components/Drawer";
import { extractErrorMessage } from "../../api/client";
import { downloadBlob } from "../../api/endpoints";
import { MASTER_CONFIGS, MASTER_NAV_ORDER } from "./masterConfigs";
import { MasterForm } from "./MasterForm";
import { WeightsEditor } from "./WeightsEditor";
import { EmployeeProjectAllocationsEditor } from "./EmployeeProjectAllocationsEditor";

export function MastersPage() {
  const { masterType } = useParams();
  const config = MASTER_CONFIGS[masterType];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRow, setEditingRow] = useState(null); // null (drawer closed) | {} (new) | row (edit)
  const [busy, setBusy] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [csvResult, setCsvResult] = useState(null); // { created, updated, errors } from the last import
  const fileInputRef = useRef(null);

  const loadRows = () => {
    if (!config) return;
    setLoading(true);
    config.api
      .list(includeInactive)
      .then(({ data }) => setRows(data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setEditingRow(null);
    setCsvResult(null);
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterType, includeInactive]);

  const handleDownloadTemplate = async () => {
    setError("");
    try {
      const { data } = await config.api.downloadTemplate();
      downloadBlob(data, `${masterType}_template.csv`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-choosing the same file later
    if (!file) return;

    setError("");
    setCsvResult(null);
    setCsvBusy(true);
    try {
      const { data } = await config.api.importCsv(file);
      setCsvResult(data);
      loadRows();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCsvBusy(false);
    }
  };

  if (!config) {
    return (
      <div className="page">
        <h1>Unknown master: {masterType}</h1>
      </div>
    );
  }

  const handleSubmit = async (values) => {
    setError("");
    setBusy(true);
    try {
      if (editingRow?.id) {
        await config.api.update(editingRow.id, values);
      } else {
        await config.api.create(values);
      }
      setEditingRow(null);
      loadRows();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async (row) => {
    if (!confirm("Deactivate this record? It will be hidden from active lists but kept for history.")) {
      return;
    }
    setError("");
    try {
      await config.api.deactivate(row.id);
      loadRows();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="page masters-page">
      <nav className="masters-subnav">
        {MASTER_NAV_ORDER.map((key) => (
          <Link
            key={key}
            to={`/admin/masters/${key}`}
            className={key === masterType ? "active" : ""}
          >
            {MASTER_CONFIGS[key].title}
          </Link>
        ))}
      </nav>

      <div className="page-header-row">
        <h1>{config.title}</h1>
        <div>
          <label className="inline-checkbox">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>
          {config.hasCsv && (
            <>
              <button type="button" className="secondary" onClick={handleDownloadTemplate}>
                Download CSV template
              </button>
              <button type="button" className="secondary" onClick={handleImportClick} disabled={csvBusy}>
                {csvBusy ? "Importing…" : "Import CSV"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={handleFileChosen}
              />
            </>
          )}
          <button onClick={() => setEditingRow({})}>+ Add new</button>
        </div>
      </div>

      <Banner>{error}</Banner>

      {csvResult && (
        <div className={`banner banner-${csvResult.errors.length ? "error" : "success"}`}>
          <p>
            CSV import: {csvResult.created} created, {csvResult.updated} updated
            {csvResult.errors.length > 0 && `, ${csvResult.errors.length} row(s) skipped`}.
          </p>
          {csvResult.errors.length > 0 && (
            <ul className="csv-error-list">
              {csvResult.errors.map((message, i) => (
                <li key={i}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={config.columns}
          rows={rows}
          actions={(row) => (
            <>
              <button className="link-button" onClick={() => setEditingRow(row)}>
                Edit
              </button>
              {!row.end_date && (
                <button className="link-button danger" onClick={() => handleDeactivate(row)}>
                  Deactivate
                </button>
              )}
            </>
          )}
        />
      )}

      <Drawer
        open={editingRow !== null}
        title={editingRow?.id ? `Edit ${config.title}` : `New ${config.title}`}
        onClose={() => setEditingRow(null)}
      >
        {editingRow !== null && (
          <>
            <MasterForm
              config={config}
              initialValues={editingRow.id ? editingRow : null}
              onSubmit={handleSubmit}
              onCancel={() => setEditingRow(null)}
              busy={busy}
            />
            {config.hasWeights && editingRow.id && <WeightsEditor formulaId={editingRow.id} />}
            {config.hasProjectAllocations && editingRow.id && (
              <EmployeeProjectAllocationsEditor employeeId={editingRow.id} />
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
