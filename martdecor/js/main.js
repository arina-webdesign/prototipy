/* МАРТдекор — прототип: общие шапка и подвал, карточки, каталог, подборка, калькулятор. */
(function () {
  var NB = " ";
  var page = document.body.getAttribute("data-page");
  var params = new URLSearchParams(location.search);

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  function sec(id) { return SECTIONS.filter(function (s) { return s.id === id; })[0]; }
  function item(id) { return ITEMS.filter(function (i) { return i.id === id; })[0]; }

  // типографика для всего, что вставляет скрипт: проходим по текстовым узлам
  function typoTree(el) {
    if (!el || !window.typo) return;
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (t) { if (t.nodeValue.trim()) t.nodeValue = typo(t.nodeValue); });
  }
  function fill(el, html) { if (!el) return; el.innerHTML = html; typoTree(el); }
  // последнее короткое слово не остаётся одно в строке: склеиваем его с предыдущим
  function glueTails(root) {
    $$("h1, h2, h3, p, li, summary, blockquote, label, .line", root).forEach(function (el) {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, last = null;
      while ((n = w.nextNode())) if (n.nodeValue.trim()) last = n;
      if (!last) return;
      last.nodeValue = last.nodeValue.replace(/ (\S{1,12}\s*)$/, NB + "$1");
    });
  }

  /* ── подборка: хранится в браузере, если он разрешает ── */
  var KEY = "martdecor-podborka", mem = [];
  var pick = {
    get: function () { try { var v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : mem; } catch (e) { return mem; } },
    set: function (v) { mem = v; try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} },
    has: function (id) { return pick.get().indexOf(id) >= 0; },
    toggle: function (id) {
      var v = pick.get().slice(), i = v.indexOf(id);
      if (i >= 0) v.splice(i, 1); else v.push(id);
      pick.set(v); syncPick();
      return i < 0;
    }
  };

  var LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true">' +
    '<path d="M4 38V18A16 16 0 0 1 20 2v36z" fill="#6b1e2b"/>' +
    '<path d="M20 2a16 16 0 0 1 16 16v20H20z" fill="#b9ada1"/>' +
    '<path d="M10 38V21a10 10 0 0 1 20 0v17z" fill="#f5f0e8"/>' +
    '<path d="M13 38V23a7 7 0 0 1 7-7v22z" fill="#7d9682"/>' +
    '<rect x="23" y="21" width="2" height="17" fill="#1f1a19"/><rect x="27" y="23" width="2" height="15" fill="#1f1a19"/></svg>';

  /* ── шапка, подвал, панель подборки ── */
  function chrome() {
    var nav = [["catalog.html", "Каталог", "catalog"], ["index.html#podbor", "Как подбираем", ""], ["index.html#pro", "Дизайнерам", ""],
      ["index.html#sovety", "Советы", "article"], ["index.html#kontakty", "Контакты", ""]];
    fill($("#top"), '<div class="wrap top-in">' +
      '<a class="logo" href="index.html">' + LOGO + '<span class="logo-t"><b>МАРТдекор</b><span>интерьерный салон</span></span></a>' +
      '<nav class="nav">' + nav.map(function (n) { return '<a href="' + n[0] + '"' + (n[2] && n[2] === page ? ' class="on"' : "") + ">" + n[1] + "</a>"; }).join("") + "</nav>" +
      '<div class="top-r"><span class="open-chip" data-open><span class="dot"></span><span class="t">Ростов-на-Дону</span></span>' +
      '<a class="top-phone" href="tel:' + SALON.tel + '">' + SALON.phone + "</a>" +
      '<button class="pick-btn" data-drawer><i class="ti ti-bookmark"></i>Подборка <span class="n" data-count>0</span></button></div></div>');

    fill($("#foot"), '<div class="wrap"><div class="foot-in">' +
      '<div><a class="logo" href="index.html">' + LOGO + '<span class="logo-t"><b>МАРТдекор</b><span>интерьерный салон с 2018 года</span></span></a>' +
      '<p class="small" style="margin-top:18px;max-width:22em">Обои, фрески, стеновые панели, каменный шпон, краски и лепной декор. Подбор под ваш интерьер.</p></div>' +
      '<div><h4>Салон</h4><ul><li>' + SALON.address + '</li><li>Пн–пт 10:00–19:00</li><li>Сб–вс 10:00–17:00</li></ul></div>' +
      '<div><h4>Связаться</h4><ul><li><a href="tel:' + SALON.tel + '">' + SALON.phone + '</a></li><li>WhatsApp, Telegram, MAX</li><li><a href="mailto:info@martdecor.ru">info@martdecor.ru</a></li></ul></div>' +
      '<div><h4>Разделы</h4><ul>' + SECTIONS.map(function (s) { return '<li><a href="catalog.html?sec=' + s.id + '">' + s.name + "</a></li>"; }).join("") + "</ul></div>" +
      '</div><div class="foot-note"><span>ИП Арийская Людмила Руслановна · ОГРНИП 319619600052602</span>' +
      "<span>Прототип подготовила Арина · наличие показано для примера, фото — заглушки</span></div></div>");

    var d = document.createElement("div");
    d.innerHTML = '<div class="shade" data-close></div><aside class="drawer" aria-label="Подборка">' +
      '<div class="dr-head"><div><h3>Ваша подборка</h3><p>Менеджер проверит наличие, рассчитает количество и пришлёт счёт. На сайте оплачивать не нужно.</p></div>' +
      '<button class="x" data-close aria-label="Закрыть"><i class="ti ti-x"></i></button></div>' +
      '<div class="dr-body" data-list></div><div class="dr-foot" data-form></div></aside>';
    document.body.appendChild(d);
    typoTree(d);

    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-drawer],[data-close],[data-add],[data-del]");
      if (!t) return;
      if (t.hasAttribute("data-drawer")) { renderDrawer(); document.body.classList.add("drawer-open"); }
      if (t.hasAttribute("data-close")) document.body.classList.remove("drawer-open");
      if (t.hasAttribute("data-add")) { e.preventDefault(); pick.toggle(t.getAttribute("data-add")); }
      if (t.hasAttribute("data-del")) { pick.toggle(t.getAttribute("data-del")); renderDrawer(); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") document.body.classList.remove("drawer-open"); });
  }

  function syncPick() {
    var v = pick.get();
    $$("[data-count]").forEach(function (el) { el.textContent = v.length; });
    $$("[data-add]").forEach(function (b) {
      var on = v.indexOf(b.getAttribute("data-add")) >= 0;
      b.classList.toggle("on", on);
      if (b.classList.contains("add")) {
        b.innerHTML = '<i class="ti ti-' + (on ? "check" : "plus") + '"></i>';
        b.setAttribute("aria-label", on ? "Убрать из подборки" : "Добавить в подборку");
      } else if (b.hasAttribute("data-label")) {
        b.innerHTML = '<i class="ti ti-' + (on ? "check" : "bookmark") + '"></i>' + typo(on ? "В подборке" : b.getAttribute("data-label"));
      }
    });
  }

  function renderDrawer() {
    var v = pick.get();
    fill($("[data-list]"), v.length ? v.map(function (id) {
      var it = item(id); if (!it) return "";
      return '<div class="dr-item"><div class="ph t-' + sec(it.sec).tone + '"></div><div><b>' + esc(it.name) + "</b><span>" + priceText(it) + "</span></div>" +
        '<button data-del="' + it.id + '" aria-label="Убрать"><i class="ti ti-trash"></i></button></div>';
    }).join("") : '<div class="empty">Пока пусто. Добавляйте материалы кнопкой <b>+</b> в каталоге — соберём всё в одну заявку.</div>');
    fill($("[data-form]"), v.length ? '<form data-send>' +
      '<div class="row2"><label class="field">Имя<input required placeholder="Как к вам обращаться"></label>' +
      '<label class="field">Телефон<input required type="tel" placeholder="+7"></label></div>' +
      '<label class="field" style="margin-top:12px">Куда ответить<select><option>WhatsApp</option><option>Telegram</option><option>MAX</option><option>Позвонить</option></select></label>' +
      '<label class="field" style="margin-top:12px">Комментарий<textarea placeholder="Комната, площадь стен, есть ли дизайн-проект"></textarea></label>' +
      '<label class="check" style="margin-top:8px"><input type="checkbox"> Нужны образцы на объект</label>' +
      '<button class="btn btn-filled" style="width:100%;margin-top:12px" type="submit"><i class="ti ti-send"></i>Отправить менеджеру</button></form>' : "");
    var f = $("[data-send]");
    if (f) f.addEventListener("submit", function (e) {
      e.preventDefault();
      fill($("[data-form]"), '<div class="ok"><b>Подборка отправлена — это демо</b>В рабочей версии она придёт менеджеру салона, а он ответит туда, куда вы выбрали.</div>' +
        '<div class="need"><i class="ti ti-help-circle"></i><span><b>Нужно от вас:</b> куда удобнее получать заявки с сайта — WhatsApp, Telegram, MAX или почта.</span></div>');
    });
  }

  /* ── цена, статус, карточка ── */
  function priceText(it) { return it.price ? "от " + money(it.price) + " ₽" + (it.unit ? " " + it.unit : "") : "Цена по запросу"; }
  function priceHTML(it) { return it.price ? "от " + money(it.price) + NB + "₽" + (it.unit ? "<small>" + it.unit + "</small>" : "") : "Цена по запросу"; }
  function statusHTML(it) {
    var t = { "in": "В наличии", few: "Количество ограничено", order: "Под заказ" }[it.status];
    return '<span class="status ' + it.status + '">' + t + "</span>";
  }
  function card(it) {
    var s = sec(it.sec);
    return '<article class="item"><a href="item.html?id=' + it.id + '" class="ph t-' + s.tone + '" style="text-decoration:none">' +
      '<span class="ph-cap"><i class="ti ti-photo"></i>Фото товара</span></a>' +
      '<div class="meta"><span>' + esc(it.group) + "</span>" + statusHTML(it) + "</div>" +
      '<h3><a href="item.html?id=' + it.id + '">' + esc(it.name) + "</a></h3>" +
      '<p class="line">' + esc(it.line) + "</p>" +
      '<div class="bottom"><span class="price">' + priceHTML(it) + "</span>" +
      '<button class="add" data-add="' + it.id + '" aria-label="Добавить в подборку"><i class="ti ti-plus"></i></button></div></article>';
  }
  function minPrice(secId) {
    var p = ITEMS.filter(function (i) { return i.sec === secId && i.price; }).map(function (i) { return i.price; });
    return p.length ? Math.min.apply(null, p) : 0;
  }

  /* ── открыто сейчас: время Ростова совпадает с московским ── */
  function openNow() {
    var d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
    var day = d.getDay(), h = d.getHours() + d.getMinutes() / 60, today = SALON.hours[day];
    var open = h >= today[0] && h < today[1];
    var text;
    if (open) text = "Открыто до " + today[1] + ":00";
    else if (h < today[0]) text = "Откроется сегодня в " + today[0] + ":00";
    else text = "Откроется завтра в " + SALON.hours[(day + 1) % 7][0] + ":00";
    $$("[data-open]").forEach(function (el) {
      el.classList.toggle("closed", !open);
      var t = $(".t", el) || el; t.textContent = typo(text);
    });
    var tb = $("#hours");
    if (tb) {
      var wk = day >= 1 && day <= 5;
      fill(tb, [["Понедельник — пятница", 1, wk], ["Суббота и воскресенье", 6, !wk]].map(function (g) {
        return "<tr" + (g[2] ? ' class="today"' : "") + "><td>" + g[0] + (g[2] ? " · сегодня" : "") + "</td><td>" + SALON.hours[g[1]][0] + ":00–" + SALON.hours[g[1]][1] + ":00</td></tr>";
      }).join(""));
    }
  }

  /* ── появление при прокрутке ── */
  function reveal() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("rise"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px 80px 0px" });
    $$(".sec-card, .item, .step, .rev, .art, .why > div").forEach(function (el) {
      if (el.getBoundingClientRect().top > innerHeight) io.observe(el);
    });
  }

  /* ── главная ── */
  function home() {
    fill($("#secs"), SECTIONS.map(function (s) {
      var p = minPrice(s.id);
      return '<a class="sec-card" href="catalog.html?sec=' + s.id + '"><div class="ph t-' + s.tone + '"></div><div>' +
        "<h3>" + s.name + "</h3><p>" + esc(s.fact) + "</p>" +
        (p ? '<div class="from">В выборке от ' + money(p) + NB + "₽</div>" : "") +
        '<span class="go">Смотреть <i class="ti ti-arrow-right"></i></span></div></a>';
    }).join(""));
    var feat = ["px175", "dp151", "d1132", "dblack", "santorini", "gelios", "struct", "s20065"];
    fill($("#featured"), feat.map(function (id) { return card(item(id)); }).join(""));
    fill($("#revs"), REVIEWS.map(function (r) {
      return '<figure class="rev" style="margin:0"><blockquote>' + esc(r.text) + '</blockquote><figcaption><div class="who">' + esc(r.name) +
        '</div><div class="when">' + r.date + ", Яндекс Карты</div></figcaption></figure>";
    }).join(""));
    var tones = { traversee: "ink", classic: "stone", nature: "sage" };
    fill($("#arts"), ARTICLES.map(function (a) {
      return '<a class="art" href="article.html?id=' + a.id + '"><div class="ph t-' + tones[a.id] + '"><span class="ph-cap"><i class="ti ti-photo"></i>Фото интерьера из поста</span></div>' +
        '<span class="tag">' + a.tag + "</span><h3>" + esc(a.title) + "</h3><p>" + esc(a.lead) + "</p></a>";
    }).join(""));
    fill($("#faqs"), FAQ.map(function (f, i) {
      return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(f[0]) + '<i class="ti ti-plus"></i></summary><p>' + esc(f[1]) + "</p></details>";
    }).join(""));
  }

  /* ── каталог ── */
  function catalog() {
    var st = { sec: params.get("sec") || "", q: "", paint: false, ru: false, price: "" };
    fill($("#tabs"), '<button class="tab" data-sec="">Все разделы</button>' + SECTIONS.map(function (s) {
      return '<button class="tab" data-sec="' + s.id + '">' + s.name + "</button>";
    }).join(""));
    function draw() {
      $$("#tabs .tab").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-sec") === st.sec); });
      var s = sec(st.sec);
      $("#cat-title").textContent = s ? s.name : "Каталог";
      fill($("#cat-sub"), s ? s.fact + ". Здесь — выборка из нескольких позиций, чтобы показать, как будет устроен раздел." :
        "Шесть разделов салона. В прототипе — по 2–3 позиции в каждом, в каталоге салона их 84" + NB + "797.");
      /* ищем по началу каждого слова: «карнизы» найдут «карниз», «лепнина» — раздел «Лепной декор» */
      var q = st.q.trim().toLowerCase().split(/\s+/).filter(Boolean).map(function (w) { return w.slice(0, 5); });
      var list = ITEMS.filter(function (it) {
        if (st.sec && it.sec !== st.sec) return false;
        if (q.length) {
          var is = sec(it.sec), hay = (it.name + " " + it.brand + " " + it.group + " " + (is ? is.name + " " + is.words : "")).toLowerCase();
          if (q.some(function (w) { return hay.indexOf(w) < 0; })) return false;
        }
        if (st.paint && !it.paint) return false;
        if (st.ru && !it.ru) return false;
        if (st.price === "lt1000" && !(it.price && it.price < 1000)) return false;
        if (st.price === "lt10000" && !(it.price && it.price < 10000)) return false;
        if (st.price === "gt10000" && !(it.price >= 10000)) return false;
        return true;
      });
      fill($("#cat-count"), "Показано " + list.length + " из " + ITEMS.length + " позиций выборки");
      fill($("#cat-items"), list.length ? list.map(card).join("") :
        '<div class="empty" style="grid-column:1/-1">Ничего не нашлось. Попробуйте другое слово или снимите фильтр — или спросите менеджера: в салоне более 90 брендов.</div>');
      syncPick();
      glueTails($("#cat-items"));
    }
    $("#tabs").addEventListener("click", function (e) {
      var b = e.target.closest(".tab"); if (!b) return;
      st.sec = b.getAttribute("data-sec");
      history.replaceState(null, "", st.sec ? "?sec=" + st.sec : location.pathname);
      draw();
    });
    $("#q").addEventListener("input", function (e) { st.q = e.target.value; draw(); });
    $("#f-paint").addEventListener("change", function (e) { st.paint = e.target.checked; draw(); });
    $("#f-ru").addEventListener("change", function (e) { st.ru = e.target.checked; draw(); });
    $$("input[name=price]").forEach(function (r) { r.addEventListener("change", function () { st.price = r.value; draw(); }); });
    draw();
  }

  /* ── карточка позиции ── */
  function product() {
    var it = item(params.get("id")) || ITEMS[0], s = sec(it.sec);
    document.title = it.name + " — МАРТдекор";
    var calc = "";
    if (it.calc && it.price) {
      calc = '<div class="calc"><h3>Сколько понадобится</h3><p class="small muted">Ориентир по данным карточки, без запаса на подрезку и раппорт. Точный расчёт сделает менеджер салона.</p>' +
        '<div class="calc-row"><span>Площадь стен</span><input type="range" min="1" max="60" value="12" id="area"><span class="area" id="area-v">12 м²</span></div>' +
        '<div class="calc-out"><div><b id="c-qty"></b><span>количество</span></div><div><b id="c-sum"></b><span>ориентир по цене</span></div></div></div>';
    }
    fill($("#crumbs"), '<a href="index.html">Главная</a> / <a href="catalog.html">Каталог</a> / <a href="catalog.html?sec=' + s.id + '">' + s.name + "</a>");
    fill($("#pd"), '<div class="pd-gal"><div class="ph t-' + s.tone + '"><span class="ph-cap"><i class="ti ti-photo"></i>Фото в интерьере</span></div>' +
      '<div class="ph t-' + s.tone + '"><span class="ph-cap">Фактура крупно</span></div><div class="ph t-' + s.tone + '"><span class="ph-cap">Образец в салоне</span></div></div>' +
      '<div><span class="eyebrow">' + esc(it.brand) + " · " + esc(it.group) + "</span><h1>" + esc(it.name) + '</h1><p class="line">' + esc(it.line) + "</p>" +
      '<div class="pd-buy"><span class="price">' + priceHTML(it) + "</span>" + statusHTML(it) + '<span class="small muted">наличие — для примера</span></div>' +
      '<div class="pd-actions"><button class="btn btn-filled" data-add="' + it.id + '" data-label="Добавить в подборку"><i class="ti ti-bookmark"></i>Добавить в подборку</button>' +
      '<button class="btn btn-ghost" data-drawer><i class="ti ti-ruler-measure"></i>Расчёт и образец</button></div>' + calc +
      '<table class="specs">' + it.specs.map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("") +
      (it.fits ? "<tr><td>Где применяют</td><td>" + esc(it.fits) + "</td></tr>" : "") + "</table>" +
      '<div class="pc"><div class="plus"><h4>Чем хорош</h4><ul>' + it.pros.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="minus"><h4>Что учесть</h4><ul>' + it.needs.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div></div>" +
      '<p class="source">Источник: <a href="' + (it.src.indexOf("http") === 0 ? it.src.split(" ")[0] : "#") + '" target="_blank" rel="noopener">' + esc(it.src) + "</a></p></div>");
    var more = ITEMS.filter(function (i) { return i.sec === it.sec && i.id !== it.id; });
    fill($("#more"), more.map(card).join(""));
    if (calc) {
      var area = $("#area");
      var upd = function () {
        var a = +area.value, c = it.calc, qty, sum;
        $("#area-v").textContent = a + NB + "м²";
        if (c.per === "m2") { qty = a + NB + "м²"; sum = a * it.price; }
        else if (c.per === "pcs") { var n = Math.ceil(a * c.k); qty = money(n) + NB + c.label; sum = n * it.price; }
        else { var u = Math.ceil(a / c.k); qty = u + NB + c.label; sum = u * it.price; }
        $("#c-qty").textContent = qty;
        $("#c-sum").textContent = "≈" + NB + money(sum) + NB + "₽";
      };
      area.addEventListener("input", upd); upd();
    }
  }

  /* ── статья ── */
  function article() {
    var a = ARTICLES.filter(function (x) { return x.id === params.get("id"); })[0] || ARTICLES[0];
    document.title = a.title + " — МАРТдекор";
    var tones = { traversee: "ink", classic: "stone", nature: "sage" };
    var body = a.body.map(function (b) {
      if (b[0] === "h") return "<h2>" + esc(b[1]) + "</h2>";
      if (b[0] === "li") return "<ul>" + b[1].map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      return "<p>" + esc(b[1]) + "</p>";
    }).join("");
    fill($("#article"), '<div class="crumbs"><a href="index.html">Главная</a> / <a href="index.html#sovety">Советы</a></div>' +
      '<span class="eyebrow">' + a.tag + "</span><h1>" + esc(a.title) + '</h1><p class="lead">' + esc(a.lead) + "</p>" +
      '<div class="ph t-' + tones[a.id] + '"><span class="ph-cap"><i class="ti ti-photo"></i>Фото из поста салона</span></div>' + body +
      '<p class="source">Текст салона: <a href="' + a.src + '" target="_blank" rel="noopener">' + esc(a.srcLabel) + "</a></p>" +
      '<div class="promise" style="margin-top:30px"><p>Покажем эти материалы вживую и подберём сочетания под вашу комнату.</p>' +
      '<a class="btn btn-light" href="catalog.html"><i class="ti ti-layout-grid"></i>В каталог</a></div>');
  }

  chrome();
  if (page === "home") home();
  if (page === "catalog") catalog();
  if (page === "item") product();
  if (page === "article") article();
  openNow();
  syncPick();
  glueTails(document);
  reveal();
})();
