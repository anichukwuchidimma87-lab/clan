import React from 'react';

export default function AdminControl() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">System Settings</h1>
          <p className="text-sm text-gray-600 mb-6">
            This admin control center is the starting point for your management settings. Use it to configure your Deanery site workflows, user tiers, and content categories.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">System configuration</h2>
              <p className="text-sm text-slate-600 mt-2">Manage site defaults, enable or disable content modules, and review your public stats workflow.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-5 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">Admin utilities</h2>
              <p className="text-sm text-slate-600 mt-2">Future features include audit trails, backup automation, and role-based permissions for your executive team.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
