// Importación masiva de PDFs a Supabase (plan de migración, paso 5).
//
// Uso:
//   node --env-file=.env scripts/import-books.mjs <carpeta-con-pdfs>
//
// Para cada PDF en <carpeta>:
//   - extrae la portada (primera página) con pdftoppm
//   - extrae el nº de páginas con pdfinfo
//   - sube el PDF a books-files y la portada a books-covers
//   - inserta (o actualiza, si ya existe por título+autor) la fila en `books`
//
// Metadatos: si <carpeta>/metadata.json tiene una entrada para el archivo
// (por nombre exacto), se usa esa. Si no, se intenta leer Title/Author del
// propio PDF. Si tampoco hay, se usa el nombre de archivo y "Autor
// desconocido" — edítalo luego a mano en la tabla books.
//
// Requiere poppler-utils instalado (pdftoppm, pdfinfo) y las variables de
// entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (la service_role key,
// NO la anon/publishable — esta sí puede saltarse RLS para insertar).
// NUNCA expongas la service_role key en el front (por eso no lleva prefijo
// VITE_: Vite no la mete en el bundle del navegador).

import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const run = promisify(execFile);

// supabase-js instancia un cliente de Realtime aunque no lo usemos, y ese
// cliente necesita `WebSocket` global — Node 20 no lo trae (sí Node 22+).
globalThis.WebSocket ??= WebSocket;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno (.env).');
  process.exit(1);
}

const folder = process.argv[2];
if (!folder) {
  console.error('Uso: node --env-file=.env scripts/import-books.mjs <carpeta-con-pdfs>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function readMetadataOverrides() {
  try {
    const raw = await readFile(path.join(folder, 'metadata.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function pdfInfo(filePath) {
  const { stdout } = await run('pdfinfo', [filePath]);
  const get = (label) => {
    // ojo: `\s` incluye saltos de línea, así que si el valor está vacío
    // ("Title:           ") un `\s*` se "come" el salto de línea y termina
    // capturando la línea siguiente entera. Restringido a espacios/tabs.
    const m = stdout.match(new RegExp(`^${label}:[ \\t]*(.*)$`, 'm'));
    const value = m ? m[1].trim() : '';
    return value || null;
  };
  return {
    pages: Number(get('Pages')) || null,
    title: get('Title'),
    author: get('Author'),
  };
}

// Los tiles del catálogo muestran la portada en una caja de 128x182 CSS px.
// 400px de ancho da margen de sobra para pantallas retina sin arrastrar
// portadas a resolución de impresión (una A3 a 150dpi pesaba ~1MB; a este
// ancho pesa ~80-100KB).
const COVER_WIDTH_PX = 400;

async function extractCover(filePath, outDir, baseName) {
  const outPrefix = path.join(outDir, baseName);
  await run('pdftoppm', ['-jpeg', '-f', '1', '-l', '1', '-scale-to-x', String(COVER_WIDTH_PX), '-scale-to-y', '-1', '-singlefile', filePath, outPrefix]);
  return `${outPrefix}.jpg`;
}

async function upsertBook({ title, author, genre, synopsis, pages, coverUrl, fileUrl }) {
  const { data: existing } = await supabase
    .from('books')
    .select('id')
    .eq('title', title)
    .eq('author', author)
    .maybeSingle();

  const row = { title, author, genre, synopsis, pages, cover_url: coverUrl, file_url: fileUrl };

  if (existing) {
    const { error } = await supabase.from('books').update(row).eq('id', existing.id);
    if (error) throw error;
    return 'actualizado';
  }
  const { error } = await supabase.from('books').insert(row);
  if (error) throw error;
  return 'creado';
}

async function importFile(fileName, overrides, tmpDir) {
  const filePath = path.join(folder, fileName);
  const baseName = slugify(path.basename(fileName, '.pdf'));
  const override = overrides[fileName] || {};

  console.log(`\n-> ${fileName}`);

  const info = await pdfInfo(filePath);
  const title = override.title || info.title || path.basename(fileName, '.pdf');
  const author = override.author || info.author || 'Autor desconocido';
  const genre = override.genre || 'Tu biblioteca';
  const synopsis = override.synopsis || null;

  const coverPath = await extractCover(filePath, tmpDir, baseName);
  const pdfBuffer = await readFile(filePath);
  const coverBuffer = await readFile(coverPath);

  const pdfKey = `${baseName}.pdf`;
  const coverKey = `${baseName}.jpg`;

  const { error: pdfUploadError } = await supabase.storage
    .from('books-files')
    .upload(pdfKey, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  if (pdfUploadError) throw pdfUploadError;

  const { error: coverUploadError } = await supabase.storage
    .from('books-covers')
    .upload(coverKey, coverBuffer, { contentType: 'image/jpeg', upsert: true });
  if (coverUploadError) throw coverUploadError;

  const fileUrl = supabase.storage.from('books-files').getPublicUrl(pdfKey).data.publicUrl;
  const coverUrl = supabase.storage.from('books-covers').getPublicUrl(coverKey).data.publicUrl;

  const result = await upsertBook({ title, author, genre, synopsis, pages: info.pages, coverUrl, fileUrl });
  console.log(`   ${result}: "${title}" — ${author} (${genre}, ${info.pages ?? '?'} páginas)`);
}

async function main() {
  const entries = await readdir(folder);
  const pdfFiles = entries.filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (pdfFiles.length === 0) {
    console.log(`No hay PDFs en ${folder}`);
    return;
  }

  const overrides = await readMetadataOverrides();
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'skulflix-import-'));

  try {
    for (const fileName of pdfFiles) {
      try {
        await importFile(fileName, overrides, tmpDir);
      } catch (e) {
        console.error(`   ERROR con ${fileName}:`, e.message || e);
      }
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }

  console.log(`\nListo. ${pdfFiles.length} PDF(s) procesados.`);
}

main();
