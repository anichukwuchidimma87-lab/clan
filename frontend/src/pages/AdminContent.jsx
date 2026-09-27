import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import generateCaption from '../utils/generateCaption';

function EventManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('soonest');
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', coverImage: '' });
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const apiRoot = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('clan_token');

  const getStatusTone = (status = 'Upcoming') => {
    switch (status) {
      case 'Ongoing':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Completed':
        return 'bg-slate-200 text-slate-700 border border-slate-300';
      default:
        return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    }
  };

  const formatDate = (value) =>
    new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiRoot}/api/events`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setEvents(json.data || []);
    } catch (err) {
      console.error('EventManager load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const method = editing ? 'PATCH' : 'POST';
      const url = editing ? `${apiRoot}/api/events/${editing._id}` : `${apiRoot}/api/events`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setForm({ title: '', description: '', date: '', location: '', coverImage: '' });
        setEditing(null);
        load();
      } else {
        alert(json.message || 'Save failed');
      }
    } catch (err) {
      console.error(err);
      alert('Save error');
    }
  };

  const startEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      date: new Date(ev.date).toISOString().slice(0, 16),
      location: ev.location,
      coverImage: ev.coverImage,
    });
  };

  const toggle = async (id) => {
    try {
      const res = await fetch(`${apiRoot}/api/events/${id}/toggle`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setEvents((prev) => prev.map((p) => (p._id === id ? json.data : p)));
    } catch (err) {
      console.error('Toggle error', err);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await fetch(`${apiRoot}/api/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setEvents((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Delete event error', err);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      setBulkError('Enter JSON or CSV data to import.');
      return;
    }
    setBulkLoading(true);
    setBulkError('');
    try {
      const res = await fetch(`${apiRoot}/api/events/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rawData: bulkText }),
      });
      const json = await res.json();
      if (json.success) {
        setBulkText('');
        load();
        alert(`Imported ${json.count} events successfully.`);
      } else {
        setBulkError(json.message || 'Bulk import failed.');
      }
    } catch (err) {
      console.error('Bulk import error', err);
      setBulkError('Unable to import events.');
    } finally {
      setBulkLoading(false);
    }
  };

  const copyCaption = (ev) => {
    const text = generateCaption(ev);
    navigator.clipboard
      .writeText(text)
      .then(() => alert('Announcement copied to clipboard.'))
      .catch(() => alert('Unable to copy to clipboard.'));
  };

  const genCaptionServer = async (id) => {
    try {
      const res = await fetch(`${apiRoot}/api/events/${id}/generate-caption`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success && json.data) {
        navigator.clipboard.writeText(json.data.caption);
        alert('Server-generated caption copied.');
      }
    } catch (err) {
      console.error('Generate caption error', err);
    }
  };

  const filteredEvents = [...events]
    .filter((event) => {
      const matchesSearch =
        !search ||
        [event.title, event.description, event.location]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'All' || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'alphabetical') return (a.title || '').localeCompare(b.title || '');
      return new Date(a.date) - new Date(b.date);
    });

  const summary = {
    total: events.length,
    upcoming: events.filter((event) => event.status === 'Upcoming').length,
    ongoing: events.filter((event) => event.status === 'Ongoing').length,
    completed: events.filter((event) => event.status === 'Completed').length,
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_25px_60px_rgba(15,23,42,0.06)] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600">Operations</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Event Manager</h2>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total', value: summary.total, tone: 'text-slate-900' },
          { label: 'Upcoming', value: summary.upcoming, tone: 'text-indigo-600' },
          { label: 'Ongoing', value: summary.ongoing, tone: 'text-emerald-600' },
          { label: 'Completed', value: summary.completed, tone: 'text-slate-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">{item.label}</p>
            <p className={`mt-4 text-3xl font-black ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Entry form</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{editing ? 'Edit event' : 'Create new event'}</h3>
            </div>

            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm({ title: '', description: '', date: '', location: '', coverImage: '' });
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={save} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Title</label>
              <input
                placeholder="Annual Parish Retreat"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Description</label>
              <textarea
                placeholder="Tell the community what this event is about..."
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Date & time</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Location</label>
                <input
                  placeholder="St. Mary’s Church Hall"
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Cover image</label>
              <input
                placeholder="Optional image URL"
                value={form.coverImage}
                onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {editing ? 'Save changes' : 'Create event'}
              </button>
            </div>
          </form>

          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Bulk event import</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Paste JSON or CSV data to import multiple events in one action.
            </p>

            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              placeholder='JSON: [{"title":"Seminar","date":"2026-07-15T10:00","description":"...","venue":"St. Mary"}]\nCSV: title,date,description,venue'
            />

            {bulkError && <p className="mt-3 text-sm font-medium text-rose-600">{bulkError}</p>}

            <button
              type="button"
              onClick={handleBulkImport}
              disabled={bulkLoading}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {bulkLoading ? 'Importing…' : 'Import event batch'}
            </button>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Schedule</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Live event roster</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                <span>Filter</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 outline-none"
                >
                  {['All', 'Upcoming', 'Ongoing', 'Completed'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                <span>Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 outline-none"
                >
                  <option value="soonest">Soonest</option>
                  <option value="latest">Latest</option>
                  <option value="alphabetical">A-Z</option>
                </select>
              </label>
            </div>
          </div>

          <label className="relative block">
            <span className="sr-only">Search events</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event title or venue..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
            <span className="pointer-events-none absolute left-4 top-3.5 text-lg text-slate-400">⌕</span>
          </label>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm font-medium text-slate-600">
              Loading events…
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No events match your current search or filter.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredEvents.map((ev) => (
                <article key={ev._id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${getStatusTone(ev.status)}`}>
                        {ev.status || 'Upcoming'}
                      </span>
                      <h4 className="mt-3 text-xl font-black text-slate-900">{ev.title}</h4>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => startEdit(ev)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Edit</button>
                      <button type="button" onClick={() => toggle(ev._id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">{ev.status === 'Upcoming' ? 'Mark completed' : 'Mark upcoming'}</button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Date</p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{formatDate(ev.date)}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Location</p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{ev.location || 'Venue TBA'}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {ev.description || 'No description added yet.'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => copyCaption(ev)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Copy caption</button>
                    <button type="button" onClick={() => genCaptionServer(ev._id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Generate announcement</button>
                    <button type="button" onClick={() => del(ev._id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const sectionTitles = {
  'executives-gallery': 'Executives Gallery',
  'patrons-gallery': 'Patronage Gallery',
  'event-chronicles': 'Event Chronicles',
  'event-manager': 'Event Manager',
  'orphanage-visitations': 'Orphanage Visitations',
  'awards-recognition': 'Awards & Recognition',
  'voalc': 'VOALC Gallery'
};

export default function AdminContent() {
  const { section } = useParams();
  const title = sectionTitles[section] || 'Content Management';

  const categoryMap = {
    'executives-gallery': 'executives',
    'patrons-gallery': 'patrons',
    'event-chronicles': 'events',
    'event-manager': 'events',
    'orphanage-visitations': 'orphanage',
    'awards-recognition': 'awardees',
    'voalc': 'voalc'
  };

  const currentCategory = categoryMap[section] || null;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
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
              <h2 className="font-bold text-lg text-slate-900">Upload Gallery Item</h2>
              <p className="mt-3 text-sm text-slate-600">
                Use this form to upload a new item directly into the selected gallery category.
              </p>
              <div className="mt-6">
                <GalleryUploader defaultCategory={currentCategory || 'executives'} />
              </div>
            </div>
          </div>
        </div>

        {section === 'event-manager' ? (
          <EventManager />
        ) : currentCategory ? (
          <GalleryManager category={currentCategory} title={title} />
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold text-gray-900">No gallery management available</h2>
            <p className="mt-3 text-sm text-slate-600">
              This section is not mapped to a gallery category yet. Uploads are still accepted, but content management features are only available for sections with a connected category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryUploader({ defaultCategory }) {
  const [file, setFile] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [category, setCategory] = React.useState(defaultCategory || 'executives');
  const [featured, setFeatured] = React.useState(false);
  const [tags, setTags] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const apiRoot = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('clan_token');

  React.useEffect(() => {
    setCategory(defaultCategory || 'executives');
  }, [defaultCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !title) {
      alert('Please provide a file or a direct url/title.');
      return;
    }

    const form = new FormData();
    if (file) form.append('file', file);
    form.append('title', title);
    form.append('caption', caption);
    form.append('category', category);
    form.append('featured', featured ? 'true' : 'false');
    form.append('tags', tags);

    setLoading(true);
    try {
      const res = await fetch(`${apiRoot}/api/gallery`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });
      const json = await res.json();
      if (json.success) {
        alert('Uploaded successfully.');
        setFile(null); setTitle(''); setCaption(''); setTags(''); setFeatured(false);
      } else {
        alert(json.message || 'Upload failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-sm">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Image File</label>
        <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files[0])} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Title</label>
        <input className="w-full border p-2 rounded" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Caption</label>
        <input className="w-full border p-2 rounded" value={caption} onChange={e => setCaption(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Category</label>
        <select className="w-full border p-2 rounded" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="executives">Executives</option>
          <option value="patrons">Patrons</option>
          <option value="events">Events</option>
          <option value="orphanage">Orphanage</option>
          <option value="awardees">Awardees</option>
          <option value="voalc">VOALC</option>
          <option value="seminar">Seminar</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} /> Featured</label>
        <label className="flex-1 text-xs text-slate-500">Tags (comma separated)</label>
      </div>
      <div>
        <input className="w-full border p-2 rounded" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. leadership,2026" />
      </div>
      <div>
        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded">
          {loading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </form>
  );
}

function GalleryManager({ category, title }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editValues, setEditValues] = useState({ title: '', caption: '' });
  const [editFiles, setEditFiles] = useState({});

  const apiRoot = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('clan_token');

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiRoot}/api/gallery?category=${encodeURIComponent(category)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await response.json();
      console.log('GalleryManager fetched items:', json);
      if (json.success) {
        setItems(json.data || []);
      } else {
        setError(json.message || 'Unable to fetch gallery items.');
      }
    } catch (err) {
      console.error('GalleryManager fetch error:', err);
      setError('Unable to connect to gallery service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [category]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gallery item?')) return;
    try {
      const response = await fetch(`${apiRoot}/api/gallery/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await response.json();
      if (json.success) {
        // remove locally to avoid full refresh
        setItems(prev => prev.filter(i => i._id !== id));
      } else {
        alert(json.message || 'Delete failed.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Could not delete item.');
    }
  };

  const startEditing = (item) => {
    setEditingItemId(item._id);
    setEditValues({ title: item.title || '', caption: item.caption || '' });
    setEditFiles(prev => ({ ...prev, [item._id]: null }));
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditValues({ title: '', caption: '' });
  };

  const saveEdit = async (id) => {
    try {
      let response;
      const file = editFiles[id];
      if (file) {
        const form = new FormData();
        form.append('file', file);
        form.append('title', editValues.title);
        form.append('caption', editValues.caption);
        response = await fetch(`${apiRoot}/api/gallery/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: form
        });
      } else {
        response = await fetch(`${apiRoot}/api/gallery/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(editValues)
        });
      }

      const json = await response.json();
      if (json.success) {
        // update local state with returned item if available
        const updated = json.data;
        setItems(prev => prev.map(it => (it._id === id ? (updated || { ...it, ...editValues }) : it)));
        cancelEditing();
      } else {
        alert(json.message || 'Update failed.');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Unable to save changes.');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Manage {title}</h2>
          <p className="mt-2 text-sm text-slate-600">Review, edit, or delete gallery assets in the current category.</p>
        </div>
        <button
          onClick={loadItems}
          className="w-full sm:w-auto rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading gallery items…</div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          No gallery items found for the selected category yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map(item => (
            <div key={item._id} className="rounded-3xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
              <div className="h-56 overflow-hidden bg-slate-200">
                <img
                  src={item.url || item.fileUrl || item.imageUrl}
                  alt={item.title || 'Gallery item'}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                {editingItemId === item._id ? (
                  <>
                    <label className="block text-xs uppercase tracking-[0.24em] text-slate-500 mb-1">Title</label>
                    <input
                      value={editValues.title}
                      onChange={e => setEditValues(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-2 mb-3"
                    />
                    <label className="block text-xs uppercase tracking-[0.24em] text-slate-500 mb-1">Caption</label>
                    <textarea
                      value={editValues.caption}
                      onChange={e => setEditValues(prev => ({ ...prev, caption: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-2 min-h-[100px]"
                    />
                    <div className="mt-3">
                      <label className="block text-xs uppercase tracking-[0.24em] text-slate-500 mb-1">Replace Image</label>
                      <input type="file" accept="image/*,video/*" onChange={e => setEditFiles(prev => ({ ...prev, [item._id]: e.target.files[0] }))} />
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-slate-900">{item.title || 'Untitled'}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.caption || 'No caption provided.'}</p>
                  </>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => (editingItemId === item._id ? saveEdit(item._id) : startEditing(item))}
                    className="rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {editingItemId === item._id ? 'Save' : 'Edit'}
                  </button>
                  {editingItemId === item._id ? (
                    <button
                      onClick={cancelEditing}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
