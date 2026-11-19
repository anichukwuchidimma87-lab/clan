import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LeadershipShowcase() {
  const [leadership, setLeadership] = useState({ executives: [], patrons: [], featuredExecutives: [] });
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryError, setGalleryError] = useState(false);
  const [showAllExecutives, setShowAllExecutives] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const apiRoot = import.meta.env.VITE_API_URL || '';
    let active = true;
    setLoading(true);
    setError(null);
    setGalleryError(false);

    const fetchLeadership = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiRoot}/api/public/leadership`);
        if (!response.data?.success || !response.data.data) {
          throw new Error('Leadership response was not successful.');
        }
        if (active) {
          setLeadership({
            executives: Array.isArray(response.data.data.executives) ? response.data.data.executives : [],
            patrons: Array.isArray(response.data.data.patrons) ? response.data.data.patrons : [],
            featuredExecutives: Array.isArray(response.data.data.featuredExecutives) ? response.data.data.featuredExecutives : []
          });
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching leadership profiles:', err);
        if (active) {
          setError('Unable to load leadership profiles');
          setLeadership({ executives: [], patrons: [], featuredExecutives: [] });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const fetchExecutiveGallery = async () => {
      try {
        const response = await axios.get(`${apiRoot}/api/public/gallery?category=executives`);
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error('Executive gallery response was not successful.');
        }
        if (active) {
          setGalleryItems(response.data.data);
          setGalleryError(false);
        }
      } catch (err) {
        console.error('Error fetching executives gallery items:', err);
        if (active) setGalleryError(true);
      }
    };

    fetchLeadership();
    fetchExecutiveGallery();
    return () => { active = false; };
  }, [retryCount]);

  const allExecutives = leadership.executives || [];
  const visibleExecutives = showAllExecutives ? allExecutives : allExecutives.slice(0, 6);
  const canExpandExecutives = allExecutives.length > 6;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading leadership profiles">
        {[1, 2, 3].map((item) => (
          <div key={item} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-48 animate-pulse bg-slate-200 sm:h-56" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-indigo-100" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && galleryItems.length === 0) {
    return (
      <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-10 text-center text-sm text-amber-900">
        <p className="font-bold">Leadership information is temporarily unavailable.</p>
        <p className="mt-2 text-amber-800">Please check back later.</p>
        <button type="button" onClick={() => setRetryCount((current) => current + 1)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200">
          Retry
        </button>
      </div>
    );
  }

  const LeadershipCard = ({ member }) => {
    const memberName = member.name || [member.firstName, member.lastName].filter(Boolean).join(' ') || 'Leadership member';
    return (
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative h-48 overflow-hidden bg-slate-100 sm:h-56">
          {member.profileImage ? (
            <img
              src={member.profileImage}
              alt={`${memberName} portrait`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-700 to-blue-900">
              <span className="text-4xl font-black text-white">
                {memberName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-slate-900">{memberName}</h3>
          <p className="mt-1 text-sm font-bold text-indigo-700">{member.position || 'Deanery leadership'}</p>
          {member.profileTitle && (
            <p className="mt-3 text-sm leading-6 text-slate-600">{member.profileTitle}</p>
          )}
          {member.email && (
            <a href={`mailto:${member.email}`} className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              Contact {memberName.split(' ')[0]}
            </a>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-12">
      {(error || galleryError) && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p>Some public leadership information could not be loaded.</p>
          <button type="button" onClick={() => setRetryCount((current) => current + 1)} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200">
            Retry
          </button>
        </div>
      )}

      {allExecutives.length > 0 && (
        <div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-slate-900">Executive committee</h3>
            {canExpandExecutives && (
              <button
                type="button"
                onClick={() => setShowAllExecutives((current) => !current)}
                aria-expanded={showAllExecutives}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {showAllExecutives ? 'Show fewer leaders' : 'View all leaders'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleExecutives.map((member) => (
              <LeadershipCard key={member._id} member={member} />
            ))}
          </div>
        </div>
      )}

      {leadership.patrons.length > 0 && (
        <div>
          <h3 className="mb-5 text-lg font-bold text-slate-900">Patrons and patronesses</h3>
          <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            {leadership.patrons.map((member) => (
              <LeadershipCard key={member._id} member={member} />
            ))}
          </div>
        </div>
      )}

      {allExecutives.length === 0 && leadership.patrons.length === 0 && galleryItems.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="font-bold text-slate-800">{galleryError ? 'Leadership gallery is temporarily unavailable' : 'Leadership profiles coming soon'}</p>
          <p className="mt-2 text-sm text-slate-500">{galleryError ? 'Please check back later for updates.' : 'Profiles will be shared here as they become available.'}</p>
          {galleryError && (
            <button type="button" onClick={() => setRetryCount((current) => current + 1)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200">
              Retry
            </button>
          )}
        </div>
      )}

      {galleryItems.length > 0 && allExecutives.length === 0 && leadership.patrons.length === 0 && (
        <div>
          <h3 className="mb-5 text-lg font-bold text-slate-900">Executive gallery</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item) => (
              <article key={item._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-52 overflow-hidden bg-slate-100 sm:h-56">
                  <img src={item.url || item.imageUrl || item.fileUrl} alt={item.title || 'Executive feature'} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <h4 className="text-base font-bold text-slate-900">{item.title || 'Executive feature'}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.caption || 'Executive gallery item'}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadershipShowcase;
