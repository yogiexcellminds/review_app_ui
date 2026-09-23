import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/client";
import { Banner } from "../components/Banner";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { data } = await authApi.forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Forgot password</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send you a link to reset your password.
        </p>
        <Banner>{error}</Banner>
        <Banner type="success">{message}</Banner>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </button>
        <Link className="auth-link" to="/login">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
