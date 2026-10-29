import { useEffect, useState } from "react";

import { getFiles } from "../services/file";
import { getPermissions } from "../services/permission";

import type { AuthenticatedUser } from "../services/auth";

import Vault from "./Vault";

interface DashboardProps {
  user: AuthenticatedUser;
  onLogout: () => Promise<void>;
  loggingOut: boolean;
}

const Dashboard = ({
  user,
  onLogout,
  loggingOut,
}: DashboardProps) => {

  const [fileCount, setFileCount] = useState(0);
  const [accessCount, setAccessCount] = useState(0);


  /* =========================
     LOAD DASHBOARD COUNTS
     ========================= */

  useEffect(() => {
    const loadDashboardCounts = async () => {
      try {
        const files = await getFiles();

        setFileCount(files.length);

        let totalAccess = 0;

        for (const file of files) {
          try {
            const permissions =
              await getPermissions(file.file_id);

            totalAccess += permissions.filter(
              (permission) =>
                permission.permission_status === "ACTIVE"
            ).length;
          } catch {
            // Ignore permission loading
            // failures for individual files.
          }
        }

        setAccessCount(totalAccess);
      } catch (error) {
        console.error(
          "Failed to load dashboard counts:",
          error
        );
      }
    };

    void loadDashboardCounts();
  }, []);


  return (
    <main className="dashboard-page">

      {/* =========================
          TOP NAVIGATION
          ========================= */}

      <header className="dashboard-header">

        <div className="dashboard-brand">
          DIGITAL VAULT
        </div>

        <div className="dashboard-header-actions">

          <button
            className="dashboard-profile-button"
            type="button"
          >
            Profile
          </button>

          <button
            className="dashboard-logout-button"
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
          >
            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </button>

        </div>

      </header>


      {/* =========================
          DASHBOARD CONTENT
          ========================= */}

      <section className="dashboard-content">


        {/* =========================
            WELCOME BLOCK
            ========================= */}

        <section className="dashboard-welcome">

          <div>

            <p className="dashboard-eyebrow">
              DIGITAL VAULT
            </p>

            <h1>
              Welcome back, {user.name}
            </h1>

            <p>
              Manage your secure files and digital vault.
            </p>

          </div>

        </section>


        {/* =========================
            SUMMARY BLOCKS
            ========================= */}

        <section className="dashboard-summary">


          {/* MY VAULT */}

          <article className="dashboard-summary-card">

            <div className="dashboard-card-top">
              <span>
                MY VAULT
              </span>
            </div>

            <strong>
              ACTIVE
            </strong>

            <p>
              Personal vault
            </p>

          </article>


          {/* SECURE FILES */}

          <article className="dashboard-summary-card">

            <div className="dashboard-card-top">
              <span>
                SECURE FILES
              </span>
            </div>

            <strong>
              {fileCount}
            </strong>

            <p>
              Encrypted files
            </p>

          </article>


          {/* ACCESS */}

          <article className="dashboard-summary-card">

            <div className="dashboard-card-top">
              <span>
                ACCESS
              </span>
            </div>

            <strong>
              {accessCount}
            </strong>

            <p>
              Active permissions
            </p>

          </article>

        </section>


        {/* =========================
            MY FILES
            ========================= */}

        <section className="dashboard-files-section">


          {/* FILES HEADER */}

          <div className="dashboard-section-header">

            <div>

              <p className="dashboard-section-label">
                STORAGE
              </p>

              <h2>
                My Files
              </h2>

              <p>
                Manage and verify your securely stored files.
              </p>

            </div>

          </div>


          {/* =========================
              EXISTING VAULT
              ========================= */}

          <div className="dashboard-vault-content">
            <Vault />
          </div>


        </section>

      </section>

    </main>
  );
};

export default Dashboard;