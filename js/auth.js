/* ============================================================
   BAZAR — авторизация через Supabase (реальная, облачная).
   Интерфейс тот же, что был у local-mock (authSignUp/authSignIn/
   authSocial/authSignOut/authOnChange/currentUser/isAuthed), поэтому
   app.js менять почти не нужно. Грузится ДО app.js, ПОСЛЕ supabase-js.
   ============================================================ */

const SUPABASE_URL = 'https://sabzafiwxtyhzseyytbz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7ERN6zStjy-aMNvQoSIQ9w_i0oMy4Ds'; // публичный ключ, защита через RLS

const sb = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

const AUTH = { user: null, ready: false, _subs: [] };

function authPublic(u) {
  if (!u) return null;
  const m = u.user_metadata || {};
  const provider = (u.app_metadata && u.app_metadata.provider) || 'email';
  return {
    id: u.id,
    name: m.name || m.full_name || (u.email ? u.email.split('@')[0] : (u.phone || 'Пользователь')),
    email: u.email || '',
    phone: u.phone || '',
    provider,
  };
}

function authOnChange(fn) { AUTH._subs.push(fn); if (AUTH.ready) fn(AUTH.user); }
function authEmit() { AUTH._subs.forEach(fn => { try { fn(AUTH.user); } catch (e) {} }); }
function currentUser() { return AUTH.user; }
function isAuthed() { return !!AUTH.user; }

async function authInit() {
  if (!sb) { AUTH.ready = true; authEmit(); return; }
  try {
    const { data } = await sb.auth.getSession();
    AUTH.user = authPublic(data.session && data.session.user);
  } catch (e) {}
  AUTH.ready = true;
  authEmit();
  sb.auth.onAuthStateChange((_event, session) => {
    AUTH.user = authPublic(session && session.user);
    authEmit();
  });
}

/* код ошибки → наш короткий ключ (app.js покажет локализованный текст) */
function mapAuthError(error) {
  const m = ((error && error.message) || '').toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('exists')) return 'email-exists';
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'bad-creds';
  if (m.includes('password') && (m.includes('6') || m.includes('short') || m.includes('least'))) return 'weak-pass';
  if (m.includes('not enabled') || m.includes('unsupported provider') || m.includes('provider')) return 'provider-unavailable';
  if (m.includes('email')) return 'bad-email';
  return 'generic';
}

async function authSignUp({ name, email, phone, password }) {
  if (!sb) throw new Error('no-backend');
  if (phone && !email) throw new Error('phone-unavailable'); // SMS-провайдер пока не настроен
  const { data, error } = await sb.auth.signUp({
    email: (email || '').trim().toLowerCase(),
    password,
    options: { data: { name: (name || '').trim() } },
  });
  if (error) throw new Error(mapAuthError(error));
  AUTH.user = authPublic(data.user);
  authEmit();
  return AUTH.user;
}

async function authSignIn({ email, phone, password }) {
  if (!sb) throw new Error('no-backend');
  if (phone && !email) throw new Error('phone-unavailable');
  const { data, error } = await sb.auth.signInWithPassword({
    email: (email || '').trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(mapAuthError(error));
  AUTH.user = authPublic(data.user);
  authEmit();
  return AUTH.user;
}

/* Google / Apple через Supabase OAuth. Включаю провайдера здесь ТОЛЬКО когда
   реально настроен OAuth-клиент в проекте — иначе signInWithOAuth увёл бы на
   страницу ошибки Supabase. Пока не настроено → «скоро» (app.js покажет тост). */
const OAUTH_ENABLED = { google: false, apple: false };
async function authSocial(provider) {
  if (!sb) throw new Error('no-backend');
  if (!OAUTH_ENABLED[provider]) throw new Error('provider-unavailable');
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: location.origin + location.pathname + '#/profile' },
  });
  if (error) throw new Error(mapAuthError(error));
  // при успехе страница уходит на провайдера и возвращается уже залогиненной
}

async function authSignOut() {
  if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
  AUTH.user = null;
  authEmit();
}

async function authUpdateProfile(patch) {
  if (!sb || !AUTH.user) return;
  try {
    await sb.auth.updateUser({ data: { name: patch.name } });
    await sb.from('profiles').update({ name: patch.name }).eq('id', AUTH.user.id);
  } catch (e) {}
}

authInit();
