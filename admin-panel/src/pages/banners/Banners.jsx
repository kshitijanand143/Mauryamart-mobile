import React, { useEffect, useState, useCallback } from 'react';
import { bannersAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader, EmptyState, Modal, ConfirmDialog, ImageUpload, Select } from '../../components/common';
import toast from 'react-hot-toast';

const STORE_TYPES = [
  { value: 'all', label: 'All store types' }, { value: 'food', label: 'Food' },
  { value: 'electronics', label: 'Electronics' }, { value: 'fashion', label: 'Fashion' }, { value: 'grocery', label: 'Grocery' },
];

function BannerForm({ banner, onClose, onSaved }) {
  const [form, setForm] = useState(banner ? { title: banner.title, link: banner.link || '', storeType: banner.storeType, position: banner.position || 0 } : { title: '', link: '', storeType: 'food', position: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview]     = useState(banner?.image || null);
  const [loading, setLoading]     = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setPreview(URL.createObjectURL(file)); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title required'); return; }
    if (!banner && !imageFile) { toast.error('Banner image required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (banner) await bannersAPI.update(banner._id, fd);
      else        await bannersAPI.create(fd);
      toast.success(banner ? 'Banner updated' : 'Banner created');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ImageUpload label="Banner image" name="image" onChange={handleImage} preview={preview} required={!banner} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Link URL (optional)</label>
        <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} className="input-field" placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Store type" value={form.storeType} onChange={v => setForm(f => ({ ...f, storeType: v }))} options={STORE_TYPES} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
          <input type="number" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="input-field" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save banner'}</button>
      </div>
    </form>
  );
}

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formBanner, setFormBanner] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try { const { data } = await bannersAPI.list(); setBanners(data.data); }
    catch { toast.error('Failed to load banners'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const toggle = async (b) => {
    try { await bannersAPI.toggle(b._id); fetchBanners(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try { await bannersAPI.delete(deleteTarget._id); toast.success('Banner deleted'); fetchBanners(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <PageLayout title="Banner Management">
      <div className="flex justify-end mb-4">
        <button onClick={() => setFormBanner(null)} className="btn-primary">+ Add Banner</button>
      </div>

      {loading ? <PageLoader /> : banners.length === 0 ? (
        <EmptyState icon="🖼️" title="No banners yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(b => (
            <div key={b._id} className="card overflow-hidden">
              <img src={b.image} alt={b.title} className="w-full h-32 object-cover" />
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{b.title}</h3>
                  <span className={b.isActive ? 'badge-green' : 'badge-gray'}>{b.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-xs text-gray-400 capitalize mb-3">{b.storeType} · position {b.position}</p>
                <div className="flex gap-3">
                  <button onClick={() => setFormBanner(b)} className="text-xs font-medium text-brand-500 hover:text-brand-600">Edit</button>
                  <button onClick={() => toggle(b)} className="text-xs font-medium text-gray-500 hover:text-gray-700">{b.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => setDeleteTarget(b)} className="text-xs font-medium text-red-500 hover:text-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={formBanner !== undefined} onClose={() => setFormBanner(undefined)} title={formBanner ? 'Edit banner' : 'Add banner'} size="sm">
        {formBanner !== undefined && (
          <BannerForm banner={formBanner} onClose={() => setFormBanner(undefined)} onSaved={() => { setFormBanner(undefined); fetchBanners(); }} />
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete banner?" message={`Delete "${deleteTarget?.title}"?`} danger />
    </PageLayout>
  );
}
