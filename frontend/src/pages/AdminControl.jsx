import React from 'react';
import { Link } from 'react-router-dom';

const administrationLinks = [
  {
    title: 'Site settings',
    description: 'Manage the association identity and public-facing logo.',
    path: '/settings',
    label: 'Platform'
  },
  {
    title: 'My profile',
    description: 'Review your contact details and account security.',
    path: '/profile',
    label: 'Account'
  },
  {
    title: 'Executive council',
    description: 'Manage executive profiles, positions, and homepage visibility.',
    path: '/admin/executives',
    label: 'Leadership'
  },
  {
    title: 'Access requests',
    description: 'Review account requests and user access.',
    path: '/users',
    label: 'Access'
  },
  {
    title: 'Audit logs',
    description: 'Review account, registry, and administration activity.',
    path: '/admin/audit',
    label: 'Governance'
  },
  {
    title: 'Deanery targets',
    description: 'Set and review parish health targets across deaneries.',
    path: '/admin/deanery-targets',
    label: 'Planning'
  }
];

const contentLinks = [
  {
    title: 'Executive gallery',
    description: 'Manage executive photos and gallery entries.',
    section: 'executives-gallery'
  },
  {
    title: 'Patronage gallery',
    description: 'Manage patron and patroness gallery entries.',
    section: 'patrons-gallery'
  },
  {
    title: 'Event chronicles',
    description: 'Curate event photos and community highlights.',
    section: 'event-chronicles'
  },
  {
    title: 'Event manager',
    description: 'Create, update, and organize community events.',
    section: 'event-manager'
  },
  {
    title: 'Orphanage visits',
    description: 'Manage media from orphanage visitations.',
    section: 'orphanage-visitations'
  },
  {
    title: 'Awards and recognition',
    description: 'Manage award and recognition gallery entries.',
    section: 'awards-recognition'
  },
  {
    title: 'VOALC gallery',
    description: 'Manage VOALC gallery entries.',
    section: 'voalc'
  }
];

export default function AdminControl() {
  return (
    <main className="min-h-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-xl sm:p-9">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[36px] border-white/5" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200">Platform operations</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Administration command center</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
                Move directly to the tools for platform settings, leadership, governance, and public content.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              Return to workspace
            </Link>
          </div>
          <div className="relative mt-7 flex flex-wrap gap-2 text-xs font-semibold text-indigo-100">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">Administrative tools</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">Existing permissions apply</span>
          </div>
        </header>

        <section aria-labelledby="admin-shortcuts-heading">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-600">Operations</p>
            <h2 id="admin-shortcuts-heading" className="mt-2 text-2xl font-black text-slate-900">Administrative shortcuts</h2>
            <p className="mt-1 text-sm text-slate-600">Open an implemented workspace page to manage its settings and records.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {administrationLinks.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-black text-indigo-700">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    {item.label}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-black text-slate-900 group-hover:text-indigo-700">{item.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-700">
                  Open workspace <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="admin-content-heading" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-600">Public experience</p>
              <h2 id="admin-content-heading" className="mt-2 text-2xl font-black text-slate-900">Content management</h2>
              <p className="mt-1 text-sm text-slate-600">Choose a working content area to manage the material shown across the site.</p>
            </div>
            <span className="w-fit rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
              {contentLinks.length} sections
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {contentLinks.map((item) => (
              <Link
                key={item.section}
                to={`/admin/content/${item.section}`}
                className="group flex min-h-28 items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-violet-200 hover:bg-violet-50/60 focus:outline-none focus:ring-4 focus:ring-violet-100"
              >
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-violet-800">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
                <span className="mt-0.5 text-lg font-bold text-violet-600" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
