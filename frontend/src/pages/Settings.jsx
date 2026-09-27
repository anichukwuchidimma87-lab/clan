import React, { useEffect, useState } from 'react';

export default function Settings() {
  const [logoUrl, setLogoUrl] = useState('');
  const [file, setFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('clan_token');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('https://clan-3slh.onrender.com/api/public/settings');
        const data = await res.json();
        if (data.success && data.data) setLogoUrl(data.data.logoUrl || '');
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = (e) => setFile(e.target.files?.[0] || null);

  const uploadFile = async () => {
    if (!file) return setStatus('Please choose a file.');
    setLoading(true); setStatus('Uploading...');
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetch('https://clan-3slh.onrender.com/api/v1/settings/logo', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setLogoUrl(data.data.logoUrl || '');
        setStatus('Logo uploaded successfully.');
      } else {
        setStatus(data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error(err);
      setStatus('Upload error.');
    } finally { setLoading(false); }
  };

  const saveExternalUrl = async () => {
    if (!externalUrl) return setStatus('Please enter an image URL.');
    setLoading(true); setStatus('Saving URL...');
    try {
      const res = await fetch('https://clan-3slh.onrender.com/api/v1/settings/logo-url', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ logoUrl: externalUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setLogoUrl(data.data.logoUrl || '');
        setStatus('Logo URL saved.');
      } else {
        setStatus(data.message || 'Failed to save URL.');
      }
    } catch (err) {
      console.error(err);
      setStatus('Error saving URL.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Site Settings</h1>
          <p className="text-sm text-gray-600 mb-6">Manage the site logo used across the Deanery portal. You can upload an image file or supply an external image URL (we recommend uploading for stability).</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-6">
            <div className="col-span-1">
              <div className="w-28 h-28 rounded-full bg-slate-100 overflow-hidden border border-gray-100 flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Site logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">⛪</span>
                )}
              </div>
            </div>
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600">Upload Logo</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
                <div className="mt-2 flex gap-2">
                  <button onClick={uploadFile} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded">Upload</button>
                  <button onClick={() => { setFile(null); setStatus(''); }} className="px-3 py-2 border rounded">Clear</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600">Or supply image URL</label>
                <div className="flex gap-2 mt-2">
                  <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://example.com/logo.jpg" className="flex-grow px-3 py-2 border rounded" />
                  <button onClick={saveExternalUrl} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded">Save URL</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">If the external host restricts hotlinking (e.g., some Facebook URLs), consider downloading and uploading the file instead.</p>
              </div>

              {status && <p className="text-sm text-gray-700">{status}</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-600">Other profile settings remain here. Site logo changes are reflected immediately across the portal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
