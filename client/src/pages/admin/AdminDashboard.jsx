import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Empty, ErrorMessage, Loading } from '../../components/Status';
import { isFirebaseConfigured, uploadProductImage } from '../../firebase';
import { formatDate, formatPrice } from '../../utils/format';

const STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];
const BLANK = {
  name: '',
  description: '',
  price: '',
  category: '',
  countInStock: '',
  images: '',
  featured: false,
};

/** Admin area with three tabs: products (full CRUD), orders (status updates) and users. */
export default function AdminDashboard() {
  const [tab, setTab] = useState('products');
  return (
    <>
      <h1>Admin</h1>
      <div className="tabs" role="tablist">
        {['products', 'orders', 'users'].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'products' && <ProductsAdmin />}
      {tab === 'orders' && <OrdersAdmin />}
      {tab === 'users' && <UsersAdmin />}
    </>
  );
}

/** Small hook to load a list and expose a reload function. */
function useList(url, select = (d) => d) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    api
      .get(url)
      .then((r) => setData(select(r.data)))
      .catch((e) => setError(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  useEffect(load, [load]);
  return { data, error, setError, load };
}

function ProductsAdmin() {
  const { data, error, setError, load } = useList(
    '/products?limit=50',
    (d) => d.products
  );
  const [form, setForm] = useState(null); // null = hidden, otherwise product being edited
  const [editingId, setEditingId] = useState(null);

  const edit = (p) => {
    setEditingId(p?._id || null);
    setForm(p ? { ...p, images: p.images.join(', ') } : BLANK);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      countInStock: Number(form.countInStock),
      featured: form.featured,
      images: String(form.images)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editingId) await api.put(`/products/${editingId}`, body);
      else await api.post('/products', body);
      setForm(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This can't be undone.`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const set = (k) => (e) =>
    setForm({
      ...form,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });

  return (
    <section>
      <ErrorMessage message={error} />
      {form ? (
        <form className="form" onSubmit={save}>
          <h2>{editingId ? 'Edit product' : 'New product'}</h2>
          <label>
            Name
            <input required value={form.name} onChange={set('name')} />
          </label>
          <label>
            Description
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={set('description')}
            />
          </label>
          <div className="row">
            <label>
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={set('price')}
              />
            </label>
            <label>
              In stock
              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.countInStock}
                onChange={set('countInStock')}
              />
            </label>
            <label>
              Category
              <input required value={form.category} onChange={set('category')} />
            </label>
          </div>
          <label>
            Image URLs (comma separated)
            <input value={form.images} onChange={set('images')} />
          </label>
          {isFirebaseConfigured && (
            <ImageUploader
              onUploaded={(url) =>
                setForm((f) => ({ ...f, images: f.images ? `${f.images}, ${url}` : url }))
              }
            />
          )}
          <label className="check">
            <input type="checkbox" checked={form.featured} onChange={set('featured')} />{' '}
            Show on the homepage
          </label>
          <div className="row">
            <button className="btn">Save product</button>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <button className="btn" onClick={() => edit(null)}>
            Add product
          </button>
          {!data && !error && <Loading />}
          {data && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>{formatPrice(p.price)}</td>
                      <td>{p.countInStock}</td>
                      <td className="actions">
                        <button className="link-btn" onClick={() => edit(p)}>
                          Edit
                        </button>
                        <button className="link-btn danger" onClick={() => remove(p)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** Uploads a file to Firebase Storage and hands back its public URL. */
function ImageUploader({ onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // lets the same file be chosen again
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const url = await uploadProductImage(
        file,
        async () => (await api.get('/auth/firebase-token')).data.token
      );
      onUploaded(url);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label>
        Or upload an image to Firebase
        <input type="file" accept="image/*" disabled={busy} onChange={handleFile} />
      </label>
      {busy && (
        <p className="muted" role="status">
          Uploading…
        </p>
      )}
      <ErrorMessage message={error} />
    </div>
  );
}

function OrdersAdmin() {
  const { data, error, setError, load } = useList('/orders');

  const setStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section>
      <ErrorMessage message={error} />
      {!data && !error && <Loading />}
      {data?.length === 0 && <Empty>No orders yet.</Empty>}
      {data?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o._id}>
                  <td>…{o._id.slice(-6)}</td>
                  <td>{o.user?.name || 'Deleted user'}</td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>{formatPrice(o.totalPrice)}</td>
                  <td>
                    <select
                      aria-label={`Status for order ${o._id.slice(-6)}`}
                      value={o.status}
                      onChange={(e) => setStatus(o._id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UsersAdmin() {
  const { user: me } = useAuth();
  const { data, error, setError, load } = useList('/users');

  const remove = async (u) => {
    if (!window.confirm(`Delete the account for ${u.email}?`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section>
      <ErrorMessage message={error} />
      {!data && !error && <Loading />}
      {data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.isAdmin ? 'Admin' : 'Customer'}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="actions">
                    {u._id !== me._id && (
                      <button className="link-btn danger" onClick={() => remove(u)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
