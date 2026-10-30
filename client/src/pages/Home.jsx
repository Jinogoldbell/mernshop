import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import ProductCard from '../components/ProductCard';
import { Empty, ErrorMessage, Loading } from '../components/Status';

export default function Home() {
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/products/featured'), api.get('/products/categories')])
      .then(([f, c]) => {
        setFeatured(f.data);
        setCategories(c.data);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Everyday things, made to last.</h1>
        <p>
          Kitchenware, linen, bags and layers chosen for how they age. Free shipping on
          larger orders.
        </p>
        <Link to="/products" className="btn btn-sun">
          Shop everything
        </Link>
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="cats">
          <h2 id="cats">Browse by category</h2>
          <div className="chips">
            {categories.map((c) => (
              <Link
                key={c}
                className="chip"
                to={`/products?category=${encodeURIComponent(c)}`}
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="feat">
        <h2 id="feat">Featured this week</h2>
        <ErrorMessage message={error} />
        {!featured && !error && <Loading />}
        {featured?.length === 0 && (
          <Empty>
            No featured products yet. Run the seed script or mark a product as featured in
            the admin area.
          </Empty>
        )}
        <div className="grid">
          {featured?.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
