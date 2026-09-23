import { useEffect, useState } from "react";

/**
 * Renders (and edits) one record for a given master config. Handles the
 * "select" field type's async options loading (e.g. Department dropdown on
 * the Employee form) generically, so a new master's config rarely needs any
 * new UI code -- see masterConfigs.js.
 *
 * Two extra per-field config options a "select" field can opt into, without
 * any new component code elsewhere:
 *  - field.filterOptions(options, initialValues): return a narrowed option
 *    list, e.g. hiding a User already linked to a *different* Employee (the
 *    same idea as UsersPage.jsx's employeeOptions filter, mirrored here from
 *    the Employee side).
 *  - field.autofillFrom: { targetField: sourceKeyOnOption }: when an option
 *    is picked, copy that key off the picked option onto another field on
 *    this same form (e.g. picking a User onto the Employee form fills this
 *    Employee's full_name from that user's own full_name).
 *
 * config.codeField: the name of this master's auto-generated code field
 * (e.g. "employee_code", or "code" for Department/Project/Designation).
 * When adding a NEW record (not editing), this form calls config.api's
 * nextCode() and pre-fills that field with the suggestion -- the admin can
 * still type over it before saving, and the backend re-checks it's unique
 * either way (see app/routers/masters.py's auto-code-generation section).
 */
export function MasterForm({ config, initialValues, onSubmit, onCancel, busy }) {
  const [values, setValues] = useState(() => buildDefaults(config, initialValues));
  const [optionsByField, setOptionsByField] = useState({});

  useEffect(() => {
    config.fields
      .filter((f) => f.type === "select" && f.optionsApi)
      .forEach((f) => {
        f.optionsApi
          .list()
          .then(({ data }) => setOptionsByField((prev) => ({ ...prev, [f.name]: data })))
          .catch(() => setOptionsByField((prev) => ({ ...prev, [f.name]: [] })));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    if (!initialValues && config.codeField && config.api?.nextCode) {
      config.api
        .nextCode()
        .then(({ data }) => setValues((prev) => ({ ...prev, [config.codeField]: data.code })))
        .catch(() => {
          // No harm if this fails -- the field just starts blank, same as before
          // this feature existed, and the admin can still type a code by hand.
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, initialValues]);

  const handleChange = (field, rawValue) => {
    setValues((prev) => {
      const next = { ...prev, [field.name]: rawValue };
      if (field.type === "select" && field.autofillFrom && rawValue) {
        const options = field.options || optionsByField[field.name] || [];
        const picked = options.find((opt) => String(opt.id) === String(rawValue));
        if (picked) {
          Object.entries(field.autofillFrom).forEach(([targetField, sourceKey]) => {
            if (picked[sourceKey] !== undefined && picked[sourceKey] !== null) {
              next[targetField] = picked[sourceKey];
            }
          });
        }
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form className="master-form" onSubmit={handleSubmit}>
      {config.fields.map((field) => (
        <label key={field.name}>
          {field.label}
          {field.type === "select" ? (
            <select
              value={values[field.name] ?? ""}
              required={field.required}
              onChange={(e) => handleChange(field, e.target.value === "" ? null : e.target.value)}
            >
              <option value="">Select…</option>
              {(() => {
                const options = field.options || optionsByField[field.name] || [];
                const visible = field.filterOptions
                  ? field.filterOptions(options, initialValues)
                  : options;
                return visible.map((opt) =>
                  typeof opt === "string" ? (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ) : (
                    <option key={opt.id} value={opt.id}>
                      {field.optionLabel(opt)}
                    </option>
                  )
                );
              })()}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              value={values[field.name] ?? ""}
              required={field.required}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          ) : (
            <input
              type={field.type}
              min={field.min}
              max={field.max}
              value={values[field.name] ?? ""}
              required={field.required}
              onChange={(e) =>
                handleChange(
                  field,
                  field.type === "number" ? Number(e.target.value) : e.target.value
                )
              }
            />
          )}
          {field.hint && <span className="hint">{field.hint}</span>}
        </label>
      ))}
      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function buildDefaults(config, initialValues) {
  if (initialValues) return { ...initialValues };
  const defaults = {};
  config.fields.forEach((f) => {
    if (f.default !== undefined) defaults[f.name] = f.default;
  });
  return defaults;
}
