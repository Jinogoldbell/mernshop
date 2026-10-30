import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const GUEST_KEY = 'guestCart';
const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
  } catch {
    return [];
  }
};

/**
 * Cart state with two modes:
 *  - logged out: items live in localStorage (guest cart)
 *  - logged in: items live on the server through /api/cart
 * When a guest logs in, their local items are merged into the server cart.
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id;
  const [items, setItems] = useState(readGuest);
  const [summary, setSummary] = useState(null);

  const applyServer = (data) => {
    setItems(data.items);
    setSummary(data.summary);
  };

  const saveGuest = (next) => {
    localStorage.setItem(GUEST_KEY, JSON.stringify(next));
    setItems(next);
  };

  const refresh = useCallback(async () => {
    if (!userId) return;
    applyServer((await api.get('/cart')).data);
  }, [userId]);

  // Switch between guest and server cart when the user logs in or out
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) {
        setSummary(null);
        setItems(readGuest());
        return;
      }
      try {
        for (const { product, qty } of readGuest()) {
          await api.post('/cart', { productId: product._id, qty }).catch(() => {}); // skip out-of-stock items
        }
        localStorage.removeItem(GUEST_KEY);
        const { data } = await api.get('/cart');
        if (!cancelled) applyServer(data);
      } catch {
        /* the cart stays empty if the API is unreachable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addItem = async (product, qty = 1) => {
    if (userId)
      return applyServer((await api.post('/cart', { productId: product._id, qty })).data);
    const next = [...items];
    const line = next.find((i) => i.product._id === product._id);
    const newQty = (line?.qty || 0) + qty;
    if (newQty > product.countInStock)
      throw new Error(`Only ${product.countInStock} in stock`);
    if (line) line.qty = newQty;
    else next.push({ product, qty });
    saveGuest(next);
  };

  const setQty = async (productId, qty) => {
    if (userId) return applyServer((await api.put(`/cart/${productId}`, { qty })).data);
    saveGuest(items.map((i) => (i.product._id === productId ? { ...i, qty } : i)));
  };

  const removeItem = async (productId) => {
    if (userId) return applyServer((await api.delete(`/cart/${productId}`)).data);
    saveGuest(items.filter((i) => i.product._id !== productId));
  };

  const value = useMemo(
    () => ({
      items,
      summary,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((sum, i) => sum + i.product.price * i.qty, 0),
      addItem,
      setQty,
      removeItem,
      refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, summary, userId, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
