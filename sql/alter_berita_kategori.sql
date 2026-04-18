ALTER TABLE lp_berita ADD COLUMN kategori VARCHAR(50) DEFAULT 'berita';

-- Update existing data
UPDATE lp_berita SET kategori = 'berita' WHERE kategori IS NULL OR kategori = '';
