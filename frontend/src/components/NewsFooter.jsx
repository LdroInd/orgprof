import { Link } from 'react-router-dom';

export default function NewsFooter() {
  return (
    <footer className="news-footer">
      <div className="news-footer-inner">
        <div className="news-footer-col">
          <h3><span className="news-logo-l">L</span>DII Palmerah</h3>
          <p>Lembaga Dakwah Islam Indonesia — Kecamatan Palmerah, Jakarta Barat. Membangun umat yang berilmu, beramal, dan bertakwa.</p>
        </div>
        <div className="news-footer-col">
          <h4>Menu</h4>
          <Link to="/">Home</Link>
          <Link to="/berita">Berita</Link>
          <Link to="/admin">Admin Panel</Link>
        </div>
        <div className="news-footer-col">
          <h4>Kontak</h4>
          <p>Kec. Palmerah</p>
          <p>Jakarta Barat, DKI Jakarta</p>
          <p>Indonesia</p>
        </div>
      </div>
      <div className="news-footer-bottom">
        © 2025 LDII Kecamatan Palmerah. All rights reserved.
      </div>
    </footer>
  );
}
