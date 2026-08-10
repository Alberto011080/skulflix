import { useState } from 'react';
import { Download } from 'lucide-react';
import { colorForTitle, downloadBook } from '../data/books';
import { styles } from '../styles';

export function BookTile({ book, rank }) {
  const [hover, setHover] = useState(false);
  const [imgError, setImgError] = useState(false);
  const coverUrl = book.coverUrl;
  const showCover = coverUrl && !imgError;

  return (
    <div
      style={styles.tileWrap}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {rank && <span style={styles.rankNumber}>{rank}</span>}
      <div
        style={{
          ...styles.tileCover,
          background: showCover ? '#0a0a0a' : `linear-gradient(160deg, ${colorForTitle(book.title)} 0%, #141414 140%)`,
          transform: hover ? 'scale(1.08)' : 'scale(1)',
          zIndex: hover ? 5 : 1,
        }}
        onClick={() => setHover((h) => !h)}
      >
        {showCover && !hover && (
          <img
            src={coverUrl}
            alt={book.title}
            style={styles.coverImg}
            onError={() => setImgError(true)}
          />
        )}
        {!showCover && !hover && (
          <>
            <span style={styles.tileGenre}>{book.genre}</span>
            <span style={styles.tileTitle}>{book.title}</span>
            <span style={styles.tileAuthor}>{book.author}</span>
          </>
        )}
        {hover && (
          <div style={styles.tileOverlay}>
            <div>
              <span style={styles.tileTitleOverlay}>{book.title}</span>
              <span style={styles.tileAuthorOverlay}>{book.author}</span>
              <p style={styles.tileSynopsis}>{book.synopsis}</p>
            </div>
            <button
              style={styles.tileDownloadBtn}
              onClick={(e) => {
                e.stopPropagation();
                downloadBook(book);
              }}
            >
              <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Descargar PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
