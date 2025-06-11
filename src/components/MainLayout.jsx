import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function MainLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    // I'm using a darker, more vibrant gradient that provides better contrast.
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
         style={{ animation: 'liquid-gradient 20s ease infinite', backgroundSize: '400% 400%' }}>
      <header className="bg-white/70 backdrop-blur-lg sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link to="/dashboard" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              FamilySync
            </Link>
            <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition"
            >
                Logout
            </button>
        </div>
      </header>
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}