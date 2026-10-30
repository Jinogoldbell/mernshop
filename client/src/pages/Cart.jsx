import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { errorMessage } from '../api/client';
import ProductImage from '../components/ProductImage';
import { Empty, ErrorMessage } from '../components/Status';
import { formatPrice } from '../utils/format';

export default function Cart() {
  const { items, subtotal, count, setQty, removeItem } = useCart();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const run = async (fn) => {
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (items.length === 0)
    return (
      <Empty>
        <h1>Your cart is empty</h1>
        <p>Add something you like and it will wait for you here.</p>
        <Link to="/products" className="btn">
          Browse the shop
        </Link>
      </Empty>
    );

  return (
    <>
      <h1>Your cart</h1>
      <ErrorMessage message={error} />
      <div className="cart-layout">
        <ul className="cart-list">
          {items.map(({ product, qty }) => (
            <li key={product._id} className="cart-item">
              <ProductImage src={product.images[0]} alt={product.name} />
              <div className="cart-item-info">
                <Link to={`/products/${product._id}`}>{product.name}</Link>
                <span className="muted">{formatPrice(product.price)} each</span>
                <button
                  className="link-btn"
                  onClick={() => run(() => removeItem(product._id))}
                >
                  Remove
                </button>
              </div>
              <label className="inline">
                <span className="sr-only">Quantity for {product.name}</span>
                <select
                  value={qty}
                  onChange={(e) => run(() => setQty(product._id, Number(e.target.value)))}
                >
                  {Array.from(
                    { length: Math.min(Math.max(product.countInStock, qty), 10) },
                    (_, i) => (
                      <option key={i + 1}>{i + 1}</option>
                    )
                  )}
                </select>
              </label>
              <strong className="line-total">{formatPrice(product.price * qty)}</strong>
            </li>
          ))}
        </ul>

        <aside className="summary">
          <h2>Summary</h2>
          <dl>
            <dt>Items ({count})</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </dl>
          <p className="muted">Shipping and tax are added at checkout.</p>
          <button className="btn btn-block" onClick={() => navigate('/checkout')}>
            Go to checkout
          </button>
        </aside>
      </div>
    </>
  );
}
