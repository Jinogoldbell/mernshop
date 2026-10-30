import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product._id}`} className="card">
      <ProductImage src={product.images[0]} alt={product.name} />
      <div className="card-body">
        <h3>{product.name}</h3>
        <p className="muted clamp">{product.description}</p>
        <div className="card-foot">
          <strong>{formatPrice(product.price)}</strong>
          {product.countInStock === 0 && <span className="tag tag-out">Sold out</span>}
        </div>
      </div>
    </Link>
  );
}
