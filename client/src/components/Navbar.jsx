import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          Tidewell
        </Link>
        <button
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen(!open)}
        >
          Menu
        </button>
        <nav id="nav-links" className={`nav-links ${open ? 'open' : ''}`}>
          {user ? (
            <>
              <NavLink to="/products" onClick={close}>
                Shop
              </NavLink>
              <NavLink to="/cart" onClick={close}>
                Cart{count > 0 && <span className="badge">{count}</span>}
              </NavLink>
              {user.isAdmin && (
                <NavLink to="/admin" onClick={close}>
                  Admin
                </NavLink>
              )}
              <NavLink to="/account" onClick={close}>
                {user.name.split(' ')[0]}
              </NavLink>
              <button className="link-btn" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>
                Log in
              </NavLink>
              <NavLink to="/register" className="btn btn-small" onClick={close}>
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
