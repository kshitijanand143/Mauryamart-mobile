import React, { useEffect, useState, useCallback } from 'react';
import { productsAPI, categoriesAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader, EmptyState, SearchBar, Select, Pagination, Modal, ConfirmDialog, ImageUpload } from '../../components/common';
import { fmt } from '../../utils/helpers';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '', price: '', originalPrice: '', categoryId: '', isVeg: 'true', storeType: 'food' };

function ProductForm({ product, categories, onClose, onSaved }) {
  const [form, setForm]   = useState(product ? {
    name: product.name, description: product.description || '', price: product.price,
    originalPrice: product.originalPrice || '', categoryId: product.categoryId?._id || product.categoryId,
    isVeg: String(product.isVeg), storeType: product.storeType || 'food',
  } : emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview]     = useState(product?.image || null);
  const [loading, setLoading]     = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setPreview(URL.createObjectURL(file)); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) { toast.error('Name, price, and category are required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (product) await productsAPI.update(product._id, fd);
      else         await productsAPI.create(fd);

      toast.success(product ? 'Product updated' : 'Product created');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ImageUpload label="Product image" name="image" onChange={handleImage} preview={preview} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Product name *</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input-field resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
          <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Original price (₹)</label>
          <input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} className="input-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" required value={form.categoryId} onChange={v => setForm(f => ({ ...f, categoryId: v }))}
          options={[{ value: '', label: 'Select category' }, ...categories.map(c => ({ value: c._id, label: c.name }))]} />
        <Select label="Veg / Non-veg" value={form.isVeg} onChange={v => setForm(f => ({ ...f, isVeg: v }))}
          options={[{ value: 'true', label: 'Vegetarian' }, { value: 'false', label: 'Non-vegetarian' }]} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save product'}</button>
      </div>
    </form>
  );
}

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [formProduct, setFormProduct] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsAPI.list({ page, limit: 12, search, category });
      setProducts(data.data.products);
      setTotal(data.data.pagination.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, search, category]);

  useEffect(() => { categoriesAPI.list({ storeType: 'all' }).then(r => setCategories(r.data.data)).catch(() => {}); }, []);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    try { await productsAPI.delete(deleteTarget._id); toast.success('Product removed'); fetchProducts(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleStock = async (p) => {
    try { await productsAPI.toggleStock(p._id); fetchProducts(); }
    catch { toast.error('Failed'); }
  };

  return (
    <PageLayout title="Product Management">
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search products…" className="sm:w-72" />
            <Select value={category} onChange={setCategory} className="sm:w-52"
              options={[{ value: '', label: 'All categories' }, ...categories.map(c => ({ value: c._id, label: c.name }))]} />
          </div>
          <button onClick={() => setFormProduct(null)} className="btn-primary whitespace-nowrap">+ Add Product</button>
        </div>

        {loading ? <PageLoader /> : products.length === 0 ? (
          <EmptyState icon="🍱" title="No products found" />
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Vendor</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Stock</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <img src={p.image || 'https://via.placeholder.com/32'} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="table-td">{p.categoryId?.name || '—'}</td>
                    <td className="table-td">{p.vendorId?.storeName || '—'}</td>
                    <td className="table-td font-semibold">{fmt(p.price)}</td>
                    <td className="table-td">
                      <button onClick={() => toggleStock(p)} className={p.inStock ? 'badge-green' : 'badge-red'}>
                        {p.inStock ? 'In stock' : 'Out of stock'}
                      </button>
                    </td>
                    <td className="table-td text-right space-x-3">
                      <button onClick={() => setFormProduct(p)} className="text-xs font-medium text-brand-500 hover:text-brand-600">Edit</button>
                      <button onClick={() => setDeleteTarget(p)} className="text-xs font-medium text-red-500 hover:text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={total} limit={12} onChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={formProduct !== undefined} onClose={() => setFormProduct(undefined)} title={formProduct ? 'Edit product' : 'Add product'} size="md">
        {formProduct !== undefined && (
          <ProductForm product={formProduct} categories={categories} onClose={() => setFormProduct(undefined)}
            onSaved={() => { setFormProduct(undefined); fetchProducts(); }} />
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remove product?" message={`This will deactivate "${deleteTarget?.name}". It can be restored later.`} danger />
    </PageLayout>
  );
}
