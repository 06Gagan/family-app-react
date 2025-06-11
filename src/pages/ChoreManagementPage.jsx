import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ChoreManagementPage() {
  const [chores, setChores] = useState([]);
  const [children, setChildren] = useState([]);
  const [formData, setFormData] = useState({ task: '', assigned_to_child_id: '', due_date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // I have restored the full data fetching logic that was accidentally removed.
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: childrenData, error: childrenError } = await supabase
      .from('profiles').select('id, full_name').eq('role', 'child');
    if (childrenError) setError('Failed to fetch children.');
    else setChildren(childrenData || []);
    
    const { data: choresData, error: choresError } = await supabase
      .from('chores').select(`*, child:profiles(full_name)`)
      .order('created_at', { ascending: false });
    if (choresError) setError('Failed to fetch chores.');
    else setChores(choresData || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // I have also restored the logic for handling form input changes.
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // And the logic for submitting the new chore to the database.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('family_id').eq('id', user.id).single();
    if (!profile) { setError("Could not find your profile."); return; }
    
    const { error: insertError } = await supabase.from('chores').insert([{
      ...formData,
      family_id: profile.family_id,
    }]);

    if (insertError) setError('Failed to add chore: ' + insertError.message);
    else {
      setFormData({ task: '', assigned_to_child_id: '', due_date: '' });
      fetchData();
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <>
      <header className="mb-10">
        <Link to="/dashboard" className="text-purple-100 hover:text-white hover:underline text-sm mb-2 inline-block">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white">Chore Manager</h1>
        <p className="text-purple-200 mt-1">Assign and track chores for the whole family.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
          <h2 className="text-2xl font-semibold mb-6 text-white">Add New Chore</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="task" placeholder="Chore Task" value={formData.task} onChange={handleChange} required className="w-full p-3 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
            <select name="assigned_to_child_id" value={formData.assigned_to_child_id} onChange={handleChange} required className="w-full p-3 bg-white/50 text-gray-800 border-2 border-transparent rounded-lg focus:border-white focus:outline-none appearance-none">
              <option value="" className="text-gray-500">Assign to child</option>
              {children.map(child => <option key={child.id} value={child.id} className="text-black">{child.full_name}</option>)}
            </select>
            <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full p-3 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
            <button type="submit" className="w-full py-3 font-bold text-orange-600 bg-white rounded-lg shadow-lg hover:bg-gray-200 transition transform hover:scale-105">Add Chore</button>
            {error && <p className="text-sm text-center text-yellow-300 pt-2">{error}</p>}
          </form>
        </div>

        <div className="lg:col-span-2 bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
          <h2 className="text-2xl font-semibold mb-6 text-white">Chore Board</h2>
          {loading ? <p className="text-white">Loading chores...</p> : (
            <ul className="space-y-4">
              {chores.length > 0 ? chores.map(chore => (
                <li key={chore.id} className="p-5 flex justify-between items-center border border-white/20 rounded-lg bg-white/30">
                  <div>
                    <p className="font-bold text-lg text-white">{chore.task}</p>
                    <p className="text-sm text-purple-200">For: <span className="font-medium">{chore.child?.full_name || 'N/A'}</span></p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(chore.status)}`}>
                    {chore.status}
                  </span>
                </li>
              )) : <p className="text-center text-purple-200 py-8">No chores assigned yet.</p>}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}