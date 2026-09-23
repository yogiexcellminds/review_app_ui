import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { monthlyReviewsApi, reviewCyclesApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Banner } from "../components/Banner";
import { useAuth } from "../auth/AuthContext";

const STATUS_LABELS = {
  "Self-Assessment": "Awaiting self-assessment",
  "Manager Review": "Awaiting manager review",
  "Submitted to HR": "Awaiting HR final review",
  Closed: "Closed",
};

// project_allocations is snapshotted onto the review at bulk-create time
// (see app/models/review.py::MonthlyReviewProjectAllocation) -- it reflects
// what the employee was staffed on THEN, not necessarily their allocations now.
function formatProjectAllocations(allocations) {
  if (!allocations || allocations.length === 0) return "—";
  return allocations.map((a) => `${a.project_name} (${a.allocation_percent}%)`).join(", ");
}

export function MonthlyReviewsListPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    monthlyReviewsApi
      .list()
      .then(({ data }) => setReviews(data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (user?.role?.name === "Admin") {
      reviewCyclesApi.list().then(({ data }) => setCycles(data));
    }
  }, [user]);

  const handleBulkCreate = async () => {
    if (!selectedCycle) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const { data } = await monthlyReviewsApi.bulkCreate(Number(selectedCycle));
      setNotice(`Created ${data.length} new review record(s) for this cycle.`);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>Monthly Reviews</h1>
      <Banner>{error}</Banner>
      <Banner type="success">{notice}</Banner>

      {user?.role?.name === "Admin" && (
        <div className="inline-toolbar">
          <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)}>
            <option value="">Select a review cycle…</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.month_year} ({c.status})
              </option>
            ))}
          </select>
          <button disabled={!selectedCycle || busy} onClick={handleBulkCreate}>
            {busy ? "Creating…" : "Bulk-create reviews for this cycle"}
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={[
            { key: "employee_id", label: "Employee ID" },
            { key: "review_cycle_id", label: "Cycle ID" },
            { key: "department_name", label: "Department" },
            {
              key: "project_allocations",
              label: "Projects",
              render: (row) => formatProjectAllocations(row.project_allocations),
            },
            { key: "overall_rating_self", label: "Self rating" },
            { key: "overall_rating_manager", label: "Manager rating" },
            { key: "status", label: "Status", render: (row) => STATUS_LABELS[row.status] || row.status },
          ]}
          rows={reviews}
          actions={(row) => (
            <Link className="link-button" to={`/reviews/${row.id}`}>
              Open
            </Link>
          )}
          emptyMessage="No monthly reviews in scope yet."
        />
      )}
    </div>
  );
}
