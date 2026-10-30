const currency = import.meta.env.VITE_CURRENCY || 'INR';
const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });

export const formatPrice = (n) => formatter.format(n ?? 0);
export const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
