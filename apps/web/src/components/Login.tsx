import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
      localStorage.setItem("token", data.session.access_token);
    }

    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center bg-background text-text">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md p-8 rounded-lg shadow-lg bg-surface text-text"
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 mb-4 rounded-md border border-secondaryText bg-[#3C354D] text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 mb-6 rounded-md border border-secondaryText bg-[#3C354D] text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md font-semibold transition bg-primary text-text hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-4 text-center text-sm text-secondaryText">
            Don't have an account?{" "}
            <Link to="/signup" className="text-accent underline hover:text-opacity-80">
              Sign Up
            </Link>
          </p>
        </form>
      </div>

      {/* Right side - Logo */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/assets/logo.png"
          alt="TalkSpot Logo"
          className="h-[375px] w-[375px] object-contain select-none"
        />
      </div>
    </div>
  );
}
