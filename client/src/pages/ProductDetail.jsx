import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useCart } from '../context/CartContext';
import ProductImage from '../components/ProductImage';
import { ErrorMessage, Loading } from '../components/Status';
import { formatPrice } from '../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProduct(null);
    setError('');
    setActive(0);
    setQty(1);
    api
      .get(`/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  const handleAdd = async () => {
    setError('');
    setAdded(false);
    try {
      await addItem(product, qty);
      setAdded(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (error && !product) return <ErrorMessage message={error} />;
  if (!product) return <Loading />;

  const inStock = product.countInStock > 0;
  return (
    <div className="detail">
      <div className="gallery">
        <ProductImage
          className="gallery-main"
          src={product.images[active]}
          alt={product.name}
        />
        {product.images.length > 1 && (
          <div className="thumbs">
            {product.images.map((src, i) => (
              <button
                key={src}
                aria-label={`Show image ${i + 1}`}
                aria-pressed={i === active}
                onClick={() => setActive(i)}
              >
                <ProductImage src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail-info">
        <p className="muted">
          <Link to={`/products?category=${encodeURIComponent(product.category)}`}>
            {product.category}
          </Link>
        </p>
        <h1>{product.name}</h1>
        <p className="price">{formatPrice(product.price)}</p>
        <p>{product.description}</p>
        <p className={inStock ? 'ok' : 'bad'}>
          {inStock
            ? product.countInStock <= 5
              ? `Only ${product.countInStock} left`
              : 'In stock'
            : 'Sold out'}
        </p>

        {inStock && (
          <div className="row">
            <label className="inline">
              Quantity
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {Array.from({ length: Math.min(product.countInStock, 10) }, (_, i) => (
                  <option key={i + 1}>{i + 1}</option>
                ))}
              </select>
            </label>
            <button className="btn" onClick={handleAdd}>
              Add to cart
            </button>
          </div>
        )}
        <ErrorMessage message={error} />
        {added && (
          <p className="ok" role="status">
            Added to your cart. <Link to="/cart">View cart</Link>
          </p>
        )}
      </div>
    </div>
  );
}
