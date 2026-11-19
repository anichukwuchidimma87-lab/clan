import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const getUser = () => {
  const token = localStorage.getItem('clan_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      name: [payload.title, payload.firstName, payload.lastName].filter(Boolean).join(' ') || payload.name || 'Account',
      parish: payload.parish || '',
      role: String(payload.role || 'member').toLowerCase()
    };
  } catch {
    return null;
  }
};

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'
  }`;

const NavMark = ({ children }) => (
  <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-[8px] font-black tracking-wide text-indigo-200">
    {children}
  </span>
);

export default function WorkspaceLayout() {
  const [user] = useState(getUser);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role === 'admin' ? 'executive' : (user?.role || 'member');
  const isExecutive = ['executive', 'superadmin'].includes(role);
  const canAccessRegistry = ['executive', 'superadmin', 'president'].includes(role);
  const canAccessLedger = ['executive', 'superadmin', 'president'].includes(role);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return <Outlet />;

  const signOut = () => {
    ['clan_token', 'authToken', 'token', 'role', 'isLoggedIn'].forEach((key) => localStorage.removeItem(key));
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5 text-slate-200">
      <div className="px-2">
        <p className="text-xl font-black tracking-tight text-white">CLAN Workspace</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">
          {role === 'president' ? `${user?.parish || 'Parish'} workspace` : isExecutive ? 'Deanery administration' : 'Member workspace'}
        </p>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Workspace navigation">
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Workspace</p>
        <NavLink to="/dashboard" end className={linkClass}><NavMark>OV</NavMark><span>Overview</span></NavLink>
        {canAccessRegistry && <NavLink to="/registry" className={linkClass}><NavMark>RG</NavMark><span>{role === 'president' ? 'Parish roster' : 'Registry'}</span></NavLink>}
        {canAccessLedger && <NavLink to="/ledger" className={linkClass}><NavMark>FL</NavMark><span>Financial ledger</span></NavLink>}
        <NavLink to="/events" className={linkClass}><NavMark>EV</NavMark><span>Community calendar</span></NavLink>
        <NavLink to="/profile" className={linkClass}><NavMark>ME</NavMark><span>My profile</span></NavLink>

        {isExecutive && (
          <>
            <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Administration</p>
            <NavLink to="/users" className={linkClass}><NavMark>AR</NavMark><span>Access requests</span></NavLink>
            <NavLink to="/admin/executives" className={linkClass}><NavMark>EX</NavMark><span>Executive council</span></NavLink>
            <NavLink to="/admin/audit" className={linkClass}><NavMark>AU</NavMark><span>Audit logs</span></NavLink>
            <NavLink to="/admin/deanery-targets" className={linkClass}><NavMark>DT</NavMark><span>Deanery targets</span></NavLink>
            <details className="group rounded-xl">
              <summary className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
                Content management
              </summary>
              <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2">
                <NavLink to="/admin/content/executives-gallery" className={linkClass}>Executives gallery</NavLink>
                <NavLink to="/admin/content/patrons-gallery" className={linkClass}>Patronage gallery</NavLink>
                <NavLink to="/admin/content/event-chronicles" className={linkClass}>Event chronicles</NavLink>
                <NavLink to="/admin/content/event-manager" className={linkClass}>Event manager</NavLink>
                <NavLink to="/admin/content/orphanage-visitations" className={linkClass}>Orphanage visits</NavLink>
                <NavLink to="/admin/content/awards-recognition" className={linkClass}>Awards</NavLink>
                <NavLink to="/admin/content/voalc" className={linkClass}>VOALC gallery</NavLink>
              </div>
            </details>
            <NavLink to="/admin/control" className={linkClass}><NavMark>SYS</NavMark><span>System settings</span></NavLink>
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={signOut}
        className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5 text-left text-sm font-bold text-amber-300 transition hover:bg-amber-400 hover:text-slate-950"
      >
        Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden w-64 shrink-0 bg-indigo-950 md:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/50"
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-indigo-950 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{user?.name || 'CLAN account'}</p>
              <p className="truncate text-xs capitalize text-slate-500">{role}{user?.parish ? ` · ${user.parish}` : ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Account
          </button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
