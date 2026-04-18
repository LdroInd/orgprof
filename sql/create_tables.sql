CREATE TABLE lp_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'editor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lp_berita (
    id SERIAL PRIMARY KEY,
    judul VARCHAR(500) NOT NULL,
    konten TEXT NOT NULL,
    gambar VARCHAR(500) DEFAULT '',
    penulis VARCHAR(255) DEFAULT '',
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user (password: admin123)
INSERT INTO lp_users (name, email, password, role)
VALUES ('Admin', 'admin@ldii-palmerah.org', 'admin123', 'admin');
