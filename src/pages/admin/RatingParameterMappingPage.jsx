import { useEffect, useState } from "react";
import { Banner } from "../../components/Banner";
import { DataTable } from "../../components/DataTable";
import { extractErrorMessage } from "../../api/client";
import {
  designationRatingParameterMappingsApi,
  designationsApi,
  employeeApplicableRatingParametersApi,
  employeeRatingParameterMappingsApi,
  employeesApi,
  ratingParametersApi,
} from "../../api/endpoints";

/**
 * Maps Rating Parameters directly to a role (Designation) -- the defaults
 * everyone with that role gets -- and lets an Admin add extra ones for one
 * specific Employee on top of their role's defaults. This is reference/
 * config data: it does NOT change what the Monthly/Annual Review form
 * itself scores (that's still five fixed parameters built into the review
 * -- see the backend README). It's meant for planning/visibility: which
 * parameters are relevant to a QA Engineer vs. a SQL Developer, and any
 * one-off additions for a specific person.
 */
export function RatingParameterMappingPage() {
  const [ratingParameters, setRatingParameters] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    ratingParametersApi
      .list()
      .then(({ data }) => setRatingParameters(data))
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  return (
    <div className="page">
      <div className="page-header-row">
        <h1>Rating Parameter Mapping</h1>
      </div>
      <p className="page-subtitle">
        Set which Rating Parameters apply to each Designation (role), then pick any employee to
        see their full list auto-filled in from their role -- with room to add a few more just for
        them.
      </p>

      <Banner>{error}</Banner>

      <DesignationSection ratingParameters={ratingParameters} onError={setError} />
      <EmployeeSection ratingParameters={ratingParameters} onError={setError} />
    </div>
  );
}

function DesignationSection({ ratingParameters, onError }) {
  const [designations, setDesignations] = useState([]);
  const [designationId, setDesignationId] = useState("");
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyParameterId, setBusyParameterId] = useState(null);

  useEffect(() => {
    designationsApi.list().then(({ data }) => setDesignations(data));
  }, []);

  const loadMappings = (id) => {
    if (!id) {
      setMappings([]);
      return;
    }
    setLoading(true);
    designationRatingParameterMappingsApi
      .list({ designation_id: id })
      .then(({ data }) => setMappings(data))
      .catch((err) => onError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMappings(designationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designationId]);

  const mappingByParameterId = Object.fromEntries(mappings.map((m) => [m.rating_parameter_id, m]));

  const handleToggle = async (parameterId, checked) => {
    onError("");
    setBusyParameterId(parameterId);
    try {
      if (checked) {
        await designationRatingParameterMappingsApi.create({
          designation_id: Number(designationId),
          rating_parameter_id: parameterId,
        });
      } else {
        const existing = mappingByParameterId[parameterId];
        if (existing) await designationRatingParameterMappingsApi.deactivate(existing.id);
      }
      loadMappings(designationId);
    } catch (err) {
      onError(extractErrorMessage(err));
    } finally {
      setBusyParameterId(null);
    }
  };

  return (
    <section className="page-section">
      <h2>By Designation (role defaults)</h2>
      <label>
        Designation
        <select value={designationId} onChange={(e) => setDesignationId(e.target.value)}>
          <option value="">Select a designation…</option>
          {designations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
      </label>

      {designationId && (
        <div className="readonly-block">
          {loading ? (
            <p className="hint">Loading…</p>
          ) : (
            <>
              <p className="hint">
                Check every Rating Parameter that everyone with this Designation should be rated
                on. Unchecking one only removes the role-level default -- it doesn't touch anyone's
                past reviews.
              </p>
              {ratingParameters.map((p) => (
                <label key={p.id} className="inline-checkbox" style={{ display: "block" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(mappingByParameterId[p.id])}
                    disabled={busyParameterId === p.id}
                    onChange={(e) => handleToggle(p.id, e.target.checked)}
                  />
                  {p.name}
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function EmployeeSection({ ratingParameters, onError }) {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [resolved, setResolved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newParameterId, setNewParameterId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    employeesApi.list().then(({ data }) => setEmployees(data));
  }, []);

  const selectedEmployee = employees.find((e) => String(e.id) === String(employeeId));

  const loadResolved = (id) => {
    if (!id) {
      setResolved([]);
      return;
    }
    setLoading(true);
    employeeApplicableRatingParametersApi
      .get(id)
      .then(({ data }) => setResolved(data))
      .catch((err) => onError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadResolved(employeeId);
    setNewParameterId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const availableToAdd = ratingParameters.filter(
    (p) => !resolved.some((r) => r.rating_parameter_id === p.id)
  );

  const handleRemove = async (mappingId) => {
    onError("");
    setBusy(true);
    try {
      await employeeRatingParameterMappingsApi.deactivate(mappingId);
      loadResolved(employeeId);
    } catch (err) {
      onError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newParameterId) return;
    onError("");
    setBusy(true);
    try {
      await employeeRatingParameterMappingsApi.create({
        employee_id: Number(employeeId),
        rating_parameter_id: Number(newParameterId),
      });
      setNewParameterId("");
      loadResolved(employeeId);
    } catch (err) {
      onError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page-section">
      <h2>By Employee (auto from role, plus extra)</h2>
      <label>
        Employee
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">Select an employee…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name} ({emp.employee_code})
            </option>
          ))}
        </select>
      </label>

      {employeeId && (
        <div className="readonly-block">
          <p className="hint">
            Designation: <strong>{selectedEmployee?.designation_name ?? "Not set"}</strong>
            {!selectedEmployee?.designation_name &&
              " -- set one on the Employees master to get role defaults here."}
          </p>

          {loading ? (
            <p className="hint">Loading…</p>
          ) : (
            <DataTable
              columns={[
                { key: "rating_parameter_name", label: "Rating Parameter" },
                {
                  key: "source",
                  label: "Source",
                  render: (row) => (row.source === "designation" ? "From role" : "Added for this employee"),
                },
              ]}
              rows={resolved}
              emptyMessage="No rating parameters apply yet -- set some on this employee's Designation above, or add one below."
              actions={(row) =>
                row.source === "employee" ? (
                  <button
                    className="link-button danger"
                    disabled={busy}
                    onClick={() => handleRemove(row.mapping_id)}
                  >
                    Remove
                  </button>
                ) : (
                  <span className="hint">Edit via role, above</span>
                )
              }
            />
          )}

          {availableToAdd.length > 0 && (
            <form className="inline-toolbar" onSubmit={handleAdd}>
              <select value={newParameterId} onChange={(e) => setNewParameterId(e.target.value)} required>
                <option value="">Add a parameter just for this employee…</option>
                {availableToAdd.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={busy}>
                {busy ? "Adding…" : "Add"}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
