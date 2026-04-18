import { useState, useEffect } from 'react';

export default function BeritaPage() {
  const [berita, setBerita] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/berita/published')
      .then(r => r.json())
      .then(d => setBerita(d || []))
      .catch(() => {});
  }, []);

  const filtered = berita.filter(b =>
    !search || b.judul.toLowerCase().includes(search.toLowerCase()) ||
    b.penulis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="section">
      <div className="container">
        <h1 style={{ marginBottom: 16 }}>Berita & Kegiatan</h1>
        <input type="text" className="search-input" value={search}
          onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari berita..." />
        <div className="berita-list">
          {filtered.length === 0 ? (
            <p className="empty">Belum ada berita</p>
          ) : filtered.map(b => (
            <div key={b.id} className="berita-list-item">
              {b.gambar && <img src={`/${b.gambar}`} alt={b.judul} className="berita-list-img" />}
              <div className="berita-list-body">
                <h2>{b.judul}</h2>
                <p className="berita-meta">{b.penulis} · {b.created_at}</p>
                <p>{b.konten}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
