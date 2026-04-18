import { useState, useEffect } from 'react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'editor' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch('/api/users');
    setUsers((await res.json()) || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const headers = { 'Content-Type': 'application/json' };
    if (editId) {
      await fetch(`/api/users/${editId}`, { method: 'PUT', headers, body: JSON.stringify(form) });
      alert('User berhasil diupdate!');
    } else {
      await fetch('/api/users', { method: 'POST', headers, body: JSON.stringify(form) });
      alert('User berhasil ditambahkan!');
    }
    resetForm();
    load();
  }

  function handleEdit(u) {
    setEditId(u.id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
  }

  async function handleDelete(id) {
    if (!confirm('Hapus user ini?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    load();
  }

  function resetForm() {
    setForm({ name: '', email: '', password: '', role: 'editor' });
    setEditId(null);
  }

  return (
    <div>
      <h1>Kelola Users</h1>
      <div className="admin-form-card">
        <h2>{editId ? 'Edit User' : 'Tambah User'}</h2>
        <form onSubmit={handleSubmit}>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            placeholder="Nama *" required />
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            placeholder="Email *" required />
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            placeholder={editId ? 'Password (kosongkan jika tidak diubah)' : 'Password *'} required={!editId} />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <div className="form-actions">
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Simpan'}</button>
            {editId && <button type="button" className="btn-secondary" onClick={resetForm}>Batal</button>}
          </div>
        </form>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr><th>Nama</th><th>Email</th><th>Role</th><th>Dibuat</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="5" className="empty">Belum ada user</td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span></td>
                <td>{u.created_at}</td>
                <td className="actions">
                  <button className="btn-edit" onClick={() => handleEdit(u)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(u.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
