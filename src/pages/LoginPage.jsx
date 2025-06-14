import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    
    // After login, call the function to set up the family if needed.
    await supabase.rpc('setup_family_for_new_parent');
    
    setLoading(false);
    navigate('/dispatch');
  };

  return (
    <div className="w-full max-w-md bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-white text-center mb-6">Welcome Back</h2>
      <form onSubmit={handleLogin} className="space-y-6">
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/30 text-white placeholder-purple-200 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/30 text-white placeholder-purple-200 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
        
        {error && <p className="text-sm text-yellow-300 text-center">{error}</p>}
        
        <button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-purple-600 bg-white rounded-lg shadow-lg hover:bg-gray-200 transition">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-sm text-center text-purple-200 mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="font-bold text-white hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}