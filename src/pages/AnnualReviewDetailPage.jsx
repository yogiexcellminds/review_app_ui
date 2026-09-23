import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { annualReviewsApi } from "../api/endpoints";
import { Banner } from "../components/Banner";

export function AnnualReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    annualReviewsApi
      .get(id)
      .then(({ data }) => setReview(data))
      .catch((err) => setError(err?.response?.data?.detail || "Could not load this annual review."));
  };

  useEffect(load, [id]);

  if (!review) {
    return (
      <div className="page">
        <Banner>{error}</Banner>
        {!error && <p>Loading…</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <button className="link-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h1>Annual Review #{review.id}</h1>
      <Banner>{error}</Banner>

      <div className="review-summary">
        <div>
          <strong>Employee ID:</strong> {review.employee_id}
        </div>
        <div>
          <strong>Financial Year ID:</strong> {review.financial_year_id}
        </div>
        <div>
          <strong>Department:</strong> {review.department_name}
        </div>
        <div>
          <strong>Annual Overall Rating:</strong> {review.annual_overall_rating ?? "—"}
        </div>
        <div>
          <strong>Status:</strong> {review.status}
        </div>
      </div>

      {review.project_allocations.length > 0 && (
        <p className="hint">
          <strong>Projects as of generation:</strong>{" "}
          {review.project_allocations
            .map((a) => `${a.project_name} (${a.allocation_percent}%)`)
            .join(", ")}
        </p>
      )}

      {review.status === "Draft" && (
        <ManagerSection review={review} setReview={setReview} setError={setError} busy={busy} setBusy={setBusy} />
      )}
      {review.status === "Manager Reviewed" && (
        <HrSection review={review} setReview={setReview} setError={setError} busy={busy} setBusy={setBusy} />
      )}
      {review.status === "Closed" && (
        <div className="readonly-block">
          <p>
            <strong>Highlights:</strong> {review.annual_highlights || "—"}
          </p>
          <p>
            <strong>Areas for Improvement:</strong> {review.annual_areas_for_improvement || "—"}
          </p>
          <p>
            <strong>HR Final Comments:</strong> {review.hr_final_comments || "—"}
          </p>
        </div>
      )}
    </div>
  );
}

function ManagerSection({ review, setReview, setError, busy, setBusy }) {
  const [highlights, setHighlights] = useState(review.annual_highlights || "");
  const [improvement, setImprovement] = useState(review.annual_areas_for_improvement || "");

  const save = async (submit) => {
    setError("");
    setBusy(true);
    try {
      const { data } = await annualReviewsApi.saveManagerReview(review.id, {
        annual_highlights: highlights,
        annual_areas_for_improvement: improvement,
        submit,
      });
      setReview(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="review-form-section">
      <h2>Manager Roll-up</h2>
      <label>
        Annual Highlights
        <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} />
      </label>
      <label>
        Annual Areas for Improvement
        <textarea value={improvement} onChange={(e) => setImprovement(e.target.value)} />
      </label>
      <div className="form-actions">
        <button disabled={busy} onClick={() => save(false)}>
          Save draft
        </button>
        <button disabled={busy} onClick={() => save(true)}>
          Submit to HR
        </button>
      </div>
    </section>
  );
}

function HrSection({ review, setReview, setError, busy, setBusy }) {
  const [comments, setComments] = useState(review.hr_final_comments || "");

  const save = async (close) => {
    setError("");
    setBusy(true);
    try {
      const { data } = await annualReviewsApi.saveHrFinal(review.id, { hr_final_comments: comments, close });
      setReview(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="review-form-section">
      <h2>HR Final Review</h2>
      <p>
        <strong>Highlights:</strong> {review.annual_highlights || "—"}
      </p>
      <p>
        <strong>Areas for Improvement:</strong> {review.annual_areas_for_improvement || "—"}
      </p>
      <label>
        HR Final Comments
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} />
      </label>
      <div className="form-actions">
        <button disabled={busy} onClick={() => save(false)}>
          Save comments
        </button>
        <button disabled={busy} onClick={() => save(true)}>
          Close annual review
        </button>
      </div>
    </section>
  );
}
