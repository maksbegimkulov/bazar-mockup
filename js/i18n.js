/* ============================================================
   BAZAR mockup — i18n (ru / en / ky) + темы (light / dark / system)
   Загружается до app.js: здесь же базовые утилиты localStorage.
   ============================================================ */

function lsLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}
function lsSave(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ---------------- словари ---------------- */

const I18N = {
  ru: {
    'nav.home': 'Главная', 'nav.favs': 'Избранное', 'nav.post': 'Подать', 'nav.chats': 'Чаты', 'nav.profile': 'Профиль',
    'search.ph': 'Поиск по объявлениям…', 'search.go': 'Найти', 'search.prefix': 'Поиск',
    'city.all': 'Весь Кыргызстан', 'city.modal': 'Ваш город',
    'post.btn': 'Подать объявление', 'post.btnShort': '+ Подать объявление',
    'home.cats': 'Категории', 'home.vip': 'VIP-объявления', 'home.fresh': 'Свежие объявления',
    'home.viewed': 'Вы недавно смотрели', 'home.seeAll': 'Смотреть все', 'home.allBtn': 'Смотреть все объявления',
    'ai.banner.title': 'Айка — ИИ-помощница', 'ai.banner.sub': 'Опишите словами, что ищете: «макбук до 100к б/у» — найду за секунду', 'ai.banner.btn': 'Спросить',
    'results.all': 'Все объявления',
    'filters.title': 'Фильтры', 'filters.reset': 'Сбросить', 'filters.category': 'Категория', 'filters.sub': 'Подкатегория',
    'filters.allCats': 'Все категории', 'filters.allSubs': 'Все подкатегории', 'filters.price': 'Цена, сом',
    'filters.from': 'от', 'filters.to': 'до', 'filters.city': 'Город', 'filters.condition': 'Состояние',
    'cond.any': 'Любое', 'cond.new': 'Новое', 'cond.used': 'Б/у',
    'filters.seller': 'Продавец', 'seller.all': 'Все', 'seller.private': 'Частные', 'seller.business': 'Бизнес',
    'filters.posted': 'Дата размещения', 'period.all': 'За всё время', 'period.day': '24 часа', 'period.week': 'Неделя', 'period.month': 'Месяц',
    'filters.withPhoto': 'Только с фото', 'filters.delivery': 'С доставкой', 'filters.show': 'Показать',
    'chip.price': 'Цена', 'chip.withPhoto': 'С фото', 'chip.day': 'За 24 часа', 'chip.week': 'За неделю', 'chip.month': 'За месяц',
    'sort.new': 'Сначала новые', 'sort.cheap': 'Дешевле', 'sort.exp': 'Дороже', 'sort.popular': 'Популярные',
    'more.show': 'Показать ещё', 'more.of': 'из',
    'empty.search.t': 'Ничего не найдено', 'empty.search.p': 'Попробуйте изменить параметры фильтров или поискать по-другому.',
    'empty.reset': 'Сбросить фильтры',
    'item.specs': 'Характеристики', 'item.desc': 'Описание', 'item.location': 'Местоположение',
    'item.cat': 'Категория', 'item.section': 'Раздел', 'item.cond': 'Состояние', 'item.city': 'Город',
    'item.delivery': 'Доставка', 'item.views': 'Просмотров', 'item.posted': 'Размещено', 'item.num': 'Номер объявления',
    'item.yes': 'Есть', 'item.no': 'Нет',
    'item.showPhone': 'Показать телефон', 'item.write': 'Написать сообщение',
    'item.fav': 'В избранное', 'item.faved': 'В избранном',
    'item.edit': 'Редактировать', 'item.bump': 'Поднять в топ', 'item.delete': 'Удалить объявление',
    'item.similar': 'Похожие объявления', 'item.inCity': 'Все объявления:',
    'item.mapNote': 'точное место уточняйте у продавца',
    'item.noPhotoSeller': 'Продавец не добавил фото',
    'item.404.t': 'Объявление не найдено', 'item.404.p': 'Возможно, оно было удалено или продано.', 'item.404.btn': 'На главную',
    'seller.since': 'на BAZAR с', 'seller.sinceEnd': 'г.',
    'safety.t': 'Безопасная сделка:', 'safety.p': 'не отправляйте предоплату незнакомым продавцам, проверяйте товар при встрече в людном месте.',
    'price.negotiable': 'Договорная', 'som': 'сом',
    'verdict.good': '🔥 Отличная цена', 'verdict.goodHint': 'ниже средней по рынку', 'verdict.fair': '✓ В рынке',
    'verdict.avg': 'средняя цена —', 'verdict.high': '↑ Выше рынка',
    'time.now': 'только что', 'time.today': 'сегодня', 'time.yesterday': 'вчера', 'time.ago': 'назад',
    'nophoto': 'Без фото', 'photo.word': 'фото',
    'tag.urgent': 'Срочно', 'tag.new': 'Новое', 'tag.delivery': 'Доставка',
    'favs.title': 'Избранное',
    'favs.empty.t': 'В избранном пусто', 'favs.empty.p': 'Нажимайте на сердечко в объявлениях, чтобы сохранить их здесь.', 'favs.empty.btn': 'Смотреть объявления',
    'form.edit': 'Редактировать объявление', 'form.new': 'Подать объявление',
    'form.cat': 'Категория *', 'form.chooseCat': 'Выберите категорию', 'form.sub': 'Подкатегория *',
    'form.title': 'Заголовок *', 'form.titlePh': 'Например: iPhone 14 Pro 256GB, идеальное состояние',
    'form.titleHint': 'Минимум 5 символов. Хороший заголовок = больше просмотров.',
    'form.desc': 'Описание *', 'form.descPh': 'Состояние, комплектация, причина продажи…',
    'form.price': 'Цена, сом *', 'form.city': 'Город *', 'form.chooseCity': 'Выберите город',
    'form.cond': 'Состояние', 'form.condNone': 'Не указано', 'form.phone': 'Телефон *',
    'form.photos': 'Фотографии', 'form.photosHint': '(до 5, это макет — выберите заглушки)',
    'form.delivery': 'Возможна доставка', 'form.save': 'Сохранить изменения', 'form.publish': 'Опубликовать объявление',
    'err.cat': 'Выберите категорию', 'err.title': 'Заголовок — минимум 5 символов', 'err.desc': 'Описание — минимум 10 символов',
    'err.price': 'Укажите цену или отметьте «Договорная»', 'err.city': 'Выберите город', 'err.phone': 'Укажите корректный номер телефона',
    'toast.maxPhotos': 'Максимум 5 фото', 'toast.checkFields': 'Проверьте выделенные поля',
    'toast.saved': 'Изменения сохранены ✓', 'toast.published': 'Объявление опубликовано 🎉',
    'toast.favAdd': 'Добавлено в избранное ❤️', 'toast.favDel': 'Удалено из избранного',
    'toast.bumped': 'Объявление поднято в топ ⬆️', 'toast.deleted': 'Объявление удалено',
    'chats.title': 'Сообщения',
    'chats.empty.t': 'Пока нет диалогов', 'chats.empty.p': 'Напишите продавцу со страницы объявления — переписка появится здесь.',
    'chats.pick': 'Выберите диалог слева', 'chats.start.t': 'Начните диалог', 'chats.start.p': 'Продавец онлайн и ответит быстро',
    'chats.msgPh': 'Сообщение…',
    'chats.q1': 'Здравствуйте! Ещё актуально?', 'chats.q1s': 'Ещё актуально?',
    'chats.q2': 'Торг уместен?', 'chats.q2s': 'Торг уместен?',
    'chats.q3': 'Где можно посмотреть?', 'chats.q3s': 'Где посмотреть?',
    'profile.my': 'Мои объявления', 'profile.bump': 'Поднять', 'profile.inFavs': 'в избранном', 'profile.new': 'нов.',
    'profile.city': 'г. Бишкек',
    'profile.empty.t': 'У вас пока нет объявлений', 'profile.empty.p': 'Подайте первое объявление — это бесплатно и занимает пару минут.',
    'profile.settings': 'Настройки', 'profile.lang': 'Язык', 'profile.theme': 'Тема',
    'theme.light': 'Светлая', 'theme.dark': 'Тёмная', 'theme.system': 'Системная',
    'phone.modal': 'Телефон продавца', 'phone.call': 'Позвонить', 'phone.chat': 'Написать в чат',
    'del.t': 'Удалить объявление?', 'del.p': 'будет удалено без возможности восстановления.',
    'del.cancel': 'Отмена', 'del.ok': 'Удалить',
    'sug.cat': 'категория', 'sug.ai': '✨ Спросить Айку:',
    'lang.modal': 'Язык интерфейса',
    'ai.name': 'Айка · ИИ-помощница', 'ai.sub': 'демо · отвечает мгновенно', 'ai.ph': 'Опишите, что ищете…',
    'ai.greeting': 'Салам! Я Айка, ИИ-помощница BAZAR ✨\nНапишите, что ищете — пойму цену, город и состояние: «макбук до 100к б/у», «что подарить маме до 5000».',
    'ai.found': 'Нашла', 'ai.best': 'Вот лучшие варианты:', 'ai.showAll': 'Показать все', 'ai.inSearch': 'в поиске',
    'ai.onlyNew': 'Только новые', 'ai.cheaper': 'Подешевле', 'ai.allKg': 'По всему КР', 'ai.withDeliv': 'С доставкой',
    'ai.nothing': 'Хм, по такому запросу ничего не нашла 😕 Попробуйте иначе — например: «iPhone до 50 000», «диван недорого» или «снять квартиру».',
    'ai.priceFrom': 'Сейчас на BAZAR', 'ai.priceRange': 'от {min} до {max} {som}, всего {n}. Вот варианты:',
    'ai.q.new': 'новые', 'ai.q.used': 'б/у', 'ai.q.deliv': 'с доставкой',
    'ai.quick': ['iPhone до 60 000', 'Снять квартиру в Бишкеке', 'Авто до 1 млн', 'Что подарить ребёнку?'],
    'ai.a.phones': '📱 Телефоны', 'ai.a.cars': '🚗 Авто до 1 млн', 'ai.a.rent': '🏠 Аренда квартир',
    'ai.staleItems': 'эти объявления уже неактуальны',
    'ai.relaxCity': 'В городе «{city}» пусто, зато по всему Кыргызстану есть',
    'ai.relaxPrice': 'В бюджет не уложилась, но чуть дороже (до {max} {som}) есть варианты',
    'ai.relaxCond': 'В нужном состоянии пусто, показываю все',
    'ai.refined': 'Уточнила', 'ai.noFilters': 'без фильтров',
    'ai.refineEmpty': 'С таким уточнением ничего не осталось 😕 Вернула прежнюю подборку — попробуйте другой фильтр.',
    'a11y.remove': 'Убрать', 'a11y.back': 'Назад', 'a11y.send': 'Отправить',
    'view.grid': 'Плитка', 'view.list': 'Список',
    'ai.hi': 'Салам! 👋 Что ищем сегодня? Могу подобрать по описанию, цене и городу.',
    'ai.hi.phoneChip': '📱 iPhone до 60к', 'ai.hi.giftChip': '🎁 Подарок ребёнку',
    'ai.thanks': 'Обращайтесь! 😊 Если что-то ещё нужно — я тут.',
    'ai.help': 'Я Айка, ИИ-помощница BAZAR. Умею:\n• находить товары по живому описанию — с ценой, городом и состоянием\n• подбирать подарки под бюджет\n• подсказывать, как продать быстрее\nПросто напишите, что нужно 🙌',
    'ai.help.exampleChip': 'Пример: айфон до 60к',
    'ai.howPost': 'Это просто: нажмите «Подать объявление», выберите категорию, добавьте фото, цену и описание — публикация занимает пару минут и она бесплатная.',
    'ai.chip.sellFaster': 'Как продать быстрее?', 'ai.chip.popular': '🔥 Популярное сейчас', 'ai.chip.phones': '📱 Телефоны',
    'ai.sellTips': 'Чтобы продать быстрее:\n1️⃣ Добавьте 3–5 чётких фото при дневном свете\n2️⃣ В заголовок — модель и главное преимущество\n3️⃣ Поставьте цену чуть ниже похожих объявлений в вашей категории\n4️⃣ Отвечайте в чате быстро — первые сутки решают\n5️⃣ Поднимайте объявление в топ раз в пару дней',
    'ai.sellIntent': 'Хотите продать? Помогу 🙌 Разместите объявление — это бесплатно и занимает пару минут. Совет: 3–5 фото при дневном свете и честный заголовок с моделью ускоряют продажу в разы.',
    'ai.browse': 'Вот свежие объявления за сегодня 👇 А если скажете, что именно нужно — подберу точнее: «iPhone до 60к», «диван недорого», «авто до 1 млн».',
    'ai.who.kid': 'ребёнку', 'ai.who.her': 'ей', 'ai.who.him': 'ему',
    'ai.gift.title': 'Вот идеи подарка {who} до {budget} {som} 🎁',
    'ai.gift.none': 'С бюджетом до {budget} {som} идей не нашла — попробуйте поднять бюджет 🙈',
    'ai.gift.more': 'Ещё идеи', 'ai.gift.upTo50k': 'До 50 000',
    'ai.showPrev': 'Показать прежние',
  },
  en: {
    'nav.home': 'Home', 'nav.favs': 'Favorites', 'nav.post': 'Post', 'nav.chats': 'Chats', 'nav.profile': 'Profile',
    'search.ph': 'Search listings…', 'search.go': 'Search', 'search.prefix': 'Search',
    'city.all': 'All Kyrgyzstan', 'city.modal': 'Your city',
    'post.btn': 'Post an ad', 'post.btnShort': '+ Post an ad',
    'home.cats': 'Categories', 'home.vip': 'VIP listings', 'home.fresh': 'Fresh listings',
    'home.viewed': 'Recently viewed', 'home.seeAll': 'See all', 'home.allBtn': 'Browse all listings',
    'ai.banner.title': 'Aika — AI assistant', 'ai.banner.sub': 'Describe what you need: “macbook under 100k” — I’ll find it in a second', 'ai.banner.btn': 'Ask',
    'results.all': 'All listings',
    'filters.title': 'Filters', 'filters.reset': 'Reset', 'filters.category': 'Category', 'filters.sub': 'Subcategory',
    'filters.allCats': 'All categories', 'filters.allSubs': 'All subcategories', 'filters.price': 'Price, KGS',
    'filters.from': 'from', 'filters.to': 'to', 'filters.city': 'City', 'filters.condition': 'Condition',
    'cond.any': 'Any', 'cond.new': 'New', 'cond.used': 'Used',
    'filters.seller': 'Seller', 'seller.all': 'All', 'seller.private': 'Private', 'seller.business': 'Business',
    'filters.posted': 'Date posted', 'period.all': 'All time', 'period.day': '24 hours', 'period.week': 'Week', 'period.month': 'Month',
    'filters.withPhoto': 'With photo only', 'filters.delivery': 'With delivery', 'filters.show': 'Show',
    'chip.price': 'Price', 'chip.withPhoto': 'With photo', 'chip.day': 'Last 24h', 'chip.week': 'Last week', 'chip.month': 'Last month',
    'sort.new': 'Newest first', 'sort.cheap': 'Cheapest', 'sort.exp': 'Most expensive', 'sort.popular': 'Popular',
    'more.show': 'Show more', 'more.of': 'of',
    'empty.search.t': 'Nothing found', 'empty.search.p': 'Try changing the filters or searching differently.',
    'empty.reset': 'Reset filters',
    'item.specs': 'Details', 'item.desc': 'Description', 'item.location': 'Location',
    'item.cat': 'Category', 'item.section': 'Section', 'item.cond': 'Condition', 'item.city': 'City',
    'item.delivery': 'Delivery', 'item.views': 'Views', 'item.posted': 'Posted', 'item.num': 'Ad number',
    'item.yes': 'Yes', 'item.no': 'No',
    'item.showPhone': 'Show phone', 'item.write': 'Send message',
    'item.fav': 'Add to favorites', 'item.faved': 'In favorites',
    'item.edit': 'Edit', 'item.bump': 'Bump to top', 'item.delete': 'Delete listing',
    'item.similar': 'Similar listings', 'item.inCity': 'All listings in',
    'item.mapNote': 'ask the seller for the exact location',
    'item.noPhotoSeller': 'The seller added no photos',
    'item.404.t': 'Listing not found', 'item.404.p': 'It may have been deleted or sold.', 'item.404.btn': 'Go home',
    'seller.since': 'on BAZAR since', 'seller.sinceEnd': '',
    'safety.t': 'Safe deal:', 'safety.p': 'never prepay strangers; inspect the item in a public place.',
    'price.negotiable': 'Negotiable', 'som': 'KGS',
    'verdict.good': '🔥 Great price', 'verdict.goodHint': 'below market average', 'verdict.fair': '✓ Fair price',
    'verdict.avg': 'average —', 'verdict.high': '↑ Above market',
    'time.now': 'just now', 'time.today': 'today', 'time.yesterday': 'yesterday', 'time.ago': 'ago',
    'nophoto': 'No photo', 'photo.word': 'photos',
    'tag.urgent': 'Urgent', 'tag.new': 'New', 'tag.delivery': 'Delivery',
    'favs.title': 'Favorites',
    'favs.empty.t': 'No favorites yet', 'favs.empty.p': 'Tap the heart on any listing to save it here.', 'favs.empty.btn': 'Browse listings',
    'form.edit': 'Edit listing', 'form.new': 'Post an ad',
    'form.cat': 'Category *', 'form.chooseCat': 'Choose a category', 'form.sub': 'Subcategory *',
    'form.title': 'Title *', 'form.titlePh': 'E.g.: iPhone 14 Pro 256GB, mint condition',
    'form.titleHint': 'At least 5 characters. A good title gets more views.',
    'form.desc': 'Description *', 'form.descPh': 'Condition, what’s included, reason for selling…',
    'form.price': 'Price, KGS *', 'form.city': 'City *', 'form.chooseCity': 'Choose a city',
    'form.cond': 'Condition', 'form.condNone': 'Not specified', 'form.phone': 'Phone *',
    'form.photos': 'Photos', 'form.photosHint': '(up to 5 — mockup placeholders)',
    'form.delivery': 'Delivery available', 'form.save': 'Save changes', 'form.publish': 'Publish listing',
    'err.cat': 'Choose a category', 'err.title': 'Title — at least 5 characters', 'err.desc': 'Description — at least 10 characters',
    'err.price': 'Set a price or mark “Negotiable”', 'err.city': 'Choose a city', 'err.phone': 'Enter a valid phone number',
    'toast.maxPhotos': 'Max 5 photos', 'toast.checkFields': 'Check the highlighted fields',
    'toast.saved': 'Changes saved ✓', 'toast.published': 'Listing published 🎉',
    'toast.favAdd': 'Added to favorites ❤️', 'toast.favDel': 'Removed from favorites',
    'toast.bumped': 'Bumped to top ⬆️', 'toast.deleted': 'Listing deleted',
    'chats.title': 'Messages',
    'chats.empty.t': 'No chats yet', 'chats.empty.p': 'Message a seller from a listing page — the chat will appear here.',
    'chats.pick': 'Pick a chat on the left', 'chats.start.t': 'Start the chat', 'chats.start.p': 'The seller is online and replies fast',
    'chats.msgPh': 'Message…',
    'chats.q1': 'Hi! Is it still available?', 'chats.q1s': 'Still available?',
    'chats.q2': 'Is the price negotiable?', 'chats.q2s': 'Negotiable?',
    'chats.q3': 'Where can I see it?', 'chats.q3s': 'Where to see it?',
    'profile.my': 'My listings', 'profile.bump': 'Bump', 'profile.inFavs': 'favorites', 'profile.new': 'new',
    'profile.city': 'Bishkek',
    'profile.empty.t': 'No listings yet', 'profile.empty.p': 'Post your first ad — it’s free and takes a couple of minutes.',
    'profile.settings': 'Settings', 'profile.lang': 'Language', 'profile.theme': 'Theme',
    'theme.light': 'Light', 'theme.dark': 'Dark', 'theme.system': 'System',
    'phone.modal': 'Seller’s phone', 'phone.call': 'Call', 'phone.chat': 'Write in chat',
    'del.t': 'Delete the listing?', 'del.p': 'will be deleted permanently.',
    'del.cancel': 'Cancel', 'del.ok': 'Delete',
    'sug.cat': 'category', 'sug.ai': '✨ Ask Aika:',
    'lang.modal': 'Interface language',
    'ai.name': 'Aika · AI assistant', 'ai.sub': 'demo · replies instantly', 'ai.ph': 'Describe what you need…',
    'ai.greeting': 'Hi! I’m Aika, BAZAR’s AI assistant ✨\nTell me what you’re after — I get price, city and condition: “macbook under 100k used”, “a gift for mom under 5000”.',
    'ai.found': 'Found', 'ai.best': 'Here are the best matches:', 'ai.showAll': 'Show all', 'ai.inSearch': 'in search',
    'ai.onlyNew': 'New only', 'ai.cheaper': 'Cheaper', 'ai.allKg': 'All Kyrgyzstan', 'ai.withDeliv': 'With delivery',
    'ai.nothing': 'Hmm, nothing matched 😕 Try another wording — e.g. “iPhone under 50000”, “cheap sofa” or “rent an apartment”.',
    'ai.priceFrom': 'On BAZAR right now', 'ai.priceRange': 'from {min} to {max} {som}, {n} total. Here they are:',
    'ai.q.new': 'new', 'ai.q.used': 'used', 'ai.q.deliv': 'with delivery',
    'ai.quick': ['iPhone under 60 000', 'Rent a flat in Bishkek', 'Car under 1M', 'A gift for a kid?'],
    'ai.a.phones': '📱 Phones', 'ai.a.cars': '🚗 Cars under 1M', 'ai.a.rent': '🏠 Flats for rent',
    'ai.staleItems': 'these listings are no longer available',
    'ai.relaxCity': 'Nothing in “{city}”, but there are results across Kyrgyzstan',
    'ai.relaxPrice': 'Over budget, but slightly higher (up to {max} {som}) there are options',
    'ai.relaxCond': 'Nothing in that condition, showing all',
    'ai.refined': 'Refined', 'ai.noFilters': 'no filters',
    'ai.refineEmpty': 'Nothing left with that filter 😕 Restored the previous set — try another one.',
    'a11y.remove': 'Remove', 'a11y.back': 'Back', 'a11y.send': 'Send',
    'view.grid': 'Grid', 'view.list': 'List',
    'ai.hi': 'Hi! 👋 What are we looking for today? I can match by description, price and city.',
    'ai.hi.phoneChip': '📱 iPhone under 60k', 'ai.hi.giftChip': '🎁 Gift for a kid',
    'ai.thanks': 'Anytime! 😊 If you need anything else, I’m here.',
    'ai.help': 'I’m Aika, BAZAR’s AI assistant. I can:\n• find items from a plain description — with price, city and condition\n• pick gifts within a budget\n• advise how to sell faster\nJust tell me what you need 🙌',
    'ai.help.exampleChip': 'Example: iphone under 60k',
    'ai.howPost': 'It’s easy: tap “Post an ad”, pick a category, add photos, price and a description — it takes a couple of minutes and it’s free.',
    'ai.chip.sellFaster': 'How to sell faster?', 'ai.chip.popular': '🔥 Popular now', 'ai.chip.phones': '📱 Phones',
    'ai.sellTips': 'To sell faster:\n1️⃣ Add 3–5 clear photos in daylight\n2️⃣ Put the model and the key benefit in the title\n3️⃣ Price slightly below similar listings in your category\n4️⃣ Reply fast in chat — the first day matters most\n5️⃣ Bump the listing to the top every couple of days',
    'ai.sellIntent': 'Want to sell? I’ll help 🙌 Post a listing — it’s free and takes a couple of minutes. Tip: 3–5 daylight photos and an honest title with the model speed up the sale a lot.',
    'ai.browse': 'Here are today’s fresh listings 👇 And if you tell me exactly what you need, I’ll narrow it down: “iPhone under 60k”, “cheap sofa”, “car under 1M”.',
    'ai.who.kid': 'for a kid', 'ai.who.her': 'for her', 'ai.who.him': 'for him',
    'ai.gift.title': 'Here are gift ideas {who} under {budget} {som} 🎁',
    'ai.gift.none': 'No ideas under {budget} {som} — try raising the budget 🙈',
    'ai.gift.more': 'More ideas', 'ai.gift.upTo50k': 'Up to 50 000',
    'ai.showPrev': 'Show previous',
  },
  ky: {
    'nav.home': 'Башкы', 'nav.favs': 'Тандалма', 'nav.post': 'Берүү', 'nav.chats': 'Чаттар', 'nav.profile': 'Профиль',
    'search.ph': 'Жарыялардан издөө…', 'search.go': 'Издөө', 'search.prefix': 'Издөө',
    'city.all': 'Бүт Кыргызстан', 'city.modal': 'Шаарыңыз',
    'post.btn': 'Жарыя берүү', 'post.btnShort': '+ Жарыя берүү',
    'home.cats': 'Категориялар', 'home.vip': 'VIP жарыялар', 'home.fresh': 'Жаңы жарыялар',
    'home.viewed': 'Жакында көргөнүңүз', 'home.seeAll': 'Баарын көрүү', 'home.allBtn': 'Бардык жарыяларды көрүү',
    'ai.banner.title': 'Айка — AI жардамчы', 'ai.banner.sub': 'Эмне издеп жатканыңызды жазыңыз: «макбук 100к чейин» — заматта табам', 'ai.banner.btn': 'Суроо',
    'results.all': 'Бардык жарыялар',
    'filters.title': 'Фильтрлер', 'filters.reset': 'Тазалоо', 'filters.category': 'Категория', 'filters.sub': 'Кичи категория',
    'filters.allCats': 'Бардык категориялар', 'filters.allSubs': 'Бардык кичи категориялар', 'filters.price': 'Баасы, сом',
    'filters.from': 'баштап', 'filters.to': 'чейин', 'filters.city': 'Шаар', 'filters.condition': 'Абалы',
    'cond.any': 'Баары', 'cond.new': 'Жаңы', 'cond.used': 'Колдонулган',
    'filters.seller': 'Сатуучу', 'seller.all': 'Баары', 'seller.private': 'Жеке', 'seller.business': 'Бизнес',
    'filters.posted': 'Жарыяланган күнү', 'period.all': 'Бардык убакыт', 'period.day': '24 саат', 'period.week': 'Апта', 'period.month': 'Ай',
    'filters.withPhoto': 'Сүрөтү барлар', 'filters.delivery': 'Жеткирүү менен', 'filters.show': 'Көрсөтүү',
    'chip.price': 'Баасы', 'chip.withPhoto': 'Сүрөт менен', 'chip.day': 'Акыркы 24 саат', 'chip.week': 'Акыркы апта', 'chip.month': 'Акыркы ай',
    'sort.new': 'Адегенде жаңылар', 'sort.cheap': 'Арзаныраак', 'sort.exp': 'Кымбатыраак', 'sort.popular': 'Популярдуу',
    'more.show': 'Дагы көрсөтүү', 'more.of': '/',
    'empty.search.t': 'Эч нерсе табылган жок', 'empty.search.p': 'Фильтрлерди өзгөртүп же башкача издеп көрүңүз.',
    'empty.reset': 'Фильтрлерди тазалоо',
    'item.specs': 'Мүнөздөмөлөр', 'item.desc': 'Сүрөттөмө', 'item.location': 'Жайгашкан жери',
    'item.cat': 'Категория', 'item.section': 'Бөлүм', 'item.cond': 'Абалы', 'item.city': 'Шаар',
    'item.delivery': 'Жеткирүү', 'item.views': 'Көрүүлөр', 'item.posted': 'Жарыяланган', 'item.num': 'Жарыя номери',
    'item.yes': 'Бар', 'item.no': 'Жок',
    'item.showPhone': 'Телефонду көрсөтүү', 'item.write': 'Кабар жазуу',
    'item.fav': 'Тандалмага', 'item.faved': 'Тандалмада',
    'item.edit': 'Оңдоо', 'item.bump': 'Топко көтөрүү', 'item.delete': 'Жарыяны өчүрүү',
    'item.similar': 'Окшош жарыялар', 'item.inCity': 'Бардык жарыялар:',
    'item.mapNote': 'так жайгашкан жерин сатуучудан тактаңыз',
    'item.noPhotoSeller': 'Сатуучу сүрөт кошкон эмес',
    'item.404.t': 'Жарыя табылган жок', 'item.404.p': 'Балким, ал өчүрүлгөн же сатылган.', 'item.404.btn': 'Башкы бетке',
    'seller.since': 'BAZAR’да', 'seller.sinceEnd': '-жылдан',
    'safety.t': 'Коопсуз бүтүм:', 'safety.p': 'бейтааныш сатуучуларга алдын ала төлөбөңүз, товарды эл көп жерде текшериңиз.',
    'price.negotiable': 'Келишим баада', 'som': 'сом',
    'verdict.good': '🔥 Мыкты баа', 'verdict.goodHint': 'базар орточосунан төмөн', 'verdict.fair': '✓ Орточо баа',
    'verdict.avg': 'орточо баа —', 'verdict.high': '↑ Орточодон жогору',
    'time.now': 'азыр эле', 'time.today': 'бүгүн', 'time.yesterday': 'кечээ', 'time.ago': 'мурун',
    'nophoto': 'Сүрөт жок', 'photo.word': 'сүрөт',
    'tag.urgent': 'Шашылыш', 'tag.new': 'Жаңы', 'tag.delivery': 'Жеткирүү',
    'favs.title': 'Тандалма',
    'favs.empty.t': 'Тандалма бош', 'favs.empty.p': 'Жарыядагы жүрөкчөнү басып, аларды бул жерге сактаңыз.', 'favs.empty.btn': 'Жарыяларды көрүү',
    'form.edit': 'Жарыяны оңдоо', 'form.new': 'Жарыя берүү',
    'form.cat': 'Категория *', 'form.chooseCat': 'Категорияны тандаңыз', 'form.sub': 'Кичи категория *',
    'form.title': 'Аталышы *', 'form.titlePh': 'Мисалы: iPhone 14 Pro 256GB, абалы эң жакшы',
    'form.titleHint': 'Кеминде 5 белги. Жакшы аталыш = көбүрөөк көрүү.',
    'form.desc': 'Сүрөттөмө *', 'form.descPh': 'Абалы, комплектациясы, сатуу себеби…',
    'form.price': 'Баасы, сом *', 'form.city': 'Шаар *', 'form.chooseCity': 'Шаарды тандаңыз',
    'form.cond': 'Абалы', 'form.condNone': 'Көрсөтүлгөн эмес', 'form.phone': 'Телефон *',
    'form.photos': 'Сүрөттөр', 'form.photosHint': '(5ке чейин, бул макет — заглушка тандаңыз)',
    'form.delivery': 'Жеткирүү мүмкүн', 'form.save': 'Өзгөртүүлөрдү сактоо', 'form.publish': 'Жарыяны жарыялоо',
    'err.cat': 'Категорияны тандаңыз', 'err.title': 'Аталышы — кеминде 5 белги', 'err.desc': 'Сүрөттөмө — кеминде 10 белги',
    'err.price': 'Бааны көрсөтүңүз же «Келишим баада» белгилеңиз', 'err.city': 'Шаарды тандаңыз', 'err.phone': 'Туура телефон номерин жазыңыз',
    'toast.maxPhotos': 'Эң көп 5 сүрөт', 'toast.checkFields': 'Белгиленген талааларды текшериңиз',
    'toast.saved': 'Өзгөртүүлөр сакталды ✓', 'toast.published': 'Жарыя жарыяланды 🎉',
    'toast.favAdd': 'Тандалмага кошулду ❤️', 'toast.favDel': 'Тандалмадан өчүрүлдү',
    'toast.bumped': 'Жарыя топко көтөрүлдү ⬆️', 'toast.deleted': 'Жарыя өчүрүлдү',
    'chats.title': 'Кабарлар',
    'chats.empty.t': 'Азырынча чат жок', 'chats.empty.p': 'Жарыя барагынан сатуучуга жазыңыз — чат бул жерде пайда болот.',
    'chats.pick': 'Сол жактан чатты тандаңыз', 'chats.start.t': 'Чатты баштаңыз', 'chats.start.p': 'Сатуучу онлайн, тез жооп берет',
    'chats.msgPh': 'Кабар…',
    'chats.q1': 'Саламатсызбы! Дагы актуалдуубу?', 'chats.q1s': 'Актуалдуубу?',
    'chats.q2': 'Соодалашса болобу?', 'chats.q2s': 'Соодалашуу?',
    'chats.q3': 'Кайдан көрсө болот?', 'chats.q3s': 'Кайдан көрөм?',
    'profile.my': 'Менин жарыяларым', 'profile.bump': 'Көтөрүү', 'profile.inFavs': 'тандалмада', 'profile.new': 'жаңы',
    'profile.city': 'Бишкек ш.',
    'profile.empty.t': 'Азырынча жарыяңыз жок', 'profile.empty.p': 'Биринчи жарыяңызды бериңиз — акысыз жана 2 мүнөт убакыт алат.',
    'profile.settings': 'Жөндөөлөр', 'profile.lang': 'Тил', 'profile.theme': 'Тема',
    'theme.light': 'Жарык', 'theme.dark': 'Караңгы', 'theme.system': 'Системалык',
    'phone.modal': 'Сатуучунун телефону', 'phone.call': 'Чалуу', 'phone.chat': 'Чатка жазуу',
    'del.t': 'Жарыяны өчүрөсүзбү?', 'del.p': 'биротоло өчүрүлөт.',
    'del.cancel': 'Жокко чыгаруу', 'del.ok': 'Өчүрүү',
    'sug.cat': 'категория', 'sug.ai': '✨ Айкадан суроо:',
    'lang.modal': 'Интерфейс тили',
    'ai.name': 'Айка · AI жардамчы', 'ai.sub': 'демо · заматта жооп берет', 'ai.ph': 'Эмне издеп жатканыңызды жазыңыз…',
    'ai.greeting': 'Салам! Мен Айка, BAZAR’дын AI жардамчысымын ✨\nЭмне издеп жатканыңызды жазыңыз — баасын, шаарын жана абалын түшүнөм: «макбук 100к чейин колдонулган», «апама 5000ге чейин белек».',
    'ai.found': 'Табылды', 'ai.best': 'Мыкты варианттар:', 'ai.showAll': 'Баарын көрсөтүү', 'ai.inSearch': 'издөөдө',
    'ai.onlyNew': 'Жаңылар гана', 'ai.cheaper': 'Арзаныраак', 'ai.allKg': 'Бүт КР боюнча', 'ai.withDeliv': 'Жеткирүү менен',
    'ai.nothing': 'Хм, мындай суроо боюнча эч нерсе табылган жок 😕 Башкача жазып көрүңүз — мисалы: «iPhone 50000ге чейин», «арзан диван» же «батир ижарага».',
    'ai.priceFrom': 'Азыр BAZAR’да', 'ai.priceRange': '{min} баштап {max} {som} чейин, баары {n}. Мына:',
    'ai.q.new': 'жаңы', 'ai.q.used': 'колдонулган', 'ai.q.deliv': 'жеткирүү менен',
    'ai.quick': ['iPhone 60 000ге чейин', 'Бишкектен батир ижарага', 'Унаа 1 млнга чейин', 'Балага эмне белек кылса болот?'],
    'ai.a.phones': '📱 Телефондор', 'ai.a.cars': '🚗 Унаа 1 млнга чейин', 'ai.a.rent': '🏠 Батир ижарага',
    'ai.staleItems': 'бул жарыялар эскирген',
    'ai.relaxCity': '«{city}» шаарында жок, бирок бүт Кыргызстан боюнча бар',
    'ai.relaxPrice': 'Бюджетке батпады, бирок бир аз кымбатыраак ({max} {som} чейин) варианттар бар',
    'ai.relaxCond': 'Керектүү абалда жок, баарын көрсөтөм',
    'ai.refined': 'Тактадым', 'ai.noFilters': 'фильтрсиз',
    'ai.refineEmpty': 'Мындай тактоо менен эч нерсе калган жок 😕 Мурунку тандоону кайтардым — башка фильтр аракет кылыңыз.',
    'a11y.remove': 'Алып салуу', 'a11y.back': 'Артка', 'a11y.send': 'Жөнөтүү',
    'view.grid': 'Тор', 'view.list': 'Тизме',
    'ai.hi': 'Салам! 👋 Бүгүн эмне издейбиз? Сүрөттөмө, баа жана шаар боюнча тандай алам.',
    'ai.hi.phoneChip': '📱 iPhone 60кге чейин', 'ai.hi.giftChip': '🎁 Балага белек',
    'ai.thanks': 'Кайрылыңыз! 😊 Дагы бир нерсе керек болсо — мен ушул жердемин.',
    'ai.help': 'Мен Айка, BAZAR’дын AI жардамчысымын. Мен:\n• жөнөкөй сүрөттөмө боюнча товар табам — баасы, шаары жана абалы менен\n• бюджетке жараша белек тандайм\n• кантип тезирээк сатууну айтам\nЭмне керек экенин жазыңыз 🙌',
    'ai.help.exampleChip': 'Мисал: iphone 60кге чейин',
    'ai.howPost': 'Оңой: «Жарыя берүү» басыңыз, категория тандаңыз, сүрөт, баа жана сүрөттөмө кошуңуз — бир нече мүнөт алат, акысыз.',
    'ai.chip.sellFaster': 'Кантип тезирээк сатам?', 'ai.chip.popular': '🔥 Азыр популярдуу', 'ai.chip.phones': '📱 Телефондор',
    'ai.sellTips': 'Тезирээк сатуу үчүн:\n1️⃣ Күндүз 3–5 так сүрөт кошуңуз\n2️⃣ Аталышка моделди жана негизги артыкчылыкты жазыңыз\n3️⃣ Бааны окшош жарыялардан бир аз төмөн коюңуз\n4️⃣ Чатта тез жооп бериңиз — биринчи күн чечүүчү\n5️⃣ Жарыяны бир нече күндө бир жолу топко көтөрүңүз',
    'ai.sellIntent': 'Саткыңыз келеби? Жардам берем 🙌 Жарыя бериңиз — акысыз жана бир нече мүнөт алат. Кеңеш: күндүз 3–5 сүрөт жана модели бар чынчыл аталыш сатууну бир топ тездетет.',
    'ai.browse': 'Мына бүгүнкү жаңы жарыялар 👇 Эмне керек экенин так айтсаңыз, тагыраак тандайм: «iPhone 60кге чейин», «арзан диван», «унаа 1 млнга чейин».',
    'ai.who.kid': 'балага', 'ai.who.her': 'ага', 'ai.who.him': 'ага',
    'ai.gift.title': 'Мына {who} {budget} {som} чейин белек идеялары 🎁',
    'ai.gift.none': '{budget} {som} чейин идея табылган жок — бюджетти көтөрүп көрүңүз 🙈',
    'ai.gift.more': 'Дагы идеялар', 'ai.gift.upTo50k': '50 000ге чейин',
    'ai.showPrev': 'Мурункусун көрсөтүү',
  },
};

/* названия категорий (контент объявлений остаётся на русском) */
const CAT_I18N = {
  electronics: { en: 'Electronics', ky: 'Электроника' },
  transport: { en: 'Transport', ky: 'Унаа' },
  realty: { en: 'Real estate', ky: 'Кыймылсыз мүлк' },
  fashion: { en: 'Clothing & style', ky: 'Кийим жана стиль' },
  home: { en: 'Home & garden', ky: 'Үй жана бакча' },
  services: { en: 'Services', ky: 'Кызматтар' },
  jobs: { en: 'Jobs', ky: 'Жумуш' },
  animals: { en: 'Animals', ky: 'Жаныбарлар' },
  kids: { en: 'For kids', ky: 'Балдарга' },
  hobby: { en: 'Hobby & sport', ky: 'Хобби жана спорт' },
};

/* перевод названий подкатегорий (ключ — русское каноническое значение из data.js,
   которое остаётся значением фильтра; переводится только ОТОБРАЖЕНИЕ) */
const SUB_I18N = {
  'Телефоны': { en: 'Phones', ky: 'Телефондор' },
  'Ноутбуки': { en: 'Laptops', ky: 'Ноутбуктар' },
  'ТВ и аудио': { en: 'TV & audio', ky: 'ТВ жана аудио' },
  'Фото и видео': { en: 'Photo & video', ky: 'Фото жана видео' },
  'Планшеты': { en: 'Tablets', ky: 'Планшеттер' },
  'Бытовая техника': { en: 'Appliances', ky: 'Турмуш-тиричилик техникасы' },
  'Легковые авто': { en: 'Cars', ky: 'Жеңил унаа' },
  'Мото': { en: 'Motorcycles', ky: 'Мото' },
  'Грузовой транспорт': { en: 'Trucks', ky: 'Жүк ташуучу унаа' },
  'Запчасти и аксессуары': { en: 'Parts & accessories', ky: 'Запчасттар жана аксессуарлар' },
  'Продажа квартир': { en: 'Apartments for sale', ky: 'Батир сатуу' },
  'Аренда квартир': { en: 'Apartments for rent', ky: 'Батир ижара' },
  'Дома и участки': { en: 'Houses & land', ky: 'Үйлөр жана жер' },
  'Коммерческая': { en: 'Commercial', ky: 'Коммерциялык' },
  'Мужская одежда': { en: 'Men’s clothing', ky: 'Эркектер кийими' },
  'Женская одежда': { en: 'Women’s clothing', ky: 'Аялдар кийими' },
  'Обувь': { en: 'Footwear', ky: 'Бут кийим' },
  'Аксессуары': { en: 'Accessories', ky: 'Аксессуарлар' },
  'Мебель': { en: 'Furniture', ky: 'Эмерек' },
  'Ремонт и стройка': { en: 'Repair & construction', ky: 'Оңдоо жана курулуш' },
  'Посуда и кухня': { en: 'Kitchenware', ky: 'Идиш жана ашкана' },
  'Растения': { en: 'Plants', ky: 'Өсүмдүктөр' },
  'Ремонт техники': { en: 'Appliance repair', ky: 'Техника оңдоо' },
  'Строительство': { en: 'Construction', ky: 'Курулуш' },
  'Красота и здоровье': { en: 'Beauty & health', ky: 'Сулуулук жана ден соолук' },
  'Обучение': { en: 'Tutoring', ky: 'Окутуу' },
  'Перевозки': { en: 'Moving & delivery', ky: 'Ташуу' },
  'Клининг': { en: 'Cleaning', ky: 'Тазалоо' },
  'Вакансии': { en: 'Vacancies', ky: 'Вакансиялар' },
  'Ищу работу': { en: 'Looking for a job', ky: 'Жумуш издейм' },
  'Собаки': { en: 'Dogs', ky: 'Иттер' },
  'Кошки': { en: 'Cats', ky: 'Мышыктар' },
  'Птицы и рыбки': { en: 'Birds & fish', ky: 'Куштар жана балыктар' },
  'Товары для животных': { en: 'Pet supplies', ky: 'Жаныбарларга товарлар' },
  'Игрушки': { en: 'Toys', ky: 'Оюнчуктар' },
  'Коляски и кресла': { en: 'Strollers & seats', ky: 'Коляскалар жана отургучтар' },
  'Детская одежда': { en: 'Kids’ clothing', ky: 'Балдар кийими' },
  'Велосипеды': { en: 'Bicycles', ky: 'Велосипеддер' },
  'Тренажёры': { en: 'Gym equipment', ky: 'Тренажёрлор' },
  'Музыка': { en: 'Music', ky: 'Музыка' },
  'Туризм и отдых': { en: 'Travel & outdoors', ky: 'Туризм жана эс алуу' },
};

function subName(sub) {
  if (!sub || LANG === 'ru') return sub || '';
  return (SUB_I18N[sub] && SUB_I18N[sub][LANG]) || sub;
}

const LANG_NAMES = { ru: 'Русский', en: 'English', ky: 'Кыргызча' };
const LANG_ORDER = ['ru', 'en', 'ky'];

let LANG = lsLoad('bazar_lang', 'ru');
if (!I18N[LANG]) LANG = 'ru';

function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) ?? I18N.ru[key] ?? key;
}

/* «5 объявлений» с учётом языка */
function listingsWord(n) {
  if (LANG === 'en') return n === 1 ? 'listing' : 'listings';
  if (LANG === 'ky') return 'жарыя';
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'объявление';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'объявления';
  return 'объявлений';
}

function daysAgoLabel(d) {
  if (LANG === 'en') return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  if (LANG === 'ky') return `${d} күн мурун`;
  const m10 = d % 10, m100 = d % 100;
  const w = (m10 === 1 && m100 !== 11) ? 'день' : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? 'дня' : 'дней';
  return `${d} ${w} назад`;
}

function dialogsWord(n) {
  if (LANG === 'en') return n === 1 ? 'chat' : 'chats';
  if (LANG === 'ky') return 'чат';
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'диалог';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'диалога';
  return 'диалогов';
}

function setLang(lang) {
  if (!I18N[lang]) return;
  LANG = lang;
  lsSave('bazar_lang', lang);
  document.documentElement.lang = lang === 'ky' ? 'ky' : lang;
  applyStaticChrome();
}

/* статический хром (шапка, нижняя навигация, панель ИИ) — вне роутера */
function applyStaticChrome() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  const langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.textContent = LANG.toUpperCase();
}

/* ---------------- темы ---------------- */

let THEME = lsLoad('bazar_theme', 'system'); // 'light' | 'dark' | 'system'
const darkMQ = matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  const dark = THEME === 'dark' || (THEME === 'system' && darkMQ.matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = dark ? '#1a1f26' : '#ffffff';
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.textContent = THEME === 'light' ? '☀️' : THEME === 'dark' ? '🌙' : '🌗';
}

function setTheme(mode) {
  THEME = mode;
  lsSave('bazar_theme', mode);
  applyTheme();
}

darkMQ.addEventListener('change', () => { if (THEME === 'system') applyTheme(); });
applyTheme(); // мгновенно, до отрисовки страницы (скрипт в конце body, но до рендера app.js)
