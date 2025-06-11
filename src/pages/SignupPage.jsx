import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('parent');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: role },
        // After confirmation, the user is sent to the login page to complete setup.
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setIsModalOpen(true);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-white text-center mb-6">Create Your Family</h2>
      <form onSubmit={handleSignup} className="space-y-4">
        <input type="text" placeholder="Your Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 bg-white/30 text-white placeholder-purple-200 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/30 text-white placeholder-purple-200 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/30 text-white placeholder-purple-200 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
        <select value={role} onChange={(e) => setRole(e.target.value)} required className="w-full px-4 py-3 bg-white/30 text-white border-2 border-transparent rounded-lg focus:border-white focus:outline-none appearance-none">
          <option value="parent" className="text-black">I'm a Parent</option>
          <option value="admin" className="text-black">I'm an Admin</option>
        </select>
        {error && <p className="text-sm text-yellow-300 text-center">{error}</p>}
        <button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-purple-600 bg-white rounded-lg shadow-lg hover:bg-gray-200 transition">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-sm text-center text-purple-200 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-white hover:underline">
          Login
        </Link>
      </p>
      <Modal isOpen={isModalOpen} onClose={() => navigate('/login')} title="One Last Step!">
        <p className="mb-4 text-gray-600">We've sent a confirmation link to your email. Please click the link to activate your account, then return to the login page.</p>
        <button onClick={() => navigate('/login')} className="w-full px-4 py-2 font-medium text-white bg-green-600 rounded-lg">OK</button>
      </Modal>
    </div>
  );
}