import { useEffect, useState } from "react";
import { formulaWeightsApi, ratingParametersApi } from "../../api/endpoints";
import { extractErrorMessage } from "../../api/client";
import { Banner } from "../../components/Banner";

/** Per-parameter weight editor for one Overall Rating Formula (Weighted Average). */
export function WeightsEditor({ formulaId }) {
  const [parameters, setParameters] = useState([]);
  const [weights, setWeights] = useState({}); // parameter_id -> weight_percent
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([ratingParametersApi.list(), formulaWeightsApi.list(formulaId)]).then(
      ([paramsRes, weightsRes]) => {
        setParameters(paramsRes.data);
        const map = {};
        weightsRes.data.forEach((w) => (map[w.parameter_id] = w.weight_percent));
        setWeights(map);
      }
    );
  }, [formulaId]);

  const total = Object.values(weights).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const handleSave = async (parameterId) => {
    setError("");
    setBusy(true);
    try {
      await formulaWeightsApi.set(formulaId, parameterId, Number(weights[parameterId] || 0));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="weights-editor">
      <h4>Parameter weights</h4>
      <Banner>{error}</Banner>
      <table className="data-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Weight %</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>
                <input
                  type="number"
                  style={{ width: "6rem" }}
                  value={weights[p.id] ?? ""}
                  onChange={(e) => setWeights((prev) => ({ ...prev, [p.id]: e.target.value }))}
                />
              </td>
              <td>
                <button type="button" disabled={busy} onClick={() => handleSave(p.id)}>
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={total === 100 ? "hint-ok" : "hint-warning"}>
        Total: {total}% {total !== 100 && "(weights across all parameters should total 100)"}
      </p>
    </div>
  );
}
