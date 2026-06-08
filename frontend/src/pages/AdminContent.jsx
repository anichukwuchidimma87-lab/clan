import React from 'react';
import { useParams } from 'react-router-dom';

const sectionTitles = {
  'executives-gallery': 'Executives Gallery',
  'patrons-gallery': 'Patronage Gallery',
  'event-chronicles': 'Event Chronicles',
  'orphanage-visitations': 'Orphanage Visitations',
  'awards-recognition': 'Awards & Recognition',
  'voalc': 'VOALC Gallery'
};

export default function AdminContent() {
  const { section } = useParams();
  const title = sectionTitles[section] || 'Content Management';

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">{title}</h1>
          <p className="text-sm text-gray-600 mb-6">
            This section is designed to become your CMS control panel for managing {title.toLowerCase()} entries, images, and captions.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
              <h2 className="font-bold text-lg text-slate-900">What to expect</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• Upload and manage media assets</li>
                <li>• Add captions, titles, and display categories</li>
                <li>• Control featured gallery content</li>
                <li>• Delete outdated or archived items</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 p-5 bg-white shadow-sm">
              <h2 className="font-bold text-lg text-slate-900">Next step</h2>
              <p className="mt-3 text-sm text-slate-600">
                The next implementation phase will connect this page to Cloudinary upload workflows and the `GalleryItem` model so content truly powers the landing page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
