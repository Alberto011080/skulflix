import { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { GENRES, getBooks } from '../data/books';
import { Row } from './Row';
import { styles } from '../styles';

export function Catalog({ user, onLogout }) {
  const [activeGenre, setActiveGenre] = useState('Todos');
  const [menuOpen, setMenuOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getBooks().then((result) => {
      if (cancelled) return;
      setBooks(result);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = activeGenre === 'Todos' ? books : books.filter((b) => b.genre === activeGenre);
  const topTen = [...books].sort((a, b) => b.reads - a.reads).slice(0, 10);

  return (
    <div style={styles.page}>
      <style>{`
        .genre-tabs-desktop, .greeting-desktop, .logout-desktop { display: flex; }
        .hamburger-btn { display: none; }
        .mobile-menu-panel { display: none; }
        @media (max-width: 768px) {
          .genre-tabs-desktop, .greeting-desktop, .logout-desktop { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .mobile-menu-panel.open { display: flex !important; }
        }
      `}</style>

      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={styles.logo}>SKULFLIX</span>
          <div className="genre-tabs-desktop" style={styles.genreTabs}>
            <button style={activeGenre === 'Todos' ? styles.genreTabActive : styles.genreTab} onClick={() => setActiveGenre('Todos')}>Todos</button>
            {GENRES.map((g) => (
              <button key={g} style={activeGenre === g ? styles.genreTabActive : styles.genreTab} onClick={() => setActiveGenre(g)}>{g}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="greeting-desktop" style={styles.greeting}>Hola, {user.username}</span>
          <button className="logout-desktop" style={styles.navLoginBtn} onClick={onLogout}>
            <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Salir
          </button>
          <button className="hamburger-btn" style={styles.hamburgerBtn} onClick={() => setMenuOpen((m) => !m)} aria-label="Abrir menú">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <div className={`mobile-menu-panel ${menuOpen ? 'open' : ''}`} style={styles.mobileMenuPanel}>
        <span style={styles.greeting}>Hola, {user.username}</span>
        <button
          style={activeGenre === 'Todos' ? styles.genreTabActiveMobile : styles.genreTabMobile}
          onClick={() => { setActiveGenre('Todos'); setMenuOpen(false); }}
        >Todos</button>
        {GENRES.map((g) => (
          <button
            key={g}
            style={activeGenre === g ? styles.genreTabActiveMobile : styles.genreTabMobile}
            onClick={() => { setActiveGenre(g); setMenuOpen(false); }}
          >{g}</button>
        ))}
        <button style={styles.navLoginBtn} onClick={onLogout}>
          <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Salir
        </button>
      </div>

      <div style={styles.catalogBody}>
        {loading ? (
          <p style={styles.loadingText}>Cargando catálogo...</p>
        ) : activeGenre === 'Todos' ? (
          <>
            <Row title="Top 10 más leídos" books={topTen} ranked />
            {GENRES.map((g) => (
              <Row key={g} title={g} books={books.filter((b) => b.genre === g)} />
            ))}
          </>
        ) : (
          <Row title={activeGenre} books={filtered} />
        )}
      </div>

      <footer style={styles.footer}>
        SKULFLIX — tu biblioteca personal.
      </footer>
    </div>
  );
}
