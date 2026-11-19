import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

const categoryNameMap = {
  executives: 'Executives',
  voalc: 'VOALC',
  seminar: 'Seminar',
  orphanage: 'Orphanage Visitation',
  'orphanage-visitation': 'Orphanage Visitation',
  'event-chronicles': 'Event Chronicles',
};

const paramToCategory = {
  executives: 'executives',
  voalc: 'voalc',
  seminar: 'seminar',
  orphanage: 'orphanage',
  'orphanage-visitation': 'orphanage',
  'event-chronicles': 'events',
};

function GalleryCategory() {
  const { category: categoryParam } = useParams();
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const displayName = categoryNameMap[categoryParam] || 'Gallery';
  const category = paramToCategory[categoryParam];

  useEffect(() => {
    const apiRoot = import.meta.env.VITE_API_URL || '';
    let active = true;
    const fetchGallery = async () => {
      if (!category) {
        if (active) {
          setError('Unknown gallery category.');
          setGalleryItems([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${apiRoot}/api/public/gallery?category=${category}`);
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error('Gallery response was not successful.');
        }
        if (active) setGalleryItems(response.data.data);
      } catch (fetchError) {
        console.error('Could not fetch gallery category items:', fetchError);
        if (active) {
          setError('Unable to load category images at the moment.');
          setGalleryItems([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchGallery();
    return () => { active = false; };
  }, [category, reloadKey]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-xl sm:mb-10 sm:p-10">
          <Link to="/" className="inline-flex min-h-10 items-center rounded-lg text-sm font-semibold text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
            Back to home
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">{displayName}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Explore the selected gallery category in a polished responsive layout.
          </p>
        </div>

        {loading ? (
          <div role="status" aria-live="polite" className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Loading gallery images...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm sm:p-10">
            <p role="alert" className="text-rose-700">{error}</p>
            {category && (
              <button
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
              >
                Retry
              </button>
            )}
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <h2 className="font-bold text-slate-900">No images in this category yet</h2>
            <p className="mt-2 text-sm text-slate-500">Community photos will appear here when they are shared.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item) => (
              <div key={item._id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-72 bg-slate-100">
                  <img
                    src={item.url}
                    alt={item.title || item.caption || item.category}
                    className="h-full w-full object-contain bg-transparent"
                    loading="lazy"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white">
                    {categoryNameMap[categoryParam] || item.category}
                  </span>
                </div>
                <div className="p-5">
                  {item.title && <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>}
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.caption || 'A highlight from our community gallery.'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default GalleryCategory;
