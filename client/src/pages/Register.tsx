import { useState } from "react";
import type { FormEvent } from "react";

import { registerUser } from "../services/auth";

interface RegisterProps {
  onLogin: () => void;
}

const Register = ({ onLogin }: RegisterProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const result = await registerUser(name, email);

      if (result.verified) {
        setMessage(
          "Registration successful. Passkey registered."
        );

        setName("");
        setEmail("");
      } else {
        setMessage(
          "Registration could not be completed."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message.includes("successful");

  return (
    <main className="register-page">
      <section className="register-container">

        {/* Left Panel */}
        <div className="register-context">
          <p className="register-brand">
            DIGITAL VAULT
          </p>

          <h1 className="register-welcome">
            GET STARTED
          </h1>

          <p className="register-quote">
            "Your files deserve more than
            <br />
            storage. They deserve trust."
          </p>

          <p className="register-feature">
            Encrypted storage.
          </p>
        </div>

        {/* Right Panel */}
        <div className="register-card">

          <div className="register-header">
            <h2>
              Create your account
            </h2>

            <p>
              Set up your digital vault.
            </p>
          </div>

          <form
            className="register-form"
            onSubmit={handleRegister}
          >
            <div className="register-field">
              <label htmlFor="register-name">
                Full Name
              </label>

              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="register-email">
                Email Address
              </label>

              <input
                id="register-email"
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
              className="register-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Register with Passkey"}
            </button>
          </form>

          {message && (
            <p
              className={`register-message ${
                isSuccess
                  ? "success"
                  : "error"
              }`}
              role="status"
            >
              {message}
            </p>
          )}

          <div className="register-divider" />

          <button
            className="login-link-button"
            type="button"
            onClick={onLogin}
          >
            Back to Login
          </button>

        </div>

      </section>
    </main>
  );
};

export default Register;