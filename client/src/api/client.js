import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const baseURL = configuredBaseURL
  ? /\/api$/i.test(configuredBaseURL)
    ? configuredBaseURL
    : `${configuredBaseURL}/api`
  : '/api';

// One axios instance for the whole app. Normalize origins to the API mount path.
const api = axios.create({ baseURL });

// Attach the JWT (if any) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Pull a readable message out of an axios error. */
export const errorMessage = (err) =>
  err.response?.data?.message || err.message || 'Something went wrong';

export default api;
