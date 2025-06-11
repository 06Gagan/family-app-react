import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-pink-500 to-red-500"
         style={{ animation: 'liquid-gradient 15s ease infinite', backgroundSize: '400% 400%' }}>
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white shadow-sm">FamilySync</h1>
        <p className="text-purple-200 mt-2">The smart way to manage your household.</p>
      </div>
      <Outlet />
    </div>
  );
}