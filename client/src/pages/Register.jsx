import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import { ErrorMessage } from '../components/Status';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/login', { replace: true, state: { from } });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <nav className="auth-tabs" aria-label="Account">
        <Link to="/login" state={{ from }}>
          Log in
        </Link>
        <Link to="/register" aria-current="page">
          Sign up
        </Link>
      </nav>
      <h1>Create your account</h1>
      <form className="form" onSubmit={submit}>
        <label>
          Name
          <input required autoComplete="name" value={form.name} onChange={set('name')} />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
          />
        </label>
        <label>
          Password (6 characters or more)
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            required
            autoComplete="new-password"
            value={form.confirm}
            onChange={set('confirm')}
          />
        </label>
        <ErrorMessage message={error} />
        <button className="btn" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already have an account?{' '}
        <Link to="/login" state={{ from }}>
          Log in
        </Link>
      </p>
    </div>
  );
}
