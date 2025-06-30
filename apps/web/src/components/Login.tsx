import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate('/profile'); // Redirect to profile form after login
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">Login</h2>

      {error && <p className="text-red-600">{error}</p>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="input"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="input"
      />

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p>
        Don't have an account?{' '}
        <Link to="/signup" className="text-blue-600 underline">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
