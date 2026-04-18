import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import NewsHeader from '../components/NewsHeader';
import NewsFooter from '../components/NewsFooter';

export default function BeritaDetail() {
  const { id } = useParams();
  const [berita, setBerita] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/berita/${id}`)
      .then(r => r.json())
      .then(d => { setBerita(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const katColor = berita?.kategori === 'kegiatan' ? 'news-cat-blue'
    : berita?.kategori === 'event' ? 'news-cat-purple' : '';

  return (
    <div className="news-page">
      <NewsHeader trending={berita ? berita.judul : undefined} />

      {loading ? (
        <div className="detail-loading">Memuat...</div>
      ) : !berita || berita.error ? (
        <div className="detail-loading">
          <p>Berita tidak ditemukan</p>
          <Link to="/" className="news-btn-all" style={{ marginTop: 16, display: 'inline-block' }}>← Kembali</Link>
        </div>
      ) : (
        <div className="detail-page">
          <div className="detail-container">
            <Link to="/" className="detail-back">← Kembali ke Beranda</Link>

            {berita.gambar && (
              <div className="detail-hero-img">
                <img src={`/${berita.gambar}`} alt={berita.judul} />
              </div>
            )}

            <div className="detail-content">
              <span className={`news-cat-badge ${katColor}`}>
                {(berita.kategori || 'berita').toUpperCase()}
              </span>
              <h1>{berita.judul}</h1>
              <p className="detail-meta">
                oleh {berita.penulis || 'Redaksi'} · {berita.created_at}
              </p>
              <div className="detail-body">
                {berita.konten.split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <NewsFooter />
    </div>
  );
}
