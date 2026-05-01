import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import NewsHeader from '../components/NewsHeader';
import NewsFooter from '../components/NewsFooter';
import { imgSrc } from '../utils';

export default function HomePage() {
  const [berita, setBerita] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    fetch('/api/berita/published')
      .then(r => r.json())
      .then(d => setBerita(d || []))
      .catch(() => {});
  }, []);

  const slides = berita.slice(0, 4);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setSlideIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    if (slides.length === 0) return;
    setSlideIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [slides.length, nextSlide]);

  const allBerita = berita.filter(b => (b.kategori || 'berita') === 'berita');
  const allKegiatan = berita.filter(b => b.kategori === 'kegiatan');
  const allEvent = berita.filter(b => b.kategori === 'event');

  const moreNews = allBerita.slice(0, 10);

  return (
    <div className="news-page">
      <NewsHeader trending={slides[slideIndex] ? slides[slideIndex].judul : undefined} />

      {/* Hero Slider */}
      <section className="news-slider">
        <div className="news-slider-inner">
          {slides.length > 0 ? (
            <>
              <div className="news-slider-track">
                {slides.map((b, i) => (
                  <Link
                    to={`/berita/${b.id}`}
                    key={b.id}
                    className={`news-slide ${i === slideIndex ? 'active' : ''}`}
                  >
                    <div className="news-slide-img">
                      {b.gambar ? (
                        <img src={imgSrc(b.gambar)} alt={b.judul} />
                      ) : (
                        <div className="news-img-placeholder">📰</div>
                      )}
                    </div>
                    <div className="news-slide-overlay">
                      <span className="news-cat-badge">
                        {(b.kategori || 'berita').toUpperCase()}
                      </span>
                      <h2>{b.judul}</h2>
                      <p className="news-meta">oleh {b.penulis || 'Redaksi'} · {b.created_at}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <button className="news-slider-btn news-slider-prev" onClick={prevSlide} aria-label="Sebelumnya">❮</button>
              <button className="news-slider-btn news-slider-next" onClick={nextSlide} aria-label="Berikutnya">❯</button>
              <div className="news-slider-dots">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    className={`news-slider-dot ${i === slideIndex ? 'active' : ''}`}
                    onClick={() => setSlideIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="news-slide active">
              <div className="news-slide-img">
                <div className="news-img-placeholder">🕌</div>
              </div>
              <div className="news-slide-overlay">
                <h2>Selamat Datang di LDII Palmerah</h2>
                <p className="news-meta">Belum ada berita</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* More News Grid */}
      {moreNews.length > 0 && (
        <section className="news-more">
          <div className="news-more-inner">
            <h2 className="news-section-title">
              <span className="news-section-line" />Berita Lainnya
            </h2>
            <div className="news-grid">
              {moreNews.map((b) => (
                <Link to={`/berita/${b.id}`} key={b.id} className="news-grid-card">
                  <div className="news-grid-img">
                    {b.gambar ? (
                      <img src={imgSrc(b.gambar)} alt={b.judul} />
                    ) : (
                      <div className="news-img-placeholder-sm">📰</div>
                    )}
                  </div>
                  <div className="news-grid-body">
                    <span className="news-cat-badge news-cat-sm">BERITA</span>
                    <h4>{b.judul}</h4>
                    <p className="news-meta-sm">{b.penulis || 'Redaksi'} · {b.created_at}</p>
                    <p className="news-excerpt">{b.konten.substring(0, 100)}...</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="news-more-cta">
              <Link to="/berita" className="news-btn-all">Lihat Semua Berita →</Link>
            </div>
          </div>
        </section>
      )}

      {/* Kegiatan Section */}
      {allKegiatan.length > 0 && (
        <section className="news-more news-section-kegiatan">
          <div className="news-more-inner">
            <h2 className="news-section-title">
              <span className="news-section-line news-line-blue" />Kegiatan
            </h2>
            <div className="news-grid">
              {allKegiatan.slice(0, 4).map((b) => (
                <Link to={`/berita/${b.id}`} key={b.id} className="news-grid-card">
                  <div className="news-grid-img">
                    {b.gambar ? (
                      <img src={imgSrc(b.gambar)} alt={b.judul} />
                    ) : (
                      <div className="news-img-placeholder-sm">🤝</div>
                    )}
                  </div>
                  <div className="news-grid-body">
                    <span className="news-cat-badge news-cat-sm news-cat-blue">KEGIATAN</span>
                    <h4>{b.judul}</h4>
                    <p className="news-meta-sm">{b.penulis || 'Redaksi'} · {b.created_at}</p>
                    <p className="news-excerpt">{b.konten.substring(0, 100)}...</p>
                  </div>
                </Link>
              ))}
            </div>
            {allKegiatan.length > 4 && (
              <div className="news-more-cta">
                <Link to="/berita" className="news-btn-all news-btn-blue">Lihat Kegiatan Lainnya →</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Event Section */}
      {allEvent.length > 0 && (
        <section className="news-more news-section-event">
          <div className="news-more-inner">
            <h2 className="news-section-title">
              <span className="news-section-line news-line-purple" />Event
            </h2>
            <div className="news-grid">
              {allEvent.slice(0, 4).map((b) => (
                <Link to={`/berita/${b.id}`} key={b.id} className="news-grid-card">
                  <div className="news-grid-img">
                    {b.gambar ? (
                      <img src={imgSrc(b.gambar)} alt={b.judul} />
                    ) : (
                      <div className="news-img-placeholder-sm">🎉</div>
                    )}
                  </div>
                  <div className="news-grid-body">
                    <span className="news-cat-badge news-cat-sm news-cat-purple">EVENT</span>
                    <h4>{b.judul}</h4>
                    <p className="news-meta-sm">{b.penulis || 'Redaksi'} · {b.created_at}</p>
                    <p className="news-excerpt">{b.konten.substring(0, 100)}...</p>
                  </div>
                </Link>
              ))}
            </div>
            {allEvent.length > 4 && (
              <div className="news-more-cta">
                <Link to="/berita" className="news-btn-all news-btn-purple">Lihat Event Lainnya →</Link>
              </div>
            )}
          </div>
        </section>
      )}

      <NewsFooter />
    </div>
  );
}
