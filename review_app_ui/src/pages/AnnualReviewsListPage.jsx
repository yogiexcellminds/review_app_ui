import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { annualReviewsApi, financialYearsApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Banner } from "../components/Banner";
import { useAuth } from "../auth/AuthContext";

// project_allocations is snapshotted at generation time (see
// app/models/review.py::AnnualReviewProjectAllocation) -- the employee's
// CURRENT allocations as of when the annual review was generated, not a
// month-by-month history across the year.
function formatProjectAllocations(allocations) {
  if (!allocations || allocations.length === 0) return "—";
  return allocations.map((a) => `${a.project_name} (${a.allocation_percent}%)`).join(", ");
}

export function AnnualReviewsListPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    annualReviewsApi
      .list()
      .then(({ data }) => setReviews(data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (user?.role?.name === "Admin") {
      financialYearsApi.list().then(({ data }) => setYears(data));
    }
  }, [user]);

  const handleGenerate = async () => {
    if (!selectedYear) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const { data } = await annualReviewsApi.generate(Number(selectedYear));
      setNotice(`Generated ${data.length} annual review(s) from closed monthly reviews.`);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>Annual Reviews</h1>
      <Banner>{error}</Banner>
      <Banner type="success">{notice}</Banner>

      {user?.role?.name === "Admin" && (
        <div className="inline-toolbar">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="">Select a financial year…</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.year_label} ({y.status})
              </option>
            ))}
          </select>
          <button disabled={!selectedYear || busy} onClick={handleGenerate}>
            {busy ? "Generating…" : "Generate annual reviews for this year"}
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          columns={[
            { key: "employee_id", label: "Employee ID" },
            { key: "financial_year_id", label: "Financial Year ID" },
            { key: "department_name", label: "Department" },
            {
              key: "project_allocations",
              label: "Projects",
              render: (row) => formatProjectAllocations(row.project_allocations),
            },
            { key: "annual_overall_rating", label: "Annual Rating" },
            { key: "status", label: "Status" },
          ]}
          rows={reviews}
          actions={(row) => (
            <Link className="link-button" to={`/annual-reviews/${row.id}`}>
              Open
            </Link>
          )}
          emptyMessage="No annual reviews yet."
        />
      )}
    </div>
  );
}
