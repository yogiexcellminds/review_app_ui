import { useEffect } from "react";

/**
 * Sliding panel that comes in from the right, used for add/edit forms
 * (Masters, Users) instead of a full-page navigation or an inline block.
 * Closes on backdrop click or Escape.
 */
export function Drawer({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-header">
          <h2>{title}</h2>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}
