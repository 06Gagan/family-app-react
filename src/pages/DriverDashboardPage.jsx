import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function DriverDashboardPage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDriversData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setError("Could not identify the current user.");
        setLoading(false);
        return;
    }

    // Proactively fixed the same bug here for the driver
    const { data, error: fetchError } = await supabase
      .from('child_activities')
      .select(`*, child:profiles(full_name)`)
      .eq('assigned_to_driver_id', user.id) // Filters for activities assigned to this driver
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (fetchError) {
      setError("Could not fetch your schedule.");
      console.error(fetchError);
    } else {
      setSchedule(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDriversData();
  }, [fetchDriversData]);

  return (
    <>
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white">Driver's Schedule</h1>
        <p className="text-purple-200 mt-1">Your pickups and drop-offs for the coming days.</p>
      </header>

      {loading && <p className="text-white text-center">Loading your schedule...</p>}
      {error && <p className="text-yellow-300 text-center">{error}</p>}
      
      <div className="bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
        <h2 className="text-2xl font-semibold mb-6 text-white">Your Itinerary</h2>
        {!loading && schedule.length === 0 ? (
          <div className="text-center p-12 bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-white text-xl">You have no trips scheduled.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {schedule.map(activity => (
              <li key={activity.id} className="p-5 border border-white/20 rounded-lg bg-white/30 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-white">{activity.title}</h3>
                  <p className="text-cyan-200 font-semibold">For: {activity.child?.full_name || 'N/A'}</p>
                  <p className="text-purple-200 text-sm mt-1">
                    {new Date(activity.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {activity.time}
                  </p>
                  {activity.location && <p className="text-sm text-purple-200 mt-1"><strong>Location:</strong> {activity.location}</p>}
                </div>
                {activity.location && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(activity.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 font-bold text-blue-600 bg-white rounded-lg shadow-lg hover:bg-gray-200 transition"
                  >
                    Map
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}