import React from 'react';

export default function Settings() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Local Profile Settings</h1>
          <p className="text-sm text-gray-600 mb-4">
            Use this page to configure your personal admin profile and local preferences. This area is designed to support your day-to-day site management tasks.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-600">Your profile settings will include contact details, notification preferences, and dashboard layout options in future releases.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
