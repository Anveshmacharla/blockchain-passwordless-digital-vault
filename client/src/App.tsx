import "./App.css";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";

import {
  getCurrentUser,
  logoutUser,
} from "./services/auth";

import type { AuthenticatedUser } from "./services/auth";
import Dashboard from "./pages/Dashboard";

function App() {
  const [page, setPage] =
    useState<"login" | "register">("login");

  const [user, setUser] =
    useState<AuthenticatedUser | null>(null);

  const [checkingAuthentication, setCheckingAuthentication] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const checkAuthentication = async () => {
    try {
      const currentUser = await getCurrentUser();

      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setCheckingAuthentication(false);
    }
  };

  useEffect(() => {
    void checkAuthentication();
  }, []);

  const handleLoginSuccess = async () => {
    setCheckingAuthentication(true);

    await checkAuthentication();
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logoutUser();

      setUser(null);
      setPage("login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  if (checkingAuthentication) {
    return <p>Checking authentication...</p>;
  }

  if (user) {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
    );
  }

  return (
    <div>
      {page === "login" ? (
        <Login
        onLoginSuccess={handleLoginSuccess}
        onRegister={() => setPage("register")}
      />
    ) : (
      <Register
        onLogin={() => setPage("login")}
      />
    )}
  </div>
  );
}

export default App;