import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { Empty, ErrorMessage, Loading } from '../components/Status';

/** Product listing. Filters live in the URL so results can be shared and bookmarked. */
export default function Products() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  // Text inputs are edited locally and applied on submit
  const [draft, setDraft] = useState({ search, minPrice, maxPrice });

  useEffect(() => {
    api
      .get('/products/categories')
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setDraft({ search, minPrice, maxPrice });
    setData(null);
    setError('');
    api
      .get('/products', { params: { search, category, minPrice, maxPrice, sort, page } })
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [search, category, minPrice, maxPrice, sort, page]);

  /** Merge changes into the URL, dropping empty values. Resets to page 1 unless paging. */
  const update = (changes) => {
    const next = { search, category, minPrice, maxPrice, sort, page: 1, ...changes };
    const clean = Object.fromEntries(
      Object.entries(next).filter(
        ([k, v]) => v && !(k === 'page' && v === 1) && !(k === 'sort' && v === 'newest')
      )
    );
    setParams(clean);
  };

  const applyFilters = (e) => {
    e.preventDefault();
    update(draft);
  };

  return (
    <div className="shop-layout">
      <aside className="filters" aria-label="Filters">
        <form onSubmit={applyFilters}>
          <label>
            Search
            <input
              type="search"
              value={draft.search}
              placeholder="Try “linen”"
              onChange={(e) => setDraft({ ...draft, search: e.target.value })}
            />
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => update({ category: e.target.value })}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>Price</legend>
            <div className="row">
              <input
                type="number"
                min="0"
                aria-label="Minimum price"
                placeholder="Min"
                value={draft.minPrice}
                onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
              />
              <input
                type="number"
                min="0"
                aria-label="Maximum price"
                placeholder="Max"
                value={draft.maxPrice}
                onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
              />
            </div>
          </fieldset>
          <label>
            Sort by
            <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price, low to high</option>
              <option value="price_desc">Price, high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
          <button className="btn">Apply filters</button>
          <button type="button" className="link-btn" onClick={() => setParams({})}>
            Clear all
          </button>
        </form>
      </aside>

      <section>
        <h1>Shop</h1>
        <ErrorMessage message={error} />
        {!data && !error && <Loading label="Loading products" />}
        {data && (
          <>
            <p className="muted">
              {data.total} {data.total === 1 ? 'product' : 'products'}
            </p>
            {data.products.length === 0 ? (
              <Empty>
                Nothing matches those filters. Try a different search or clear the
                filters.
              </Empty>
            ) : (
              <div className="grid">
                {data.products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
            <Pagination
              page={data.page}
              pages={data.pages}
              onChange={(p) => update({ page: p })}
            />
          </>
        )}
      </section>
    </div>
  );
}
