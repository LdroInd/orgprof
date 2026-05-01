import { useState, useEffect } from 'react';

export default function AdminBerita() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ judul: '', konten: '', penulis: '', kategori: 'berita', published: false });
  const [gambar, setGambar] = useState(null);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch('/api/berita');
    setList((await res.json()) || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const headers = { 'Content-Type': 'application/json' };
    const payload = {
      judul: form.judul,
      konten: form.konten,
      penulis: form.penulis,
      kategori: form.kategori,
      published: form.published,
    };

    if (editId) {
      await fetch(`/api/berita/${editId}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      alert('Berita berhasil diupdate!');
    } else {
      await fetch('/api/berita', { method: 'POST', headers, body: JSON.stringify(payload) });
      alert('Berita berhasil ditambahkan!');
    }
    resetForm();
    load();
  }

  function handleEdit(b) {
    setEditId(b.id);
    setForm({ judul: b.judul, konten: b.konten, penulis: b.penulis, kategori: b.kategori || 'berita', published: b.published });
    setGambar(null);
  }

  async function handleDelete(id) {
    if (!confirm('Hapus berita ini?')) return;
    await fetch(`/api/berita/${id}`, { method: 'DELETE' });
    load();
  }

  function resetForm() {
    setForm({ judul: '', konten: '', penulis: '', kategori: 'berita', published: false });
    setGambar(null);
    setEditId(null);
  }

  const filtered = list.filter(b =>
    !search || b.judul.toLowerCase().includes(search.toLowerCase()) ||
    b.penulis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1>Kelola Berita</h1>
      <div className="admin-form-card">
        <h2>{editId ? 'Edit Berita' : 'Tambah Berita'}</h2>
        <form onSubmit={handleSubmit}>
          <input value={form.judul} onChange={e => setForm({...form, judul: e.target.value})}
            placeholder="Judul *" required />
          <textarea value={form.konten} onChange={e => setForm({...form, konten: e.target.value})}
            placeholder="Konten *" rows={5} required />
          <input value={form.penulis} onChange={e => setForm({...form, penulis: e.target.value})}
            placeholder="Penulis" />
          <select value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}>
            <option value="berita">Berita</option>
            <option value="kegiatan">Kegiatan</option>
            <option value="event">Event</option>
          </select>
          <div className="form-inline">
            <label>
              <input type="checkbox" checked={form.published}
                onChange={e => setForm({...form, published: e.target.checked})} />
              {' '}Published
            </label>
            <label className="file-label">
              📷 {gambar ? gambar.name : 'Pilih Gambar'}
              <input type="file" accept="image/*" onChange={e => setGambar(e.target.files[0])} hidden />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Simpan'}</button>
            {editId && <button type="button" className="btn-secondary" onClick={resetForm}>Batal</button>}
          </div>
        </form>
      </div>

      <input type="text" className="search-input" value={search}
        onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari berita..." />

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr><th>Judul</th><th>Kategori</th><th>Penulis</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="empty">Belum ada berita</td></tr>
            ) : filtered.map(b => (
              <tr key={b.id}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {b.gambar && <img src={`/${b.gambar}`} alt="" style={{width:40,height:40,borderRadius:6,objectFit:'cover'}} />}
                    {b.judul}
                  </div>
                </td>
                <td>{b.penulis || '-'}</td>
                <td><span className={`badge ${
                  b.kategori === 'kegiatan' ? 'badge-blue' : b.kategori === 'event' ? 'badge-purple' : 'badge-green'
                }`}>{b.kategori || 'berita'}</span></td>
                <td><span className={`badge ${b.published ? 'badge-green' : 'badge-gray'}`}>
                  {b.published ? 'Published' : 'Draft'}</span></td>
                <td>{b.created_at}</td>
                <td className="actions">
                  <button className="btn-edit" onClick={() => handleEdit(b)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(b.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
