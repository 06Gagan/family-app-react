import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const choreIcons = {
  default: '⭐',
  room: '🛏️',
  dishes: '🍽️',
  pet: '🐾',
  garden: '🌱',
};

const getChoreIcon = (task) => {
  const taskLower = task.toLowerCase();
  if (taskLower.includes('room')) return choreIcons.room;
  if (taskLower.includes('dishes')) return choreIcons.dishes;
  if (taskLower.includes('pet') || taskLower.includes('dog') || taskLower.includes('cat')) return choreIcons.pet;
  if (taskLower.includes('garden') || taskLower.includes('plant')) return choreIcons.garden;
  return choreIcons.default;
};

export default function ChildDashboardPage() {
  const [user, setUser] = useState(null);
  const [chores, setChores] = useState([]);
  const [completedPoints, setCompletedPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchChildData = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('assigned_to_child_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        setError("Could not fetch your chores.");
      } else {
        const choreData = data || [];
        setChores(choreData);
        const totalPoints = choreData.filter(c => c.status === 'completed').reduce((sum, chore) => sum + (chore.reward_points || 10), 0);
        setCompletedPoints(totalPoints);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChildData();
  }, [fetchChildData]);

  const handleMarkAsComplete = async (choreId) => {
    const { error } = await supabase
      .from('chores')
      .update({ status: 'completed' })
      .eq('id', choreId);
    
    if (error) {
        setError(`Error: ${error.message}`);
    } else {
        fetchChildData(); 
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-blue-50">
        <p className="text-center text-lg text-blue-500">Loading Your Mission Control...</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-blue-50 p-4 sm:p-6 lg:p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-start mb-10">
        <div>
            <h1 className="text-4xl font-bold text-blue-800">Mission Control</h1>
            {user && <p className="text-gray-500 mt-1">Ready for today's adventures, {user.email}?</p>}
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right p-4 bg-yellow-300 rounded-2xl shadow-lg border-4 border-white">
                <div className="text-4xl font-bold text-yellow-800">{completedPoints}</div>
                <div className="text-sm font-semibold text-yellow-700">Points! 🌟</div>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {error && <p className="text-center text-red-500 mb-4 bg-red-100 p-3 rounded-lg">{error}</p>}
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Your Active Missions:</h2>
        
        {chores.filter(c => c.status === 'pending').length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {chores.filter(c => c.status === 'pending').map(chore => (
              <div key={chore.id} className="bg-white p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300 flex flex-col justify-between">
                <div>
                  <div className="text-6xl mb-4 text-center">{getChoreIcon(chore.task)}</div>
                  <h3 className="font-bold text-2xl text-gray-800 text-center">{chore.task}</h3>
                  {chore.due_date && <p className="text-sm text-gray-500 mt-2 text-center">Due: {chore.due_date}</p>}
                </div>
                <button 
                  onClick={() => handleMarkAsComplete(chore.id)} 
                  className="mt-6 w-full px-4 py-3 text-lg font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors shadow-lg"
                >
                  Mission Complete!
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800">All Missions Accomplished!</h2>
            <p className="text-gray-600 mt-2">Time for a well-deserved break, superstar!</p>
          </div>
        )}

        <div className="mt-16">
          <h3 className="text-xl font-bold text-gray-400 mb-4">Completed Mission Log</h3>
          <ul className="space-y-2">
              {chores.filter(c => c.status === 'completed').map(chore => (
                  <li key={chore.id} className="p-3 text-gray-500 line-through bg-white rounded-lg shadow-sm">{chore.task}</li>
              ))}
          </ul>
        </div>
      </main>
    </div>
  );
}