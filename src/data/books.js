import { supabase } from '../lib/supabaseClient';

export const GENRES = ['Tu biblioteca', 'Clásicos', 'Ciencia ficción', 'Terror', 'No ficción', 'Aventura', 'Romántico'];

export const SPINE_COLORS = ['#7a1113', '#0b3d2e', '#1a2a5e', '#5c3a21', '#3d1a5c', '#6e1a4a', '#0f4c5c', '#5c1a1a'];

// Títulos solo decorativos para el lomero del hero (no dependen del catálogo).
export const HERO_TITLES = [
  'Don Quijote de la Mancha', 'Frankenstein', 'Drácula', 'Orgullo y prejuicio',
  'La isla del tesoro', 'Los miserables', 'Cumbres borrascosas', 'Sherlock Holmes',
  'Meditaciones', 'Robinson Crusoe', 'La guerra de los mundos', 'El origen de las especies',
];

export async function getBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('reads', { ascending: false });
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    synopsis: row.synopsis,
    reads: row.reads || 0,
    pages: row.pages,
    coverUrl: row.cover_url,
    fileUrl: row.file_url,
  }));
}

export function colorForTitle(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash + title.charCodeAt(i)) % SPINE_COLORS.length;
  return SPINE_COLORS[hash];
}

export function downloadBook(book) {
  const a = document.createElement('a');
  a.href = book.fileUrl;
  a.download = `${book.title.replace(/[^a-z0-9]+/gi, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
