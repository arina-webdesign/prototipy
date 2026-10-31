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
  function cat(id) { return byId(CATS.concat(window.EXTRA_CATS || []), id); }
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
  var ARROW = '<span class="arrow" aria-hidden="true"></span>';

  /* ——— подборка (вместо корзины): хранится в браузере ——— */
  var PICK_KEY = "md-pick";
  function pickGet() { try { return JSON.parse(localStorage.getItem(PICK_KEY)) || []; } catch (e) { return []; } }
  function pickSet(a) { try { localStorage.setItem(PICK_KEY, JSON.stringify(a)); } catch (e) {} syncPick(); }
  function pickHas(k) { return pickGet().indexOf(k) >= 0; }
  function pickToggle(k) {
    var a = pickGet(), i = a.indexOf(k);
    if (i >= 0) { a.splice(i, 1); toast("Убрали из подборки"); } else { a.push(k); toast("Добавили в подборку"); }
    pickSet(a);
  }
  function pickItem(k) {
    var kind = k.slice(0, 1), id = k.slice(2);
    if (kind === "p") { var p = prod(id); return p && { name: p.name, sub: priceText(p), img: p.ph[0], href: "product.html?id=" + p.id }; }
    var q = post(id); return q && { name: q.t, sub: "коллекция из группы ВК", img: q.ph[0], href: "idea.html?id=" + q.id };
  }
  function syncPick() {
    var n = pickGet().length;
    $$(".pick-ico").forEach(function (b) { b.hidden = !n; var c = $(".count", b); if (c) c.textContent = n; });
    $$("[data-pick]").forEach(function (b) {
      var on = pickHas(b.getAttribute("data-pick"));
      b.classList.toggle("on", on);
      if (b.classList.contains("heart")) { b.innerHTML = '<i class="ti ti-heart' + (on ? "-filled" : "") + '"></i>'; b.setAttribute("aria-label", on ? "Убрать из подборки" : "В подборку"); }
      else if (b.hasAttribute("data-label")) b.innerHTML = '<i class="ti ti-heart' + (on ? "-filled" : "") + '"></i>' + (on ? "В подборке" : "В подборку");
    });
    if ($(".drawer.show")) renderDrawer();
  }
  function renderDrawer() {
    var a = pickGet();
    fill(".drawer-list", a.length ? a.map(function (k) {
      var it = pickItem(k); if (!it) return "";
      return '<div class="pick"><a href="' + it.href + '">' + pic(it.img, it.name, true) + '</a><div><b><a href="' + it.href + '">' + tx(it.name) + "</a></b><span>" + tx(it.sub) + '</span></div><button data-unpick="' + k + '" aria-label="Убрать"><i class="ti ti-x"></i></button></div>';
    }).join("") : '<p class="empty">Пока пусто. Нажмите ♡ на&nbsp;карточке товара или&nbsp;коллекции&nbsp;— и&nbsp;соберите всё для&nbsp;стен в&nbsp;одном списке.</p>');
    var send = $(".drawer [data-send]");
    if (send) {
      var lines = a.map(function (k, i) { var it = pickItem(k); return it ? (i + 1) + ". " + it.name + " — " + it.sub : ""; }).filter(Boolean);
      send.href = wa("Здравствуйте! Собрал(а) подборку на сайте, посчитайте, пожалуйста, количество и наличие:\n" + lines.join("\n"));
      send.style.display = a.length ? "" : "none";
    }
  }

  /* ——— шапка ——— */
  function logo(sub) {
    return '<a class="logo" href="index.html" aria-label="МАРТдекор — на главную"><span class="logo-word">' +
      '<svg class="logo-arch" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="M1 40 A49 39 0 0 1 99 40"/></svg>' +
      "МАРТ<span>декор</span></span>" + (sub ? '<span class="logo-sub">Интерьерный салон</span>' : "") + "</a>";
  }
  function chrome() {
    var cats = CATS.concat(window.EXTRA_CATS || []);
    fill(".top", '<div class="wrap"><div class="top-bar">' + logo(false) +
      '<nav class="nav" aria-label="Меню">' +
        '<div><a href="catalog.html"' + (/catalog|category|product/.test(PAGE) ? ' class="on"' : "") + '>Материалы<i class="ti ti-chevron-down"></i></a><div class="drop">' +
          cats.map(function (c) { return '<a href="category.html?c=' + c.id + '">' + c.name + "</a>"; }).join("") + '<a href="catalog.html"><b>Весь каталог</b></a></div></div>' +
        '<div><a href="index.html#uslugi">Услуги<i class="ti ti-chevron-down"></i></a><div class="drop">' +
          '<a href="index.html#uslugi">Подбор в&nbsp;салоне</a><a href="#" data-book="photo">Подбор по&nbsp;фото комнаты</a><a href="#" data-book="obekt">Выезд с&nbsp;образцами на&nbsp;объект</a><a href="index.html#koler">Колеровка</a><a href="index.html#pro">Дизайнерам и&nbsp;мастерам</a></div></div>' +
        '<div><a href="projects.html"' + (/project/.test(PAGE) ? ' class="on"' : "") + ">Проекты</a></div>" +
        '<div><a href="index.html#komanda">О&nbsp;салоне</a></div>' +
        '<div><a href="index.html#kontakty">Контакты</a></div>' +
      "</nav>" +
      '<div class="top-icons">' +
        '<a class="ico tg" href="' + SALON.tg + '" target="_blank" rel="noopener" aria-label="Телеграм"><i class="ti ti-brand-telegram"></i></a>' +
        '<a class="ico wa" href="https://wa.me/' + SALON.wa + '" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="ti ti-brand-whatsapp"></i></a>' +
        '<button class="ico pick-ico" data-drawer hidden aria-label="Подборка"><i class="ti ti-heart"></i><span class="count">0</span></button>' +
        '<button class="ico burger" aria-label="Меню"><i class="ti ti-menu-2"></i></button>' +
      "</div>" +
      '<button class="btn btn-main btn-sm" data-book="salon">Записаться на&nbsp;подбор' + ARROW + "</button>" +
    "</div></div>");
    var burger = $(".burger");
    burger.addEventListener("click", function () {
      var open = $(".nav").classList.toggle("open");
      burger.innerHTML = '<i class="ti ti-' + (open ? "x" : "menu-2") + '"></i>';
    });
    $$(".nav a").forEach(function (a) { a.addEventListener("click", function () { if (!a.nextElementSibling) { $(".nav").classList.remove("open"); burger.innerHTML = '<i class="ti ti-menu-2"></i>'; } }); });
    var top = $(".top");
    window.addEventListener("scroll", function () { top.classList.toggle("scrolled", window.scrollY > 10); }, { passive: true });

    fill(".foot", '<svg class="foot-leaf" viewBox="0 0 200 160" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M10 155 C60 120 100 80 150 20"/><path d="M45 128 C30 110 32 92 48 84 C58 100 56 116 45 128Z"/><path d="M70 106 C58 86 62 68 80 62 C88 80 84 96 70 106Z"/><path d="M95 82 C86 62 92 46 110 42 C116 60 110 74 95 82Z"/><path d="M118 56 C112 38 120 24 138 22 C140 40 132 52 118 56Z"/><path d="M60 118 C80 122 96 114 102 98 C84 94 68 102 60 118Z"/><path d="M86 94 C106 98 122 88 126 72 C108 70 92 78 86 94Z"/></svg>' +
      '<div class="foot-grid">' +
        "<div>" + logo(true) + '<p style="margin-top:22px;max-width:260px;font-size:14px;opacity:.8">Материалы для&nbsp;стен с&nbsp;подбором и&nbsp;расчётом. Ростов-на-Дону, с&nbsp;2018 года.</p></div>' +
        '<div class="foot-col"><div><i class="ti ti-map-pin"></i><span>' + tx(SALON.address) + ",<br>" + tx(SALON.place) + '</span></div><div><i class="ti ti-clock"></i><span>Пн–пт 10:00–19:00<br>Сб–вс 10:00–17:00</span></div></div>' +
        '<div class="foot-col"><div><i class="ti ti-phone"></i><a class="foot-tel" href="tel:' + SALON.tel + '">' + SALON.phone + "</a></div>" +
          '<div class="msgs"><a href="https://wa.me/' + SALON.wa + '" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i>WhatsApp</a><a href="' + SALON.tg + '" target="_blank" rel="noopener"><i class="ti ti-brand-telegram"></i>Telegram</a><a href="' + SALON.vk + '" target="_blank" rel="noopener"><i class="ti ti-brand-vk"></i>ВКонтакте</a></div>' +
          '<div><i class="ti ti-message-circle"></i><span>Также пишите в&nbsp;MAX по&nbsp;номеру ' + SALON.phone + "</span></div></div>" +
        '<nav class="foot-nav" aria-label="Разделы"><a href="catalog.html">Материалы</a><a href="index.html#uslugi">Услуги</a><a href="projects.html">Проекты</a><a href="ideas.html">Идеи для&nbsp;стен</a><a href="index.html#komanda">О&nbsp;салоне</a><a href="index.html#kontakty">Контакты</a></nav>' +
      "</div>" +
      '<div class="foot-bottom"><span>© МАРТдекор, 2018–2026</span><span>Сайт&nbsp;— Арина</span></div>');

    document.body.insertAdjacentHTML("beforeend",
      '<div class="veil"></div>' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="book-h"><button class="x" data-close aria-label="Закрыть"><i class="ti ti-x"></i></button>' +
        '<h3 id="book-h">Записаться на&nbsp;подбор</h3><p class="sub">Выберите, как&nbsp;удобнее,&nbsp;— откроем чат с&nbsp;менеджером, сообщение уже будет написано.</p>' +
        '<div class="opts">' +
          '<label class="opt"><input type="radio" name="fmt" value="salon"><span><b>В&nbsp;салоне</b><span>Сравнить образцы рядом. Пр.&nbsp;Нагибина, 30Л, ДЦ WEST, цокольный этаж</span></span></label>' +
          '<label class="opt"><input type="radio" name="fmt" value="obekt"><span><b>На&nbsp;объекте</b><span>Привезём образцы лепного декора и&nbsp;3D-панелей Orac&nbsp;— примерить прямо на&nbsp;стене</span></span></label>' +
          '<label class="opt"><input type="radio" name="fmt" value="photo"><span><b>На&nbsp;расстоянии</b><span>Пришлите фото комнаты, проект или&nbsp;картинку из&nbsp;интернета</span></span></label>' +
        "</div>" +
        '<div class="btns"><a class="btn btn-main" data-go target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i>Написать в&nbsp;WhatsApp</a><a class="btn btn-line" href="tel:' + SALON.tel + '"><i class="ti ti-phone"></i>Позвонить</a></div>' +
        '<p class="hint">Пн–пт 10:00–19:00, сб–вс 10:00–17:00. Можно прийти и&nbsp;без&nbsp;записи, но&nbsp;на&nbsp;подбор по&nbsp;проекту лучше записаться&nbsp;— специалист подготовится.</p></div>' +
      '<aside class="drawer" aria-label="Подборка"><button class="x" data-close aria-label="Закрыть"><i class="ti ti-x"></i></button><h3>Подборка</h3>' +
        '<p class="sub">На&nbsp;сайте ничего не&nbsp;оплачивают. Менеджер проверит наличие, посчитает количество и&nbsp;пришлёт счёт.</p>' +
        '<div class="drawer-list"></div><div class="drawer-foot"><a class="btn btn-main" data-send target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i>Отправить менеджеру</a><a class="btn btn-line" href="catalog.html">Смотреть материалы</a></div></aside>' +
      '<div class="lb" role="dialog" aria-modal="true" aria-label="Просмотр фото"><button class="x" data-close aria-label="Закрыть"><i class="ti ti-x"></i></button><button class="lb-nav lb-prev" aria-label="Предыдущее"><i class="ti ti-chevron-left"></i></button><img alt=""><button class="lb-nav lb-next" aria-label="Следующее"><i class="ti ti-chevron-right"></i></button><div class="lb-count"></div></div>' +
      '<div class="toast" role="status"></div>');
  }

  /* ——— окна ——— */
  var BOOK_TEXT = {
    salon: "Здравствуйте! Хочу записаться на подбор материалов в салоне.",
    obekt: "Здравствуйте! Хочу заказать выезд с образцами на объект.",
    photo: "Здравствуйте! Хочу подобрать материалы по фото комнаты — пришлю фото."
  };
  function openBook(fmt) {
    var r = $('.modal input[value="' + (fmt || "salon") + '"]'); if (r) r.checked = true;
    syncBook(); $(".modal").classList.add("show"); $(".veil").classList.add("show");
  }
  function syncBook() { var v = ($(".modal input:checked") || {}).value || "salon"; $(".modal [data-go]").href = wa(BOOK_TEXT[v]); }
  function openDrawer() { renderDrawer(); $(".drawer").classList.add("show"); $(".veil").classList.add("show"); }
  function closeAll() { $$(".modal, .drawer, .veil").forEach(function (e) { e.classList.remove("show"); }); $(".lb").classList.remove("show"); document.body.style.overflow = ""; }
  var LB = { list: [], i: 0 };
  function openLb(list, i) { LB.list = list; LB.i = i || 0; showLb(); $(".lb").classList.add("show"); document.body.style.overflow = "hidden"; }
  function showLb() { $(".lb img").src = src(LB.list[LB.i]); $(".lb-count").textContent = LB.list.length > 1 ? (LB.i + 1) + " / " + LB.list.length : ""; $$(".lb-nav").forEach(function (b) { b.style.display = LB.list.length > 1 ? "" : "none"; }); }
  function stepLb(d) { LB.i = (LB.i + d + LB.list.length) % LB.list.length; showLb(); }
  var toastT;
  function toast(s) { var t = $(".toast"); t.textContent = s; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 1800); }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-book]"); if (b) { e.preventDefault(); openBook(b.getAttribute("data-book")); return; }
    if (e.target.closest("[data-drawer]")) { openDrawer(); return; }
    if (e.target.closest("[data-close]") || e.target.classList.contains("veil") || e.target.classList.contains("lb")) { closeAll(); return; }
    var p = e.target.closest("[data-pick]"); if (p) { e.preventDefault(); pickToggle(p.getAttribute("data-pick")); return; }
    var u = e.target.closest("[data-unpick]"); if (u) { var a = pickGet(); a.splice(a.indexOf(u.getAttribute("data-unpick")), 1); pickSet(a); return; }
    var z = e.target.closest("[data-zoom]"); if (z) { var g = z.closest("[data-gal]"); openLb(g.getAttribute("data-gal").split(","), +z.getAttribute("data-zoom")); return; }
    if (e.target.closest(".lb-prev")) { stepLb(-1); return; }
    if (e.target.closest(".lb-next")) { stepLb(1); return; }
    var q = e.target.closest(".faq-item button"); if (q) { var it = q.parentNode; it.classList.toggle("open"); q.setAttribute("aria-expanded", it.classList.contains("open")); }
  });
  document.addEventListener("change", function (e) { if (e.target.name === "fmt") syncBook(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll();
    if ($(".lb.show")) { if (e.key === "ArrowLeft") stepLb(-1); if (e.key === "ArrowRight") stepLb(1); }
  });

  /* ——— карточки ——— */
  function tiles(list) {
    return list.map(function (c) {
      return '<a class="tile" href="category.html?c=' + c.id + '">' + pic(c.tile, c.name, true) + "<span>" + c.br + ARROW + "</span></a>";
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
      (full ? '<div class="price">' + priceHTML(p) + '</div><p class="note">Наличие уточнит менеджер</p><button class="btn btn-line btn-xs" data-pick="' + k + '" data-label><i class="ti ti-heart"></i>В подборку</button>'
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
    return '<a class="proj" href="project.html?id=' + pr.id + '"><div class="proj-ph">' + pic(pr.cover, pr.title, true) + "</div><b>" + tx(pr.title) + "</b><span>" + tx(pr.who) + "</span></a>";
  }
  function faq(list) {
    return '<div class="faq-list">' + list.map(function (f, i) {
      return '<div class="faq-item"><button aria-expanded="false" aria-controls="fa' + i + '">' + tx(f[0]) + '<span class="pm" aria-hidden="true"></span></button><div class="faq-a" id="fa' + i + '"><div><p>' + tx(f[1]) + "</p></div></div></div>";
    }).join("") + "</div>";
  }
  function gal(list, cls) {
    return '<div class="' + cls + '" data-gal="' + list.join(",") + '">' + list.map(function (n, i) { return '<button data-zoom="' + i + '" aria-label="Открыть фото">' + pic(n, "", true) + "</button>"; }).join("") + "</div>";
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

  /* ——— страницы ——— */
  var pages = {};
  pages.home = function () {
    fill("#tiles", tiles(CATS));
    fill("#also", "<b>А&nbsp;ещё в&nbsp;салоне:</b>" + ALSO.map(function (a) { return '<span class="chip">' + tx(a) + "</span>"; }).join(""));
    fill("#rooms", "<b>Подобрать по&nbsp;комнате:</b>" + ROOMS.map(function (r) { return '<a class="chip chip-ink" href="ideas.html?room=' + r.id + '">' + r.name + "</a>"; }).join(""));
    var feat = (window.FEATURED || []).map(prod).filter(Boolean);
    fill("#goods", feat.map(function (p) { return good(p, true); }).join(""));
    fill("#projects", PROJECTS.slice(0, 3).map(projCard).join(""));
    var r0 = REVIEWS[0];
    fill("#revs", '<div class="rev-big"><q>' + tx(r0.text) + '</q><p class="rev-who"><b>' + tx(r0.name) + "</b> <span>· " + r0.date + "</span></p></div>" +
      '<div class="rev-list">' + REVIEWS.slice(1).map(function (r) { return '<div class="rev"><p>«' + tx(r.text) + '»</p><p class="rev-who"><b>' + tx(r.name) + "</b> <span>· " + r.date + "</span></p></div>"; }).join("") + "</div>");
    fill("#stories", STORIES.map(function (s) { return '<div class="story"><h4>' + tx(s.title) + "</h4><p>" + tx(s.text) + "</p><q>" + tx(s.quote) + '</q><span class="small muted">' + tx(s.who) + "</span></div>"; }).join(""));
    fill("#people", TEAM.map(function (m) {
      return '<figure class="person" style="margin:0"><div class="person-ph"><span class="ini">' + m.name[0] + '</span><span class="cap">Фото: ' + m.name + "</span></div><b>" + m.name + "</b><span>" + m.role + "</span><p>" + tx(m.text) + "</p></figure>";
    }).join(""));
    fill("#arts", (window.HOME_IDEAS || []).map(post).filter(Boolean).map(art).join(""));
    fill("#hours", hoursTable());
    fill("#open", openNow());
    fill("#faq", faq(FAQ));
  };
  pages.styleguide = function () {
    fill("#sg-good", (window.FEATURED || []).slice(0, 2).map(prod).filter(Boolean).map(function (p) { return good(p, true); }).join(""));
  };
  pages.catalog = function () {
    fill("#tiles", tiles(CATS));
    var ex = window.EXTRA_CATS || [];
    fill("#extra", ex.map(function (c) {
      return '<a class="extra" href="category.html?c=' + c.id + '">' + pic(c.tile, c.name, true) + '<div><span class="eyebrow">А&nbsp;ещё в&nbsp;салоне</span><b>' + c.name + "</b><p>" + tx(c.lead) + '</p></div><span class="link-more">Смотреть ' + ARROW + "</span></a>";
    }).join(""));
    fill("#also", "<b>А&nbsp;ещё в&nbsp;салоне:</b>" + ALSO.map(function (a) { return '<span class="chip">' + tx(a) + "</span>"; }).join(""));
  };
  pages.category = function () {
    var c = cat(param("c")) || CATS[0];
    document.title = c.name + " — МАРТдекор, Ростов-на-Дону";
    fill("#crumb", c.name);
    fill("#cat-h", c.name); fill("#cat-lead", tx(c.lead));
    fill("#cat-ph", pic(c.hero, c.name, false, true));
    var items = PRODS.filter(function (p) { return p.cat === c.id; });
    var cols = POSTS_.filter(function (q) { return q.kind !== "event" && q.tags.indexOf(c.id) >= 0 && q.ph.length; });
    // чипсы: подразделы товаров или темы коллекций
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
    // идеи с этим материалом — если в разделе есть товары, показываем ещё и посты
    if (items.length && cols.length) {
      $("#ideas-box").hidden = false;
      fill("#ideas", cols.slice(0, 4).map(art).join(""));
      fill("#ideas-more", '<a class="link-more" href="ideas.html?c=' + c.id + '">Все идеи раздела ' + ARROW + "</a>");
    }
  };
  function plural(n, a, b, c) { var m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; }
  pages.product = function () {
    var p = prod(param("id")) || PRODS[0]; if (!p) return;
    var c = cat(p.cat);
    document.title = p.name + " — МАРТдекор";
    fill("#crumbs", '<a href="index.html">Главная</a><span><a href="catalog.html">Материалы</a></span><span><a href="category.html?c=' + c.id + '">' + c.name + "</a></span><span>" + tx(p.name) + "</span>");
    var ph = p.ph;
    if (!ph.length) { fill("#gallery", '<div class="gal-main ph-empty"><span>МАРТ<small>декор</small></span></div><p class="small muted" style="margin-top:10px">Фото этой позиции пришлёт менеджер.</p>'); }
    else fill("#gallery", '<div class="gal-main" data-gal="' + ph.join(",") + '"><span data-zoom="0">' + pic(ph[0], p.name, false, true) + "</span></div>" +
      (ph.length > 1 ? '<div class="gal-thumbs">' + ph.map(function (n, i) { return '<button' + (i ? "" : ' class="on"') + ' data-thumb="' + i + '" aria-label="Фото ' + (i + 1) + '">' + pic(n, "", true) + "</button>"; }).join("") + "</div>" : ""));
    $("#gallery").addEventListener("click", function (e) {
      var b = e.target.closest("[data-thumb]"); if (!b) return;
      var i = +b.getAttribute("data-thumb"); $(".gal-main img").src = src(ph[i]); $(".gal-main [data-zoom]").setAttribute("data-zoom", i);
      $$(".gal-thumbs button").forEach(function (x) { x.classList.toggle("on", x === b); });
    });
    fill("#info", '<span class="brand">' + tx(p.brand) + "</span><h1>" + tx(p.name) + "</h1>" +
      '<div class="item-price">' + priceHTML(p) + (p.old ? ' <s class="muted" style="font-size:20px">' + money(p.old) + NB + "₽</s>" : "") + "</div>" +
      '<p class="item-note"><i class="ti ti-circle-check"></i>Наличие и&nbsp;сроки уточнит менеджер</p>' +
      '<div class="btns"><button class="btn btn-main" data-pick="p:' + p.id + '" data-label><i class="ti ti-heart"></i>В подборку</button>' +
      '<a class="btn btn-line" target="_blank" rel="noopener" href="' + wa("Здравствуйте! Хочу посмотреть образец: " + p.name + " — " + location.href) + '"><i class="ti ti-box"></i>Хочу образец</a></div>' +
      '<table class="specs" style="margin-top:28px">' + p.specs.map(function (s) { return "<tr><td>" + tx(s[0]) + "</td><td>" + tx(s[1]) + "</td></tr>"; }).join("") + "</table>" +
      (p.desc.length ? '<div class="item-desc">' + p.desc.map(block).join("") + "</div>" : ""));
    calc(p);
    var rel = PRODS.filter(function (x) { return x.sub === p.sub && x.id !== p.id; }).slice(0, 4);
    if (rel.length < 4) rel = rel.concat(PRODS.filter(function (x) { return x.cat === p.cat && x.sub !== p.sub; }).slice(0, 4 - rel.length));
    fill("#related", rel.map(function (x) { return good(x, false); }).join(""));
  };
  function calc(p) {
    var box = $("#calc"); if (!box) return;
    var head = '<h3>Сколько понадобится</h3>';
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
    fill("#projects", PROJECTS.map(projCard).join(""));
    var shown = 40, G = window.GALLERY || [];
    function draw() {
      fill("#gallery", gal(G.slice(0, shown), "masonry"));
      fill("#more", G.length > shown ? '<button class="btn btn-line">Показать ещё</button>' : "");
    }
    document.addEventListener("click", function (e) { if (e.target.closest("#more button")) { shown += 40; draw(); } });
    draw();
    fill("#g-count", G.length + " " + plural(G.length, "фотография", "фотографии", "фотографий"));
  };
  pages.project = function () {
    var pr = byId(PROJECTS, param("id")) || PROJECTS[0], q = post(pr.id);
    document.title = pr.title + " — проекты МАРТдекор";
    fill("#hero", pic(pr.cover, pr.title, false, true) + '<div class="cap"><span class="eyebrow" style="color:rgba(255,255,255,.8)">Проект · ' + tx(pr.who) + "</span><h1>" + tx(pr.title) + "</h1></div>");
    fill("#crumb", tx(pr.title));
    fill("#text", (q ? (q.x.map(block).join("")) : "") + '<p class="src">' + (q ? date(q.d) + " · " : "") + '<a href="https://vk.ru/wall-53471837_' + pr.id + '" target="_blank" rel="noopener">Обсудить во&nbsp;ВКонтакте</a></p>');
    fill("#mats", "<h3 class=\"h3\" style=\"font-size:26px;margin-bottom:8px\">Что использовали</h3><ul>" + pr.mats.map(function (m) { return '<li><i class="ti ti-point-filled"></i><span>' + tx(m) + "</span></li>"; }).join("") + "</ul>");
    if (q && q.ph.length) fill("#minigal", gal(q.ph, "minigal"));
    fill("#others", PROJECTS.filter(function (x) { return x.id !== pr.id; }).slice(0, 3).map(projCard).join(""));
  };
  // короткие строки КАПСОМ в постах — это подзаголовки: показываем их обычным регистром
  function capsHead(s) {
    var L = s.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
    return s.length < 70 && L.length > 3 && L.replace(/[^A-ZА-ЯЁ]/g, "").length / L.length > .7;
  }
  function block(b) {
    if (typeof b === "string" && capsHead(b)) { var h = b.toLowerCase(); return '<h3 class="h3" style="font-size:26px;margin:28px 0 12px">' + tx(h[0].toUpperCase() + h.slice(1)) + "</h3>"; }
    return typeof b === "string" ? "<p>" + tx(b) + "</p>" : '<ul style="margin:0 0 16px 20px;list-style:disc">' + b.map(function (li) { return "<li>" + tx(li) + "</li>"; }).join("") + "</ul>";
  }
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
    fill("#body", q.x.map(block).join("") + (q.v ? '<p><a class="link-more" href="https://vk.ru/wall-53471837_' + q.id + '" target="_blank" rel="noopener">Смотреть видео во&nbsp;ВКонтакте ' + ARROW + "</a></p>" : ""));
    if (q.ph.length > 1) fill("#minigal", gal(q.ph, "minigal"));
    fill("#src", '<a href="https://vk.ru/wall-53471837_' + q.id + '" target="_blank" rel="noopener">Обсудить во&nbsp;ВКонтакте</a>');
    fill("#cta", pr ? '<b>Хотите так&nbsp;же?</b><div class="btns"><a class="btn btn-main" href="project.html?id=' + pr.id + '">Смотреть проект' + ARROW + "</a></div>"
      : '<b>Подберём под&nbsp;ваш интерьер</b><div class="btns"><button class="btn btn-main" data-book="salon">Записаться на&nbsp;подбор' + ARROW + '</button><button class="btn btn-line" data-pick="c:' + q.id + '" data-label><i class="ti ti-heart"></i>В подборку</button></div>');
    var more = POSTS_.filter(function (x) { return x.id !== q.id && x.ph.length && q.tags[0] && x.tags[0] === q.tags[0]; }).slice(0, 3);
    if (more.length) fill("#more-arts", more.map(art).join("")); else { var m = $("#more-box"); if (m) m.hidden = true; }
  };

  /* мягкое появление */
  function reveal() {
    var els = $$(".panel, .duo, .foot"); els.forEach(function (e) { e.classList.add("rv"); });
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
