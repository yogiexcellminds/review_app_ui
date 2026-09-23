import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { monthlyReviewsApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { Banner } from "../components/Banner";
import { RatingSelect } from "../components/RatingSelect";

const PARAMS = [
  { key: "work_quality", label: "Work Quality" },
  { key: "timely_completion", label: "Timely Completion" },
  { key: "ownership_accountability", label: "Ownership & Accountability" },
  { key: "communication", label: "Communication" },
  { key: "teamwork", label: "Teamwork & Collaboration" },
];

export function MonthlyReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    monthlyReviewsApi
      .get(id)
      .then(({ data }) => setReview(data))
      .catch((err) => setError(extractErrorMessage(err)));
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
      <h1>Monthly Review #{review.id}</h1>
      <Banner>{error}</Banner>

      <div className="review-summary">
        <div>
          <strong>Employee ID:</strong> {review.employee_id}
        </div>
        <div>
          <strong>Review Cycle ID:</strong> {review.review_cycle_id}
        </div>
        <div>
          <strong>Department:</strong> {review.department_name}
        </div>
        <div>
          <strong>Status:</strong> {review.status}
        </div>
      </div>

      {review.project_allocations.length > 0 && (
        <p className="hint">
          <strong>Projects at the time of this review:</strong>{" "}
          {review.project_allocations
            .map((a) => `${a.project_name} (${a.allocation_percent}%)`)
            .join(", ")}
        </p>
      )}

      {review.status === "Self-Assessment" && (
        <SelfAssessmentForm review={review} setReview={setReview} setError={setError} busy={busy} setBusy={setBusy} />
      )}
      {review.status === "Manager Review" && (
        <ManagerReviewForm review={review} setReview={setReview} setError={setError} busy={busy} setBusy={setBusy} />
      )}
      {review.status === "Submitted to HR" && (
        <HrFinalForm review={review} setReview={setReview} setError={setError} busy={busy} setBusy={setBusy} />
      )}
      {review.status === "Closed" && <ReadOnlyReview review={review} />}
    </div>
  );
}

function SelfAssessmentForm({ review, setReview, setError, busy, setBusy }) {
  const [form, setForm] = useState({
    key_tasks: review.key_tasks || "",
    key_achievements: review.key_achievements || "",
    work_quality_self: review.work_quality_self,
    timely_completion_self: review.timely_completion_self,
    ownership_accountability_self: review.ownership_accountability_self,
    communication_self: review.communication_self,
    teamwork_self: review.teamwork_self,
    employee_comments: review.employee_comments || "",
  });

  const save = async (submit) => {
    setError("");
    setBusy(true);
    try {
      const { data } = await monthlyReviewsApi.saveSelfAssessment(review.id, { ...form, submit });
      setReview(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not save self-assessment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="review-form-section">
      <h2>Self-Assessment</h2>
      <label>
        Key Tasks / Deliverables
        <textarea value={form.key_tasks} onChange={(e) => setForm({ ...form, key_tasks: e.target.value })} />
      </label>
      <label>
        Key Achievements
        <textarea
          value={form.key_achievements}
          onChange={(e) => setForm({ ...form, key_achievements: e.target.value })}
        />
      </label>
      <div className="rating-grid">
        {PARAMS.map((p) => (
          <RatingSelect
            key={p.key}
            label={p.label}
            value={form[`${p.key}_self`]}
            onChange={(v) => setForm({ ...form, [`${p.key}_self`]: v })}
          />
        ))}
      </div>
      <label>
        Employee Comments
        <textarea
          value={form.employee_comments}
          onChange={(e) => setForm({ ...form, employee_comments: e.target.value })}
        />
      </label>
      <div className="form-actions">
        <button disabled={busy} onClick={() => save(false)}>
          Save draft
        </button>
        <button disabled={busy} onClick={() => save(true)}>
          Submit to Manager
        </button>
      </div>
    </section>
  );
}

function ManagerReviewForm({ review, setReview, setError, busy, setBusy }) {
  const [form, setForm] = useState({
    key_tasks: review.key_tasks || "",
    key_achievements: review.key_achievements || "",
    work_quality_manager: review.work_quality_manager,
    timely_completion_manager: review.timely_completion_manager,
    ownership_accountability_manager: review.ownership_accountability_manager,
    communication_manager: review.communication_manager,
    teamwork_manager: review.teamwork_manager,
    strengths: review.strengths || "",
    areas_for_improvement: review.areas_for_improvement || "",
    training_required: review.training_required || "",
    manager_comments: review.manager_comments || "",
  });

  const save = async (submit) => {
    setError("");
    setBusy(true);
    try {
      const { data } = await monthlyReviewsApi.saveManagerReview(review.id, { ...form, submit });
      setReview(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not save the manager review.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="review-form-section">
      <h2>Manager Review</h2>
      {review.employee_comments && (
        <div className="readonly-block">
          <strong>Employee self-assessment comments:</strong>
          <p>{review.employee_comments}</p>
          <strong>Self rating:</strong> {review.overall_rating_self ?? "—"}
        </div>
      )}
      <label>
        Key Tasks / Deliverables
        <textarea value={form.key_tasks} onChange={(e) => setForm({ ...form, key_tasks: e.target.value })} />
      </label>
      <label>
        Key Achievements
        <textarea
          value={form.key_achievements}
          onChange={(e) => setForm({ ...form, key_achievements: e.target.value })}
        />
      </label>
      <div className="rating-grid">
        {PARAMS.map((p) => (
          <RatingSelect
            key={p.key}
            label={p.label}
            value={form[`${p.key}_manager`]}
            onChange={(v) => setForm({ ...form, [`${p.key}_manager`]: v })}
          />
        ))}
      </div>
      <label>
        Strengths / Positive Feedback
        <textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} />
      </label>
      <label>
        Areas for Improvement
        <textarea
          value={form.areas_for_improvement}
          onChange={(e) => setForm({ ...form, areas_for_improvement: e.target.value })}
        />
      </label>
      <label>
        Training / Support Required
        <textarea
          value={form.training_required}
          onChange={(e) => setForm({ ...form, training_required: e.target.value })}
        />
      </label>
      <label>
        Manager Comments
        <textarea
          value={form.manager_comments}
          onChange={(e) => setForm({ ...form, manager_comments: e.target.value })}
        />
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

function HrFinalForm({ review, setReview, setError, busy, setBusy }) {
  const [comments, setComments] = useState(review.hr_final_comments || "");

  const save = async (close) => {
    setError("");
    setBusy(true);
    try {
      const { data } = await monthlyReviewsApi.saveHrFinal(review.id, {
        hr_final_comments: comments,
        close,
      });
      setReview(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not save the HR review.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="review-form-section">
      <h2>HR Final Review</h2>
      <ReadOnlyReview review={review} />
      <label>
        HR Final Comments
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} />
      </label>
      <div className="form-actions">
        <button disabled={busy} onClick={() => save(false)}>
          Save comments
        </button>
        <button disabled={busy} onClick={() => save(true)}>
          Close review
        </button>
      </div>
    </section>
  );
}

function ReadOnlyReview({ review }) {
  return (
    <div className="readonly-block">
      <p>
        <strong>Key Tasks:</strong> {review.key_tasks || "—"}
      </p>
      <p>
        <strong>Key Achievements:</strong> {review.key_achievements || "—"}
      </p>
      <p>
        <strong>Self rating:</strong> {review.overall_rating_self ?? "—"} &nbsp;|&nbsp;
        <strong>Manager rating:</strong> {review.overall_rating_manager ?? "—"}
      </p>
      <p>
        <strong>Strengths:</strong> {review.strengths || "—"}
      </p>
      <p>
        <strong>Areas for Improvement:</strong> {review.areas_for_improvement || "—"}
      </p>
      <p>
        <strong>Training Required:</strong> {review.training_required || "—"}
      </p>
      <p>
        <strong>Manager Comments:</strong> {review.manager_comments || "—"}
      </p>
      <p>
        <strong>HR Final Comments:</strong> {review.hr_final_comments || "—"}
      </p>
    </div>
  );
}
