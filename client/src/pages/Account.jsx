import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Empty, ErrorMessage, Loading } from '../components/Status';
import { formatDate, formatPrice } from '../utils/format';

export default function Account() {
  const { user, updateProfile } = useAuth();
  const [orders, setOrders] = useState(null);
  const [form, setForm] = useState({ name: user.name, email: user.email, password: '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get('/orders/mine')
      .then((r) => setOrders(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      // Only send the password if the person typed a new one
      await updateProfile({
        name: form.name,
        email: form.email,
        ...(form.password && { password: form.password }),
      });
      setForm((f) => ({ ...f, password: '' }));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <h1>Your account</h1>
      <div className="cart-layout">
        <section>
          <h2>Order history</h2>
          {!orders && !error && <Loading />}
          {orders?.length === 0 && (
            <Empty>
              You haven’t ordered anything yet. <Link to="/products">Start shopping</Link>
            </Empty>
          )}
          {orders?.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>
                        <Link to={`/orders/${o._id}`}>…{o._id.slice(-6)}</Link>
                      </td>
                      <td>{formatDate(o.createdAt)}</td>
                      <td>{o.status}</td>
                      <td>{formatPrice(o.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="summary">
          <h2>Your details</h2>
          <form className="form" onSubmit={save}>
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              New password (leave blank to keep current)
              <input
                type="password"
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <ErrorMessage message={error} />
            {saved && (
              <p className="ok" role="status">
                Details saved.
              </p>
            )}
            <button className="btn">Save changes</button>
          </form>
        </aside>
      </div>
    </>
  );
}
