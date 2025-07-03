import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/themeContext";

export default function Signup() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen flex items-center custom-gradient"
      style={{
        color: "#f5f5f4", // Smoky white text
      }}
    >
      {/* Left side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <form
          onSubmit={handleSignup}
          className="w-full max-w-md p-8 rounded-lg shadow-lg"
          style={{
            backgroundColor: "#000000", // Black form background
            color: "#f5f5f4",
          }}
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>

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
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <p className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-purpl underline hover:text-tel">
              Login
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
