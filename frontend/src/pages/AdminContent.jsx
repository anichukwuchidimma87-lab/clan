import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import generateCaption from '../utils/generateCaption';

function EventManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', coverImage: '' });
  const apiRoot = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('clan_token');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiRoot}/api/events`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setEvents(json.data || []);
    } catch (err) {
      console.error('EventManager load error', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const method = editing ? 'PATCH' : 'POST';
      const url = editing ? `${apiRoot}/api/events/${editing._id}` : `${apiRoot}/api/events`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { setForm({ title: '', description: '', date: '', location: '', coverImage: '' }); setEditing(null); load(); }
      else alert(json.message || 'Save failed');
    } catch (err) { console.error(err); alert('Save error'); }
  };

  const startEdit = (ev) => { setEditing(ev); setForm({ title: ev.title, description: ev.description, date: new Date(ev.date).toISOString().slice(0,16), location: ev.location, coverImage: ev.coverImage }); };

  const toggle = async (id) => {
    try {
      const res = await fetch(`${apiRoot}/api/events/${id}/toggle`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setEvents(prev => prev.map(p => p._id === id ? json.data : p));
    } catch (err) { console.error('Toggle error', err); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await fetch(`${apiRoot}/api/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setEvents(prev => prev.filter(p => p._id !== id));
    } catch (err) { console.error('Delete event error', err); }
  };

  const copyCaption = (ev) => {
    const text = generateCaption(ev);
    navigator.clipboard.writeText(text).then(() => alert('Announcement copied to clipboard.'))
      .catch(() => alert('Unable to copy to clipboard.'));
  };

  const genCaptionServer = async (id) => {
    try {
      const res = await fetch(`${apiRoot}/api/events/${id}/generate-caption`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success && json.data) { navigator.clipboard.writeText(json.data.caption); alert('Server-generated caption copied.'); }
    } catch (err) { console.error('Generate caption error', err); }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Event Manager</h2>
        <button onClick={load} className="rounded-full border px-3 py-1">Refresh</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <form onSubmit={save} className="space-y-3">
            <input placeholder="Title" value={form.title} onChange={e=>setForm(prev=>({...prev,title:e.target.value}))} className="w-full border p-2 rounded" required />
            <textarea placeholder="Description" value={form.description} onChange={e=>setForm(prev=>({...prev,description:e.target.value}))} className="w-full border p-2 rounded" />
            <input type="datetime-local" value={form.date} onChange={e=>setForm(prev=>({...prev,date:e.target.value}))} className="w-full border p-2 rounded" required />
            <input placeholder="Location" value={form.location} onChange={e=>setForm(prev=>({...prev,location:e.target.value}))} className="w-full border p-2 rounded" />
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">{editing ? 'Save' : 'Create'}</button>
              {editing && <button type="button" onClick={()=>{setEditing(null); setForm({ title: '', description: '', date: '', location: '', coverImage: '' });}} className="border px-3 py-2 rounded">Cancel</button>}
            </div>
          </form>
        </div>
        <div>
          {loading ? <div>Loading…</div> : (
            <div className="space-y-3">
              {events.map(ev => (
                <div key={ev._id} className="p-3 border rounded flex items-start justify-between bg-slate-50">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{ev.title}</h3>
                      <span className="text-xs text-gray-500">{new Date(ev.date).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600">{ev.location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={()=>startEdit(ev)} className="text-sm px-2 py-1 border rounded">Edit</button>
                    <button onClick={()=>toggle(ev._id)} className="text-sm px-2 py-1 border rounded">{ev.status==='Upcoming'?'Mark Completed':'Mark Upcoming'}</button>
                    <button onClick={()=>copyCaption(ev)} title="Copy caption" className="text-sm px-2 py-1 border rounded">Notify</button>
                    <button onClick={()=>genCaptionServer(ev._id)} title="Generate caption (server)" className="text-sm px-2 py-1 border rounded">Generate Announcement</button>
                    <button onClick={()=>del(ev._id)} className="text-sm px-2 py-1 border rounded text-rose-600">Delete</button>
                  </div>
                </div>
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
