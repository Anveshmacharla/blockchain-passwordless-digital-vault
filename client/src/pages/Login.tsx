import { useState } from "react";
import type { FormEvent } from "react";

import { loginUser } from "../services/auth";

interface LoginProps {
  onLoginSuccess: () => Promise<void>;
  onRegister: () => void;
}

const Login = ({
  onLoginSuccess,
  onRegister,
}: LoginProps) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const result = await loginUser(email);

      if (result.verified) {
        await onLoginSuccess();
      } else {
        setMessage(
          "Login could not be completed."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-container">

        {/* Left Panel */}
        <div className="login-context">
          <p className="login-brand">
            DIGITAL VAULT
          </p>

          <h1 className="login-welcome">
            WELCOME BACK
          </h1>

          <p className="login-quote">
            "Your files deserve more than
            <br />
            storage. They deserve trust."
          </p>

          <p className="login-feature">
            Encrypted storage.
          </p>
        </div>

        {/* Right Panel */}
        <div className="login-card">

          <div className="login-header">
            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to your digital vault.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleLogin}
          >
            <div className="login-field">
              <label htmlFor="login-email">
                Email Address
              </label>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email address"
                autoComplete="email"
                required
              />
            </div>

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Authenticating..."
                : "Login with Passkey"}
            </button>
          </form>

          {message && (
            <p
              className="login-message"
              role="status"
            >
              {message}
            </p>
          )}

          <div className="login-divider" />

          <button
            className="register-link-button"
            type="button"
            onClick={onRegister}
          >
            Create an Account
          </button>

        </div>

      </section>
    </main>
  );
};

export default Login;