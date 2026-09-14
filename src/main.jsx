
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
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (miningData) {
      setMining(true);
      setMiningId(miningData.id);
    } else {
      setMining(false);
      setMiningId(null);
    }
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
    if (!session?.user) return;

    setMessage("");

    const { data, error } = await supabase
      .from("mining_sessions")
      .insert({
        user_id: session.user.id,
        mining_rate: 0,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setMining(true);
    setMiningId(data.id);
  }

  async function stopMining() {
    if (!miningId) return;

    const { error } = await supabase
      .from("mining_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", miningId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMining(false);
    setMiningId(null);
  }

  if (loading) {
    return <div className="app">Loading CROMTEL NETWORK...</div>;
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
        </header>

        <main className="container">
          <section className="welcome">
            <h2>
              {authMode === "login"
                ? "Welcome Back"
                : "Create Your Account"}
            </h2>

            <p>
              {authMode === "login"
                ? "Login to access your CROMTEL Network dashboard."
                : "Join the CROMTEL Network community today."}
            </p>
          </section>

          <form className="auth-card" onSubmit={handleAuth}>
            <h2>
              {authMode === "login" ? "Sign In" : "Sign Up"}
            </h2>

            {authMode === "signup" && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <button type="submit">
              {authMode === "login"
                ? "Login"
                : "Create Account"}
            </button>

            {message && <p className="notice">{message}</p>}
          </form>

          <p className="switch-auth">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              className="link-button"
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "signup" : "login"
                );
                setMessage("");
              }}
            >
              {authMode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        </main>

        <footer>© 2026 CROMTEL NETWORK APPLICATION</footer>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">⚡</div>
        <div>
          <h1>CROMTEL NETWORK</h1>
          <p>APPLICATION</p>
        </div>

        <button className="logout" onClick={logout}>
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
          <p>Total Balance</p>
          <h2>{balance.toFixed(2)} CROMTEL</h2>
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
          <h2>⛏ CROMTEL Mining</h2>

          <p>
            Start your mining session and participate
            in the CROMTEL Network ecosystem.
          </p>

          <button onClick={mining ? stopMining : startMining}>
            {mining ? "Stop Mining" : "Start Mining"}
          </button>

          <p className="notice">
            Demo interface — mining rewards are not
            connected to a blockchain yet.
          </p>

          {message && <p className="notice">{message}</p>}
        </section>

        <section className="menu">
          <div>👤 My Profile</div>
          <div>💰 My Balance</div>
          <div>⛏ Mining Sessions</div>
          <div>🔗 Referrals</div>
          <div>📋 Transactions</div>
        </section>
      </main>

      <footer>© 2026 CROMTEL NETWORK APPLICATION</footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <App />
);
