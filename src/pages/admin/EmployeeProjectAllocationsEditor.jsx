import { useEffect, useState } from "react";
import { employeeProjectMappingsApi, projectsApi, utilizationApi } from "../../api/endpoints";
import { extractErrorMessage } from "../../api/client";
import { Banner } from "../../components/Banner";

/**
 * Inline project-allocation editor for one Employee, shown inside the
 * Employee edit drawer (see masterConfigs.js's `hasProjectAllocations` flag
 * and MastersPage.jsx) so Admin can add/remove which project(s) an employee
 * is on, and at what percentage, without leaving the Employee form.
 *
 * Department (on the Employee record itself) and Project are different
 * masters: an employee has exactly one Department, but can be allocated
 * across several Projects at once -- this is exactly that many-to-many,
 * backed by the same /employee-project-mappings endpoints as the dedicated
 * Employee <-> Project Mapping page, so the 200% utilization cap is
 * enforced identically either way.
 */
export function EmployeeProjectAllocationsEditor({ employeeId }) {
  const [utilization, setUtilization] = useState(null);
  const [projects, setProjects] = useState([]);
  const [newProjectId, setNewProjectId] = useState("");
  const [newAllocationPercent, setNewAllocationPercent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    utilizationApi
      .get(employeeId)
      .then(({ data }) => setUtilization(data))
      .catch((err) => setError(extractErrorMessage(err)));
    projectsApi.list().then(({ data }) => setProjects(data));
  };

  useEffect(load, [employeeId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newProjectId || !newAllocationPercent) return;
    setError("");
    setBusy(true);
    try {
      await employeeProjectMappingsApi.create({
        employee_id: employeeId,
        project_id: Number(newProjectId),
        allocation_percent: Number(newAllocationPercent),
      });
      setNewProjectId("");
      setNewAllocationPercent("");
      load();
    } catch (err) {
      // A 400 here is the 200%-cap message from assert_within_cap -- shown as-is.
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (mappingId) => {
    setError("");
    setBusy(true);
    try {
      await employeeProjectMappingsApi.deactivate(mappingId);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!utilization) {
    return null;
  }

  // Only projects not already assigned to this employee make sense to add.
  const assignedProjectIds = new Set(utilization.mappings.map((m) => m.project_id));
  const availableProjects = projects.filter((p) => !assignedProjectIds.has(p.id));

  return (
    <div className="weights-editor">
      <h4>Project allocations</h4>
      <Banner>{error}</Banner>

      <table className="data-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Allocation %</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {utilization.mappings.length === 0 ? (
            <tr>
              <td colSpan={3} className="empty-state">
                Not currently allocated to any project.
              </td>
            </tr>
          ) : (
            utilization.mappings.map((m) => (
              <tr key={m.mapping_id}>
                <td>{m.project_name}</td>
                <td>{m.allocation_percent}%</td>
                <td>
                  <button
                    type="button"
                    className="link-button danger"
                    disabled={busy}
                    onClick={() => handleRemove(m.mapping_id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className={utilization.available_percent > 0 ? "hint-ok" : "hint-warning"}>
        Total: {utilization.total_allocation_percent}% of {utilization.cap_percent}% cap (
        {utilization.available_percent}% available)
      </p>

      {availableProjects.length > 0 && (
        <form className="inline-toolbar" onSubmit={handleAdd}>
          <select value={newProjectId} onChange={(e) => setNewProjectId(e.target.value)} required>
            <option value="">Add project…</option>
            {availableProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0.01"
            max="200"
            step="0.01"
            style={{ width: "6rem" }}
            placeholder="%"
            value={newAllocationPercent}
            onChange={(e) => setNewAllocationPercent(e.target.value)}
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? "Adding…" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}
