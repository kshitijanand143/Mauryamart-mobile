import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-8xl mb-4">🍽️</div>
        <h1 className="text-6xl font-black text-brand-500 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page not found</h2>
        <p className="text-sm text-gray-500 mb-8">
          Looks like this page went out for delivery and never came back.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/" className="btn-primary">Go to home</Link>
          <button onClick={() => navigate(-1)} className="btn-secondary">Go back</button>
        </div>
      </div>
    </div>
  );
}
