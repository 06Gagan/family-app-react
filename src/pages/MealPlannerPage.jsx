import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

export default function MealPlannerPage() {
  const navigate = useNavigate();
  const [cooks, setCooks] = useState([]);
  const [assignedCook, setAssignedCook] = useState('');
  const [preferences, setPreferences] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCooks = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'cook');
      if (error) {
        console.error("Failed to fetch cooks", error);
      } else {
        setCooks(data);
      }
    };
    fetchCooks();
  }, []);

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: planData, error: invokeError } = await supabase.functions.invoke('generate-meal-plan', {
        body: { preferences, mood }
      });

      if (invokeError) throw invokeError;
      if (planData.error) throw new Error(planData.error);
      if (!planData.mealPlan) throw new Error("The AI did not return a valid meal plan.");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in.");
      
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('family_id').eq('id', user.id).single();
      if (profileError || !profileData) throw new Error("Could not find your profile to save the plan.");

      const { error: insertError } = await supabase.from('meal_plans').insert({
        user_id: user.id,
        family_id: profileData.family_id,
        meals_json: planData.mealPlan,
        week_start: new Date().toISOString().split('T')[0],
        assigned_to_cook_id: assignedCook || null,
      });

      if (insertError) throw new Error(`Failed to save meal plan: ${insertError.message}`);
      
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to generate or save meal plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="mb-10">
        <Link to="/dashboard" className="text-purple-100 hover:text-white hover:underline text-sm mb-2 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-4xl font-bold text-white">AI Meal Planner</h1>
        <p className="text-purple-200 mt-1">Let AI create a delicious weekly plan for you.</p>
      </header>
      <div className="bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
        <form onSubmit={handleGeneratePlan} className="space-y-6">
          <div>
            <label htmlFor="preferences" className="block text-lg font-semibold text-white mb-2">What does your family like to eat?</label>
            <textarea id="preferences" value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="e.g., We love Italian, one person is vegetarian..." required className="w-full mt-1 p-4 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none h-32" />
          </div>
          <div>
            <label htmlFor="mood" className="block text-lg font-semibold text-white mb-2">What's the mood for this week? <span className="text-purple-200 font-normal">(Optional)</span></label>
            <input id="mood" type="text" value={mood} onChange={(e) => setMood(e.target.value)} placeholder="e.g., Light and healthy, quick meals..." className="w-full mt-1 p-4 bg-white/50 text-gray-800 placeholder-gray-500 border-2 border-transparent rounded-lg focus:border-white focus:outline-none" />
          </div>
          <div>
            <label htmlFor="cook" className="block text-lg font-semibold text-white mb-2">Assign to Cook <span className="text-purple-200 font-normal">(Optional)</span></label>
            <select id="cook" value={assignedCook} onChange={(e) => setAssignedCook(e.target.value)} className="w-full mt-1 p-4 bg-white/50 text-gray-800 border-2 border-transparent rounded-lg focus:border-white focus:outline-none appearance-none">
              <option value="" className="text-gray-500">No one</option>
              {cooks.map(cook => (<option key={cook.id} value={cook.id} className="text-black">{cook.full_name}</option>))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full px-6 py-4 font-bold text-purple-600 bg-white rounded-lg shadow-lg hover:bg-gray-200 disabled:opacity-50 transition-all transform hover:scale-105">{loading ? 'Generating...' : '✨ Generate My Plan'}</button>
        </form>
        {error && <p className="mt-4 text-center text-yellow-300">{error}</p>}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Success!"><p className="mb-4">Your new meal plan has been generated and saved!</p><button onClick={() => navigate('/shopping-list')} className="w-full px-4 py-3 font-medium text-white bg-green-600 rounded-lg">Go to Shopping List</button></Modal>
    </>
  );
}