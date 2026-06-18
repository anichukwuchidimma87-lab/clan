import React from 'react';
import LeadershipShowcase from '../components/public/LeadershipShowcase';

function Leadership() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[2rem] bg-white p-10 shadow-xl">
          <h1 className="text-4xl font-bold text-slate-900">Executive Leadership</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Discover the leadership team guiding CLAN Benin Deanery with service, vision, and deep community impact.
          </p>
        </div>
        <LeadershipShowcase />
      </div>
    </main>
  );
}

export default Leadership;
