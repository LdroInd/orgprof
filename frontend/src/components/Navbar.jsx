import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">🕌 LDII Palmerah</Link>
        <div className="nav-links">
          <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>Beranda</Link>
          <Link to="/berita" className={loc.pathname === '/berita' ? 'active' : ''}>Berita</Link>
          <Link to="/admin" className="nav-admin">Admin</Link>
        </div>
      </div>
    </nav>
  );
}
