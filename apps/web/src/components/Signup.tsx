import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    alert("Signup successful! Please check your email to confirm your account.");
    setLoading(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center bg-background text-text">
      {/* Left side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <form
          onSubmit={handleSignup}
          className="w-full max-w-md p-8 rounded-lg shadow-lg bg-surface text-text"
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>

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
            className="w-full p-3 mb-4 rounded-md border border-secondaryText bg-[#3C354D] text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <input
            type="password"
            placeholder="Repeat Password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            required
            className="w-full p-3 mb-6 rounded-md border border-secondaryText bg-[#3C354D] text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md font-semibold transition bg-primary text-text hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <p className="mt-4 text-center text-sm text-secondaryText">
            Already have an account?{" "}
            <Link to="/login" className="text-accent underline hover:text-opacity-80">
              Login
            </Link>
          </p>
        </form>
      </div>

      {/* Right side - Logo */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/assets/logo.png"
          alt="Zynqer Logo"
          className="h-[375px] w-[375px] object-contain select-none"
        />
      </div>
    </div>
  );
}
