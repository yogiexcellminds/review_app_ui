const SCALE = [1, 2, 3, 4, 5];

export function RatingSelect({ label, value, onChange, disabled }) {
  return (
    <label className="rating-field">
      <span>{label}</span>
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Select…</option>
        {SCALE.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
