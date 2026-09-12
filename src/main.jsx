import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import "./style.css";

function App() {
  const [mining, setMining] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">⚡</div>

        <div>
          <h1>CROMTEL NETWORK</h1>
          <p>APPLICATION</p>
        </div>
      </header>

      <main className="container">
        <section className="welcome">
          <p>Welcome back,</p>
          <h2>CROMTEL User 👋</h2>
          <p>Your digital network starts here.</p>
        </section>

        <section className="balance-card">
          <p>Total Balance</p>
          <h2>0.00 CROMTEL</h2>
          <span>Available balance</span>
        </section>

        <section className="stats">
          <div className="stat">
            <span>Mining Status</span>
            <strong>{mining ? "Active" : "Inactive"}</strong>
          </div>

          <div className="stat">
            <span>Mining Rate</span>
            <strong>0.00 / hr</strong>
          </div>
        </section>

        <section className="mining-card">
          <h2>⛏️ CROMTEL Mining</h2>

          <p>
            Start your mining session and participate
            in the CROMTEL Network ecosystem.
          </p>

          <button
            onClick={() => setMining(!mining)}
          >
            {mining ? "Stop Mining" : "Start Mining"}
          </button>

          <p className="notice">
            Demo interface — mining rewards are not
            connected to a blockchain yet.
          </p>
        </section>

        <section className="menu">
          <div>👤 My Profile</div>
          <div>💰 My Balance</div>
          <div>⛏️ Mining Sessions</div>
          <div>🔗 Referrals</div>
          <div>📋 Transactions</div>
        </section>
      </main>

      <footer>
        © 2026 CROMTEL NETWORK APPLICATION
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <App />
);
