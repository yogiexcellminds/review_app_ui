import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Banner } from "../components/Banner";
import { extractErrorMessage } from "../api/client";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await login(username, password);
      const redirectTo = result.must_change_password
        ? "/change-password"
        : location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Performance Review</h1>
        <p className="auth-subtitle">Sign in to continue</p>
        <Banner>{error}</Banner>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <Link className="auth-link" to="/forgot-password">
          Forgot your password?
        </Link>
      </form>
    </div>
  );
}
