import React, { useEffect, useState } from 'react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const token = localStorage.getItem('clan_token');
  const [query, setQuery] = useState('');

  const fetchLogs = async (p = 1) => {
    try {
      const q = query ? `&q=${encodeURIComponent(query)}` : '';
      const res = await fetch(`/api/audit/logs?page=${p}&limit=${limit}${q}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
        setPage(json.page || p);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  };

  useEffect(() => { fetchLogs(1); }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-700">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Audit Log</h1>
            <div className="text-xs text-slate-500">Total: {total}</div>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by action, user, or notes" className="rounded-xl border p-2 w-full" />
          <button onClick={() => fetchLogs(1)} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Search</button>
        </div>

        <div className="space-y-3">
          {logs.length === 0 && <div className="bg-white p-6 rounded-2xl border">No audit entries found.</div>}
          {logs.map(log => (
            <div key={log._id} className="bg-white rounded-2xl border p-4 flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">{log.action}</div>
                <div className="text-[12px] text-slate-500">By: {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''} (${log.user.role || ''})` : 'system'}</div>
                <div className="text-[12px] mt-2">Affected: {log.affectedCount} — IDs: {(log.ids || []).length}</div>
                {log.notes && <div className="text-[12px] text-slate-600 mt-2">Notes: {log.notes}</div>}
              </div>
              <div className="text-xs text-slate-400 text-right">
                <div>{new Date(log.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button disabled={page <= 1} onClick={() => fetchLogs(page - 1)} className="rounded-xl border px-3 py-2 bg-white">Previous</button>
          <button disabled={page * limit >= total} onClick={() => fetchLogs(page + 1)} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Next</button>
          <div className="text-xs text-slate-500">Page {page} • {total} total</div>
        </div>
      </div>
    </div>
  );
}
