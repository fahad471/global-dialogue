import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    alert('Signup successful! Please check your email to confirm your account.');
    navigate('/login'); // Redirect to login after signup
  };

  return (
    <form onSubmit={handleSignup} className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">Sign Up</h2>

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
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>

      <p>
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 underline">
          Login
        </Link>
      </p>
    </form>
  );
}
