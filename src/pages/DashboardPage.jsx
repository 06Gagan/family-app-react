import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const FeatureCard = ({ to, title, description, icon, color }) => (
  <Link to={to} className={`block p-6 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300 ${color}`}>
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-white/80">{description}</p>
  </Link>
);

export default function DashboardPage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    return (
        <div>
            <header className="mb-10">
                <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                {user && <p className="text-gray-500 mt-1">Welcome back, {user.email}!</p>}
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard to="/meal-planner" title="AI Meal Planner" description="Create weekly meal plans with AI." icon="🍳" color="bg-gradient-to-br from-purple-500 to-indigo-600" />
                <FeatureCard to="/shopping-list" title="Shopping List" description="Generate your grocery lists instantly." icon="🛒" color="bg-gradient-to-br from-pink-500 to-rose-500" />
                <FeatureCard to="/activity-planner" title="Activity Planner" description="Manage your child's schedule." icon="🗓️" color="bg-gradient-to-br from-sky-500 to-cyan-500" />
                <FeatureCard to="/chore-management" title="Chore Manager" description="Assign and track family chores." icon="🧹" color="bg-gradient-to-br from-amber-500 to-orange-500" />
                <FeatureCard to="/family-management" title="Manage Family" description="Invite and manage family members." icon="👨‍👩‍👧‍👦" color="bg-gradient-to-br from-teal-500 to-emerald-500" />
            </main>
        </div>
    );
}