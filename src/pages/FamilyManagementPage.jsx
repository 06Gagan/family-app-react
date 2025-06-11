import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

export default function FamilyManagementPage() {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'child' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in.");
      
      const { data: profile, error: profileError } = await supabase.from('profiles').select('family_id').eq('id', user.id).single();
      if (profileError) throw new Error("Could not find your profile.");

      const { data, error: invokeError } = await supabase.functions.invoke('invite-member', { body: { ...formData, family_id: profile.family_id } });
      if (invokeError) throw invokeError;
      if (data.error) throw new Error(data.error);

      setIsModalOpen(true);
      setFormData({ fullName: '', email: '', password: '', role: 'child' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="mb-10">
        <Link to="/dashboard" className="text-purple-100 hover:text-white hover:underline text-sm mb-2 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-4xl font-bold text-white">Manage Family</h1>
        <p className="text-purple-200 mt-1">Invite new members and manage roles.</p>
      </header>

      <div className="max-w-2xl mx-auto bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
        <h2 className="text-2xl font-semibold mb-6 text-white">Invite New Member</h2>
        <form onSubmit={handleInvite} className="space-y-4">
          <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="Full Name" required className="w-full p-3 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="w-full p-3 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Temporary Password" required className="w-full p-3 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
          <select name="role" value={formData.role} onChange={handleChange} required className="w-full p-3 bg-white/50 text-gray-800 border-2 border-transparent rounded-lg focus:border-white focus:outline-none appearance-none">
            <option value="child" className="text-black">Child</option>
            <option value="parent" className="text-black">Parent</option>
            <option value="cook" className="text-black">Cook</option>
            <option value="driver" className="text-black">Driver</option>
          </select>
          <button type="submit" disabled={loading} className="w-full py-3 font-bold text-emerald-600 bg-white rounded-lg shadow-lg hover:bg-gray-200 transition transform hover:scale-105">
            {loading ? 'Sending Invite...' : 'Send Invite'}
          </button>
          {error && <p className="text-yellow-300 text-sm text-center mt-2">{error}</p>}
        </form>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Invite Sent!">
        <p>The new family member has been invited. They will need to click the confirmation link sent to their email to log in.</p>
      </Modal>
    </>
  );
}