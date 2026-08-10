import { BookTile } from './BookTile';
import { styles } from '../styles';

export function Row({ title, books, ranked }) {
  return (
    <div style={styles.row}>
      <h3 style={styles.rowTitle}>{title}</h3>
      <div style={styles.rowScroll}>
        {books.map((b, i) => <BookTile key={b.id} book={b} rank={ranked ? i + 1 : null} />)}
      </div>
    </div>
  );
}
