import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { Banner } from "../components/Banner";
import { useAuth } from "../auth/AuthContext";

export function ChangePasswordPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
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
      await authApi.changePassword(currentPassword, newPassword);
      await refresh();
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Change password</h1>
        {user?.must_change_password && (
          <Banner type="info">
            Your account has a temporary password. Please set a new one to continue.
          </Banner>
        )}
        <Banner>{error}</Banner>
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
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
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
