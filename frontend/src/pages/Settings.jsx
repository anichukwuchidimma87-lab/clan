import React, { useCallback, useEffect, useMemo, useState } from 'react';
import StatusNotice from '../components/StatusNotice';

const API_BASE = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

export default function Settings() {
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSource, setLogoSource] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  const token = localStorage.getItem('clan_token');

  const safeFetch = async (input, init) => {
    const response = await fetch(input, init);
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    let result = null;

    if (contentType.includes('application/json')) {
      result = JSON.parse(text);
    } else {
      try {
        result = JSON.parse(text);
      } catch {
        result = { success: response.ok, message: text };
      }
    }

    if (!response.ok) throw new Error(result.message || 'The settings request failed.');
    return result;
  };

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    setSettingsError('');
    try {
      const result = await safeFetch(`${API_BASE}/api/public/settings`);
      setLogoUrl(result.data?.logoUrl || '');
      setLogoSource(result.data?.logoSource || '');
    } catch (error) {
      setSettingsError(error.message || 'Could not load site settings.');
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!file) {
      setFilePreview('');
      return;
    }
    const preview = URL.createObjectURL(file);
    setFilePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  const previewUrl = useMemo(() => filePreview || externalUrl.trim() || logoUrl, [filePreview, externalUrl, logoUrl]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (!selectedFile.type.startsWith('image/')) {
      setFile(null);
      setMessage({ text: 'Choose a valid image file.', isError: true });
      event.target.value = '';
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setMessage({ text: 'The logo must be 5 MB or smaller.', isError: true });
      event.target.value = '';
      return;
    }
    setMessage({ text: '', isError: false });
    setFile(selectedFile);
  };

  const uploadFile = async () => {
    if (!file) {
      setMessage({ text: 'Choose an image file first.', isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: 'Uploading logo...', isError: false });
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const result = await safeFetch(`${API_BASE}/api/v1/settings/logo`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      setLogoUrl(result.data?.logoUrl || '');
      setLogoSource('uploaded');
      setExternalUrl('');
      setFile(null);
      setMessage({ text: 'Logo uploaded successfully.', isError: false });
    } catch (error) {
      setMessage({ text: error.message || 'Unable to upload the logo.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const saveExternalUrl = async () => {
    const trimmedUrl = externalUrl.trim();
    if (!trimmedUrl) {
      setMessage({ text: 'Enter an image URL first.', isError: true });
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setMessage({ text: 'Enter a valid complete image URL.', isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: 'Saving logo URL...', isError: false });
    try {
      const result = await safeFetch(`${API_BASE}/api/v1/settings/logo-url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ logoUrl: trimmedUrl })
      });
      setLogoUrl(result.data?.logoUrl || trimmedUrl);
      setLogoSource('external');
      setFile(null);
      setMessage({ text: 'Logo URL saved successfully.', isError: false });
    } catch (error) {
      setMessage({ text: error.message || 'Unable to save the logo URL.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const clearSelections = () => {
    setFile(null);
    setExternalUrl('');
    setMessage({ text: '', isError: false });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-600">Administration</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Site settings</h1>
          <p className="mt-2 text-sm text-slate-500">Control the association identity shown across the public and workspace portals.</p>
        </header>

        {message.text && (
          <StatusNotice type={message.isError ? 'error' : 'success'}>
            {message.text}
          </StatusNotice>
        )}

        {loadingSettings ? (
          <div role="status" aria-live="polite" className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading site settings...</div>
        ) : settingsError ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <StatusNotice type="error">{settingsError}</StatusNotice>
            <button type="button" onClick={fetchSettings} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700">
              Retry
            </button>
          </section>
        ) : (
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Current logo</p>
              <div className="mt-4 flex h-48 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-6">
                {previewUrl ? (
                  <img src={previewUrl} alt="Association logo preview" className="max-h-36 max-w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <div aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-black tracking-wide text-indigo-700">CLAN</div>
                    <p className="mt-3 text-xs font-semibold text-slate-500">No logo configured</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Source: <span className="font-bold capitalize text-slate-700">{logoSource || 'Not set'}</span>
              </p>
            </aside>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Association logo</h2>
                <p className="mt-1 text-sm text-slate-500">Upload a square image or use a stable public image URL.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Upload an image</h3>
                    <p className="mt-1 text-xs text-slate-500">PNG, JPG, SVG, or WebP · Maximum 5 MB</p>
                  </div>
                  {file && <span className="max-w-32 truncate rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">{file.name}</span>}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="mt-4 block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                  type="button"
                  onClick={uploadFile}
                  disabled={loading || !file}
                  className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Upload logo'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900">Use an external image URL</h3>
                <p className="mt-1 text-xs text-slate-500">Use a directly accessible HTTPS image URL.</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(event) => setExternalUrl(event.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={saveExternalUrl}
                    disabled={loading || !externalUrl.trim()}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save URL
                  </button>
                </div>
              </div>

              {(file || externalUrl) && (
                <div className="flex justify-end">
                  <button type="button" onClick={clearSelections} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Clear selection
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
