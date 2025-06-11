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

    const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    
    if (signInData.user) {
      // After a successful login, check if a profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', signInData.user.id)
        .single();

      // If no profile exists, this must be their first login after email confirmation.
      if (!profile) {
        const { full_name, role } = signInData.user.user_metadata;
        
        // This check is crucial for self-registering parents/admins.
        if (role === 'parent' || role === 'admin') {
          // Step A: Create a family for the new parent.
          const { data: newFamily, error: familyError } = await supabase
            .from('families')
            .insert({ family_name: `${full_name}'s Family` })
            .select('id')
            .single();
          
          if (familyError) {
            setError(`Failed to create a family: ${familyError.message}`);
            setLoading(false);
            return;
          }

          // Step B: Create their profile and link it to the new family.
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: signInData.user.id, full_name, role, family_id: newFamily.id });
          
          if (profileError) {
             setError(`Login succeeded, but failed to create your profile: ${profileError.message}`);
             setLoading(false);
             return;
          }
        }
      }
    }

    // After ensuring a profile exists, safely dispatch the user
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