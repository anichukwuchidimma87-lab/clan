import React, { useEffect, useMemo, useState } from 'react';
import StatusNotice from '../components/StatusNotice';

const API_BASE = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
const PAGE_SIZE = 50;

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async (nextPage = 1, search = submittedQuery, selectedAction = actionFilter) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('clan_token');
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE)
      });
      if (search.trim()) params.set('q', search.trim());
      if (selectedAction !== 'all') params.set('action', selectedAction);

      const response = await fetch(`${API_BASE}/api/audit/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load audit logs');
      }

      setLogs(result.data || []);
      setPage(result.page || nextPage);
      setTotal(result.total || 0);
    } catch (loadError) {
      setLogs([]);
      setError(loadError.message || 'Unable to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, '');
  }, []);

  useEffect(() => {
    if (submittedQuery || actionFilter !== 'all') fetchLogs(1, submittedQuery, actionFilter);
  }, [actionFilter]);

  const actionOptions = useMemo(() => {
    const actions = [...new Set(logs.map((log) => log.action).filter(Boolean))].sort();
    return ['all', ...actions];
  }, [logs]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSubmittedQuery(query);
    fetchLogs(1, query);
  };

  const clearFilters = () => {
    setQuery('');
    setSubmittedQuery('');
    setActionFilter('all');
    fetchLogs(1, '', 'all');
  };

  const getActorName = (log) => {
    if (!log.user) return 'System';
    const name = [log.user.firstName, log.user.lastName].filter(Boolean).join(' ');
    return name || log.user.name || 'Unknown user';
  };

  const formatAction = (action = '') =>
    action
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-600">Governance</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Audit log</h1>
            <p className="mt-2 text-sm text-slate-500">Review account, registry, and administration activity.</p>
          </div>
          <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
            {total.toLocaleString()} records
          </span>
        </header>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <label className="sr-only" htmlFor="audit-search">Search audit logs</label>
          <input
            id="audit-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search action, person, role, or notes..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
          />
          <label className="sr-only" htmlFor="audit-action">Filter action</label>
          <select
            id="audit-action"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"
          >
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action === 'all' ? 'All actions' : formatAction(action)}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
            Search
          </button>
          {(query || submittedQuery || actionFilter !== 'all') && (
            <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
              Clear
            </button>
          )}
        </form>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div role="status" aria-live="polite" className="p-10 text-center text-sm text-slate-500">Loading audit activity...</div>
          ) : error ? (
            <div className="p-6">
              <StatusNotice type="error">{error}</StatusNotice>
              <button
                type="button"
                onClick={() => fetchLogs(page, submittedQuery, actionFilter)}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-bold text-slate-900">
                {submittedQuery || actionFilter !== 'all' ? 'No matching audit entries' : 'No audit entries yet'}
              </p>
              {(submittedQuery || actionFilter !== 'all') && (
                <p className="mt-2 text-sm text-slate-500">Try changing the search or action filter.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <article key={log._id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_180px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                        {formatAction(log.action)}
                      </span>
                      {log.userRole && (
                        <span className="text-xs font-semibold capitalize text-slate-500">{log.userRole}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900">By {getActorName(log)}</p>
                    {log.notes && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{log.notes}</p>}
                    <p className="mt-2 text-xs text-slate-400">
                      {typeof log.affectedCount === 'number' ? `${log.affectedCount} affected record${log.affectedCount === 1 ? '' : 's'}` : 'No affected-record count'}
                      {Array.isArray(log.ids) && log.ids.length > 0 ? ` · ${log.ids.length} record reference${log.ids.length === 1 ? '' : 's'}` : ''}
                    </p>
                  </div>
                  <time className="text-xs font-medium text-slate-500 md:text-right" dateTime={log.createdAt}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Time unavailable'}
                  </time>
                </article>
              ))}
            </div>
          )}
        </section>

        {!loading && !error && logs.length > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => fetchLogs(page - 1)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => fetchLogs(page + 1)}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}
