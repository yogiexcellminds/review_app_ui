import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { Banner } from "../components/Banner";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword(token, newPassword);
      navigate("/login", { state: { resetSuccess: true } });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Reset password</h1>
        {!token && (
          <Banner>
            No reset token found in the link. Use the link from your reset email, or request a
            new one.
          </Banner>
        )}
        <Banner>{error}</Banner>
        <label>
          New password
          <input
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy || !token}>
          {busy ? "Resetting…" : "Reset password"}
        </button>
        <Link className="auth-link" to="/forgot-password">
          Request a new link
        </Link>
      </form>
    </div>
  );
}
