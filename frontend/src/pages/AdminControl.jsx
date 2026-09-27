import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminControl() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">System Settings</h1>
          <p className="text-sm text-gray-600 mb-6">
            Manage the deanery control center from one place. Use this page to review system configuration, administrative utilities, and your personal profile settings.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">System configuration</h2>
              <p className="text-sm text-slate-600 mt-2">
                Manage site defaults, workflow settings, role visibility, and the public-facing administration tools.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 p-5 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">Admin utilities</h2>
              <p className="text-sm text-slate-600 mt-2">
                Access executive tools, audit-related actions, and future operational controls for the deanery team.
              </p>
            </div>

            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
              <h2 className="text-lg font-semibold text-indigo-900">Local profile settings</h2>
              <p className="text-sm text-indigo-700 mt-2">
                Update your personal information, contact details, and account password from your profile editor.
              </p>
              <Link
                to="/profile"
                className="mt-4 inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                Open profile settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
