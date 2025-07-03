import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/themeContext";

export default function Login() {
  const { theme } = useTheme();
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

    if (data.session) {
      localStorage.setItem("token", data.session.access_token);
    }

    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center custom-gradient"
      style={{
        color: "#f5f5f4", // Smoky White text
      }}
    >
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md p-8 rounded-lg shadow-lg"
          style={{
            backgroundColor: "#000000", // Black form background
            color: "#f5f5f4",
          }}
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 mb-4 rounded-md border bg-gray-800 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-purpl"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 mb-6 rounded-md border bg-gray-800 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-purpl"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purpl hover:bg-tel rounded-md font-semibold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-purpl underline hover:text-tel"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>

      {/* Right side - Logo */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/assets/logo.png"
          alt="Zyleno Logo"
          className="h-100 w-100 object-contain select-none"
        />
      </div>
    </div>
  );
}
