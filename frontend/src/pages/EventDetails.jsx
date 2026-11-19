import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { buildGoogleCalendarUrl, deriveCategory, getEventStatus, getStatusTone, formatDate, formatTime } from './EventCalendar';

const API_ROOT = import.meta.env.VITE_API_URL || '';

export default function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchEvent = async () => {
      setLoading(true);
      setError('');
      setEvent(null);
      try {
        const response = await axios.get(`${API_ROOT}/api/events/all`);
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error('Unable to load public event details.');
        }
        const record = response.data.data.find((item) => String(item._id) === eventId);
        if (!record) throw new Error('Event not found.');

        if (active) {
          setEvent({
            ...record,
            normalizedStatus: getEventStatus(record),
            category: deriveCategory(record)
          });
        }
      } catch (loadError) {
        if (active) setError(loadError.response?.status === 404 ? 'Event not found.' : loadError.message || 'Unable to load public event details.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEvent();
    return () => { active = false; };
  }, [eventId, retryCount]);

  useEffect(() => {
    if (!shareMessage) return undefined;
    const timeoutId = window.setTimeout(() => setShareMessage(''), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [shareMessage]);

  const shareEvent = async () => {
    if (!event) return;
    const url = `${window.location.origin}/events/${event._id}`;
    const text = `${event.title} — ${formatDate(event.date)} at ${event.location || 'Venue TBA'}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text, url });
        return;
      }
      if (!navigator.clipboard) throw new Error('Sharing and clipboard are unavailable in this browser.');
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareMessage('Event link copied to clipboard.');
    } catch (shareError) {
      if (shareError.name !== 'AbortError') {
        console.error('Failed to share event:', shareError);
        setShareMessage(`Unable to share this event.${shareError.message ? ` ${shareError.message}` : ''}`);
      }
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" role="status">
          <div className="h-4 w-28 rounded bg-indigo-100" />
          <div className="mt-5 h-9 max-w-lg rounded bg-slate-200" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-24 rounded-2xl bg-slate-100" />)}
          </div>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
          <p role="alert" className="font-semibold text-amber-900">{error || 'Event not found.'}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {error !== 'Event not found.' && (
              <button type="button" onClick={() => setRetryCount((current) => current + 1)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200">
                Retry
              </button>
            )}
            <Link to="/events" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100">
              Back to events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const tone = getStatusTone(event.normalizedStatus);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.14),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8 sm:px-6 sm:py-10">
      {shareMessage && (
        <div
          role={shareMessage.startsWith('Unable') ? 'alert' : 'status'}
          className={`fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-xl ${
            shareMessage.startsWith('Unable') ? 'border-rose-200 text-rose-700' : 'border-emerald-200 text-emerald-700'
          }`}
        >
          {shareMessage}
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-5">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link to="/" className="rounded-sm font-semibold text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/events" className="rounded-sm font-semibold text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Events</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{event.title}</span>
        </nav>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className={`h-2 bg-gradient-to-r ${tone.accent}`} />
          {event.coverImage && (
            <div className="h-52 bg-slate-100 sm:h-72">
              <img src={event.coverImage} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`${tone.badge} inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]`}>
                <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden="true" />
                {tone.label}
              </span>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
                {event.category}
              </span>
            </div>

            <h1 className="mt-4 break-words text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{event.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {event.description || 'More details for this event will be shared soon.'}
            </p>

            <dl className="mt-7 grid gap-3 sm:grid-cols-2">
              <Detail label="Date" value={formatDate(event.date)} />
              <Detail label="Time" value={formatTime(event.date)} />
              <Detail label="Venue" value={event.location || 'Venue to be announced'} />
              <Detail label="Category" value={event.category} />
            </dl>

            <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
              <a
                href={buildGoogleCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Add to calendar
              </a>
              <button
                type="button"
                onClick={shareEvent}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
              >
                Share event
              </button>
              <Link
                to="/events"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 sm:ml-auto"
              >
                Back to events
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</dt>
      <dd className="mt-2 break-words text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}
