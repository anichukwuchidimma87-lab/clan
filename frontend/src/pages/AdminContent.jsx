import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import generateCaption from '../utils/generateCaption';
import { EVENT_TIME_ZONE, formatEventDateTime, toEventDateTimeInput } from '../utils/eventDateTime';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusNotice from '../components/StatusNotice';

const emptyEventForm = { title: '', description: '', date: '', location: '', coverImage: '' };
const eventFormFromRecord = (event) => ({
  title: event.title || '',
  description: event.description || '',
  date: toEventDateTimeInput(event.date),
  location: event.location || '',
  coverImage: event.coverImage || ''
});

function EventManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState(emptyEventForm);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [discardRequest, setDiscardRequest] = useState(null);
  const editButtonRefs = useRef({});
  const createButtonRef = useRef(null);
  const editTitleRef = useRef(null);
  const focusAfterEditRef = useRef(null);
  const focusAfterCreateRef = useRef(false);
  const dialogRef = useRef(null);
  const closeDialogRequestRef = useRef(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('soonest');
  const [form, setForm] = useState(emptyEventForm);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkSummary, setBulkSummary] = useState('');
  const apiRoot = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('clan_token');
  const editIsDirty = Boolean(editing && JSON.stringify(editForm) !== JSON.stringify(eventFormFromRecord(editing)));
  const createIsDirty = Boolean(creating && JSON.stringify(form) !== JSON.stringify(emptyEventForm));
  const dialogIsDirty = editIsDirty || createIsDirty;
  const dialogOpen = Boolean(editing || creating);
  const dialogForm = editing ? editForm : form;
  const setDialogForm = editing ? setEditForm : setForm;
  const dialogError = editing ? editError : createError;

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

  useEffect(() => {
    if (dialogOpen) {
      editTitleRef.current?.focus();
    } else if (!saving && !editSaving) {
      if (focusAfterEditRef.current) {
        editButtonRefs.current[focusAfterEditRef.current]?.focus();
        focusAfterEditRef.current = null;
      } else if (focusAfterCreateRef.current) {
        createButtonRef.current?.focus();
        focusAfterCreateRef.current = false;
      }
    }
  }, [dialogOpen, editing?._id, creating, saving, editSaving]);

  useEffect(() => {
    if (!dialogOpen) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialogRequestRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogIsDirty) return undefined;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dialogIsDirty]);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`${apiRoot}/api/events`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Unable to load events.');
      setEvents(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error('EventManager load error', err);
      setLoadError(err.message || 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setCreateError('');
    setFeedback(null);
    try {
      const res = await fetch(`${apiRoot}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Unable to save the event.');
      setForm(emptyEventForm);
      setEvents((prev) => [...prev, json.data]);
      setFeedback({ type: 'success', text: 'Event created.' });
      setCreating(false);
      focusAfterCreateRef.current = true;
    } catch (err) {
      console.error(err);
      setCreateError(err.message || 'Unable to save the event.');
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (event) => {
    setEditing(event);
    setCreating(false);
    setEditForm(eventFormFromRecord(event));
    setEditError('');
    focusAfterEditRef.current = event._id;
  };

  const requestEdit = (event) => {
    if (dialogIsDirty) {
      setDiscardRequest({ nextEvent: event });
      return;
    }
    openEditor(event);
  };

  const closeEditor = () => {
    const eventId = editing?._id;
    setEditing(null);
    setEditError('');
    focusAfterEditRef.current = eventId;
  };

  const confirmDiscard = () => {
    const nextEvent = discardRequest?.nextEvent;
    const editedEventId = editing?._id;
    setDiscardRequest(null);
    setEditing(null);
    setCreating(false);
    setEditError('');
    setCreateError('');
    setForm(emptyEventForm);
    if (nextEvent) {
      window.requestAnimationFrame(() => openEditor(nextEvent));
      return;
    }
    if (editedEventId) focusAfterEditRef.current = editedEventId;
    else focusAfterCreateRef.current = true;
  };

  const openCreateDialog = () => {
    setForm(emptyEventForm);
    setCreateError('');
    setCreating(true);
  };

  const requestCloseDialog = () => {
    if (saving || editSaving) return;
    if (dialogIsDirty) {
      setDiscardRequest({ nextEvent: null });
      return;
    }
    if (editing) {
      closeEditor();
      return;
    }
    setCreating(false);
    setCreateError('');
    setForm(emptyEventForm);
    focusAfterCreateRef.current = true;
  };

  closeDialogRequestRef.current = requestCloseDialog;

  const saveEdit = async (event, e) => {
    e.preventDefault();
    if (editSaving) return;
    setEditSaving(true);
    setEditError('');
    try {
      const eventPayload = { ...editForm };
      if (eventPayload.date === eventFormFromRecord(event).date) delete eventPayload.date;
      const res = await fetch(`${apiRoot}/api/events/${event._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(eventPayload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Unable to save the event.');
      setEvents((previous) => previous.map((item) => item._id === event._id ? json.data : item));
      setFeedback({ type: 'success', text: 'Event changes saved.' });
      closeEditor();
    } catch (error) {
      console.error('Save event error', error);
      setEditError(error.message || 'Unable to save the event.');
    } finally {
      setEditSaving(false);
    }
  };

  const toggle = async (id) => {
    setTogglingId(id);
    setFeedback(null);
    try {
      const res = await fetch(`${apiRoot}/api/events/${id}/toggle`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Unable to update event status.');
      setEvents((prev) => prev.map((p) => (p._id === id ? json.data : p)));
      setFeedback({ type: 'success', text: 'Event status updated.' });
    } catch (err) {
      console.error('Toggle error', err);
      setFeedback({ type: 'error', text: err.message || 'Unable to update event status.' });
    } finally {
      setTogglingId(null);
    }
  };

  const del = async (id) => {
    setPendingDelete(events.find((event) => event._id === id) || { _id: id });
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setFeedback(null);
    try {
      const res = await fetch(`${apiRoot}/api/events/${pendingDelete._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Unable to delete the event.');
      setEvents((prev) => prev.filter((event) => event._id !== pendingDelete._id));
      setFeedback({ type: 'success', text: 'Event deleted.' });
      setPendingDelete(null);
    } catch (err) {
      console.error('Delete event error', err);
      setFeedback({ type: 'error', text: err.message || 'Unable to delete the event.' });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      setBulkError('Enter JSON or CSV data to import.');
      return;
    }
    setBulkLoading(true);
    setBulkError('');
    setBulkErrors([]);
    setBulkSummary('');
    setFeedback(null);
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
        setBulkSummary(json.message || `Imported ${json.count} events.`);
        setBulkErrors(Array.isArray(json.errors) ? json.errors : []);
        setFeedback({ type: 'success', text: `Imported ${json.importedCount ?? json.count} events.` });
        await load();
      } else {
        setBulkError(json.message || 'Bulk import failed. No events were imported.');
        setBulkErrors(Array.isArray(json.errors) ? json.errors : []);
      }
    } catch (err) {
      console.error('Bulk import error', err);
      setBulkError(err.message || 'Unable to import events.');
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const content = [
      'title,date,description,location,status,coverImage',
      '"Sample event - replace before importing",2026-07-15T10:00,"A sample description, with a comma","St. Mary Church Hall",Upcoming,'
    ].join('\r\n');
    const blob = new Blob([`\uFEFF${content}\r\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clan-event-template.csv';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const copyCaption = async (ev) => {
    const text = generateCaption(ev);
    try {
      if (!navigator.clipboard) throw new Error('Clipboard access is unavailable in this browser.');
      await navigator.clipboard.writeText(text);
      setFeedback({ type: 'success', text: 'Announcement copied to clipboard.' });
    } catch (err) {
      console.error('Copy caption error', err);
      setFeedback({ type: 'error', text: err.message || 'Unable to copy the announcement.' });
    }
  };

  const genCaptionServer = async (id) => {
    try {
      const res = await fetch(`${apiRoot}/api/events/${id}/generate-caption`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.caption) throw new Error(json.message || 'Unable to generate an announcement.');
      if (!navigator.clipboard) throw new Error('Clipboard access is unavailable in this browser.');
      await navigator.clipboard.writeText(json.data.caption);
      setFeedback({ type: 'success', text: 'Server-generated announcement copied to clipboard.' });
    } catch (err) {
      console.error('Generate caption error', err);
      setFeedback({ type: 'error', text: err.message || 'Unable to generate an announcement.' });
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

        <div className="flex flex-wrap gap-3">
          <button
            ref={createButtonRef}
            type="button"
            onClick={openCreateDialog}
            aria-haspopup="dialog"
            aria-expanded={creating}
            aria-controls="create-event-dialog"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            + Create event
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {feedback && <StatusNotice type={feedback.type} className="mt-4">{feedback.text}</StatusNotice>}
      {loadError && (
        <StatusNotice type="error" className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{loadError}</span>
            <button type="button" onClick={load} className="font-bold underline underline-offset-2">Try again</button>
          </div>
        </StatusNotice>
      )}

      {!loading && !loadError && <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
      </div>}

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Bulk event import</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              CSV columns: title, date, description, location, status, coverImage. Use YYYY-MM-DDTHH:mm for dates and Upcoming or Completed for status; times are interpreted in Africa/Lagos. Valid rows are saved even when other rows fail, and each skipped row is reported.
            </p>

            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              Download CSV template
            </button>

            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              disabled={bulkLoading || editSaving}
              rows={8}
              className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              placeholder={'JSON: [{"title":"Seminar","date":"2026-07-15T10:00","description":"...","location":"St. Mary"}]\nCSV: title,date,description,location,status,coverImage'}
            />

            {bulkError && <StatusNotice type="error" className="mt-3">{bulkError}</StatusNotice>}
            {bulkSummary && <p role="status" className="mt-3 text-sm font-semibold text-slate-700">{bulkSummary}</p>}
            {bulkErrors.length > 0 && (
              <div className="mt-3 max-h-48 overflow-auto rounded-xl border border-rose-200 bg-rose-50 p-3" role="alert">
                <p className="text-sm font-bold text-rose-800">Rows not imported</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-rose-700">
                  {bulkErrors.map((error, index) => (
                    <li key={`${error.row}-${error.field}-${index}`}>
                      Row {error.row}{error.field ? ` (${error.field})` : ''}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={handleBulkImport}
              disabled={bulkLoading || editSaving}
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
          ) : loadError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
              Events could not be displayed. Use the retry action above to try again.
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
                      <button
                        ref={(node) => { editButtonRefs.current[ev._id] = node; }}
                        type="button"
                        aria-haspopup="dialog"
                        aria-expanded={editing?._id === ev._id}
                        aria-controls={`event-editor-${ev._id}`}
                        onClick={() => requestEdit(ev)}
                        disabled={editSaving}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {editing?._id === ev._id ? 'Editing' : 'Edit'}
                      </button>
                      <button type="button" onClick={() => toggle(ev._id)} disabled={togglingId === ev._id || editSaving} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">{togglingId === ev._id ? 'Updating…' : ev.status === 'Upcoming' ? 'Mark completed' : 'Mark upcoming'}</button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Date</p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{formatEventDateTime(ev.date)}</p>
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
                    <button type="button" onClick={() => del(ev._id)} disabled={editSaving} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60">Delete</button>
                  </div>

                </article>
              ))}
            </div>
          )}
        </div>
      </div>
      {dialogOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) requestCloseDialog();
          }}
        >
          <section
            ref={dialogRef}
            id={editing ? `event-editor-${editing._id}` : 'create-event-dialog'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-dialog-title"
            aria-describedby="event-dialog-description"
            tabIndex={-1}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl outline-none"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-600">Event Manager</p>
                <h3 id="event-dialog-title" className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                  {editing ? `Edit ${editing.title}` : 'Create a new event'}
                </h3>
                <p id="event-dialog-description" className="mt-1 text-xs text-slate-500">
                  Event date and time use {EVENT_TIME_ZONE}.
                </p>
              </div>
              <button
                type="button"
                onClick={requestCloseDialog}
                disabled={saving || editSaving}
                aria-label="Close event dialog"
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </header>

            <form
              onSubmit={(event) => (editing ? saveEdit(editing, event) : save(event))}
              className="space-y-4 p-5 sm:p-7"
            >
              <label className="block text-xs font-bold text-slate-600">
                Title
                <input
                  ref={editTitleRef}
                  value={dialogForm.title}
                  onChange={(event) => setDialogForm((previous) => ({ ...previous, title: event.target.value }))}
                  disabled={saving || editSaving}
                  required
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-xs font-bold text-slate-600">
                Description
                <textarea
                  value={dialogForm.description}
                  onChange={(event) => setDialogForm((previous) => ({ ...previous, description: event.target.value }))}
                  disabled={saving || editSaving}
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-600">
                  Date & time ({EVENT_TIME_ZONE})
                  <input
                    type="datetime-local"
                    value={dialogForm.date}
                    onChange={(event) => setDialogForm((previous) => ({ ...previous, date: event.target.value }))}
                    disabled={saving || editSaving}
                    required
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-600">
                  Location
                  <input
                    value={dialogForm.location}
                    onChange={(event) => setDialogForm((previous) => ({ ...previous, location: event.target.value }))}
                    disabled={saving || editSaving}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-slate-600">
                Cover image URL
                <input
                  value={dialogForm.coverImage}
                  onChange={(event) => setDialogForm((previous) => ({ ...previous, coverImage: event.target.value }))}
                  disabled={saving || editSaving}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              {dialogError && <StatusNotice type="error">{dialogError}</StatusNotice>}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={requestCloseDialog}
                  disabled={saving || editSaving}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || editSaving}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving || editSaving ? 'Saving…' : editing ? 'Save changes' : 'Create event'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete this event?"
          message={`This will permanently remove "${pendingDelete.title || 'this event'}" from the event schedule.`}
          confirmLabel="Delete event"
          processing={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {discardRequest && (
        <ConfirmDialog
          title="Discard unsaved event changes?"
          message="Your edits have not been saved. Discard them and continue?"
          confirmLabel="Discard changes"
          onConfirm={confirmDiscard}
          onCancel={() => setDiscardRequest(null)}
        />
      )}
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

  if (!sectionTitles[section] || !currentCategory) {
    return (
      <main className="min-h-full bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-600">Content area not found</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">This content section is unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Choose a supported content area from the administration command center.</p>
          <Link to="/admin/control" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700">
            Open administration
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-600">Public content</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {section === 'event-manager'
              ? 'Create and maintain the public community event schedule, and manage its supporting gallery media.'
              : `Upload and maintain the media and captions in the ${title.toLowerCase()} collection.`}
          </p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-600">Section tools</p>
            <h2 className="mt-2 text-xl font-black text-slate-900">{section === 'event-manager' ? 'Event operations' : 'Gallery operations'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {section === 'event-manager'
                ? 'Use the event workspace below to create, update, import, and organize scheduled events.'
                : 'Use the collection workspace below to review, edit, or remove existing gallery assets.'}
            </p>
            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-900">
              {section === 'event-manager'
                ? 'Event changes appear on the public events calendar.'
                : 'Gallery changes update the media associated with this public section.'}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-slate-900">Add gallery media</h2>
            <p className="mt-1 text-sm text-slate-600">Upload an image or video, then add its title, caption, and display options.</p>
            <div className="mt-5">
              <GalleryUploader defaultCategory={currentCategory} />
            </div>
          </section>
        </div>

        {section === 'event-manager' ? <EventManager /> : <GalleryManager category={currentCategory} title={title} />}
      </div>
    </main>
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
  const [feedback, setFeedback] = React.useState(null);
  const apiRoot = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('clan_token');

  React.useEffect(() => {
    setCategory(defaultCategory || 'executives');
  }, [defaultCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !title) {
      setFeedback({ type: 'error', text: 'Choose a media file or enter a title.' });
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
    setFeedback(null);
    try {
      const res = await fetch(`${apiRoot}/api/gallery`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Upload failed.');
      setFeedback({ type: 'success', text: 'Media uploaded successfully.' });
      setFile(null); setTitle(''); setCaption(''); setTags(''); setFeatured(false);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: err.message || 'Unable to upload media.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-sm">
      {feedback && <StatusNotice type={feedback.type}>{feedback.text}</StatusNotice>}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Image File</label>
        <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files[0] || null)} />
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
        <button type="submit" disabled={loading} className="min-h-11 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Uploading…' : 'Upload media'}
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
  const [feedback, setFeedback] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

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
      if (response.ok && json.success) {
        setItems(json.data || []);
      } else {
        throw new Error(json.message || 'Unable to fetch gallery items.');
      }
    } catch (err) {
      console.error('GalleryManager fetch error:', err);
      setError(err.message || 'Unable to connect to gallery service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [category]);

  const handleDelete = (item) => setPendingDelete(item);

  const confirmDelete = async () => {
    if (!pendingDelete || deletingId) return;
    setDeletingId(pendingDelete._id);
    setFeedback(null);
    try {
      const response = await fetch(`${apiRoot}/api/gallery/${pendingDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Delete failed.');
      setItems(prev => prev.filter(item => item._id !== pendingDelete._id));
      setFeedback({ type: 'success', text: 'Gallery item deleted.' });
      setPendingDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      setFeedback({ type: 'error', text: err.message || 'Could not delete item.' });
    } finally {
      setDeletingId(null);
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
    setSavingId(id);
    setFeedback(null);
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
      if (!response.ok || !json.success) throw new Error(json.message || 'Update failed.');
      const updated = json.data;
      setItems(prev => prev.map(it => (it._id === id ? (updated || { ...it, ...editValues }) : it)));
      cancelEditing();
      setFeedback({ type: 'success', text: 'Gallery changes saved.' });
    } catch (err) {
      console.error('Update error:', err);
      setFeedback({ type: 'error', text: err.message || 'Unable to save changes.' });
    } finally {
      setSavingId(null);
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
          type="button"
          onClick={loadItems}
          disabled={loading}
          className="w-full min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {feedback && <StatusNotice type={feedback.type} className="mb-4">{feedback.text}</StatusNotice>}

      {loading ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">Loading gallery items…</div>
      ) : error ? (
        <StatusNotice type="error">{error}</StatusNotice>
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
                    type="button"
                    onClick={() => (editingItemId === item._id ? saveEdit(item._id) : startEditing(item))}
                    disabled={savingId === item._id}
                    className="min-h-10 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === item._id ? 'Saving…' : editingItemId === item._id ? 'Save changes' : 'Edit'}
                  </button>
                  {editingItemId === item._id ? (
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={savingId === item._id}
                      className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item._id}
                    className="min-h-10 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete this gallery item?"
          message={`This will permanently remove "${pendingDelete.title || 'this gallery item'}".`}
          confirmLabel="Delete item"
          processing={deletingId === pendingDelete._id}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
