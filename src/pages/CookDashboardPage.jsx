import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function CookDashboardPage() {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const fetchCooksData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('assigned_to_cook_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error("Error fetching meal plans:", fetchError);
      setError("Could not fetch your assigned meal plans.");
    } else {
      console.log("Fetched meal plans:", data);
      setMealPlans(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    fetchCooksData();
  }, [fetchCooksData]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 sm:p-6 lg:p-8">
      <header className="mb-10 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white">Cook's Dashboard</h1>
        <p className="text-purple-200 mt-1">Here are the meal plans assigned to you.</p>
      </header>
      
      <main className="max-w-7xl mx-auto">
        {loading && <p className="text-white text-center">Loading your kitchen tasks...</p>}
        {error && <p className="text-yellow-300 text-center">{error}</p>}

        <div className="space-y-8">
          {!loading && mealPlans.length === 0 ? (
            <div className="text-center p-12 bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-white text-xl">No meal plans have been assigned to you yet.</p>
            </div>
          ) : (
            mealPlans.map(plan => (
              <div key={plan.id} className="bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Week of: {new Date(plan.week_start).toLocaleDateString()}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(plan.meals_json).map(([day, meal]) => (
                    <div key={day} className="bg-white/30 p-4 rounded-lg">
                      <h3 className="font-bold text-white capitalize">{day}</h3>
                      <p className="text-lg text-purple-100 font-semibold">{meal.meal_name}</p>
                      <p className="text-sm text-purple-200 mt-1">{meal.description}</p>
                      {meal.chef_tip && (
                        <p className="text-xs text-yellow-200 italic mt-3 bg-black/20 p-2 rounded">
                          <strong>Chef's Tip:</strong> {meal.chef_tip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}