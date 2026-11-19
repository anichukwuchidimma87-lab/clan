import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function CommunityEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const apiRoot = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiRoot}/api/events/upcoming`);
        if (!res.data?.success || !Array.isArray(res.data.data)) {
          throw new Error('Upcoming events response was not successful.');
        }
        setEvents(res.data.data);
        setError(false);
      } catch (err) {
        console.error('CommunityEvents fetch error', err);
        setEvents([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const featured = events[0];
  const otherEvents = events.slice(1);
  const formatEventDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date to be announced' : date.toLocaleString();
  };
  const daysUntil = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <section id="events" aria-labelledby="events-heading" className="border-b border-slate-200 bg-slate-50 py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-indigo-600">Gather and take part</p>
            <h2 id="events-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Upcoming community events</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">Find opportunities to connect, learn, and serve across the deanery.</p>
          </div>
          <Link to="/events" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100">
            Browse all events
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]" role="status" aria-label="Loading upcoming events">
            <div className="min-h-72 animate-pulse rounded-3xl bg-slate-200" />
            <div className="space-y-4">
              {[1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-3xl bg-white shadow-sm" />)}
            </div>
          </div>
        ) : error || events.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700" aria-hidden="true">CL</div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{error ? 'Events are temporarily unavailable' : 'No upcoming events yet'}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {error ? 'Please try again later or visit the events page for the latest information.' : 'There are no upcoming events to display right now. Check back soon or browse the full event calendar.'}
            </p>
            <Link to="/events" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200">
              Open event calendar
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <article className="rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-700 to-slate-900 p-5 text-white shadow-lg sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-200">Featured event</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90">{featured.status || 'Upcoming'}</span>
              </div>
              <h3 className="mt-5 text-2xl font-black leading-tight sm:mt-6 sm:text-3xl">
                <Link to={`/events/${featured._id}`} className="hover:text-indigo-100 focus:outline-none focus:underline focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-800">
                  {featured.title || 'Community gathering'}
                </Link>
              </h3>
              <p className="mt-3 text-sm leading-7 text-indigo-100">{featured.description || 'A special upcoming moment for our deanery community.'}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">When</p>
                  <p className="mt-2 text-sm font-semibold text-white">{formatEventDate(featured.date)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">Where</p>
                  <p className="mt-2 text-sm font-semibold text-white">{featured.location || 'Venue to be announced'}</p>
                </div>
              </div>
              <p className="mt-5 text-xs font-semibold text-indigo-200">
                {daysUntil(featured.date) === null ? 'Date to be announced' : daysUntil(featured.date) > 0 ? `${daysUntil(featured.date)} days to go` : 'Happening soon'}
              </p>
              <Link
                to={`/events/${featured._id}`}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-800 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
              >
                View event details
              </Link>
            </article>

            {otherEvents.length > 0 ? (
              <div className="space-y-3">
                {otherEvents.map((event) => {
                  const daysLeft = daysUntil(event.date);
                  return (
                    <article key={event._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Upcoming</p>
                          <h3 className="mt-2 break-words text-base font-bold text-slate-900 sm:text-lg">
                            <Link to={`/events/${event._id}`} className="hover:text-indigo-700 focus:outline-none focus:underline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                              {event.title || 'Community event'}
                            </Link>
                          </h3>
                        </div>
                        {daysLeft !== null && (
                          <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-700">{daysLeft > 0 ? `${daysLeft}d` : 'Soon'}</span>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{event.location || 'Venue to be announced'}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatEventDate(event.date)}</p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="font-bold text-slate-800">That’s the only event on the calendar for now.</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Visit the event calendar for more details.</p>
                <Link to="/events" className="mt-4 inline-flex min-h-11 items-center rounded-lg text-sm font-bold text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">View event calendar</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
