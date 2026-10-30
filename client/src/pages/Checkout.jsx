import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Empty, ErrorMessage, Loading } from '../components/Status';
import { loadScript } from '../utils/loadScript';
import { formatPrice } from '../utils/format';

export default function Checkout() {
  const { user } = useAuth();
  const { items, summary, refresh } = useCart();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState(null); // { razorpay: boolean }
  const [form, setForm] = useState({
    fullName: user.name,
    address: '',
    city: '',
    postalCode: '',
    country: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  // Pull the latest server-side cart (prices and totals come from the server)
  useEffect(() => {
    refresh().finally(() => setLoaded(true));
  }, [refresh]);

  // Ask the server which payment options are switched on
  useEffect(() => {
    api
      .get('/payments/config')
      .then((r) => setPay(r.data))
      .catch(() => setPay({ razorpay: false }));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const shippingAddress = () => {
    const { fullName, address, city, postalCode, country } = form;
    return { fullName, address, city, postalCode, country };
  };

  /** Create the order on the server, then show the confirmation page. */
  const placeOrder = async (payment) => {
    const { data } = await api.post('/orders', {
      shippingAddress: shippingAddress(),
      ...payment,
    });
    await refresh();
    navigate(`/orders/${data._id}`, { state: { placed: true } });
  };

  /**
   * Razorpay flow:
   * 1. server creates a Razorpay order for the cart total
   * 2. Razorpay's checkout window collects the payment
   * 3. we send the signed result to the server, which verifies it before creating the order
   */
  const payWithRazorpay = async () => {
    await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    const { data: rz } = await api.post('/payments/razorpay/order');
    await new Promise((resolve, reject) => {
      let paid = false;
      const checkout = new window.Razorpay({
        key: rz.keyId,
        amount: rz.amount,
        currency: rz.currency,
        order_id: rz.id,
        name: 'Tidewell',
        description: 'Order payment',
        prefill: { name: form.fullName, email: user.email },
        theme: { color: '#1f6f78' },
        handler: (resp) => {
          paid = true;
          placeOrder({
            paymentMethod: 'razorpay',
            razorpay: {
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            },
          }).then(resolve, reject);
        },
        modal: {
          ondismiss: () =>
            !paid &&
            reject(new Error('Payment window closed. You have not been charged.')),
        },
      });
      checkout.on('payment.failed', (r) =>
        reject(new Error(r.error?.description || 'Payment failed'))
      );
      checkout.open();
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (pay.razorpay) await payWithRazorpay();
      else await placeOrder({ paymentMethod: 'demo', cardNumber: form.cardNumber });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  if (!loaded || !summary || !pay) return <Loading />;
  if (items.length === 0)
    return (
      <Empty>
        <h1>Nothing to check out</h1>
        <Link to="/products" className="btn">
          Browse the shop
        </Link>
      </Empty>
    );

  return (
    <>
      <h1>Checkout</h1>
      <div className="cart-layout">
        <form className="form" onSubmit={submit}>
          <fieldset>
            <legend>Shipping address</legend>
            <label>
              Full name
              <input
                required
                autoComplete="name"
                value={form.fullName}
                onChange={set('fullName')}
              />
            </label>
            <label>
              Street address
              <input
                required
                autoComplete="street-address"
                value={form.address}
                onChange={set('address')}
              />
            </label>
            <div className="row">
              <label>
                City
                <input
                  required
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={set('city')}
                />
              </label>
              <label>
                Postal code
                <input
                  required
                  autoComplete="postal-code"
                  value={form.postalCode}
                  onChange={set('postalCode')}
                />
              </label>
            </div>
            <label>
              Country
              <input
                required
                autoComplete="country-name"
                value={form.country}
                onChange={set('country')}
              />
            </label>
          </fieldset>

          {pay.razorpay ? (
            <fieldset>
              <legend>Payment</legend>
              <p className="muted">
                You will pay securely in Razorpay’s window with UPI, card, netbanking or
                wallet.
              </p>
            </fieldset>
          ) : (
            <fieldset>
              <legend>Payment</legend>
              <p className="muted">
                Demo store: use any 16-digit number, for example 4242 4242 4242 4242.
                Nothing is charged.
              </p>
              <label>
                Card number
                <input
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  pattern="[0-9 ]{13,23}"
                  title="13 to 19 digits"
                  value={form.cardNumber}
                  onChange={set('cardNumber')}
                />
              </label>
              <div className="row">
                <label>
                  Expiry
                  <input
                    required
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    value={form.expiry}
                    onChange={set('expiry')}
                  />
                </label>
                <label>
                  CVC
                  <input
                    required
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="cc-csc"
                    value={form.cvc}
                    onChange={set('cvc')}
                  />
                </label>
              </div>
            </fieldset>
          )}

          <ErrorMessage message={error} />
          <button className="btn" disabled={busy}>
            {busy
              ? 'Processing…'
              : `Pay ${formatPrice(summary.totalPrice)}${pay.razorpay ? ' with Razorpay' : ''}`}
          </button>
        </form>

        <aside className="summary">
          <h2>Order summary</h2>
          <ul className="mini-list">
            {items.map(({ product, qty }) => (
              <li key={product._id}>
                <span>
                  {product.name} × {qty}
                </span>
                <span>{formatPrice(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <Totals summary={summary} />
          <Link to="/cart" className="link-btn">
            Edit cart
          </Link>
        </aside>
      </div>
    </>
  );
}

export function Totals({ summary }) {
  return (
    <dl>
      <dt>Items</dt>
      <dd>{formatPrice(summary.itemsPrice)}</dd>
      <dt>Shipping</dt>
      <dd>{summary.shippingPrice === 0 ? 'Free' : formatPrice(summary.shippingPrice)}</dd>
      <dt>Tax</dt>
      <dd>{formatPrice(summary.taxPrice)}</dd>
      <dt className="total">Total</dt>
      <dd className="total">{formatPrice(summary.totalPrice)}</dd>
    </dl>
  );
}
