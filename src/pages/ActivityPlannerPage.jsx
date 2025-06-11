import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ActivityPlannerPage() {
  const [activities, setActivities] = useState([]);
  const [children, setChildren] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({ title: '', child_id: '', date: '', time: '', location: '', assigned_to_driver_id: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: childrenData, error: childrenError } = await supabase.from('profiles').select('id, full_name').eq('role', 'child'); 
    if (childrenError) setError('Failed to fetch children.');
    else setChildren(childrenData || []);
    
    const { data: driversData, error: driversError } = await supabase.from('profiles').select('id, full_name').eq('role', 'driver');
    if (driversError) setError(prev => prev + ' Failed to fetch drivers.');
    else setDrivers(driversData || []);

    // I've made the query unambiguous by specifying which column to join on.
    // This will now correctly fetch the child's name and the driver's name.
    const { data: actsData, error: actsError } = await supabase
      .from('child_activities')
      .select(`
        *,
        child:profiles!child_id(full_name),
        driver:profiles!assigned_to_driver_id(full_name)
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (actsError) {
      setError('Failed to fetch activities: ' + actsError.message);
    } else {
      setActivities(actsData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be logged in."); return; }
    
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('family_id').eq('id', user.id).single();
    if (profileError) { setError("Could not find user's family information."); return; }
    
    const dataToInsert = {
      ...formData,
      family_id: profileData.family_id,
      assigned_to_driver_id: formData.assigned_to_driver_id || null,
    };

    const { error: insertError } = await supabase.from('child_activities').insert([dataToInsert]);
    if (insertError) setError('Failed to add activity: ' + insertError.message);
    else {
      setFormData({ title: '', child_id: '', date: '', time: '', location: '', assigned_to_driver_id: '' });
      fetchData();
    }
  };

  return (
    <>
      <header className="mb-10">
        <Link to="/dashboard" className="text-purple-100 hover:text-white hover:underline text-sm mb-2 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-4xl font-bold text-white">Activity Planner</h1>
        <p className="text-purple-200 mt-1">Keep track of everyone's schedule.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
          <h2 className="text-2xl font-semibold mb-6 text-white">Add New Activity</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="title" placeholder="Activity Title" value={formData.title} onChange={handleChange} required className="w-full p-3 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
            <select name="child_id" value={formData.child_id} onChange={handleChange} required className="w-full p-3 bg-white/50 text-gray-800 border-2 border-transparent rounded-lg focus:border-white focus:outline-none appearance-none">
              <option value="" className="text-gray-500">Assign to child</option>
              {children.map(child => <option key={child.id} value={child.id} className="text-black">{child.full_name}</option>)}
            </select>
             <select name="assigned_to_driver_id" value={formData.assigned_to_driver_id} onChange={handleChange} className="w-full p-3 bg-white/50 text-gray-800 border-2 border-transparent rounded-lg focus:border-white focus:outline-none appearance-none">
              <option value="" className="text-gray-500">Assign to driver (Optional)</option>
              {drivers.map(driver => <option key={driver.id} value={driver.id} className="text-black">{driver.full_name}</option>)}
            </select>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-3 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
            <input type="time" name="time" value={formData.time} onChange={handleChange} required className="w-full p-3 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
            <input type="text" name="location" placeholder="Location (Optional)" value={formData.location} onChange={handleChange} className="w-full p-3 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none"/>
            <button type="submit" className="w-full py-3 font-bold text-cyan-600 bg-white rounded-lg shadow-lg hover:bg-gray-200 transition transform hover:scale-105">Add Activity</button>
            {error && <p className="text-sm text-center text-yellow-300 pt-2">{error}</p>}
          </form>
        </div>
        <div className="lg:col-span-2 bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
          <h2 className="text-2xl font-semibold mb-6 text-white">Upcoming Activities</h2>
          {loading ? <p className="text-white">Loading activities...</p> : (
            <ul className="space-y-4">
              {activities.length > 0 ? activities.map(activity => (
                <li key={activity.id} className="p-5 border border-white/20 rounded-lg bg-white/30">
                  <h3 className="font-bold text-lg text-white">{activity.title}</h3>
                  <p className="text-cyan-200 font-semibold">For: {activity.child?.full_name || 'N/A'}</p>
                  {/* I've added a line to display the driver's name if available */}
                  {activity.driver && <p className="text-cyan-200 font-semibold">Driver: {activity.driver.full_name}</p>}
                  <p className="text-purple-200 text-sm mt-1">{new Date(activity.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {activity.time}</p>
                  {activity.location && <p className="text-sm text-purple-200 mt-1"><strong>Location:</strong> {activity.location}</p>}
                </li>
              )) : <p className="text-center text-purple-200 py-8">No activities scheduled yet.</p>}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}