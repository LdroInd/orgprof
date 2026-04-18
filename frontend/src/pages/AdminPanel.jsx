import { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminBerita from './AdminBerita';
import AdminUsers from './AdminUsers';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('berita');

  useEffect(() => {
    const saved = sessionStorage.getItem('lp_admin');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  function handleLogin(u) {
    setUser(u);
    sessionStorage.setItem('lp_admin', JSON.stringify(u));
  }

  function handleLogout() {
    setUser(null);
    sessionStorage.removeItem('lp_admin');
  }

  if (!user) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="admin-brand">🕌 Admin</h2>
        <nav>
          <button className={`admin-nav ${page === 'berita' ? 'active' : ''}`}
            onClick={() => setPage('berita')}>📰 Berita</button>
          {user.role === 'admin' && (
            <button className={`admin-nav ${page === 'users' ? 'active' : ''}`}
              onClick={() => setPage('users')}>👥 Users</button>
          )}
        </nav>
        <div className="admin-footer">
          <span>👤 {user.name}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        {page === 'berita' && <AdminBerita />}
        {page === 'users' && user.role === 'admin' && <AdminUsers />}
      </main>
    </div>
  );
}
