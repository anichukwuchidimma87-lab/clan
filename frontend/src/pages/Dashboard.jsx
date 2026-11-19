import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState({ name: '', role: '', position: '', parish: '', isLoggedIn: false });
  const [registryCount, setRegistryCount] = useState(0);
  const [parishCount, setParishCount] = useState(0);
  const [executiveCouncil, setExecutiveCouncil] = useState([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [parishRosterStats, setParishRosterStats] = useState(null);
  const [parishRosterError, setParishRosterError] = useState('');
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const [pendingApprovalsError, setPendingApprovalsError] = useState('');
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

  const safeFetch = async (input, init) => {
    const res = await fetch(input, init);
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    if (!res.ok) {
      try { const j = JSON.parse(text); throw new Error(j.message || JSON.stringify(j)); } catch (_) { throw new Error(text || `${res.status} ${res.statusText}`); }
    }
    if (ct.includes('application/json')) return JSON.parse(text);
    try { return JSON.parse(text); } catch { return { success: true, data: text }; }
  };

  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };

  const formatUserName = (payload) => {
    const fullName = [payload?.title || '', payload?.firstName || '', payload?.lastName || '', payload?.name || '']
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (fullName) return fullName;
    return `${payload?.title || 'Mr.'} ${payload?.firstName || ''} ${payload?.lastName || ''}`.trim() || 'Member';
  };

  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem('clan_token');
      if (token) {
        const payload = parseJwt(token);
        if (payload) {
          const role = String(payload.role || 'member').toLowerCase();
          setUser({
            name: formatUserName(payload),
            role,
            position: payload.position || 'Member',
            parish: payload.parish || '',
            isLoggedIn: true
          });

          if (role === 'president') {
            try {
              const rosterData = await safeFetch(`${apiBase}/api/lectors/registry?limit=1000&page=1`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const roster = rosterData.ownParish || rosterData.data || [];
              setParishRosterStats({
                total: roster.length,
                active: roster.filter((member) => (member.status || 'Active') === 'Active').length,
                suspended: roster.filter((member) => member.status === 'Suspended').length
              });
            } catch (err) {
              console.error('Parish roster stats error', err.message || err);
              setParishRosterError('Parish roster statistics could not be loaded. Open the roster to try again.');
            }
          }

          if (['superadmin', 'executive', 'admin'].includes(role)) {
            try {
              const pendingData = await safeFetch(`${apiBase}/api/v1/users/pending`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setPendingApprovals(pendingData.data?.length || 0);
            } catch (err) {
              console.error('Pending approval count error', err.message || err);
              setPendingApprovalsError('Pending request count could not be loaded.');
            }
          }
        }
      }

      try {
        const countData = await safeFetch(`${apiBase}/api/public/stats`);
        if (countData.success) {
          setRegistryCount(countData.data.totalLectors || 0);
          setParishCount(countData.data.totalParishes || 0);
        }
      } catch (err) { console.error('Stats error', err.message || err); }

      try {
        const leadershipData = await safeFetch(`${apiBase}/api/public/leadership`);
        const allMembers = leadershipData?.data?.executives || [];

        if (leadershipData.success && allMembers.length > 0) {
          setExecutiveCouncil(allMembers.map((member) => ({
            name: member.name,
            role: member.position || 'Executive Member',
            parish: member.profileTitle || member.parish || 'Deanery Executive'
          })));
        } else {
          setExecutiveCouncil([]);
        }
      } catch (err) {
        console.error('Leadership fetch error', err.message || err);
        setExecutiveCouncil([]);
      }
    };
    checkStatus();
    // fetch public settings (logo)
    (async () => {
      try {
        const data = await safeFetch(`${apiBase}/api/public/settings`);
        if (data.success && data.data) setLogoUrl(data.data.logoUrl || '');
      } catch (e) { console.error('Failed to fetch site settings', e.message || e); }
    })();
  }, []);

  const normalizedRole = user.role === 'admin' ? 'executive' : (user.role || 'member');
  const isExecutive = ['superadmin', 'executive'].includes(normalizedRole);
  const isPresident = normalizedRole === 'president';
  const isSuperAdmin = normalizedRole === 'superadmin';

  const workspaceDescription = isPresident
    ? 'Your parish at a glance. Review your roster, follow up on member records, and stay on top of parish administration.'
    : isExecutive
      ? 'Review deanery-wide activity, respond to pending requests, and manage registry and financial operations.'
      : user.isLoggedIn
        ? 'Stay connected with your profile and the wider CLAN community.'
        : 'Catholic Lectors Association of Nigeria | Registry Base';

  const workspaceActions = isPresident
    ? [
        { title: 'Parish roster', description: 'View and manage members in your parish.', path: '/registry', mark: 'RG' },
        { title: 'Financial ledger', description: 'Review parish financial records.', path: '/ledger', mark: 'FL' },
        { title: 'My profile', description: 'Keep your contact details up to date.', path: '/profile', mark: 'ME' }
      ]
    : isExecutive
      ? [
          { title: 'Unified registry', description: 'Find parish and lector records.', path: '/registry', mark: 'RG' },
          { title: 'Financial ledger', description: 'Review deanery financial compliance.', path: '/ledger', mark: 'FL' },
          { title: 'Access requests', description: 'Review new account approvals.', path: '/users', mark: 'AR', count: pendingApprovals },
          { title: 'Community calendar', description: 'Browse upcoming and past events.', path: '/events', mark: 'EV' },
          ...(isSuperAdmin ? [{ title: 'System settings', description: 'Manage platform-wide settings.', path: '/admin/control', mark: 'SYS' }] : [])
        ]
      : [
          { title: 'My profile', description: 'Review your account and contact details.', path: '/profile', mark: 'ME' },
          { title: 'Public leadership', description: 'Meet the CLAN leadership team.', path: '/leadership', mark: 'EX' },
          { title: 'Public financials', description: 'View the public financial summary.', path: '/financials', mark: 'FIN' }
        ];

  return (
    <main className="min-h-screen bg-slate-50 text-sm text-slate-700">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {!user.isLoggedIn ? (
            <section className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:p-8">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-indigo-100/50 bg-indigo-50 text-sm font-black tracking-wide text-indigo-700">
                {logoUrl ? <img src={logoUrl} alt="CLAN logo" className="h-full w-full object-cover" /> : 'CLAN'}
              </div>
              <div className="flex-grow space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome to CLAN Benin City Deanery</h2>
                <p className="text-sm font-medium text-gray-600 max-w-3xl leading-relaxed">
                  A community of lectors serving across {parishCount || 0} parishes. Sign in to access your workspace, or explore the public leadership and financial information.
                </p>
                <button type="button" onClick={() => navigate('/login')} className="mt-2 min-h-11 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
                  Sign in to your workspace
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-sm sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-200">
                  {isPresident ? 'Parish operations' : isExecutive ? 'Deanery overview' : 'Member access'}
                </p>
                <h2 className="mt-2 text-2xl font-black">Welcome back, {user.name}</h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">{workspaceDescription}</p>
              </section>

              {isPresident && parishRosterStats && (
                <section className="grid gap-4 sm:grid-cols-3">
                  <DashboardMetric label="Parish members" value={parishRosterStats.total} tone="border-slate-200 bg-white text-slate-900" />
                  <DashboardMetric label="Active members" value={parishRosterStats.active} tone="border-emerald-100 bg-emerald-50 text-emerald-700" />
                  <DashboardMetric label="Suspended" value={parishRosterStats.suspended} tone="border-amber-100 bg-amber-50 text-amber-700" />
                </section>
              )}
              {isPresident && parishRosterError && (
                <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{parishRosterError}</p>
              )}

              {isExecutive && (
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <DashboardMetric label="Registered lectors" value={registryCount} tone="border-slate-200 bg-white text-slate-900" />
                  <DashboardMetric label="Parishes" value={parishCount} tone="border-indigo-100 bg-indigo-50 text-indigo-700" />
                  <DashboardMetric label="Pending access requests" value={pendingApprovals === null ? '—' : pendingApprovals} tone="border-amber-100 bg-amber-50 text-amber-700" />
                </section>
              )}
              {isExecutive && pendingApprovalsError && (
                <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{pendingApprovalsError}</p>
              )}

              <section>
                <div className="mb-4">
                  <h2 className="text-xl font-black text-gray-900">Quick access</h2>
                  <p className="mt-1 text-sm text-gray-500">The tools available for your role.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {workspaceActions.map((action) => (
                    <button
                      type="button"
                      key={action.path}
                      onClick={() => navigate(action.path)}
                      className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span aria-hidden="true" className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-indigo-50 px-2 text-[10px] font-black uppercase tracking-wide text-indigo-700">{action.mark}</span>
                        {action.count !== undefined && action.count !== null && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{action.count}</span>
                        )}
                      </div>
                      <h3 className="mt-4 font-bold text-gray-900 group-hover:text-indigo-700">{action.title}</h3>
                      <p className="mt-1 text-sm font-medium text-gray-500">{action.description}</p>
                      <span className="mt-4 inline-flex text-xs font-bold text-indigo-600">Open <span className="ml-1" aria-hidden="true">→</span></span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {executiveCouncil.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="border-b pb-3">
                <h2 className="text-lg font-black text-gray-900 tracking-tight">Deanery leadership</h2>
                <p className="mt-1 text-sm text-gray-500">Current leadership serving the CLAN community.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {executiveCouncil.map((exec, index) => (
                  <div key={`${exec.name}-${index}`} className="bg-gray-50/70 border border-gray-100 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100/80 flex items-center justify-center font-bold text-xs text-indigo-600 shrink-0">{index + 1}</div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-gray-900 text-sm leading-tight">{exec.name}</p>
                      <p className="text-[10px] text-indigo-600 uppercase font-extrabold tracking-wider">{exec.role}</p>
                      <p className="text-gray-400 text-[11px] font-medium">{exec.parish}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
      </div>
    </main>
  );
}

function DashboardMetric({ label, value, tone }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tone}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}