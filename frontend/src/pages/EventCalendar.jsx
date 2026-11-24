import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import StatusNotice from '../components/StatusNotice';
import {
  EVENT_TIME_ZONE,
  formatBirthdayMonthDay,
  formatEventDate,
  formatEventTime,
  getBirthdayOccurrence,
  getEventDateKey,
  getEventDateParts
} from '../utils/eventDateTime';

const FILTERS = ['All', 'Upcoming', 'Ongoing', 'Completed'];
const CATEGORIES = ['All', 'Worship', 'Conference', 'Retreat', 'Meeting', 'Social'];
const SORT_OPTIONS = [
  { value: 'soonest', label: 'Soonest first' },
  { value: 'latest', label: 'Latest first' },
  { value: 'alphabetical', label: 'A → Z' },
];

const dayMs = 1000 * 60 * 60 * 24;

const formatDate = formatEventDate;
const formatTime = formatEventTime;

const getStatusTone = (status) => {
  switch (status) {
    case 'Ongoing':
      return {
        label: 'Ongoing',
        badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        dot: 'bg-emerald-500',
        accent: 'from-emerald-500 to-teal-500',
      };
    case 'Upcoming':
      return {
        label: 'Upcoming',
        badge: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
        dot: 'bg-indigo-500',
        accent: 'from-indigo-500 to-violet-500',
      };
    case 'Completed':
      return {
        label: 'Completed',
        badge: 'bg-slate-200 text-slate-700 border border-slate-300',
        dot: 'bg-slate-500',
        accent: 'from-slate-500 to-slate-700',
      };
    default:
      return {
        label: 'Upcoming',
        badge: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
        dot: 'bg-indigo-500',
        accent: 'from-indigo-500 to-violet-500',
      };
  }
};

const deriveCategory = (event) => {
  const haystack = `${event.title || ''} ${event.description || ''} ${event.location || ''}`.toLowerCase();

  if (/retreat|seminar|formation|mission|pilgrimage|renewal/.test(haystack)) return 'Retreat';
  if (/conference|summit|convocation|delegate|assembly|council/.test(haystack)) return 'Conference';
  if (/meeting|gathering|session|board|committee|forum|parish/.test(haystack)) return 'Meeting';
  if (/social|youth|family|celebration|party|outing/.test(haystack)) return 'Social';
  if (/mass|service|worship|eucharist|adoration|choir|prayer/.test(haystack)) return 'Worship';

  return 'Meeting';
};

const getEventStatus = (event) => {
  const eventDate = new Date(event.date);
  const now = new Date();
  const eventParts = getEventDateParts(eventDate);
  const todayParts = getEventDateParts(now);

  if (event.status === 'Completed') return 'Completed';

  const sameDay = eventParts.year === todayParts.year && eventParts.month === todayParts.month && eventParts.day === todayParts.day;

  if (sameDay) return 'Ongoing';
  return eventDate > now ? 'Upcoming' : 'Completed';
};

const buildGoogleCalendarUrl = (event) => {
  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatGoogleDate = (date) => {
    const parts = getEventDateParts(date);
    return `${parts.year}${`${parts.month}`.padStart(2, '0')}${`${parts.day}`.padStart(2, '0')}T${`${parts.hour}`.padStart(2, '0')}${`${parts.minute}`.padStart(2, '0')}${`${parts.second}`.padStart(2, '0')}`;
  };

  const title = encodeURIComponent(event.title || 'Community Event');
  const details = encodeURIComponent(event.description || 'Community event');
  const location = encodeURIComponent(event.location || 'To be announced');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&ctz=${encodeURIComponent(EVENT_TIME_ZONE)}`;
};

const toDateKey = (date) => {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = `${localDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${localDate.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EventCalendar() {
  const [events, setEvents] = useState([]);
  const [publicBirthdays, setPublicBirthdays] = useState([]);
  const [birthdayError, setBirthdayError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('soonest');
  const [viewMode, setViewMode] = useState('grid');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = getEventDateParts(new Date());
    return new Date(today.year, today.month - 1, 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [shareFeedback, setShareFeedback] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();
  const apiRoot = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    if (!shareFeedback) return undefined;
    const timeoutId = window.setTimeout(() => setShareFeedback(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [shareFeedback]);

  useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${apiRoot}/api/events/all`);
        if (!res.data?.success || !Array.isArray(res.data.data)) {
          throw new Error('Public events response was not successful.');
        }
        const data = (res.data.data || []).map((event) => ({
          ...event,
          normalizedStatus: getEventStatus(event),
          category: deriveCategory(event),
          sortDate: new Date(event.date).getTime(),
        }));

        if (active) setEvents(data);
      } catch (err) {
        console.error('EventCalendar fetch error', err);
        if (active) {
          setEvents([]);
          setError('Could not load events.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEvents();
    return () => { active = false; };
  }, [apiRoot, reloadKey]);

  useEffect(() => {
    let active = true;
    axios.get(`${apiRoot}/api/lectors/public-birthdays`)
      .then((response) => {
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error('Public birthday response was not successful.');
        }
        if (active) {
          setPublicBirthdays(response.data.data);
          setBirthdayError('');
        }
      })
      .catch((error) => {
        console.error('Public birthday fetch error', error);
        if (active) {
          setPublicBirthdays([]);
          setBirthdayError('Public birthday entries are temporarily unavailable.');
        }
      });
    return () => { active = false; };
  }, [apiRoot]);

  const featuredEvent = useMemo(() => {
    if (!events.length) return null;

    const upcoming = [...events]
      .filter((event) => event.normalizedStatus !== 'Completed')
      .sort((a, b) => a.sortDate - b.sortDate);

    return upcoming[0] || events[0];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    const items = events.filter((event) => {
      const matchesSearch =
        !query ||
        [event.title, event.location, event.description, event.category, formatDate(event.date)]
          .join(' ')
          .toLowerCase()
          .includes(query);

      const matchesFilter = selectedFilter === 'All' || event.normalizedStatus === selectedFilter;
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;

      return matchesSearch && matchesFilter && matchesCategory;
    });

    return [...items].sort((a, b) => {
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      if (sortBy === 'latest') return b.sortDate - a.sortDate;
      return a.sortDate - b.sortDate;
    });
  }, [events, search, selectedFilter, selectedCategory, sortBy]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: events.length,
      upcoming: events.filter((item) => item.normalizedStatus === 'Upcoming').length,
      ongoing: events.filter((item) => item.normalizedStatus === 'Ongoing').length,
      completed: events.filter((item) => item.normalizedStatus === 'Completed').length,
      thisMonth: events.filter((item) => {
        const eventDate = getEventDateParts(item.date);
        const currentDate = getEventDateParts(now);
        return eventDate.year === currentDate.year && eventDate.month === currentDate.month;
      }).length,
    };
  }, [events]);

  const eventMap = useMemo(() => {
    const map = new Map();

    events.forEach((event) => {
      const key = getEventDateKey(event.date);
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    });

    return map;
  }, [events]);

  const birthdayMap = useMemo(() => {
    const map = new Map();
    publicBirthdays.forEach((birthday) => {
      try {
        const occurrence = getBirthdayOccurrence(currentMonth.getFullYear(), birthday.month, birthday.day);
        const key = `${occurrence.year}-${`${occurrence.month}`.padStart(2, '0')}-${`${occurrence.day}`.padStart(2, '0')}`;
        const entries = map.get(key) || [];
        entries.push(birthday);
        map.set(key, entries);
      } catch (error) {
        console.error('Invalid public birthday entry:', error);
      }
    });
    return map;
  }, [currentMonth, publicBirthdays]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [currentMonth]);

  const visibleEvents = useMemo(() => {
    if (!selectedDate) return filteredEvents;
    return filteredEvents.filter((event) => getEventDateKey(event.date) === selectedDate);
  }, [filteredEvents, selectedDate]);

  const handleShare = async (event) => {
    const shareUrl = `${window.location.origin}/events/${event._id}`;
    const shareText = `${event.title} — ${formatDate(event.date)} at ${event.location || 'Venue TBA'}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setShareFeedback({ type: 'success', text: 'Event link copied to clipboard.' });
      } else {
        setShareFeedback({ type: 'error', text: 'Sharing is not available in this browser.' });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to share event', error);
        setShareFeedback({ type: 'error', text: 'Unable to share this event.' });
      }
    }
  };

  const renderEventCard = (event) => {
    const tone = getStatusTone(event.normalizedStatus);
    const daysLeft = Math.ceil((new Date(event.date) - new Date()) / dayMs);

    const countdownLabel =
      event.normalizedStatus === 'Ongoing'
        ? 'Happening today'
        : event.normalizedStatus === 'Completed'
          ? 'Completed'
          : daysLeft > 0
            ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining`
            : 'Starts today';

    return (
      <article
        key={event._id}
        className="group overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-[0_22px_50px_rgba(15,23,42,0.07)] ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(79,70,229,0.12)]"
      >
        <div className={`h-2 bg-gradient-to-r ${tone.accent}`} />

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className={`${tone.badge} inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em]`}>
                <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                {tone.label}
              </span>

              <h3 className="mt-4 text-2xl font-black text-slate-900">
                <Link to={`/events/${event._id}`} className="transition hover:text-indigo-700 focus:outline-none focus:underline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                  {event.title}
                </Link>
              </h3>
            </div>

            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{event.category}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{daysLeft > 0 ? `${daysLeft}d` : 'Now'}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Date</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{formatDate(event.date)}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Time</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{formatTime(event.date)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Venue</p>
            <p className="mt-2 text-sm font-medium text-slate-700">{event.location || 'Venue TBA'}</p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
            <span className="text-sm font-semibold text-indigo-700">{countdownLabel}</span>

            {event.normalizedStatus === 'Upcoming' && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                Live
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {event.description || 'More details for this event will be shared soon.'}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={`/events/${event._id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
            >
              View details
            </Link>

            <a
              href={buildGoogleCalendarUrl(event)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
            >
              Add to Calendar
            </a>

            <button
              type="button"
              onClick={() => handleShare(event)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
            >
              Share
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      {shareFeedback && (
        <div
          role={shareFeedback.type === 'error' ? 'alert' : 'status'}
          className={`fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-xl ${
            shareFeedback.type === 'error' ? 'border-rose-200 text-rose-700' : 'border-emerald-200 text-emerald-700'
          }`}
        >
          {shareFeedback.text}
        </div>
      )}

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-16">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
              >
                ← Back to home
              </button>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
              Deanery schedule
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-indigo-600">Community calendar</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Events that move our community forward.
              </h1>
            </div>

            <div className="text-left xl:text-right">
              <p className="text-sm text-slate-500">{loading ? 'Loading the event calendar' : error ? 'Event data is unavailable' : 'Updated with live event status'}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{loading ? 'Loading events…' : error ? 'Retry to continue' : `${stats.total} total entries`}</p>
            </div>
          </div>
        </div>

        {!loading && !error && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Upcoming', value: stats.upcoming, tone: 'text-indigo-600' },
              { label: 'Ongoing', value: stats.ongoing, tone: 'text-emerald-600' },
              { label: 'Completed', value: stats.completed, tone: 'text-slate-600' },
              { label: 'This month', value: stats.thisMonth, tone: 'text-violet-600' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(79,70,229,0.08)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">{stat.label}</p>
                <p className={`mt-4 text-3xl font-black ${stat.tone}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-[2rem] border border-slate-200/80 bg-white/85 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <label className="relative block w-full xl:max-w-md">
                <span className="sr-only">Search events</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, venue, or month…"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
                <span className="pointer-events-none absolute left-4 top-3.5 text-lg text-slate-400">⌕</span>
              </label>

              <div className="flex items-center gap-2 self-end xl:self-auto">
                {['grid', 'list'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      viewMode === mode
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`}
                    aria-pressed={viewMode === mode}
                  >
                    {mode === 'grid' ? 'Grid view' : 'List view'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selectedFilter === filter
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`}
                    aria-pressed={selectedFilter === filter}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      selectedCategory === category
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`}
                    aria-pressed={selectedCategory === category}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span>Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg bg-transparent font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {featuredEvent && (
          <div className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-700 p-6 text-white shadow-[0_30px_70px_rgba(79,70,229,0.35)] ring-1 ring-white/10 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-indigo-200">Featured event</p>
                <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                  <Link to={`/events/${featuredEvent._id}`} className="hover:text-indigo-100 focus:outline-none focus:underline focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-900">
                    {featuredEvent.title}
                  </Link>
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100">
                  {featuredEvent.description || 'A community moment to look forward to, designed to bring people together.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/events/${featuredEvent._id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                >
                  View details
                </Link>
                <a
                  href={buildGoogleCalendarUrl(featuredEvent)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                >
                  Add to calendar
                </a>

                <button
                  type="button"
                  onClick={() => handleShare(featuredEvent)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                >
                  Share event
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.28em] text-indigo-200">When</p>
                <p className="mt-3 text-lg font-bold">{formatDate(featuredEvent.date)}</p>
                <p className="mt-1 text-sm text-indigo-100">{formatTime(featuredEvent.date)}</p>
              </div>

              <div className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.28em] text-indigo-200">Where</p>
                <p className="mt-3 text-lg font-bold">{featuredEvent.location || 'Venue TBA'}</p>
              </div>

              <div className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.28em] text-indigo-200">Status</p>
                <p className="mt-3 text-lg font-bold">
                  {featuredEvent.normalizedStatus === 'Ongoing'
                    ? 'Happening today'
                    : featuredEvent.normalizedStatus === 'Completed'
                      ? 'Completed'
                      : `${Math.ceil((new Date(featuredEvent.date) - new Date()) / dayMs)} days soon`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Monthly view</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  aria-label="Previous month"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  aria-label="Next month"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const key = toDateKey(day);
                const hasEvents = (eventMap.get(key) || []).length > 0;
                const hasBirthdays = (birthdayMap.get(key) || []).length > 0;
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isSelected = selectedDate === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    aria-label={`${day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${hasEvents ? `, ${(eventMap.get(key) || []).length} events` : ''}${hasBirthdays ? `, ${(birthdayMap.get(key) || []).length} birthdays` : ''}`}
                    aria-pressed={isSelected}
                    className={`relative flex min-h-[92px] flex-col rounded-2xl border p-2 text-left transition ${
                      isCurrentMonth ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-slate-100 bg-slate-50/70 text-slate-400'
                    } ${isSelected ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100' : 'hover:border-indigo-200 hover:bg-white'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`}
                  >
                    <span className="text-sm font-bold">{day.getDate()}</span>

                    {(hasEvents || hasBirthdays) && (
                      <div className="mt-auto flex flex-wrap gap-1">
                        {(eventMap.get(key) || []).slice(0, 3).map((event, index) => (
                          <span
                            key={`${key}-${event._id || index}`}
                            className={`h-2.5 w-2.5 rounded-full ${
                              event.normalizedStatus === 'Ongoing'
                                ? 'bg-emerald-500'
                                : event.normalizedStatus === 'Completed'
                                  ? 'bg-slate-400'
                                  : 'bg-indigo-500'
                            }`}
                          />
                        ))}
                        {hasBirthdays && <span className="h-2.5 w-2.5 rounded-full bg-pink-500" aria-label="Birthday" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Selected day</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">
                  {selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today overview'}
                </h3>
              </div>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {(selectedDate ? eventMap.get(selectedDate) || [] : events.slice(0, 4)).map((event) => (
                <div key={event._id || `${event.title}-${event.date}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{event.normalizedStatus}</p>
                      <Link
                        to={`/events/${event._id}`}
                        className="mt-2 inline-block text-sm font-bold text-slate-900 hover:text-indigo-700 focus:outline-none focus:underline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      >
                        {event.title}
                      </Link>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${
                      event.normalizedStatus === 'Ongoing'
                        ? 'bg-emerald-100 text-emerald-700'
                        : event.normalizedStatus === 'Completed'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {event.normalizedStatus}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600">{formatDate(event.date)} · {formatTime(event.date)}</p>
                  <p className="mt-2 text-xs text-slate-500">{event.location || 'Venue TBA'}</p>
                </div>
              ))}

              {(selectedDate ? birthdayMap.get(selectedDate) || [] : []).map((birthday) => (
                <article key={`${birthday.month}-${birthday.day}-${birthday.name}`} className="rounded-2xl border border-pink-200 bg-pink-50 p-3">
                  <p className="text-sm font-bold leading-6 text-slate-900">
                    Join us in wishing {birthday.name} a happy birthday! May the year ahead bring joy and blessings.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-700">Parish: {birthday.parishName || 'Not listed'}</p>
                  <p className="mt-1 text-xs text-slate-600">{formatBirthdayMonthDay(birthday.month, birthday.day)} · Birthday</p>
                </article>
              ))}

              {birthdayError && <p role="status" className="text-xs text-amber-700">{birthdayError}</p>}

              {!selectedDate && !loading && !error && events.length === 0 && (
                <p className="text-sm text-slate-500">There are no upcoming events right now.</p>
              )}
              {selectedDate && !loading && !error && !(eventMap.get(selectedDate) || []).length && !(birthdayMap.get(selectedDate) || []).length && (
                <p className="text-sm text-slate-500">No events are scheduled for this date.</p>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div role="status" aria-live="polite" className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            Loading your calendar…
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <StatusNotice type="error">{error}</StatusNotice>
            <button type="button" onClick={() => setReloadKey((current) => current + 1)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200">
              Retry calendar
            </button>
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            {events.length === 0 ? 'No events have been posted yet.' : 'No events match your current search or selected date.'}
          </div>
        ) : (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-black text-slate-900">
                {selectedDate ? `Events on ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'All matching events'}
              </h3>
            </div>

            <div className={`${viewMode === 'grid' ? 'grid gap-6 xl:grid-cols-2' : 'space-y-5'}`}>
              {visibleEvents.map((event) => renderEventCard(event))}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

export { buildGoogleCalendarUrl, deriveCategory, formatDate, formatTime, getEventStatus, getStatusTone };
