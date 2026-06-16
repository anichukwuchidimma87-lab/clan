import React from 'react';
import { useParams } from 'react-router-dom';

const sectionTitles = {
  'executives-gallery': 'Executives Gallery',
  'patrons-gallery': 'Patronage Gallery',
  'event-chronicles': 'Event Chronicles',
  'orphanage-visitations': 'Orphanage Visitations',
  'awards-recognition': 'Awards & Recognition',
  'voalc': 'VOALC Gallery'
};

export default function AdminContent() {
  const { section } = useParams();
  const title = sectionTitles[section] || 'Content Management';

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-6xl mx-auto">
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
              <h2 className="font-bold text-lg text-slate-900">Next step</h2>
              <p className="mt-3 text-sm text-slate-600">
                The next implementation phase will connect this page to Cloudinary upload workflows and the `GalleryItem` model so content truly powers the landing page.
              </p>
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2">Upload Gallery Item</h3>
                <GalleryUploader />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryUploader() {
  const [file, setFile] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [category, setCategory] = React.useState('executives');
  const [featured, setFeatured] = React.useState(false);
  const [tags, setTags] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const token = localStorage.getItem('clan_token');

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
      const res = await fetch('https://clan-3slh.onrender.com/api/gallery', {
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
