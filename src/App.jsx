import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Download } from 'lucide-react';
import { HERO_TITLES, SPINE_COLORS } from './data/books';
import { registerUser, loginUser, logoutUser } from './lib/auth';
import { Catalog } from './components/Catalog';
import { styles } from './styles';

export default function App() {
  const [mode, setMode] = useState('register');
  const [heroEmail, setHeroEmail] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function scrollToForm() {
    const el = document.getElementById('auth-form');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleRegister() {
    setError('');
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError('Rellena todos los campos, no seas tímido.');
      return;
    }
    if (!form.email.includes('@')) {
      setError('Ese email no me lo creo. Revísalo.');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña necesita al menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const record = await registerUser(form);
      setUser(record);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError('');
    if (!form.username.trim() || !form.password) {
      setError('Falta email o contraseña.');
      return;
    }
    setLoading(true);
    try {
      const record = await loginUser(form);
      setUser(record);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const onEnter = (fn) => (e) => { if (e.key === 'Enter') fn(); };

  if (user) {
    return <Catalog user={user} onLogout={() => { logoutUser(); setUser(null); }} />;
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.logo}>SKULFLIX</span>
        <button style={styles.navLoginBtn} onClick={() => { setMode('login'); setError(''); scrollToForm(); }}>
          Iniciar sesión
        </button>
      </nav>

      <div style={styles.hero}>
        <div style={styles.spineGrid}>
          {Array.from({ length: 54 }).map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.spine,
                background: SPINE_COLORS[i % SPINE_COLORS.length],
                transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.2}deg)`,
              }}
            >
              <span style={styles.spineText}>{HERO_TITLES[i % HERO_TITLES.length]}</span>
            </div>
          ))}
        </div>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Miles de libros.<br />Descárgalos y ya está.</h1>
          <p style={styles.heroSub}>
            Sin colas de biblioteca, sin esperar tu turno del ebook. Se descarga, se abre, se lee. Así de simple.
          </p>
          <p style={styles.heroCta}>¿Listo para empezar? Mete tu email.</p>
          <div style={styles.heroForm}>
            <input
              type="email"
              placeholder="Email"
              value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              onKeyDown={onEnter(() => { setForm((f) => ({ ...f, email: heroEmail })); setMode('register'); scrollToForm(); })}
              style={styles.heroInput}
            />
            <button
              style={styles.heroButton}
              onClick={() => { setForm((f) => ({ ...f, email: heroEmail })); setMode('register'); scrollToForm(); }}
            >
              Empezar <Download size={18} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
            </button>
          </div>
        </div>
      </div>

      <div id="auth-form" style={styles.authSection}>
        <div style={styles.authCard}>
          <div style={styles.tabRow}>
            <button style={mode === 'register' ? styles.tabActive : styles.tab} onClick={() => { setMode('register'); setError(''); }}>Crear cuenta</button>
            <button style={mode === 'login' ? styles.tabActive : styles.tab} onClick={() => { setMode('login'); setError(''); }}>Iniciar sesión</button>
          </div>

          {mode === 'register' ? (
            <div style={styles.form}>
              <h2 style={styles.formTitle}>Date de alta</h2>
              <div style={styles.inputWrap}>
                <User size={18} color="#808080" />
                <input style={styles.input} placeholder="Nombre de usuario" value={form.username} onChange={update('username')} onKeyDown={onEnter(handleRegister)} />
              </div>
              <div style={styles.inputWrap}>
                <Mail size={18} color="#808080" />
                <input style={styles.input} type="email" placeholder="Email" value={form.email} onChange={update('email')} onKeyDown={onEnter(handleRegister)} />
              </div>
              <div style={styles.inputWrap}>
                <Lock size={18} color="#808080" />
                <input style={styles.input} type={showPw ? 'text' : 'password'} placeholder="Contraseña (mín. 6 caracteres)" value={form.password} onChange={update('password')} onKeyDown={onEnter(handleRegister)} />
                <button style={styles.eyeBtn} onClick={() => setShowPw((s) => !s)} aria-label="Mostrar contraseña">
                  {showPw ? <EyeOff size={18} color="#808080" /> : <Eye size={18} color="#808080" />}
                </button>
              </div>
              <div style={styles.inputWrap}>
                <Lock size={18} color="#808080" />
                <input style={styles.input} type={showPw ? 'text' : 'password'} placeholder="Repite la contraseña" value={form.confirm} onChange={update('confirm')} onKeyDown={onEnter(handleRegister)} />
              </div>
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.submitBtn} onClick={handleRegister} disabled={loading}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</button>
              <p style={styles.switchText}>¿Ya tienes cuenta? <span style={styles.switchLink} onClick={() => { setMode('login'); setError(''); }}>Inicia sesión</span></p>
            </div>
          ) : (
            <div style={styles.form}>
              <h2 style={styles.formTitle}>Bienvenido de vuelta</h2>
              <div style={styles.inputWrap}>
                <Mail size={18} color="#808080" />
                <input style={styles.input} type="email" placeholder="Email" value={form.username} onChange={update('username')} onKeyDown={onEnter(handleLogin)} />
              </div>
              <div style={styles.inputWrap}>
                <Lock size={18} color="#808080" />
                <input style={styles.input} type={showPw ? 'text' : 'password'} placeholder="Contraseña" value={form.password} onChange={update('password')} onKeyDown={onEnter(handleLogin)} />
                <button style={styles.eyeBtn} onClick={() => setShowPw((s) => !s)} aria-label="Mostrar contraseña">
                  {showPw ? <EyeOff size={18} color="#808080" /> : <Eye size={18} color="#808080" />}
                </button>
              </div>
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.submitBtn} onClick={handleLogin} disabled={loading}>{loading ? 'Entrando...' : 'Iniciar sesión'}</button>
              <p style={styles.switchText}>¿Aún no tienes cuenta? <span style={styles.switchLink} onClick={() => { setMode('register'); setError(''); }}>Regístrate</span></p>
            </div>
          )}
        </div>
      </div>

      <footer style={styles.footer}>SKULFLIX — prototipo de front.</footer>
    </div>
  );
}
