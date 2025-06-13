import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ShoppingListPage() {
  const [shoppingList, setShoppingList] = useState({});
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [budgetMode, setBudgetMode] = useState(false);

  // My new function to fetch the latest shopping list from the database.
  const fetchLatestShoppingList = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('items_json')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (data) {
      setShoppingList(data.items_json || {});
    }
    setLoading(false);
  }, []);

  const fetchLatestMealPlan = useCallback(async () => {
    const { data, error } = await supabase.from('meal_plans').select('meals_json').order('created_at', { ascending: false }).limit(1).single();
    if (error) console.log("No meal plan found.");
    else if (data) setMealPlan(data.meals_json);
  }, []);

  useEffect(() => {
    // I'll fetch both the latest meal plan and the latest shopping list when the page loads.
    fetchLatestMealPlan();
    fetchLatestShoppingList();
  }, [fetchLatestMealPlan, fetchLatestShoppingList]);

  const handleGenerateList = async () => {
    if (!mealPlan) {
      setError("Please generate a meal plan first.");
      return;
    }
    setShoppingList({});
    setGenerating(true);
    setError('');

    try {
      const { data: generatedData, error: invokeError } = await supabase.functions.invoke('generate-shopping-list', {
        body: { mealPlan, budgetMode }
      });

      if (invokeError) throw invokeError;
      if (generatedData.error) throw new Error(generatedData.error);
      if (!generatedData.shoppingList) throw new Error("The AI did not return a valid shopping list.");

      setShoppingList(generatedData.shoppingList);

      // After generating the list, I'll save it to the database.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to save a list.");

      const { data: profile } = await supabase.from('profiles').select('family_id').eq('id', user.id).single();
      if (!profile) throw new Error("Could not find your profile to save the list.");

      const { error: insertError } = await supabase.from('shopping_lists').insert({
        user_id: user.id,
        family_id: profile.family_id,
        items_json: generatedData.shoppingList,
      });

      if (insertError) throw new Error(`Failed to save shopping list: ${insertError.message}`);

    } catch (err) {
      setError(err.message || "Failed to generate shopping list.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <p className="text-center text-lg text-white">Loading your data...</p>;

  return (
    <>
      <header className="mb-10">
        <Link to="/dashboard" className="text-purple-100 hover:text-white hover:underline text-sm mb-2 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-4xl font-bold text-white">Shopping List</h1>
        <p className="text-purple-200 mt-1">Generate a list from your latest meal plan.</p>
      </header>

      {!mealPlan ? (
        <div className="text-center p-12 bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-white text-xl">You don't have a meal plan yet.</p>
            <Link to="/meal-planner" className="mt-6 inline-block px-8 py-3 font-bold text-purple-600 bg-white rounded-lg shadow-lg hover:bg-gray-200 transition transform hover:scale-105">Create a Meal Plan</Link>
        </div>
      ) : (
        <div className="bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Your Latest Meal Plan</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {Object.values(mealPlan).map(meal => <div key={meal.meal_name} className="bg-white/30 p-3 rounded-lg text-white text-sm font-medium">{meal.meal_name}</div>)}
          </div>
          <div className="flex items-center mb-6"><input type="checkbox" id="budgetMode" checked={budgetMode} onChange={() => setBudgetMode(!budgetMode)} className="h-5 w-5 rounded text-indigo-400 focus:ring-indigo-300 border-gray-300 bg-white/50" /><label htmlFor="budgetMode" className="ml-3 block text-md text-white">Budget-Friendly Mode</label></div>
          <button onClick={handleGenerateList} disabled={generating} className="w-full px-6 py-4 font-bold text-green-600 bg-white rounded-lg shadow-lg hover:bg-gray-200 disabled:opacity-50 transition-all transform hover:scale-105">{generating ? 'Generating...' : '🛒 Generate Shopping List'}</button>
        </div>
      )}

      {error && <p className="mt-4 text-center text-yellow-300">{error}</p>}

      {Object.keys(shoppingList).length > 0 && (
        <div className="bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30">
          <h2 className="text-3xl font-bold mb-6 text-white">Your Shopping List</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(shoppingList).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-bold text-xl text-purple-200 border-b-2 border-white/30 pb-2 mb-4">{category}</h3>
                <ul className="space-y-3">
                  {Array.isArray(items) && items.map((item, index) => <li key={index} className="text-white pl-2 border-l-4 border-purple-300">{typeof item === 'object' ? item.item : item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}