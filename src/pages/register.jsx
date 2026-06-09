import { useState, useRef, useCallback } from 'react';
import Footer from '../components/Footer';
import '../styles/register.css';

const MAX_AVATAR_MB = 5;
const MIN_NAME_LEN  = 3;
const MIN_PW_LEN    = 8;

async function hashPassword(pw) {
  const data    = new TextEncoder().encode(pw);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function measureStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw))   score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(4, Math.ceil(score * 0.8));
}

const STRENGTH_DATA = [
  { label: '–',       cls: '',       color: 'var(--text-muted)' },
  { label: 'Débil',   cls: 'weak',   color: 'var(--color-error)' },
  { label: 'Regular', cls: 'fair',   color: 'var(--color-warning)' },
  { label: 'Buena',   cls: 'good',   color: '#5aabdf' },
  { label: 'Fuerte',  cls: 'strong', color: 'var(--primary)' },
];

const INITIAL_FORM   = { name: '', email: '', password: '', confirm: '', terms: false };
const INITIAL_ERRORS = { name: '', email: '', password: '', confirm: '', terms: '', avatar: '' };

export default function Register() {
  const [formData,     setFormData]     = useState(INITIAL_FORM);
  const [errors,       setErrors]       = useState(INITIAL_ERRORS);
  const [fieldValid,   setFieldValid]   = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [pwStrength,   setPwStrength]   = useState(0);
  const [avatarSrc,    setAvatarSrc]    = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState({ show: false, msg: '', type: 'success' });
  const [darkMode,     setDarkMode]     = useState(false);

  const avatarInputRef = useRef(null);
  const toastTimer     = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, msg, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  }, []);

  const setError = useCallback((field, msg) => {
    setErrors(prev     => ({ ...prev, [field]: msg   }));
    setFieldValid(prev => ({ ...prev, [field]: false }));
  }, []);

  const setValid = useCallback((field) => {
    setErrors(prev     => ({ ...prev, [field]: ''   }));
    setFieldValid(prev => ({ ...prev, [field]: true }));
  }, []);

  const clearField = useCallback((field) => {
    setErrors(prev     => ({ ...prev, [field]: ''    }));
    setFieldValid(prev => ({ ...prev, [field]: false }));
  }, []);

  const validateName = useCallback((value = formData.name) => {
    const v = value.trim();
    if (!v)                      { setError('name', 'El nombre es obligatorio.');           return false; }
    if (v.length < MIN_NAME_LEN) { setError('name', `Mínimo ${MIN_NAME_LEN} caracteres.`); return false; }
    if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/u.test(v)) { setError('name', 'Solo letras, espacios o guiones.'); return false; }
    setValid('name'); return true;
  }, [formData.name, setError, setValid]);

  const validateEmail = useCallback((value = formData.email) => {
    const v = value.trim();
    if (!v)                                        { setError('email', 'El correo es obligatorio.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setError('email', 'Ingresa un correo válido.'); return false; }
    setValid('email'); return true;
  }, [formData.email, setError, setValid]);

  const validatePassword = useCallback((value = formData.password) => {
    if (!value)                    { setError('password', 'La contraseña es obligatoria.');     return false; }
    if (value.length < MIN_PW_LEN) { setError('password', `Mínimo ${MIN_PW_LEN} caracteres.`); return false; }
    setValid('password'); return true;
  }, [formData.password, setError, setValid]);

  const validateConfirm = useCallback((confirmVal = formData.confirm, passwordVal = formData.password) => {
    if (!confirmVal)                { setError('confirm', 'Confirma tu contraseña.');        return false; }
    if (confirmVal !== passwordVal) { setError('confirm', 'Las contraseñas no coinciden.');  return false; }
    setValid('confirm'); return true;
  }, [formData.confirm, formData.password, setError, setValid]);

  const validateTerms = useCallback((checked = formData.terms) => {
    if (!checked) { setError('terms', 'Debes aceptar los términos para continuar.'); return false; }
    clearField('terms'); return true;
  }, [formData.terms, setError, clearField]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (name === 'password') setPwStrength(value ? measureStrength(value) : 0);
  }, []);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'name')     validateName(value);
    if (name === 'email')    validateEmail(value);
    if (name === 'password') validatePassword(value);
    if (name === 'confirm')  validateConfirm(value, formData.password);
  }, [validateName, validateEmail, validatePassword, validateConfirm, formData.password]);

  const handleAvatarFile = useCallback((file) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setError('avatar', 'Solo se permiten imágenes JPG, PNG o WEBP.'); return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setError('avatar', `La imagen no puede superar ${MAX_AVATAR_MB} MB.`); return;
    }
    clearField('avatar');
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  }, [setError, clearField]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleAvatarFile(e.dataTransfer?.files?.[0]);
  }, [handleAvatarFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = [validateName(), validateEmail(), validatePassword(), validateConfirm(), validateTerms()].every(Boolean);
    if (!ok) return;
    setLoading(true);
    try {
      const passwordHash = await hashPassword(formData.password);
      const payload = {
        fullName: formData.name.trim(),
        email:    formData.email.trim().toLowerCase(),
        passwordHash,
        role: 'cliente', active: true, createdAt: new Date().toISOString(),
      };
      await new Promise(res => setTimeout(res, 1400));
      console.info('[RentStyle] Registro OK →', payload);
      showToast('¡Cuenta creada exitosamente! Redirigiendo…', 'success');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } catch (err) {
      console.error('[RentStyle] Error en registro:', err);
      showToast('Ocurrió un error. Intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) => {
    if (errors[name])     return 'field-group has-error';
    if (fieldValid[name]) return 'field-group is-valid';
    return 'field-group';
  };

  const strengthInfo = STRENGTH_DATA[pwStrength];

  const EyeIcon = showPassword ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <>
      <nav className="register-nav">
        <div className="register-nav-inner">
          <h2 className="register-logo">RentStyle</h2>
          <div className="register-nav-links">
            <button className="theme-toggle-register" onClick={() => setDarkMode(!darkMode)}>
              <div className="theme-icon-register" />
            </button>
            <a href="/">Inicio</a>
            <a href="/login">Iniciar sesión</a>
          </div>
        </div>
      </nav>

      <div className={`register-page${darkMode ? ' dark' : ''}`}>

        <div className="register-left">
          <span className="register-welcome">BIENVENIDO A</span>
          <h1>RentStyle</h1>
          <p>Alquila lo que necesitas, cuando lo necesitas. Moda, tecnología y más sin el compromiso de comprar.</p>
          <ul>
            <li>✦ Catálogo actualizado</li>
            <li>✦ Reservas flexibles</li>
            <li>✦ Cancelación sin cargos</li>
          </ul>
        </div>

        <div className="register-right">
          <div className="register-form-container">
            <h2>Crear cuenta</h2>

            <form onSubmit={handleSubmit} noValidate>

              <div className={fieldClass('name')}>
                <label htmlFor="name">Nombre completo</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </span>
                  <input type="text" id="name" name="name" placeholder="Tu nombre completo"
                    autoComplete="name" minLength={3} maxLength={80}
                    value={formData.name} onChange={handleChange} onBlur={handleBlur} required />
                </div>
                {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
              </div>

              <div className={fieldClass('email')}>
                <label htmlFor="email">Correo electrónico</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                    </svg>
                  </span>
                  <input type="email" id="email" name="email" placeholder="ejemplo@correo.com"
                    autoComplete="email" value={formData.email}
                    onChange={handleChange} onBlur={handleBlur} required />
                </div>
                {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
              </div>

              <div className={fieldClass('password')}>
                <label htmlFor="password">Contraseña</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input type={showPassword ? 'text' : 'password'} id="password" name="password"
                    placeholder="Mínimo 8 caracteres" autoComplete="new-password" minLength={8}
                    value={formData.password} onChange={handleChange} onBlur={handleBlur} required />
                  <button type="button" className="toggle-pw"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword(p => !p)}>
                    {EyeIcon}
                  </button>
                </div>
                <div className={`pw-strength${formData.password ? ' visible' : ''}`} aria-live="polite">
                  <div className="pw-bars">
                    {[1,2,3,4].map(i => (
                      <span key={i} className={`bar${i <= pwStrength ? ` ${strengthInfo.cls}` : ''}`} />
                    ))}
                  </div>
                  <span className="pw-label" style={{ color: strengthInfo.color }}>{strengthInfo.label}</span>
                </div>
                {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
              </div>

              <div className={fieldClass('confirm')}>
                <label htmlFor="confirm">Confirmar contraseña</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 12 2 2 4-4"/><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input type={showPassword ? 'text' : 'password'} id="confirm" name="confirm"
                    placeholder="Repite tu contraseña" autoComplete="new-password"
                    value={formData.confirm} onChange={handleChange} onBlur={handleBlur} required />
                </div>
                {errors.confirm && <span className="field-error" role="alert">{errors.confirm}</span>}
              </div>

              <div className={fieldClass('avatar')}>
                <label>Foto de perfil <span className="optional-tag">Opcional</span></label>
                <div className={`avatar-zone${dragging ? ' dragging' : ''}`}
                  role="button" tabIndex={0} aria-label="Subir foto de perfil"
                  onClick={() => avatarInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); avatarInputRef.current?.click(); }}}
                  onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragOver={(e)  => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}>
                  <div className="avatar-preview-wrap">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Vista previa" style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block', borderRadius:'14px' }} />
                    ) : (
                      <div className="avatar-placeholder">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                        </svg>
                        <p>Haz clic o arrastra una imagen</p>
                        <span>JPG, PNG o WEBP · Máx. 5 MB</span>
                      </div>
                    )}
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    aria-hidden="true" tabIndex={-1} onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                    style={{ display:'none' }} />
                </div>
                {errors.avatar && <span className="field-error" role="alert">{errors.avatar}</span>}
              </div>

              <div className={fieldClass('terms')}>
                <label className="check-label">
                  <input type="checkbox" id="terms" name="terms"
                    checked={formData.terms} onChange={handleChange} required />
                  <span className="check-box" aria-hidden="true" />
                  <span>
                    Acepto los{' '}
                    <a href="/terms" className="link">Términos de uso</a>
                    {' '}y la{' '}
                    <a href="/privacy" className="link">Política de privacidad</a>
                  </span>
                </label>
                {errors.terms && <span className="field-error" role="alert">{errors.terms}</span>}
              </div>

              <button type="submit" className={`btn-submit${loading ? ' loading' : ''}`} disabled={loading}>
                <span className="btn-text">{loading ? 'Creando cuenta…' : 'Crear cuenta'}</span>
                <span className="btn-spinner" aria-hidden="true" />
              </button>

            </form>

            <p className="form-footer-text">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="link">Inicia sesión</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      <div className={`toast${toast.show ? ' show' : ''} ${toast.type}`} role="status" aria-live="polite">
        {toast.msg}
      </div>
    </>
  );
}