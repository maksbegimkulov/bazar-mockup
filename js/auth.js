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

/* ============================================================
   Данные через Supabase: объявления, чаты, сообщения, realtime.
   ============================================================ */

async function dbCreateListing(l) {
  if (!sb || !AUTH.user) throw new Error('no-auth');
  const { data, error } = await sb.from('listings').insert({
    owner_id: AUTH.user.id,
    title: l.title, price: l.price || 0, floor: l.floor || 0,
    category: l.category, subcategory: l.subcategory, city: l.city, district: l.district || null,
    condition: l.condition || null, description: l.description || '',
    photos: l.photos || [], negotiable: !!l.negotiable,
  }).select().single();
  if (error) throw error;
  return data;
}

async function dbAllListings() {
  if (!sb) return [];
  const { data, error } = await sb.from('listings').select('*').order('created_at', { ascending: false }).limit(300);
  return error ? [] : data;
}

async function dbDeleteListing(id) {
  if (!sb || !AUTH.user) return;
  await sb.from('listings').delete().eq('id', id);
}

/* найти существующий или создать чат покупатель→продавец по объявлению */
async function dbStartChat({ listingRef, listingTitle, sellerId }) {
  if (!sb || !AUTH.user) throw new Error('no-auth');
  const buyer = AUTH.user.id;
  const { data: found } = await sb.from('chats').select('*')
    .eq('listing_ref', String(listingRef)).eq('buyer_id', buyer).eq('seller_id', sellerId).limit(1);
  if (found && found.length) return found[0];
  const { data, error } = await sb.from('chats').insert({
    listing_ref: String(listingRef), listing_title: listingTitle || '', buyer_id: buyer, seller_id: sellerId,
  }).select().single();
  if (error) throw error;
  return data;
}

async function dbMyChats() {
  if (!sb || !AUTH.user) return [];
  const uid = AUTH.user.id;
  const { data, error } = await sb.from('chats').select('*')
    .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`).order('updated_at', { ascending: false });
  return error ? [] : data;
}

async function dbChat(chatId) {
  if (!sb) return null;
  const { data } = await sb.from('chats').select('*').eq('id', chatId).single();
  return data || null;
}

async function dbMessages(chatId) {
  if (!sb) return [];
  const { data, error } = await sb.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
  return error ? [] : data;
}

async function dbSendMessage(chatId, text) {
  if (!sb || !AUTH.user) throw new Error('no-auth');
  const { data, error } = await sb.from('messages').insert({ chat_id: chatId, sender_id: AUTH.user.id, text }).select().single();
  if (error) throw error;
  sb.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId).then(() => {});
  return data;
}

/* realtime: новые сообщения в чате → колбэк (мгновенно на обоих аккаунтах) */
function dbSubscribeMessages(chatId, onMsg) {
  if (!sb) return () => {};
  const ch = sb.channel('msgs-' + chatId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'chat_id=eq.' + chatId },
      payload => onMsg(payload.new))
    .subscribe();
  return () => { try { sb.removeChannel(ch); } catch (e) {} };
}

/* realtime: любой новый/обновлённый чат пользователя → колбэк (для списка) */
function dbSubscribeMyChats(onChange) {
  if (!sb || !AUTH.user) return () => {};
  const ch = sb.channel('mychats-' + AUTH.user.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => onChange())
    .subscribe();
  return () => { try { sb.removeChannel(ch); } catch (e) {} };
}

authInit();
