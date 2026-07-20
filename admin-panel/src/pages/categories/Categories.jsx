import React, { useEffect, useState, useCallback } from 'react';
import { categoriesAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader, EmptyState, Modal, ConfirmDialog, ImageUpload, Select } from '../../components/common';
import toast from 'react-hot-toast';

const STORE_TYPES = [
  { value: 'food', label: 'Food' }, { value: 'electronics', label: 'Electronics' },
  { value: 'fashion', label: 'Fashion' }, { value: 'grocery', label: 'Grocery' }, { value: 'all', label: 'All store types' },
];

function CategoryForm({ category, onClose, onSaved }) {
  const [form, setForm] = useState(category ? { name: category.name, storeType: category.storeType, sortOrder: category.sortOrder || 0 } : { name: '', storeType: 'food', sortOrder: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview]     = useState(category?.image || null);
  const [loading, setLoading]     = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setPreview(URL.createObjectURL(file)); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (category) await categoriesAPI.update(category._id, fd);
      else          await categoriesAPI.create(fd);
      toast.success(category ? 'Category updated' : 'Category created');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ImageUpload label="Category image" name="image" onChange={handleImage} preview={preview} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category name *</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
      </div>
      <Select label="Store type" value={form.storeType} onChange={v => setForm(f => ({ ...f, storeType: v }))} options={STORE_TYPES} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort order</label>
        <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className="input-field" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save category'}</button>
      </div>
    </form>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [formCat, setFormCat]       = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try { const { data } = await categoriesAPI.list({ storeType: 'all' }); setCategories(data.data); }
    catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleDelete = async () => {
    try { await categoriesAPI.delete(deleteTarget._id); toast.success('Category deleted'); fetchCategories(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  return (
    <PageLayout title="Category Management">
      <div className="flex justify-end mb-4">
        <button onClick={() => setFormCat(null)} className="btn-primary">+ Add Category</button>
      </div>

      {loading ? <PageLoader /> : categories.length === 0 ? (
        <EmptyState icon="🗂️" title="No categories yet" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(c => (
            <div key={c._id} className="card p-4">
              <img src={c.image || 'https://via.placeholder.com/100'} alt="" className="h-20 w-full rounded-lg object-cover mb-3" />
              <h3 className="font-semibold text-gray-900 text-sm">{c.name}</h3>
              <p className="text-xs text-gray-400 capitalize mb-3">{c.storeType}</p>
              <div className="flex gap-3">
                <button onClick={() => setFormCat(c)} className="text-xs font-medium text-brand-500 hover:text-brand-600">Edit</button>
                <button onClick={() => setDeleteTarget(c)} className="text-xs font-medium text-red-500 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={formCat !== undefined} onClose={() => setFormCat(undefined)} title={formCat ? 'Edit category' : 'Add category'} size="sm">
        {formCat !== undefined && (
          <CategoryForm category={formCat} onClose={() => setFormCat(undefined)} onSaved={() => { setFormCat(undefined); fetchCategories(); }} />
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete category?" message={`Delete "${deleteTarget?.name}"? Products in this category will be unaffected but unlinked.`} danger />
    </PageLayout>
  );
}
