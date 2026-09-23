import { useEffect, useState } from "react";
import { Banner } from "../../components/Banner";
import { DataTable } from "../../components/DataTable";
import { Drawer } from "../../components/Drawer";
import { extractErrorMessage } from "../../api/client";
import {
  employeeProjectMappingsApi,
  employeesApi,
  projectsApi,
  utilizationApi,
} from "../../api/endpoints";

/**
 * Employee <-> Project allocation mapping. Not a generic MastersPage screen
 * because it needs two things a plain master doesn't: a live utilization
 * readout (an employee's active allocations can never total more than 200%,
 * enforced server-side in app/core/utilization.py) and a friendlier error
 * when that cap is hit.
 */
export function EmployeeProjectMappingsPage() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError("");
    Promise.all([
      employeeProjectMappingsApi.list({ include_inactive: includeInactive }),
      employeesApi.list(),
      projectsApi.list(),
    ])
      .then(([mappingsRes, employeesRes, projectsRes]) => {
        setRows(mappingsRes.data);
        setEmployees(employeesRes.data);
        setProjects(projectsRes.data);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  const employeeById = Object.fromEntries(employees.map((e) => [e.id, e]));
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));

  const handleDeactivate = async (row) => {
    if (!confirm("Deactivate this allocation? It frees up the employee's utilization.")) return;
    setError("");
    try {
      await employeeProjectMappingsApi.deactivate(row.id);
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <h1>Employee ↔ Project Mapping</h1>
        <div>
          <label className="inline-checkbox">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>
          <button onClick={() => setDrawerOpen(true)}>+ Add mapping</button>
        </div>
      </div>

      <p className="page-subtitle">
        An employee can be mapped to multiple projects with a percentage allocation each. Total
        active allocation across all of an employee's projects cannot exceed 200%.
      </p>

      <Banner>{error}</Banner>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={[
            {
              key: "employee_id",
              label: "Employee",
              render: (row) => {
                const emp = employeeById[row.employee_id];
                return emp ? `${emp.full_name} (${emp.employee_code})` : `#${row.employee_id}`;
              },
            },
            {
              key: "project_id",
              label: "Project",
              render: (row) => projectById[row.project_id]?.name ?? `#${row.project_id}`,
            },
            { key: "allocation_percent", label: "Allocation %" },
            { key: "start_date", label: "Start date" },
            { key: "end_date", label: "End date" },
          ]}
          rows={rows}
          emptyMessage="No project allocations yet."
          actions={(row) => (
            <>
              {!row.end_date && (
                <button className="link-button danger" onClick={() => handleDeactivate(row)}>
                  Deactivate
                </button>
              )}
            </>
          )}
        />
      )}

      <Drawer open={drawerOpen} title="New Employee ↔ Project Mapping" onClose={() => setDrawerOpen(false)}>
        {drawerOpen && (
          <MappingForm
            employees={employees}
            projects={projects}
            onSaved={() => {
              setDrawerOpen(false);
              loadAll();
            }}
            onCancel={() => setDrawerOpen(false)}
          />
        )}
      </Drawer>
    </div>
  );
}

const MAX_UTILIZATION_PERCENT = 200;

function MappingForm({ employees, projects, onSaved, onCancel }) {
  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [allocationPercent, setAllocationPercent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [utilization, setUtilization] = useState(null); // { total_allocation_percent, available_percent, mappings }
  const [utilLoading, setUtilLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!employeeId) {
      setUtilization(null);
      return;
    }
    setUtilLoading(true);
    utilizationApi
      .get(employeeId)
      .then(({ data }) => setUtilization(data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setUtilLoading(false));
  }, [employeeId]);

  const requested = Number(allocationPercent) || 0;
  const currentTotal = utilization?.total_allocation_percent ?? 0;
  const projectedTotal = Math.round((currentTotal + requested) * 100) / 100;
  const overCap = employeeId && requested > 0 && projectedTotal > MAX_UTILIZATION_PERCENT;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !projectId || !allocationPercent) {
      setError("Employee, project and allocation % are all required.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await employeeProjectMappingsApi.create({
        employee_id: Number(employeeId),
        project_id: Number(projectId),
        allocation_percent: Number(allocationPercent),
        start_date: startDate || undefined,
      });
      onSaved();
    } catch (err) {
      // The backend's 400 for an over-cap request already carries a
      // descriptive message (see assert_within_cap) -- surface it as-is.
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="master-form compact" onSubmit={handleSubmit}>
      <label>
        Employee
        <select value={employeeId} required onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">Select…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name} ({emp.employee_code})
            </option>
          ))}
        </select>
      </label>

      <label>
        Project
        <select value={projectId} required onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Select…</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name} ({proj.code})
            </option>
          ))}
        </select>
      </label>

      <label>
        Allocation %
        <input
          type="number"
          min="0.01"
          max="200"
          step="0.01"
          value={allocationPercent}
          required
          onChange={(e) => setAllocationPercent(e.target.value)}
        />
      </label>

      <label>
        Start date
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>

      {employeeId && (
        <div className={`readonly-block ${overCap ? "banner-error" : ""}`}>
          {utilLoading ? (
            <p className="hint">Checking current utilization…</p>
          ) : (
            <>
              <p className="hint">
                Currently allocated: <strong>{currentTotal}%</strong> · Available up to cap:{" "}
                <strong>{utilization?.available_percent ?? MAX_UTILIZATION_PERCENT}%</strong>
              </p>
              {utilization?.mappings?.length > 0 && (
                <ul className="csv-error-list">
                  {utilization.mappings.map((m) => (
                    <li key={m.mapping_id}>
                      {m.project_name}: {m.allocation_percent}%
                    </li>
                  ))}
                </ul>
              )}
              {requested > 0 && (
                <p className={overCap ? "hint-warning" : "hint-ok"}>
                  {overCap
                    ? `This would bring total utilization to ${projectedTotal}%, over the 200% cap.`
                    : `New total after this allocation: ${projectedTotal}%.`}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <Banner>{error}</Banner>

      <div className="form-actions">
        <button type="submit" disabled={busy || overCap}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
