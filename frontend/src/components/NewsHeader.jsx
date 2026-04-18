import { Link, useLocation } from 'react-router-dom';

export default function NewsHeader({ trending }) {
  const loc = useLocation();
  return (
    <>
      <div className="news-topbar">
        <div className="news-topbar-inner">
          <div className="news-trending">
            <span className="news-trending-badge">🔥 TRENDING</span>
            <span className="news-trending-text">{trending || 'Selamat datang di LDII Palmerah'}</span>
          </div>
          <div className="news-topbar-right">
            <span>📍 Palmerah, Jakarta Barat</span>
          </div>
        </div>
      </div>
      <div className="news-brand-bar">
        <div className="news-brand-inner">
          <Link to="/" className="news-logo">
            <span className="news-logo-l">L</span>DII
            <span className="news-logo-sub">PALMERAH</span>
          </Link>
        </div>
      </div>
      <nav className="news-nav">
        <div className="news-nav-inner">
          <div className="news-nav-links">
            <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>HOME</Link>
            <Link to="/berita" className={loc.pathname.startsWith('/berita') ? 'active' : ''}>BERITA</Link>
            <Link to="/admin">ADMIN</Link>
          </div>
        </div>
      </nav>
    </>
  );
}
