import React from 'react';

function FeaturedGallery({ items }) {
  if (!items || !items.length) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="text-4xl mb-4">📷</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Dynamic Gallery Coming Soon</h3>
        <p className="text-sm text-gray-500">
          As your team adds media through the admin CMS, this section will refresh automatically with a new mix of event, award, and leadership images.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item._id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="relative h-64 bg-slate-100">
            <img
              src={item.url}
              alt={item.title || item.caption || item.category}
              className="h-full w-full object-cover"
            />
            <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white">
              {item.category}
            </span>
          </div>
          <div className="p-5">
            {item.title && <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>}
            <p className="mt-2 text-sm text-gray-500 min-h-[3rem]">{item.caption || 'A meaningful moment from our community timeline.'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FeaturedGallery;
