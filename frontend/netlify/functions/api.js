const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  const rawPath = event.path || event.rawUrl || '';
  const path = rawPath
    .replace('/.netlify/functions/api', '')
    .replace(/^\/api/, '')
    || '/';
  const method = event.httpMethod;

  let body = {};
  if (event.body) {
    try { body = JSON.parse(event.body); } catch (e) { body = {}; }
  }

  console.log(`[API] ${method} ${path}`);

  try {
    // === AUTH ===
    if (path === '/login' && method === 'POST') {
      const { username, password } = body;
      if (!username || !password) return json(400, { error: 'Username dan password wajib diisi' });
      const r = await pool.query(
        `SELECT id, username, nama, role, kelompok FROM lp_users WHERE username=$1 AND password=md5($2)`,
        [username, password]
      );
      if (r.rows.length === 0) return json(401, { error: 'Username atau password salah' });
      return json(200, r.rows[0]);
    }

    // === USERS ===
    if (path === '/users' && method === 'GET') {
      const r = await pool.query(`SELECT id, username, nama, role, kelompok, TO_CHAR(created_at,'YYYY-MM-DD') as created_at FROM lp_users ORDER BY id`);
      return json(200, r.rows);
    }

    if (path === '/users' && method === 'POST') {
      const { username, password, nama, role, kelompok } = body;
      if (!username || !password || !nama) return json(400, { error: 'Username, password, nama wajib diisi' });
      const r = await pool.query(
        `INSERT INTO lp_users (username,password,nama,role,kelompok) VALUES ($1,md5($2),$3,$4,$5) RETURNING id`,
        [username, password, nama, role || 'editor', kelompok || '']
      );
      return json(201, { id: r.rows[0].id, message: 'User created' });
    }

    const userMatch = path.match(/^\/users\/(\d+)$/);
    if (userMatch && method === 'PUT') {
      const id = userMatch[1];
      const { username, password, nama, role, kelompok } = body;
      if (password) {
        await pool.query(`UPDATE lp_users SET username=$1, password=md5($2), nama=$3, role=$4, kelompok=$5 WHERE id=$6`,
          [username, password, nama, role, kelompok, id]);
      } else {
        await pool.query(`UPDATE lp_users SET username=$1, nama=$2, role=$3, kelompok=$4 WHERE id=$5`,
          [username, nama, role, kelompok, id]);
      }
      return json(200, { message: 'User updated' });
    }

    if (userMatch && method === 'DELETE') {
      await pool.query(`DELETE FROM lp_users WHERE id=$1`, [userMatch[1]]);
      return json(200, { message: 'User deleted' });
    }

    // === BERITA ===
    if (path === '/berita' && method === 'GET') {
      const r = await pool.query(`SELECT id, judul, konten, COALESCE(gambar,'') as gambar, COALESCE(penulis,'') as penulis,
        published, COALESCE(kategori,'berita') as kategori, TO_CHAR(created_at,'YYYY-MM-DD') as created_at FROM lp_berita ORDER BY id DESC`);
      return json(200, r.rows);
    }

    if (path === '/berita/published' && method === 'GET') {
      const r = await pool.query(`SELECT id, judul, konten, COALESCE(gambar,'') as gambar, COALESCE(penulis,'') as penulis,
        COALESCE(kategori,'berita') as kategori, TO_CHAR(created_at,'YYYY-MM-DD') as created_at FROM lp_berita WHERE published=true ORDER BY id DESC`);
      return json(200, r.rows);
    }

    const beritaDetailMatch = path.match(/^\/berita\/(\d+)$/);

    if (beritaDetailMatch && method === 'GET') {
      const r = await pool.query(`SELECT id, judul, konten, COALESCE(gambar,'') as gambar, COALESCE(penulis,'') as penulis,
        COALESCE(kategori,'berita') as kategori, TO_CHAR(created_at,'YYYY-MM-DD') as created_at FROM lp_berita WHERE id=$1`, [beritaDetailMatch[1]]);
      if (r.rows.length === 0) return json(404, { error: 'Berita tidak ditemukan' });
      return json(200, r.rows[0]);
    }

    if (path === '/berita' && method === 'POST') {
      const { judul, konten, gambar, penulis, kategori, published } = body;
      if (!judul || !konten) return json(400, { error: 'Judul dan konten wajib diisi' });
      const r = await pool.query(
        `INSERT INTO lp_berita (judul,konten,gambar,penulis,kategori,published) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [judul, konten, gambar || '', penulis || '', kategori || 'berita', published || false]
      );
      return json(201, { id: r.rows[0].id, message: 'Berita created' });
    }

    if (beritaDetailMatch && method === 'PUT') {
      const id = beritaDetailMatch[1];
      const { judul, konten, gambar, penulis, kategori, published } = body;
      if (gambar) {
        await pool.query(`UPDATE lp_berita SET judul=$1, konten=$2, gambar=$3, penulis=$4, kategori=$5, published=$6 WHERE id=$7`,
          [judul, konten, gambar, penulis, kategori || 'berita', published || false, id]);
      } else {
        await pool.query(`UPDATE lp_berita SET judul=$1, konten=$2, penulis=$3, kategori=$4, published=$5 WHERE id=$6`,
          [judul, konten, penulis, kategori || 'berita', published || false, id]);
      }
      return json(200, { message: 'Berita updated' });
    }

    if (beritaDetailMatch && method === 'DELETE') {
      await pool.query(`DELETE FROM lp_berita WHERE id=$1`, [beritaDetailMatch[1]]);
      return json(200, { message: 'Berita deleted' });
    }

    return json(404, { error: 'Not found' });

  } catch (err) {
    console.error('API Error:', err);
    return json(500, { error: err.message });
  }
};
