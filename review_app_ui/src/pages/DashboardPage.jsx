import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { monthlyReviewsApi } from "../api/endpoints";

const STATUS_HINT = {
  Admin: "As Admin you also act as HR: do the final review and close cycles from Monthly Reviews.",
  Manager: "Review and submit your team's monthly reviews once they've filed a self-assessment.",
  Employee: "File your self-assessment for the open cycle, then wait for your manager's review.",
};

export function DashboardPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monthlyReviewsApi
      .list()
      .then(({ data }) => setReviews(data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const countByStatus = (status) => reviews.filter((r) => r.status === status).length;
  const pending = reviews.filter((r) => r.status !== "Closed");

  const stats = [
    { label: "Total in scope", value: reviews.length },
    { label: "Self-Assessment", value: countByStatus("Self-Assessment") },
    { label: "Manager Review", value: countByStatus("Manager Review") },
    { label: "Submitted to HR", value: countByStatus("Submitted to HR") },
    { label: "Closed", value: countByStatus("Closed") },
  ];

  return (
    <div className="page">
      <h1>Welcome, {user?.full_name}</h1>
      <p className="page-subtitle">{STATUS_HINT[user?.role?.name]}</p>

      <div className="stat-row">
        {stats.map((s) => (
          <div className="stat-tile" key={s.label}>
            <div className="stat-label">
              <span className="stat-dot" /> {s.label}
            </div>
            <div className="stat-value">{loading ? "…" : s.value}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-cards">
        <div className="card">
          <h3>{loading ? "…" : pending.length}</h3>
          <p>Monthly reviews awaiting action</p>
          <Link to="/reviews">Go to Monthly Reviews →</Link>
        </div>
        <div className="card">
          <h3>Annual Reviews</h3>
          <p>Year-end roll-up of closed monthly reviews</p>
          <Link to="/annual-reviews">Go to Annual Reviews →</Link>
        </div>
        {user?.role?.name === "Admin" && (
          <div className="card">
            <h3>Administration</h3>
            <p>Masters, users, roles &amp; permissions</p>
            <Link to="/admin/masters/departments">Go to Masters →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
