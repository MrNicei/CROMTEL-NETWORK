
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";
import "./style.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [mining, setMining] = useState(false);
  const [miningId, setMiningId] = useState(null);
  const [miningEndsAt, setMiningEndsAt] = useState(null);
const [timeRemaining, setTimeRemaining] = useState(0);
  
  function formatTimeRemaining(milliseconds) {
  if (milliseconds <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0")
  ].join(":");
}

  useEffect(() => {
  if (!miningEndsAt || !mining) {
    setTimeRemaining(0);
    return;
  }

  const updateCountdown = () => {
    const remaining =
      new Date(miningEndsAt).getTime() - Date.now();

    setTimeRemaining(Math.max(0, remaining));

    if (remaining <= 0) {
      setMessage(
        "Mining circle completed. Updating your CML balance..."
      );

      if (session?.user?.id) {
        loadUserData(session.user.id);
      }
    }
  };

  updateCountdown();

  const timer = setInterval(updateCountdown, 1000);

  return () => clearInterval(timer);
}, [miningEndsAt, mining, session]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadUserData(session.user.id);
    } else {
      setProfile(null);
      setBalance(0);
      setMining(false);
      setMiningId(null);
    }
  }
  }, [session]);

  async function loadUserData(userId) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, referral_code")
      .eq("id", userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    const { data: balanceData } = await supabase
      .from("balances")
      .select("balance, lifetime_earned")
      .eq("user_id", userId)
      .maybeSingle();

    if (balanceData) {
      setBalance(Number(balanceData.balance || 0));
    }

    const { data: miningData } = await supabase
      .from("mining_sessions")
.select("id,status,started_at,ends_at,mining_rate,earned_amount")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (miningData) {
  setMining(true);
  setMiningId(miningData.id);
setMiningEndsAt(miningData.ends_at);
      setMessage("Mining started successfully!");
setLoading(false);
} else {
  setMining(false);
  setMiningId(null);
  setMiningEndsAt(null);
}
      
  async function handleAuth(event) {
    event.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (authMode === "signup" && !username.trim()) {
      setMessage("Please enter a username.");
      return;
    }

    setLoading(true);

    if (authMode === "signup") {
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: "https://cromtel-network.netlify.app",
    data: {
      username: username.trim(),
    },
  },
});
      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Account created! Check your email to confirm your account."
        );
        setAuthMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("");
      }
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function startMining() {
  if (!session) {
    setMessage("Please sign in first.");
    return;
  }

  setMessage("");
  setLoading(true);

  const startedAt = new Date();
  const endsAt = new Date(
    startedAt.getTime() + 12 * 60 * 60 * 1000
  );

  const miningRate = 200 / 12;

  const { data, error } = await supabase
    .from("mining_sessions")
    .insert({
      user_id: session.user.id,
      mining_rate: miningRate,
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      earned_amount: 0,
      status: "active"
    })
    .select("id, started_at, ends_at, mining_rate")
    .single();

  if (error) {
    setMessage("Mining error: " + error.message);
    setLoading(false);
    return;
  }

  setMining(true);
setMiningId(data.id);
setMiningEndsAt(data.ends_at);
  
}

  async function stopMining() {
  if (!miningId) return;

  setLoading(true);
  setMessage("");

  const { data, error } = await supabase.rpc(
    "calculate_mining_reward",
    {
      p_session_id: miningId
    }
  );

  if (error) {
    setMessage("Mining error: " + error.message);
    setLoading(false);
    return;
  }

  const earned = Number(data || 0);

  setMining(false);
  setMiningId(null);
setMiningEndsAt(null);
setTimeRemaining(0);
  setLoading(false);

  setMessage(
    `Mining stopped successfully! You earned ${earned.toFixed(6)} CROMTEL.`
  );

  await loadUserData(session.user.id);
}

  if (!session) {
    return (
  <div className="app">

    <header className="header">
      <div className="logo">⚡</div>

      <div>
        <h1>CROMTEL NETWORK</h1>
        <p>APPLICATION</p>
      </div>

      <button onClick={logout}>
        Logout
      </button>
    </header>

    <main className="container">

      <section className="welcome">
        <h2>
          Welcome, {profile?.username || "CROMTEL User"} 👋
        </h2>

        <p>Your digital network starts here.</p>
      </section>

      <section className="balance-card">

        <span>Total Balance</span>

        <strong>
          {balance.toFixed(2)} CML
        </strong>

        <div className="balance-info">

          <div>
            <span>Mining Status</span>
            <strong>
              {mining ? "ACTIVE" : "INACTIVE"}
            </strong>
          </div>

          <div>
            <span>Mining Rate</span>
            <strong>
              {mining ? "16.67 CML/hr" : "0.00 CML/hr"}
            </strong>
          </div>

        </div>

      </section>

      <section className="mining-card">

        <div className="mining-header">

          <div>
            <h2>⛏️ CROMTEL Mining</h2>

            <p>
              Complete a 12-hour mining circle.
            </p>
          </div>

          <div
            className={
              mining
                ? "status active"
                : "status inactive"
            }
          >
            {mining
              ? "● ACTIVE"
              : "● INACTIVE"}
          </div>

        </div>

        <div className="mining-stats">

          <div className="stat-box">
            <span>Circle Reward</span>
            <strong>200 CML</strong>
          </div>

          <div className="stat-box">
            <span>Mining Rate</span>
            <strong>16.67 CML/hr</strong>
          </div>

        </div>

        {mining && (
          <div className="countdown-box">

            <span>TIME REMAINING</span>

            <strong>
              {formatTimeRemaining(timeRemaining)}
            </strong>

            {miningEndsAt && (
              <small>
                Ends:{" "}
                {new Date(
                  miningEndsAt
                ).toLocaleString()}
              </small>
            )}

          </div>
        )}

        <button
          onClick={
            mining
              ? stopMining
              : startMining
          }
          disabled={loading}
          className={
            mining
              ? "stop-button"
              : "start-button"
          }
        >
          {loading
            ? "Processing..."
            : mining
              ? "Stop Mining"
              : "Start Mining"}
        </button>

        <p className="notice">
          CROMTEL Network reward system is active.
        </p>

        {message && (
          <p className="notice">
            {message}
          </p>
        )}

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

createRoot(document.getElementById("root")).render(
  <App />
);
