import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { ErrorMessage, Loading } from '../components/Status';
import ProductImage from '../components/ProductImage';
import { Totals } from './Checkout';
import { formatDate, formatPrice } from '../utils/format';

/** Order receipt. Doubles as the confirmation page right after checkout. */
export default function OrderDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <ErrorMessage message={error} />;
  if (!order) return <Loading />;

  const a = order.shippingAddress;
  return (
    <>
      {state?.placed && (
        <div className="confirm" role="status">
          <h1>Thank you, your order is confirmed.</h1>
          <p>
            We will ship it to the address below. Keep your order number for reference.
          </p>
        </div>
      )}
      {!state?.placed && <h1>Order details</h1>}
      <p className="muted">
        Order {order._id} placed {formatDate(order.createdAt)}. Status:{' '}
        <strong>{order.status}</strong>
      </p>

      <div className="cart-layout">
        <ul className="cart-list">
          {order.items.map((i) => (
            <li key={i.product} className="cart-item">
              <ProductImage src={i.image} alt={i.name} />
              <div className="cart-item-info">
                <Link to={`/products/${i.product}`}>{i.name}</Link>
                <span className="muted">
                  {formatPrice(i.price)} × {i.qty}
                </span>
              </div>
              <span />
              <strong className="line-total">{formatPrice(i.price * i.qty)}</strong>
            </li>
          ))}
        </ul>
        <aside className="summary">
          <h2>Shipping to</h2>
          <p>
            {a.fullName}
            <br />
            {a.address}
            <br />
            {a.city} {a.postalCode}, {a.country}
          </p>
          <h2>Payment</h2>
          <p>
            {order.paymentMethod === 'razorpay'
              ? `Paid with Razorpay (${order.paymentResult?.razorpayPaymentId})`
              : `Demo payment, card ending ${order.paymentResult?.last4}`}
          </p>
          <Totals summary={order} />
        </aside>
      </div>
    </>
  );
}
