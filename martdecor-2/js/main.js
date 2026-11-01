/* МАРТдекор — шапка и подвал, блоки страниц, подборка, запись на подбор, просмотр фото. */
(function () {
  "use strict";
  var NB = " ";
  var PAGE = document.body.getAttribute("data-page");
  var PER = 24;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function tx(s) { return esc(window.typo ? typo(s) : s); }
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  function src(name, small) { return "img/vk/" + (small ? "s/" : "") + name + ".jpg"; }
  function pic(name, alt, small, eager) {
    return name ? '<img src="' + src(name, small) + '" alt="' + esc(alt || "") + '"' + (eager ? "" : ' loading="lazy"') + ' decoding="async">' : "";
  }
  function fill(sel, html) { var el = typeof sel === "string" ? $(sel) : sel; if (el) el.innerHTML = html; return el; }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i]; return null; }
  var PRODS = window.PRODUCTS || [];
  var POSTS_ = window.POSTS || [];
  function allCats() { return CATS.concat(window.EXTRA_CATS || []); }
  function cat(id) { return byId(allCats(), id); }
  function prod(id) { return byId(PRODS, id); }
  function post(id) { return byId(POSTS_, id); }
  function date(iso) {
    var m = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    var d = iso.split("-"); return +d[2] + NB + m[+d[1] - 1] + " " + d[0];
  }
  function wa(text) { return "https://wa.me/" + SALON.wa + "?text=" + encodeURIComponent(text); }
  function priceHTML(p) {
    if (!p.price) return '<span class="muted" style="font:500 15px var(--sans)">Цена по запросу</span>';
    return "от " + money(p.price) + NB + "₽" + (p.unit ? "<small>" + esc(p.unit) + "</small>" : "");
  }
  function priceText(p) { return p.price ? "от " + money(p.price) + " ₽" + (p.unit ? " " + p.unit : "") : "цена по запросу"; }
  function plural(n, a, b, c) { var m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; }
  var ARROW = '<span class="arrow" aria-hidden="true"></span>';
  var CIRC = '<span class="circ" aria-hidden="true">' + ARROW + "</span>";

  /* ——— подборка (вместо корзины): хранится в браузере ——— */
  var PICK_KEY = "md-pick", QTY_KEY = "md-qty";
  function store(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function pickGet() { return store(PICK_KEY, []).filter(function (k) { return !!pickItem(k); }); }
  function pickSet(a) { save(PICK_KEY, a); syncPick(); }
  function qtyGet(k) { return store(QTY_KEY, {})[k] || 1; }
  function qtySet(k, n) { var q = store(QTY_KEY, {}); q[k] = Math.max(1, Math.min(999, n)); save(QTY_KEY, q); renderDrawer(); }
  function pickHas(k) { return pickGet().indexOf(k) >= 0; }
  function pickToggle(k) {
    var a = pickGet(), i = a.indexOf(k);
    if (i >= 0) { a.splice(i, 1); toast("Убрали из подборки"); } else { a.push(k); toast("Добавили в подборку"); }
    pickSet(a);
  }
  function pickItem(k) {
    var kind = k.slice(0, 1), id = k.slice(2);
    if (kind === "p") { var p = prod(id); return p && { name: p.name, sub: p.brand, price: priceText(p), img: p.ph[0], href: "product.html?id=" + p.id }; }
    var q = post(id); return q && { name: q.t, sub: "Коллекция в салоне", price: "цену уточнит менеджер", img: q.ph[0], href: "idea.html?id=" + q.id };
  }
  function pickLabel(b, on) {
    var long = b.getAttribute("data-label") === "add";
    return '<i class="ti ti-bookmark' + (on ? "-filled" : "") + '"></i>' + (on ? "В подборке" : long ? "Добавить в подборку" : "В подборку");
  }
  function syncPick() {
    var n = pickGet().length;
    $$(".pick-ico .count").forEach(function (c) { c.textContent = n || ""; });
    $$("[data-pick]").forEach(function (b) {
      var on = pickHas(b.getAttribute("data-pick"));
      b.classList.toggle("on", on);
      if (b.classList.contains("heart")) { b.innerHTML = '<i class="ti ti-heart' + (on ? "-filled" : "") + '"></i>'; b.setAttribute("aria-label", on ? "Убрать из подборки" : "В подборку"); }
      else if (b.hasAttribute("data-label")) b.innerHTML = pickLabel(b, on);
    });
    if ($(".drawer.show")) renderDrawer();
  }
  function renderDrawer() {
    var a = pickGet();
    fill(".drawer h3 .n", a.length || "0");
    fill(".drawer-list", a.length ? a.map(function (k) {
      var it = pickItem(k);
      return '<div class="pick"><a href="' + it.href + '">' + pic(it.img, it.name, true) + '</a><div><b><a href="' + it.href + '">' + tx(it.name) + "</a></b><span>" + tx(it.sub) + "</span></div>" +
        '<span class="qty"><button data-q="' + k + '" data-d="-1" aria-label="Меньше">−</button><output>' + qtyGet(k) + '</output><button data-q="' + k + '" data-d="1" aria-label="Больше">+</button></span>' +
        '<button class="rm" data-unpick="' + k + '" aria-label="Убрать"><i class="ti ti-x"></i></button></div>';
    }).join("") : '<p class="empty">Пока пусто. Нажмите ♡ на&nbsp;карточке товара или&nbsp;коллекции&nbsp;— и&nbsp;соберите всё для&nbsp;стен в&nbsp;одном списке.</p>');
    var send = $(".drawer [data-send]");
    if (send) {
      var lines = a.map(function (k, i) { var it = pickItem(k); return (i + 1) + ". " + it.name + " — " + qtyGet(k) + " шт., " + it.price; });
      send.href = wa("Здравствуйте! Собрал(а) подборку на сайте, посчитайте, пожалуйста, количество и наличие:\n" + lines.join("\n"));
      send.style.display = a.length ? "" : "none";
    }
  }

  /* ——— шапка и подвал ——— */
  var ARCH = '<svg class="logo-mark" viewBox="0 0 30 34" aria-hidden="true"><path d="M3 33 V15 A12 12 0 0 1 27 15 V33"/></svg>';
  function logo() {
    return '<a class="logo" href="index.html" aria-label="МАРТдекор — на главную">' + ARCH +
      '<span class="logo-text"><span class="logo-word">МАРТ<span>декор</span></span><span class="logo-sub">Интерьерный салон</span></span></a>';
  }
  function chrome() {
    function on(rx) { return rx.test(PAGE) ? ' class="on"' : ""; }
    fill(".top", '<div class="wrap"><div class="top-bar">' + logo() +
      '<nav class="nav" aria-label="Меню">' +
        '<div><a href="catalog.html"' + on(/catalog|category|product/) + '>Каталог<i class="ti ti-chevron-down"></i></a><div class="drop">' +
          allCats().map(function (c) { return '<a href="category.html?c=' + c.id + '">' + c.name + "</a>"; }).join("") + '<a href="catalog.html"><b>Весь каталог</b></a></div></div>' +
        '<div><a href="services.html"' + on(/services/) + ">Услуги</a></div>" +
        '<div><a href="projects.html"' + on(/project/) + ">Проекты</a></div>" +
        '<div><a href="about.html"' + on(/about/) + ">О&nbsp;салоне</a></div>" +
        '<div><a href="designers.html"' + on(/designers/) + ">Дизайнерам</a></div>" +
        '<div><a href="contacts.html"' + on(/contacts/) + ">Контакты</a></div>" +
      "</nav>" +
      '<div class="top-icons">' +
        '<a class="ico srch" href="catalog.html#search" aria-label="Поиск по каталогу"><i class="ti ti-search"></i></a>' +
        '<button class="ico pick-ico" data-drawer aria-label="Подборка"><i class="ti ti-shopping-bag"></i><span class="count"></span></button>' +
        '<a class="ico wa" href="https://wa.me/' + SALON.wa + '" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="ti ti-brand-whatsapp"></i></a>' +
        '<button class="ico burger" aria-label="Меню"><i class="ti ti-menu-2"></i></button>' +
      "</div></div></div>");
    var burger = $(".burger");
    burger.addEventListener("click", function () {
      var open = $(".nav").classList.toggle("open");
      burger.innerHTML = '<i class="ti ti-' + (open ? "x" : "menu-2") + '"></i>';
    });
    var top = $(".top");
    window.addEventListener("scroll", function () { top.classList.toggle("scrolled", window.scrollY > 10); }, { passive: true });

    fill(".foot", '<div class="foot-grid">' +
        "<div>" + logo() + '<p style="margin-top:22px;max-width:260px;font-size:14px;opacity:.8">Материалы для&nbsp;стен с&nbsp;подбором и&nbsp;расчётом. Ростов-на-Дону, с&nbsp;2018 года.</p></div>' +
        '<div class="foot-col"><div><i class="ti ti-map-pin"></i><span>' + tx(SALON.address) + ",<br>" + tx(SALON.place) + '</span></div><div><i class="ti ti-clock"></i><span>Пн–пт 10:00–19:00<br>Сб–вс 10:00–17:00</span></div></div>' +
        '<div class="foot-col"><div><i class="ti ti-phone"></i><a class="foot-tel" href="tel:' + SALON.tel + '">' + SALON.phone + "</a></div>" +
          '<div class="msgs"><a href="https://wa.me/' + SALON.wa + '" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i>WhatsApp</a><a href="' + SALON.tg + '" target="_blank" rel="noopener"><i class="ti ti-brand-telegram"></i>Telegram</a><a href="' + SALON.vk + '" target="_blank" rel="noopener"><i class="ti ti-brand-vk"></i>ВКонтакте</a></div>' +
          '<div><i class="ti ti-message-circle"></i><span>Также пишите в&nbsp;MAX по&nbsp;номеру ' + SALON.phone + "</span></div></div>" +
        '<nav class="foot-nav" aria-label="Разделы"><a href="catalog.html">Каталог</a><a href="services.html">Услуги</a><a href="projects.html">Проекты</a><a href="ideas.html">Идеи для&nbsp;стен</a><a href="about.html">О&nbsp;салоне</a><a href="designers.html">Дизайнерам</a><a href="contacts.html">Контакты</a></nav>' +
      "</div>" +
      '<div class="foot-bottom"><span>© МАРТдекор, 2018–2026</span><span>Сайт&nbsp;— Арина</span></div>');

    document.body.insertAdjacentHTML("beforeend",
      '<div class="veil"></div>' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="book-h"><button class="x" data-close aria-label="Закрыть"><i class="ti ti-x"></i></button>' +
        '<h3 id="book-h">Записаться на&nbsp;подбор</h3><p class="sub">Оставьте контакты&nbsp;— мы свяжемся с&nbsp;вами, уточним задачу и&nbsp;подберём удобное время.</p>' +
        '<form id="book-form" novalidate>' +
          '<label class="field"><i class="ti ti-user"></i><input name="name" placeholder="Ваше имя" autocomplete="name" required></label>' +
          '<label class="field"><i class="ti ti-phone"></i><input name="phone" type="tel" placeholder="+7 (___) ___-__-__" autocomplete="tel" inputmode="tel" required></label>' +
          '<label class="field"><i class="ti ti-calendar"></i><input name="when" placeholder="Удобная дата и время"></label>' +
          '<label class="field"><i class="ti ti-adjustments"></i><select name="fmt" aria-label="Формат подбора"><option value="salon">Подбор в салоне</option><option value="photo">Подбор по фото комнаты</option><option value="obekt">Выезд с образцами на объект</option></select></label>' +
          '<button class="btn btn-main" type="submit">Отправить заявку' + ARROW + "</button>" +
        "</form>" +
        '<p class="hint">Заявка откроется в&nbsp;WhatsApp с&nbsp;уже написанным текстом&nbsp;— останется нажать «Отправить». Или позвоните: <a href="tel:' + SALON.tel + '">' + SALON.phone + "</a>.</p></div>" +
      '<aside class="drawer" aria-label="Подборка"><button class="x" data-close aria-label="Закрыть"><i class="ti ti-x"></i></button><h3>Подборка <span class="n">0</span></h3>' +
        '<p class="sub">На&nbsp;сайте ничего не&nbsp;оплачивают. Менеджер проверит наличие, посчитает количество и&nbsp;пришлёт счёт.</p>' +
        '<div class="drawer-list"></div><div class="drawer-foot"><a class="btn btn-main" data-send target="_blank" rel="noopener">Отправить менеджеру' + ARROW + '</a><a class="btn btn-line" href="catalog.html">Смотреть материалы</a></div></aside>' +
      '<div class="lb" role="dialog" aria-modal="true" aria-label="Просмотр фото"><button class="x" data-close aria-label="Закрыть"><i class="ti ti-x"></i></button><button class="lb-nav lb-prev" aria-label="Предыдущее"><i class="ti ti-chevron-left"></i></button><img alt=""><button class="lb-nav lb-next" aria-label="Следующее"><i class="ti ti-chevron-right"></i></button><div class="lb-count"></div></div>' +
      '<div class="toast" role="status"></div>');

    $("#book-form").addEventListener("submit", function (e) {
      e.preventDefault();
      // form.name — это имя самой формы, поэтому поля берём через elements.namedItem
      var f = e.target.elements, el = function (n) { return f.namedItem(n); };
      var name = el("name").value.trim(), phone = el("phone").value.trim(), when = el("when").value.trim(), fs = el("fmt");
      if (!name) { el("name").focus(); toast("Напишите, как к вам обращаться"); return; }
      if (phone.replace(/\D/g, "").length < 10) { el("phone").focus(); toast("Проверьте номер телефона"); return; }
      var fmt = fs.options[fs.selectedIndex].text;
      var msg = "Здравствуйте! Хочу записаться: " + fmt.toLowerCase() + ".\nИмя: " + name + "\nТелефон: " + phone + (when ? "\nУдобное время: " + when : "");
      window.open(wa(msg), "_blank", "noopener");
      closeAll(); toast("Открыли WhatsApp — осталось отправить сообщение");
    });
  }

  /* ——— окна ——— */
  function openBook(fmt) {
    var s = $('.modal select[name="fmt"]'); if (s && fmt) s.value = fmt;
    $(".modal").classList.add("show"); $(".veil").classList.add("show");
    setTimeout(function () { var i = $('.modal input[name="name"]'); if (i) i.focus(); }, 250);
  }
  function openDrawer() { renderDrawer(); $(".drawer").classList.add("show"); $(".veil").classList.add("show"); }
  function closeAll() { $$(".modal, .drawer, .veil").forEach(function (e) { e.classList.remove("show"); }); $(".lb").classList.remove("show"); document.body.style.overflow = ""; }
  var LB = { list: [], i: 0 };
  function openLb(list, i) { LB.list = list; LB.i = i || 0; showLb(); $(".lb").classList.add("show"); document.body.style.overflow = "hidden"; }
  function showLb() { $(".lb img").src = src(LB.list[LB.i]); $(".lb-count").textContent = LB.list.length > 1 ? (LB.i + 1) + " / " + LB.list.length : ""; $$(".lb-nav").forEach(function (b) { b.style.display = LB.list.length > 1 ? "" : "none"; }); }
  function stepLb(d) { LB.i = (LB.i + d + LB.list.length) % LB.list.length; showLb(); }
  var toastT;
  function toast(s) { var t = $(".toast"); t.textContent = s; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2200); }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-book]"); if (b) { e.preventDefault(); openBook(b.getAttribute("data-book")); return; }
    if (e.target.closest("[data-drawer]")) { openDrawer(); return; }
    if (e.target.closest("[data-close]") || e.target.classList.contains("veil") || e.target.classList.contains("lb")) { closeAll(); return; }
    var p = e.target.closest("[data-pick]"); if (p) { e.preventDefault(); pickToggle(p.getAttribute("data-pick")); return; }
    var u = e.target.closest("[data-unpick]"); if (u) { var a = pickGet(); a.splice(a.indexOf(u.getAttribute("data-unpick")), 1); pickSet(a); return; }
    var q = e.target.closest("[data-q]"); if (q) { var k = q.getAttribute("data-q"); qtySet(k, qtyGet(k) + +q.getAttribute("data-d")); return; }
    var z = e.target.closest("[data-zoom]"); if (z) { var g = z.closest("[data-gal]"); openLb(g.getAttribute("data-gal").split(","), +z.getAttribute("data-zoom")); return; }
    if (e.target.closest(".lb-prev")) { stepLb(-1); return; }
    if (e.target.closest(".lb-next")) { stepLb(1); return; }
    var fq = e.target.closest(".faq-item button"); if (fq) { var it = fq.parentNode; it.classList.toggle("open"); fq.setAttribute("aria-expanded", it.classList.contains("open")); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll();
    if ($(".lb.show")) { if (e.key === "ArrowLeft") stepLb(-1); if (e.key === "ArrowRight") stepLb(1); }
  });

  /* ——— карточки ——— */
  function dirs(list) {
    return list.map(function (c) {
      return '<a class="dir" href="category.html?c=' + c.id + '"><div class="dir-ph">' + pic(c.tile, c.name, true) + '</div><div class="dir-cap"><span>' + c.name + "</span>" + CIRC + "</div></a>";
    }).join("");
  }
  function catCards(list) {
    return list.map(function (c) {
      return '<a class="cat-card' + (c.id === "mebel" ? " wide" : "") + '" href="category.html?c=' + c.id + '"><div class="ph">' + pic(c.tile, c.name, true) + '</div><div class="cap"><div><b>' + c.name + "</b><span>" + tx(c.short || c.lead) + "</span></div>" + CIRC + "</div></a>";
    }).join("");
  }
  function good(p, full) {
    var k = "p:" + p.id, href = "product.html?id=" + p.id;
    var media = p.ph[0] ? '<a class="good-ph" href="' + href + '">' + pic(p.ph[0], p.name, true) + "</a>"
      : '<a class="good-ph ph-empty" href="' + href + '" aria-label="' + esc(p.name) + '"><span>МАРТ<small>декор</small></span></a>';
    return '<article class="good"><div class="good-media">' + media +
      '<button class="heart" data-pick="' + k + '" aria-label="В подборку"><i class="ti ti-heart"></i></button></div>' +
      (full ? '<span class="brand">' + tx(p.brand) + "</span>" : "") +
      '<h3 class="name"><a href="' + href + '">' + tx(p.name) + "</a></h3>" +
      (full ? '<div class="price">' + priceHTML(p) + '</div><p class="note">Наличие уточнит менеджер</p><button class="btn btn-line btn-xs" data-pick="' + k + '" data-label><i class="ti ti-bookmark"></i>В подборку</button>'
            : '<span class="brand">' + tx(p.brand) + "</span>") + "</article>";
  }
  function collection(q) {
    var href = "idea.html?id=" + q.id;
    return '<article class="good"><div class="good-media"><a class="good-ph" href="' + href + '">' + pic(q.ph[0], q.t, true) + "</a>" +
      '<button class="heart" data-pick="c:' + q.id + '" aria-label="В подборку"><i class="ti ti-heart"></i></button></div>' +
      '<h3 class="name"><a href="' + href + '">' + tx(q.t) + '</a></h3><span class="brand">Коллекция в&nbsp;салоне · ' + date(q.d) + "</span></article>";
  }
  function excerpt(q, n) {
    var s = q.x.filter(function (b) { return typeof b === "string"; }).join(" ");
    if (s.length > n) s = s.slice(0, n).replace(/\s+\S*$/, "") + "…";
    return s;
  }
  var TAGNAME = { lepnina: "Лепной декор", paneli: "Стеновые панели", shpon: "Каменный шпон", freski: "Фрески и панно", kraski: "Краски и штукатурки", oboi: "Обои" };
  function art(q) {
    var tag = q.kind === "project" ? "Проект" : q.kind === "event" ? "Событие" : (TAGNAME[q.tags[0]] || "Идеи");
    return '<a class="art" href="idea.html?id=' + q.id + '">' + (q.ph[0] ? '<div class="art-ph">' + pic(q.ph[0], q.t, true) : '<div class="art-ph ph-empty"><span>МАРТ<small>декор</small></span>') + '</div><span class="tag">' + tag + " · " + date(q.d) + "</span><h3>" + tx(q.t) + "</h3><p>" + tx(excerpt(q, 120)) + "</p></a>";
  }
  function projCard(pr) {
    return '<a class="proj" href="project.html?id=' + pr.id + '"><div class="proj-ph">' + pic(pr.cover, pr.title, true) + '</div><div class="proj-cap"><div><b>' + tx(pr.title) + "</b><span>" + tx(pr.who) + "</span></div>" + CIRC + "</div></a>";
  }
  function svcCards(toPage) {
    return SERVICES.map(function (s) {
      var attr = toPage ? 'href="services.html"' : s.href ? 'href="' + s.href + '"' : 'href="#" data-book="' + s.book + '"';
      return '<a class="svc" ' + attr + '><i class="ti ' + s.icon + '"></i><b>' + tx(s.title) + "</b><p>" + tx(s.text) + "</p>" + CIRC + "</a>";
    }).join("");
  }
  function faq(list) {
    return '<div class="faq-list">' + list.map(function (f, i) {
      return '<div class="faq-item"><button aria-expanded="false" aria-controls="fa' + i + '">' + tx(f[0]) + '<span class="pm" aria-hidden="true"></span></button><div class="faq-a" id="fa' + i + '"><div><p>' + tx(f[1]) + "</p></div></div></div>";
    }).join("") + "</div>";
  }
  function gal(list, cls) {
    return '<div class="' + cls + '" data-gal="' + list.join(",") + '">' + list.map(function (n, i) { return '<button data-zoom="' + i + '" aria-label="Открыть фото">' + pic(n, "", true) + "</button>"; }).join("") + "</div>";
  }
  function revs(n) {
    var r0 = REVIEWS[0];
    return '<div class="rev-big"><q>' + tx(r0.text) + '</q><p class="rev-who"><b>' + tx(r0.name) + "</b> <span>· " + r0.date + "</span></p></div>" +
      '<div class="rev-list">' + REVIEWS.slice(1, n).map(function (r) { return '<div class="rev"><p>«' + tx(r.text) + '»</p><p class="rev-who"><b>' + tx(r.name) + "</b> <span>· " + r.date + "</span></p></div>"; }).join("") + "</div>";
  }

  /* часы и «открыто сейчас» — по времени Ростова (Москва) */
  function nowRostov() {
    try {
      var s = new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow", hour12: false, weekday: "short", hour: "numeric", minute: "numeric" });
      var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[s.slice(0, 3)];
      var hm = s.match(/(\d+):(\d+)/); return { d: wd, h: (+hm[1] % 24) + hm[2] / 60 };
    } catch (e) { var d = new Date(); return { d: d.getDay(), h: d.getHours() + d.getMinutes() / 60 }; }
  }
  function hoursTable() {
    var names = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"], now = nowRostov();
    return [1, 2, 3, 4, 5, 6, 0].map(function (d) { var h = SALON.hours[d]; return "<tr" + (d === now.d ? ' class="today"' : "") + "><td>" + names[d] + "</td><td>" + h[0] + ":00–" + h[1] + ":00</td></tr>"; }).join("");
  }
  function openNow() {
    var n = nowRostov(), h = SALON.hours[n.d], open = n.h >= h[0] && n.h < h[1];
    return '<span class="open-now' + (open ? "" : " closed") + '"><i></i>' + (open ? "Сейчас открыто до " + h[1] + ":00" : "Сейчас закрыто") + "</span>";
  }

  // короткие строки КАПСОМ в постах — это подзаголовки: показываем их обычным регистром
  function capsHead(s) {
    var L = s.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
    return s.length < 70 && L.length > 3 && L.replace(/[^A-ZА-ЯЁ]/g, "").length / L.length > .7;
  }
  function block(b) {
    if (typeof b === "string" && capsHead(b)) { var h = b.toLowerCase(); return '<h3 class="h3" style="font-size:22px;margin:28px 0 12px">' + tx(h[0].toUpperCase() + h.slice(1)) + "</h3>"; }
    return typeof b === "string" ? "<p>" + tx(b) + "</p>" : '<ul style="margin:0 0 16px 20px;list-style:disc">' + b.map(function (li) { return "<li>" + tx(li) + "</li>"; }).join("") + "</ul>";
  }

  /* ——— страницы ——— */
  var pages = {};
  pages.home = function () {
    fill("#dirs", dirs(CATS));
    fill("#goods", (window.FEATURED || []).map(prod).filter(Boolean).map(function (p) { return good(p, true); }).join(""));
    fill("#svc", svcCards(true));
    fill("#projects", PROJECTS.slice(0, 3).map(projCard).join(""));
    fill("#revs", revs(3));
    fill("#arts", (window.HOME_IDEAS || []).map(post).filter(Boolean).map(art).join(""));
    fill("#faq", faq(FAQ));
  };
  pages.services = function () { fill("#svc", svcCards(false)); };
  pages.about = function () {
    fill("#people", TEAM.map(function (m) {
      return '<figure class="person" style="margin:0"><div class="person-ph"><span class="ini">' + m.name[0] + '</span><span class="cap">Фото: ' + m.name + "</span></div><b>" + m.name + "</b><span>" + m.role + "</span><p>" + tx(m.text) + "</p></figure>";
    }).join(""));
    fill("#revs", revs(4));
    fill("#stories", STORIES.map(function (s) { return '<div class="story"><h4>' + tx(s.title) + "</h4><p>" + tx(s.text) + "</p><q>" + tx(s.quote) + '</q><span class="small muted">' + tx(s.who) + "</span></div>"; }).join(""));
  };
  pages.designers = function () {
    var p = $("#partner"); if (p) p.href = wa("Здравствуйте! Я дизайнер (архитектор, мастер) и хочу сотрудничать с салоном.");
    fill("#events", POSTS_.filter(function (q) { return q.kind === "event"; }).slice(0, 8).map(function (q) {
      return '<li><span class="d">' + date(q.d).replace(/\s\d{4}$/, "") + "<br>" + q.d.slice(0, 4) + '</span><a href="idea.html?id=' + q.id + '">' + tx(q.t) + "</a></li>";
    }).join(""));
  };
  pages.contacts = function () {
    fill("#open", openNow());
    fill("#hours", hoursTable());
    fill("#faq", faq(FAQ));
  };
  pages.styleguide = function () {
    fill("#sg-good", (window.FEATURED || []).slice(0, 2).map(prod).filter(Boolean).map(function (p) { return good(p, true); }).join(""));
  };
  pages.catalog = function () {
    fill("#cats", catCards(allCats()));
    fill("#also", "<b>А&nbsp;ещё в&nbsp;салоне:</b>" + ALSO.map(function (a) { return '<span class="chip">' + tx(a) + "</span>"; }).join(""));
    var inp = $("#search input"), box = $("#results");
    if (location.hash === "#search") setTimeout(function () { inp.focus(); }, 300);
    inp.addEventListener("input", function () {
      var q = inp.value.trim().toLowerCase();
      if (q.length < 2) { box.hidden = true; return; }
      var words = q.split(/\s+/);
      var found = PRODS.filter(function (p) { var s = (p.name + " " + p.brand + " " + p.sub).toLowerCase(); return words.every(function (w) { return s.indexOf(w) >= 0; }); });
      box.hidden = false;
      fill("#r-count", found.length ? "Найдено: " + found.length + " " + plural(found.length, "товар", "товара", "товаров") + (found.length > 24 ? " — показаны первые 24" : "") : "Ничего не&nbsp;нашли. Попробуйте другое слово или&nbsp;напишите нам&nbsp;— подберём.");
      fill("#r-grid", found.slice(0, 24).map(function (p) { return good(p, false); }).join(""));
      syncPick();
    });
  };
  pages.category = function () {
    var c = cat(param("c")) || CATS[0];
    document.title = c.name + " — МАРТдекор, Ростов-на-Дону";
    fill("#crumb", c.name);
    fill("#cat-h", c.name); fill("#cat-lead", tx(c.lead));
    fill("#cat-ph", pic(c.hero, c.name, false, true));
    var items = PRODS.filter(function (p) { return p.cat === c.id; });
    var cols = POSTS_.filter(function (q) { return q.kind !== "event" && q.tags.indexOf(c.id) >= 0 && q.ph.length; });
    var chips = [];
    if (items.length) {
      items.forEach(function (p) { if (chips.indexOf(p.sub) < 0) chips.push(p.sub); });
      chips = chips.map(function (s) { return { name: s, test: function (p) { return p.sub === s; } }; });
    } else {
      chips = (c.chips || []).map(function (ch) { var rx = new RegExp(ch[1], "i"); return { name: ch[0], test: function (q) { return rx.test(q.t + " " + q.x.join(" ")); } }; })
        .filter(function (ch) { return cols.some(ch.test); });
    }
    var list = items.length ? items : cols, card = items.length ? function (p) { return good(p, false); } : collection;
    var cur = -1, shown = PER;
    function draw() {
      var arr = cur < 0 ? list : list.filter(chips[cur].test);
      fill("#chips", '<button class="chip' + (cur < 0 ? " on" : "") + '" data-chip="-1">Все</button>' + chips.map(function (ch, i) { return '<button class="chip' + (cur === i ? " on" : "") + '" data-chip="' + i + '">' + tx(ch.name) + "</button>"; }).join(""));
      fill("#count", items.length ? arr.length + " " + plural(arr.length, "товар", "товара", "товаров") + ". Цены&nbsp;— «от», наличие и&nbsp;сроки уточнит менеджер."
        : "Коллекции и&nbsp;новинки салона. Цену, наличие и&nbsp;сроки уточнит менеджер.");
      fill("#grid", arr.slice(0, shown).map(card).join("") || '<p class="empty">Здесь пока пусто</p>');
      fill("#more", arr.length > shown ? '<button class="btn btn-line">Показать ещё ' + Math.min(PER, arr.length - shown) + "</button>" : "");
      syncPick();
    }
    document.addEventListener("click", function (e) {
      var ch = e.target.closest("[data-chip]"); if (ch) { cur = +ch.getAttribute("data-chip"); shown = PER; draw(); }
      if (e.target.closest("#more button")) { shown += PER; draw(); }
    });
    draw();
    if (items.length && cols.length) {
      $("#ideas-box").hidden = false;
      fill("#ideas", cols.slice(0, 4).map(art).join(""));
      fill("#ideas-more", '<a class="link-more" href="ideas.html?c=' + c.id + '">Все идеи раздела' + ARROW + "</a>");
    }
  };
  pages.product = function () {
    var p = prod(param("id")) || PRODS[0]; if (!p) return;
    var c = cat(p.cat);
    document.title = p.name + " — МАРТдекор";
    fill("#crumbs", '<a href="index.html">Главная</a><span><a href="catalog.html">Каталог</a></span><span><a href="category.html?c=' + c.id + '">' + c.name + "</a></span><span>" + tx(p.name) + "</span>");
    var ph = p.ph;
    fill("#gallery", '<div class="gal-main" data-gal="' + ph.join(",") + '"><span data-zoom="0">' + pic(ph[0], p.name, false, true) + "</span></div>" +
      (ph.length > 1 ? '<div class="gal-thumbs">' + ph.map(function (n, i) { return '<button' + (i ? "" : ' class="on"') + ' data-thumb="' + i + '" aria-label="Фото ' + (i + 1) + '">' + pic(n, "", true) + "</button>"; }).join("") + "</div>" : ""));
    $("#gallery").addEventListener("click", function (e) {
      var b = e.target.closest("[data-thumb]"); if (!b) return;
      var i = +b.getAttribute("data-thumb"); $(".gal-main img").src = src(ph[i]); $(".gal-main [data-zoom]").setAttribute("data-zoom", i);
      $$(".gal-thumbs button").forEach(function (x) { x.classList.toggle("on", x === b); });
    });
    var first = p.desc.filter(function (d) { return typeof d === "string" && d.length >= 40; })[0] || "";
    if (first.length > 220) first = first.slice(0, 220).replace(/\s+\S*$/, "") + "…";
    var specs = (p.brand !== p.sub ? [["Бренд", p.brand]] : []).concat(p.specs);
    fill("#info", '<span class="tagchip">' + tx(p.sub) + "</span><h1>" + tx(p.name) + "</h1>" + (first ? '<p class="item-short">' + tx(first) + "</p>" : "") +
      '<div class="item-price">' + priceHTML(p) + (p.old ? ' <s class="muted" style="font-size:20px">' + money(p.old) + NB + "₽</s>" : "") + "</div>" +
      '<p class="item-note"><i class="ti ti-circle-check"></i>Наличие и&nbsp;сроки уточнит менеджер</p>' +
      '<table class="specs">' + specs.map(function (s) { return "<tr><td>" + tx(s[0]) + "</td><td>" + tx(s[1]) + "</td></tr>"; }).join("") + "</table>" +
      '<div class="item-actions"><button class="btn btn-main" data-pick="p:' + p.id + '" data-label="add"></button>' +
      '<button class="btn btn-line" data-book="salon">Записаться на&nbsp;подбор' + ARROW + "</button>" +
      '<a class="link-more" style="justify-self:start;margin-top:6px" target="_blank" rel="noopener" href="' + wa("Здравствуйте! Хочу посмотреть образец: " + p.name + " — " + location.href) + '">Хочу образец' + ARROW + "</a></div>");
    if (p.desc.length) { $("#desc-box").hidden = false; fill("#desc", p.desc.map(block).join("")); }
    calc(p);
    var rel = PRODS.filter(function (x) { return x.sub === p.sub && x.id !== p.id; }).slice(0, 4);
    if (rel.length < 4) rel = rel.concat(PRODS.filter(function (x) { return x.cat === p.cat && x.sub !== p.sub; }).slice(0, 4 - rel.length));
    fill("#related", rel.map(function (x) { return good(x, false); }).join(""));
  };
  function calc(p) {
    var box = $("#calc"); if (!box) return;
    var head = "<h3>Сколько понадобится</h3>";
    if (!p.calc || !p.price) {
      fill(box, head + '<p class="muted small">Для&nbsp;этой позиции количество считает менеджер: пришлите размеры стены или&nbsp;проект.</p><div class="row"><a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="' + wa("Здравствуйте! Посчитайте, пожалуйста, сколько нужно: " + p.name) + '"><i class="ti ti-brand-whatsapp"></i>Попросить расчёт</a></div>');
      return;
    }
    var k = p.calc, m2 = k.per === "m2";
    var hint = m2 ? "Цена указана за м²." : "Одна панель — " + String(k.area).replace(".", ",") + "&nbsp;м² (по&nbsp;размерам из&nbsp;карточки).";
    fill(box, head + '<p class="muted small">' + hint + " Точный расчёт с&nbsp;учётом раскладки, углов и&nbsp;проёмов сделает менеджер.</p>" +
      '<div class="row"><label>Площадь стены, м²<input type="number" inputmode="decimal" min="0" step="0.1" value="10" id="c-a"></label><label>Запас, %<input type="number" inputmode="numeric" min="0" max="50" step="1" value="10" id="c-r"></label></div><p class="res" id="c-res"></p>');
    function upd() {
      var a = parseFloat(String($("#c-a").value).replace(",", ".")) || 0, r = (parseFloat($("#c-r").value) || 0) / 100;
      if (!a) { fill("#c-res", "Введите площадь стены"); return; }
      if (m2) { var s = Math.ceil(a * (1 + r) * 10) / 10; fill("#c-res", "<b>" + String(s).replace(".", ",") + "&nbsp;м²</b> &nbsp;≈&nbsp;" + money(s * p.price) + "&nbsp;₽ по&nbsp;цене «от»"); return; }
      var n = Math.ceil(a * (1 + r) / k.area - 1e-9);
      fill("#c-res", "<b>" + n + "&nbsp;шт.</b> &nbsp;≈&nbsp;" + money(n * p.price) + "&nbsp;₽, если цена указана за&nbsp;штуку");
    }
    box.addEventListener("input", upd); upd();
  }
  pages.projects = function () {
    var types = [["", "Все проекты"], ["home", "Жилые интерьеры"], ["com", "Коммерческие"]], cur = "";
    function drawP() {
      fill("#pchips", types.map(function (t) { return '<button class="chip' + (t[0] === cur ? " on" : "") + '" data-t="' + t[0] + '">' + t[1] + "</button>"; }).join(""));
      fill("#projects", PROJECTS.filter(function (p) { return !cur || p.type === cur; }).map(projCard).join(""));
    }
    var shown = 40, G = window.GALLERY || [];
    function drawG() {
      fill("#gallery", gal(G.slice(0, shown), "masonry"));
      fill("#more", G.length > shown ? '<button class="btn btn-line">Показать ещё</button>' : "");
    }
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-t]"); if (t) { cur = t.getAttribute("data-t"); drawP(); }
      if (e.target.closest("#more button")) { shown += 40; drawG(); }
    });
    drawP(); drawG();
    fill("#g-count", G.length + " " + plural(G.length, "фотография", "фотографии", "фотографий"));
  };
  pages.project = function () {
    var pr = byId(PROJECTS, param("id")) || PROJECTS[0], q = post(pr.id);
    document.title = pr.title + " — проекты МАРТдекор";
    fill("#hero", pic(pr.cover, pr.title, false, true) + '<div class="cap"><span class="eyebrow" style="color:rgba(255,255,255,.8)">Проект · ' + tx(pr.who) + "</span><h1>" + tx(pr.title) + "</h1></div>");
    fill("#crumb", tx(pr.title));
    fill("#text", (q ? q.x.map(block).join("") : "") + '<p class="src">' + (q ? date(q.d) + " · " : "") + '<a href="https://vk.ru/wall-53471837_' + pr.id + '" target="_blank" rel="noopener">Обсудить во&nbsp;ВКонтакте</a></p>');
    fill("#mats", '<h3 class="h3" style="font-size:22px;margin-bottom:8px">Что использовали</h3><ul>' + pr.mats.map(function (m) { return '<li><i class="ti ti-point-filled"></i><span>' + tx(m) + "</span></li>"; }).join("") + "</ul>");
    if (q && q.ph.length) fill("#minigal", gal(q.ph, "minigal"));
    fill("#others", PROJECTS.filter(function (x) { return x.id !== pr.id; }).slice(0, 3).map(projCard).join(""));
  };
  pages.ideas = function () {
    var c = param("c"), room = param("room"), shown = 16;
    var chips = [{ k: "", name: "Все" }].concat(CATS.map(function (x) { return { k: "c=" + x.id, name: x.name }; }), ROOMS.map(function (r) { return { k: "room=" + r.id, name: r.name }; }), [{ k: "kind=event", name: "События" }]);
    var cur = c ? "c=" + c : room ? "room=" + room : param("kind") ? "kind=" + param("kind") : "";
    function list() {
      return POSTS_.filter(function (q) {
        if (!cur) return true;
        var kv = cur.split("=");
        return kv[0] === "c" ? q.tags.indexOf(kv[1]) >= 0 : kv[0] === "room" ? q.rooms.indexOf(kv[1]) >= 0 : q.kind === kv[1];
      });
    }
    function draw() {
      var arr = list();
      fill("#chips", chips.map(function (ch) { return '<button class="chip' + (ch.k === cur ? " on" : "") + '" data-k="' + ch.k + '">' + ch.name + "</button>"; }).join(""));
      fill("#count", arr.length + " " + plural(arr.length, "запись", "записи", "записей"));
      fill("#arts", arr.slice(0, shown).map(art).join(""));
      fill("#more", arr.length > shown ? '<button class="btn btn-line">Показать ещё</button>' : "");
    }
    document.addEventListener("click", function (e) {
      var ch = e.target.closest("[data-k]"); if (ch) { cur = ch.getAttribute("data-k"); shown = 16; history.replaceState(null, "", cur ? "?" + cur : "ideas.html"); draw(); }
      if (e.target.closest("#more button")) { shown += 16; draw(); }
    });
    draw();
  };
  pages.idea = function () {
    var q = post(param("id")) || POSTS_[0]; if (!q) return;
    var pr = byId(PROJECTS, q.id);
    document.title = q.t + " — МАРТдекор";
    var tag = q.kind === "project" ? "Проект" : q.kind === "event" ? "Событие" : (TAGNAME[q.tags[0]] || "Идеи");
    fill("#crumb", tx(q.t.length > 50 ? q.t.slice(0, 48) + "…" : q.t));
    fill("#head", '<span class="eyebrow">' + tag + "</span><h1>" + tx(q.t) + '</h1><div class="meta"><span>' + date(q.d) + "</span>" + (q.ph.length ? "<span>" + q.ph.length + " фото</span>" : "") + (q.v ? "<span>есть видео</span>" : "") + "</div>");
    if (q.ph.length) fill("#cover", '<div data-gal="' + q.ph.join(",") + '"><button data-zoom="0" style="display:block;width:100%">' + pic(q.ph[0], q.t, false, true) + "</button></div>");
    fill("#body", q.x.map(block).join("") + (q.v ? '<p><a class="link-more" href="https://vk.ru/wall-53471837_' + q.id + '" target="_blank" rel="noopener">Смотреть видео во&nbsp;ВКонтакте' + ARROW + "</a></p>" : ""));
    if (q.ph.length > 1) fill("#minigal", gal(q.ph, "minigal"));
    fill("#src", '<a href="https://vk.ru/wall-53471837_' + q.id + '" target="_blank" rel="noopener">Обсудить во&nbsp;ВКонтакте</a>');
    fill("#cta", pr ? '<b>Хотите так&nbsp;же?</b><div class="btns"><a class="btn btn-main" href="project.html?id=' + pr.id + '">Смотреть проект' + ARROW + "</a></div>"
      : '<b>Подберём под&nbsp;ваш интерьер</b><div class="btns"><button class="btn btn-main" data-book="salon">Записаться на&nbsp;подбор' + ARROW + '</button><button class="btn btn-line" data-pick="c:' + q.id + '" data-label></button></div>');
    var more = POSTS_.filter(function (x) { return x.id !== q.id && x.ph.length && q.tags[0] && x.tags[0] === q.tags[0]; }).slice(0, 3);
    if (more.length) fill("#more-arts", more.map(art).join("")); else { var m = $("#more-box"); if (m) m.hidden = true; }
  };

  /* спокойные микроанимации */
  function reveal() {
    var els = $$(".panel, .hero2, .foot"); els.forEach(function (e) { e.classList.add("rv"); });
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  chrome();
  if (pages[PAGE]) pages[PAGE]();
  syncPick();
  reveal();
  if (location.hash && /^#\w+$/.test(location.hash)) setTimeout(function () { var t = $(location.hash); if (t) t.scrollIntoView(); }, 60);
})();
