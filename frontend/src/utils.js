export function imgSrc(gambar) {
  if (!gambar) return '';
  if (gambar.startsWith('http')) return gambar;
  return `/${gambar}`;
}
