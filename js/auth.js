/* ============================================================
   BAZAR — слой авторизации.
   Абстракция над провайдером: сейчас LOCAL-MOCK (всё в браузере,
   чтобы UX входа/кабинета работал сразу), дальше — чистая замена
   на Supabase (тот же интерфейс: authSignUp/authSignIn/authSocial/
   authSignOut/authOnChange). Грузится ДО app.js. lsLoad/lsSave — из i18n.js.
   ============================================================ */

const AUTH = { user: null, ready: false, _subs: [] };
const AUTH_USERS_LS = 'bazar_users';
const AUTH_SESSION_LS = 'bazar_session';

function authUsers() { return lsLoad(AUTH_USERS_LS, []); }
function authSaveUsers(u) { lsSave(AUTH_USERS_LS, u); }
function authPublic(u) {
  return { id: u.id, name: u.name, email: u.email || '', phone: u.phone || '', provider: u.provider || 'email', createdAt: u.createdAt };
}

/* SHA-256 хэш пароля (для локального мока — не храним пароли в открытую) */
async function authHash(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bzr.v1:' + pw));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function authOnChange(fn) { AUTH._subs.push(fn); if (AUTH.ready) fn(AUTH.user); }
function authEmit() { AUTH._subs.forEach(fn => { try { fn(AUTH.user); } catch (e) {} }); }
function currentUser() { return AUTH.user; }
function isAuthed() { return !!AUTH.user; }

function authInit() {
  const sid = lsLoad(AUTH_SESSION_LS, null);
  if (sid) {
    const u = authUsers().find(x => x.id === sid);
    if (u) AUTH.user = authPublic(u);
  }
  AUTH.ready = true;
  authEmit();
}

function authStartSession(u) {
  lsSave(AUTH_SESSION_LS, u.id);
  AUTH.user = authPublic(u);
  authEmit();
  return AUTH.user;
}

/* регистрация по email или телефону + пароль */
async function authSignUp({ name, email, phone, password }) {
  email = (email || '').trim().toLowerCase();
  phone = (phone || '').trim();
  const users = authUsers();
  if (email && users.some(u => u.email === email)) throw new Error('email-exists');
  if (phone && users.some(u => u.phone === phone)) throw new Error('phone-exists');
  const u = {
    id: 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    name: (name || '').trim() || (email ? email.split('@')[0] : 'Пользователь'),
    email, phone, provider: phone && !email ? 'phone' : 'email',
    pass: password ? await authHash(password) : '',
    createdAt: Date.now(),
  };
  users.push(u);
  authSaveUsers(users);
  return authStartSession(u);
}

/* вход по email/телефону + пароль */
async function authSignIn({ email, phone, password }) {
  email = (email || '').trim().toLowerCase();
  phone = (phone || '').trim();
  const u = authUsers().find(x => (email && x.email === email) || (phone && x.phone === phone));
  if (!u) throw new Error('no-user');
  if (u.pass && u.pass !== await authHash(password || '')) throw new Error('bad-pass');
  return authStartSession(u);
}

/* вход через Google/Apple — в локальном моке имитируем; в Supabase будет реальный OAuth */
async function authSocial(provider) {
  const users = authUsers();
  const email = provider + '.demo@bazar.kg';
  let u = users.find(x => x.email === email);
  if (!u) {
    u = {
      id: 'u' + Date.now().toString(36),
      name: provider === 'google' ? 'Google-аккаунт' : 'Apple-аккаунт',
      email, phone: '', provider, pass: '', createdAt: Date.now(),
    };
    users.push(u);
    authSaveUsers(users);
  }
  return authStartSession(u);
}

function authSignOut() {
  lsSave(AUTH_SESSION_LS, null);
  AUTH.user = null;
  authEmit();
}

/* обновить профиль текущего пользователя (имя и т.п.) */
function authUpdateProfile(patch) {
  if (!AUTH.user) return;
  const users = authUsers();
  const u = users.find(x => x.id === AUTH.user.id);
  if (!u) return;
  Object.assign(u, patch);
  authSaveUsers(users);
  AUTH.user = authPublic(u);
  authEmit();
}

authInit();
