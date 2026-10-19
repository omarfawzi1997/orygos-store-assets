/* Orygos theme behaviours — loaded with app.js */
window.oyBehaviours=function () {
  const ready = fn => (document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn));
  const isAr = () => document.documentElement.dir !== 'ltr';

  /* ---------- Official Saudi Riyal symbol (SAMA), placed to the left of the amount ---------- */
  const RIYAL = '<svg class="sar-i" viewBox="0 0 1124.14 1256.39" role="img" aria-label="SAR"><path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/><path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/></svg>';
  const NUM = '([0-9٠-٩][0-9٠-٩,٬.٫]*)';
  const CUR = '(?:ر\\.س|ر\\.س\\.|ريال|SAR|SR|\\u20C1|\\uE900)';
  const RE = new RegExp('(?:' + CUR + '\\s*' + NUM + '|' + NUM + '\\s*' + CUR + ')', 'g');
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, OPTION: 1, TITLE: 1, NOSCRIPT: 1 };
  const money = n => '<span class="money" dir="ltr">' + RIYAL + '<span>' + n + '</span></span>';

  /* Salla prints its own riyal font icon (<i class="sicon-sar">) — swap it for the official SAMA symbol used in the design */
  function swapSallaRiyal(root) {
    (root || document).querySelectorAll('i.sicon-sar').forEach(i => {
      if (i.closest('.money')) return;
      const prev = i.previousSibling, next = i.nextSibling;
      let num = null;
      if (prev && prev.nodeType === 3) { const m = prev.nodeValue.match(/([0-9٠-٩][0-9٠-٩,٬.٫]*)\s*$/); if (m) { num = m[1]; prev.nodeValue = prev.nodeValue.slice(0, m.index); } }
      if (num === null && next && next.nodeType === 3) { const m = next.nodeValue.match(/^\s*([0-9٠-٩][0-9٠-٩,٬.٫]*)/); if (m) { num = m[1]; next.nodeValue = next.nodeValue.slice(m[0].length); } }
      const t = document.createElement('span'); t.innerHTML = num === null ? '<span class="money" dir="ltr">' + RIYAL + '</span>' : money(num);
      i.replaceWith(t.firstChild);
    });
  }

  /* the design uses Latin numerals (Num face) everywhere — Salla prints Arabic-Indic digits */
  function latinDigits(root) {
    const base = root && root.nodeType === 1 ? root : document.body; if (!base) return;
    const w = document.createTreeWalker(base, NodeFilter.SHOW_TEXT, { acceptNode: n => /[٠-٩]/.test(n.nodeValue) && n.parentElement && n.parentElement.closest('.oy') && !n.parentElement.closest('input,textarea') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const L = []; while (w.nextNode()) L.push(w.currentNode);
    L.forEach(n => { n.nodeValue = n.nodeValue.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)).replace(/٬/g, ',').replace(/٫/g, '.'); });
  }
  function riyalize(root) {
    try { latinDigits(root); } catch (e) {}
    try { swapSallaRiyal(root && root.querySelectorAll ? root : document); } catch (e) {}
    if (!root || window.__oyNoRiyal) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => {
        const p = n.parentElement;
        if (!p || SKIP[p.tagName] || p.closest('.money,[contenteditable]')) return NodeFilter.FILTER_REJECT;
        RE.lastIndex = 0;
        return RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(n => {
      const s = document.createElement('span');
      s.innerHTML = n.nodeValue.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(RE, (m, a, b) => money(a || b));
      n.replaceWith(...s.childNodes);
    });
    // also walk open shadow roots of Salla web components
    root.querySelectorAll && root.querySelectorAll('*').forEach(el => { if (el.shadowRoot && !el.shadowRoot.__oy) { el.shadowRoot.__oy = 1; injectShadowStyle(el.shadowRoot); riyalize(el.shadowRoot); observe(el.shadowRoot); } });
  }
  function injectShadowStyle(sr) {
    const st = document.createElement('style');
    st.textContent = '.money{display:inline-flex;align-items:center;gap:.28em;direction:ltr;unicode-bidi:isolate;white-space:nowrap}.sar-i{height:.82em;width:auto;flex:none}';
    sr.appendChild(st);
  }
  let pending = new Set(), timer;
  function observe(target) {
    new MutationObserver(ms => {
      ms.forEach(m => { m.addedNodes.forEach(n => pending.add(n.nodeType === 1 ? n : n.parentElement)); if (m.type === 'characterData' && m.target.parentElement) pending.add(m.target.parentElement); });
      clearTimeout(timer); timer = setTimeout(() => { const l = [...pending]; pending.clear(); l.forEach(n => n && riyalize(n)); }, 40);
    }).observe(target, { childList: true, subtree: true, characterData: true });
  }

  /* ---------- Hero slider ---------- */
  function initSliders() {
    document.querySelectorAll('[data-oy-slider]').forEach(sl => {
      const slides = [...sl.querySelectorAll('.slide')]; if (slides.length < 2) return;
      const dots = sl.querySelector('[data-dots]'); let i = 0, t;
      slides.forEach((_, k) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'slide ' + (k + 1)); b.onclick = () => go(k); dots && dots.appendChild(b); });
      function go(k) { i = (k + slides.length) % slides.length; slides.forEach((s, n) => s.classList.toggle('on', n === i)); dots && [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i)); clearTimeout(t); t = setTimeout(() => go(i + 1), 6000); }
      sl.querySelector('[data-next]').onclick = () => go(i + 1);
      sl.querySelector('[data-prev]').onclick = () => go(i - 1);
      let x0 = null; sl.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
      sl.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + ((dx < 0) === isAr() ? -1 : 1)); x0 = null; });
      go(0);
    });
  }

  /* ---------- Product tabs + rail arrows ---------- */
  function initTabs() {
    document.querySelectorAll('[data-oy-tabs]').forEach(box => {
      box.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
        box.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b === btn));
        box.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== btn.dataset.tab; const l = p.querySelector('.s-products-list-wrapper'); if (l) l.scrollLeft = 0; });
      }));
    });
    document.querySelectorAll('.oy-rail').forEach(r => {
      const list = () => r.querySelector('.s-products-list-wrapper') || r.querySelector('salla-products-list');
      const step = d => { const l = list(); if (l) l.scrollBy({ left: d * (isAr() ? -1 : 1) * l.clientWidth * .8, behavior: 'smooth' }); };
      const n = r.querySelector('.rail-nav.next'), p = r.querySelector('.rail-nav.prev');
      n && (n.onclick = () => step(1)); p && (p.onclick = () => step(-1));
    });
  }

  /* ---------- Scent finder quiz ---------- */
  const QZ = {
    ar: [['متى ستستخدم العطر؟', [['day', 'للنهار والعمل'], ['evening', 'للمساء والمناسبات'], ['gift', 'هدية لشخص عزيز']]],
         ['أي عالم عطري يشدّك؟', [['amber', 'عنبري دافئ'], ['floral', 'زهري ناعم'], ['woody', 'خشبي عميق'], ['fresh', 'منعش وخفيف']]],
         ['كيف تحب حضوره؟', [['soft', 'هادئ وقريب'], ['mid', 'متوازن'], ['strong', 'واضح ويدوم']]],
         ['ميزانيتك؟', [['lo', 'أقل من 300'], ['mid', '300 – 600'], ['hi', 'أكثر من 600']]]],
    en: [['When will you wear it?', [['day', 'Day & work'], ['evening', 'Evenings & occasions'], ['gift', 'A gift']]],
         ['Which world draws you?', [['amber', 'Warm amber'], ['floral', 'Soft floral'], ['woody', 'Deep woody'], ['fresh', 'Fresh & light']]],
         ['How present should it be?', [['soft', 'Soft & close'], ['mid', 'Balanced'], ['strong', 'Bold & lasting']]],
         ['Your budget?', [['lo', 'Under 300'], ['mid', '300 – 600'], ['hi', 'Over 600']]]]
  };
  function initQuiz() {
    document.querySelectorAll('[data-oy-quiz-open]').forEach(btn => {
      const sec = btn.closest('.oy'); const modal = sec.querySelector('[data-oy-quiz]'); if (!modal) return;
      const body = modal.querySelector('[data-oy-quiz-body]'); let step = 0, ans = {};
      const Q = () => QZ[isAr() ? 'ar' : 'en'];
      function draw() {
        if (step >= Q().length) {
          const fam = ans[1] || 'amber'; const url = modal.dataset[fam] || '/';
          body.innerHTML = '<div class="qres"><span class="en">Your match</span><h3 class="display">' + (isAr() ? 'رشّحنا لك عالمك العطري' : 'We found your scent world') + '</h3><div class="qres-actions"><a class="btn" href="' + url + '">' + (isAr() ? 'شاهد الترشيحات' : 'See suggestions') + '</a><button class="ghost-btn" type="button" data-again>' + (isAr() ? 'أعد الاختبار' : 'Retake') + '</button></div></div>';
          body.querySelector('[data-again]').onclick = () => { step = 0; ans = {}; draw(); }; return;
        }
        const [q, opts] = Q()[step];
        body.innerHTML = '<div class="qprog"><span style="width:' + ((step) / Q().length * 100) + '%"></span></div><h3 class="display">' + q + '</h3><div class="qopts">' + opts.map(o => '<button class="qopt" type="button" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
        body.querySelectorAll('.qopt').forEach(b => b.onclick = () => { ans[step] = b.dataset.v; step++; draw(); });
      }
      const close = () => { modal.hidden = true; document.body.style.overflow = ''; };
      btn.addEventListener('click', () => { step = 0; ans = {}; draw(); modal.hidden = false; document.body.style.overflow = 'hidden'; });
      modal.querySelector('[data-oy-quiz-close]').onclick = close;
      modal.addEventListener('click', e => { if (e.target === modal) close(); });
    });
  }

  /* ---------- Footer accordion on mobile ---------- */
  /* ---------- Newsletter: opens Salla sign-up so the customer joins the store's list ---------- */
  function initNews() {
    document.querySelectorAll('[data-oy-news]').forEach(f => f.addEventListener('submit', e => {
      e.preventDefault();
      try { window.salla && salla.event.dispatch('login::open'); } catch (err) {}
      f.reset();
    }));
  }

  /* ---------- Reviews: hide the section while the store has no reviews yet ---------- */
  function initReviews() {
    const check = () => document.querySelectorAll('.oy .oy-reviews').forEach(box => {
      const sr = box.querySelector('salla-reviews'); if (!sr) return;
      const has = sr.querySelector('img, p, .s-reviews-testimonial, [class*="review"]') && sr.textContent.trim().length > 20;
      const blk = box.closest('.s-block'); if (blk) blk.style.display = has ? '' : 'none';
    });
    setTimeout(check, 2500); setTimeout(check, 6000);
  }

  function initSearchPh() {
    const ph = document.documentElement.dir === 'ltr' ? 'Search a perfume, brand or note…' : 'ابحث عن عطرك، ماركة أو نوتة…';
    const set = () => document.querySelectorAll('.oy .oy-search input').forEach(i => i.setAttribute('placeholder', ph));
    set(); setTimeout(set, 1200); setTimeout(set, 3500);
  }

  /* Footer columns follow the store's footer menu (Salla dashboard → القوائم → قائمة الفوتر):
     items with sub-links become headed columns; a flat menu becomes one "روابط مهمة" column. */
  function initFooterMenu() {
    const box = document.querySelector('[data-oy-fcols]');
    if (!box || !window.salla || !salla.api?.component?.getMenus) return;
    salla.api.component.getMenus('footer').then(({ data }) => {
      const items = (data || []).filter(i => i && i.title);
      if (!items.length) return;
      const ar = document.documentElement.dir !== 'ltr';
      const esc = v => String(v || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const a = i => `<a href="${esc(i.url)}"${i.target === '_blank' ? ' target="_blank" rel="noopener"' : ''}>${esc(i.title)}</a>`;
      const parents = items.filter(i => (i.children || []).length);
      const flat = items.filter(i => !(i.children || []).length);
      let html = parents.map(p => `<div class="fcol"><h4>${esc(p.title)}</h4>${p.children.map(a).join('')}</div>`).join('');
      if (flat.length) html += `<div class="fcol"><h4>${ar ? 'روابط مهمة' : 'Useful links'}</h4>${flat.map(a).join('')}</div>`;
      box.innerHTML = html;
      initFooter();
    }).catch(() => {});
  }
  function initFooter() {
    document.querySelectorAll('[data-oy-lang]').forEach(b => b.addEventListener('click', () => {
      if (b.classList.contains('on')) return;
      const m = document.querySelector('salla-localization-modal');
      try { m && m.open ? m.open() : salla.event.dispatch('localization::open'); } catch (e) {}
    }));
    document.querySelectorAll('.oy-foot .fcol h4').forEach(h => {
      if (h.querySelector('.pm')) return; const s = document.createElement('span'); s.className = 'pm'; s.textContent = '+'; h.appendChild(s);
      h.addEventListener('click', () => { if (innerWidth <= 820) h.parentElement.classList.toggle('open'); });
    });
  }

  ready(() => {
    initSliders(); initTabs(); initQuiz(); initFooter(); initNews(); initReviews(); initSearchPh(); initFooterMenu();
    riyalize(document.body); observe(document.body);
    // Salla components render after hydration; sweep again
    setTimeout(() => riyalize(document.body), 1500); setTimeout(() => riyalize(document.body), 4000);
  });
  window.oyRiyalize = riyalize;
};


/* Orygos store layer — builds the approved Orygos design on top of the Raed theme (Salla custom JS) */
(function(){
  if (window.__oyLoaded) return; window.__oyLoaded = 1;
  var BASE = (window.OY_BASE || 'https://cdn.jsdelivr.net/gh/omarfawzi1997/orygos-store-assets@main/');
  var root = document.documentElement; root.classList.add('oy-on');
  var l = document.createElement('link'); l.rel='stylesheet'; l.href=BASE+'oy.css?v='+(window.OY_VER||'1'); document.head.appendChild(l);
  var whenReady = function(fn){ document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn); };
  var whenSalla = function(fn){ var n=0; (function t(){ if(window.salla&&salla.config&&salla.url) return fn(); if(n++<100) setTimeout(t,50); else fn(); })(); };
  var ar = root.dir !== 'ltr';
  var isHome = function(){ try{ return salla.config.get('page.slug')==='index'; }catch(e){ return !!document.querySelector('main .s-block--hero-slider, main [class*=s-block--]') && location.pathname.split('/').filter(Boolean).length<=1; } };
  if (/\/?$/.test(location.pathname)) { /* home guess before salla boots */ }
  function patchCard(){
    var PC = customElements.get('custom-salla-product-card'); if(!PC || PC.prototype.__oy) return !!PC;
    var p = PC.prototype; p.__oy = 1;
    if(!p.escapeHTML) p.escapeHTML = ESC;
    p.renderOrygos = RO;
    var orig = p.render;
    p.render = function(){ if(this.closest && this.closest('.oy')) return this.renderOrygos(); return orig.apply(this, arguments); };
    return true;
  }
  function fixLinks(scope){
    var base; try{ base = salla.url.get(''); }catch(e){ base = location.origin + '/'; }
    base = String(base).replace(/\/?$/,'/');
    scope.querySelectorAll('a[href^="oy:"]').forEach(function(a){
      var p = a.getAttribute('href').slice(3);
      if(p.charAt(0)==='#' ) { a.setAttribute('href', isHome()? p : base + p); return; }
      a.setAttribute('href', base + p);
    });
  }
  function mount(parts){
    var h = document.querySelector('header.store-header:not(.oy-header)');
    var f = document.querySelector('footer.store-footer:not(.oy-footer)');
    var tmp = document.createElement('div');
    if (h && parts.h){ tmp.innerHTML = parts.h; var nh = tmp.firstElementChild; h.replaceWith(nh); fixLinks(nh); }
    if (f && parts.f){ tmp.innerHTML = parts.f; var frag=document.createDocumentFragment(); while(tmp.firstChild) frag.appendChild(tmp.firstChild); f.replaceWith(frag); }
    if (isHome() && parts.m){
      root.classList.add('oy-home');
      var main = document.querySelector('main#main-content') || document.querySelector('main');
      if (main){ var box = document.createElement('div'); box.className='oy-home-root'; box.innerHTML = parts.m; main.querySelectorAll(':scope > section.s-block').forEach(function(s){ s.remove(); }); var hk = main.querySelector('salla-hook'); hk ? hk.after(box) : main.prepend(box); }
    }
    fixLinks(document);
    try { window.oyBehaviours && window.oyBehaviours(); } catch(e){ console.warn('oy', e); }
  }
  patchCard() || customElements.whenDefined('custom-salla-product-card').then(patchCard);
  whenReady(function(){ whenSalla(function(){
    fetch(BASE + 'parts-' + (ar?'ar':'en') + '.json?v='+(window.OY_VER||'1')).then(function(r){ return r.json(); }).then(mount).catch(function(e){ console.warn('oy parts', e); root.classList.remove('oy-on','oy-home'); });
  }); });
  function ESC_(str){ str = str==null?'':String(str); return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var ESC = function(s){ return ESC_(s); };
  var RO = function(){ 
    const P = this.product, ar = document.documentElement.dir !== 'ltr';
    const num = v => { const n = Number(v && v.amount !== undefined ? v.amount : v); return isNaN(n) ? '' : String(Math.round(n * 100) / 100); };
    const sale = P.is_on_sale && P.regular_price && Number(P.regular_price) > Number(P.price);
    const pct = sale ? Math.round((1 - Number(P.sale_price || P.price) / Number(P.regular_price)) * 100) : 0;
    const out = !!P.is_out_of_stock;
    const label = P.preorder?.label || P.promotion_title || '';
    const cur = ar ? 'ر.س' : 'SAR';
    this.className = 'product' + (out ? ' is-out' : '');
    this.setAttribute('id', P.id);
    this.setAttribute('tabindex', '0');
    this.setAttribute('aria-label', P.name || '');
    const inWish = !salla.config.isGuest() && salla.storage.get('salla::wishlist', []).includes(Number(P.id));
    this.innerHTML = `
      <div class="img">${sale && pct > 0 ? `<span class="badge">-${pct}%</span>` : ''}<button type="button" class="fav ${inWish ? 'on' : ''}" aria-label="favourite"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"></path></svg></button><img src="${P?.image?.url || P?.thumbnail || this.placeholder || ''}" alt="${this.escapeHTML(P?.image?.alt || P.name)}" loading="lazy">${out ? `<span class="soldout">${ar ? 'نفذت الكمية' : 'Sold out'}</span>` : (label ? `<span class="ptag">${this.escapeHTML(label)}</span>` : '')}</div>
      <div class="p-info"><div class="p-top"><span class="p-brand">${this.escapeHTML(P.brand?.name || '')}</span>${P.rating?.stars ? `<span class="rate"><i>★</i> ${P.rating.stars}</span>` : ''}</div>
      <div class="p-name">${this.escapeHTML(P.name || '')}</div>
      <div class="price"><strong>${num(sale ? (P.sale_price || P.price) : P.price)} ${cur}</strong>${sale ? `<s>${num(P.regular_price)} ${cur}</s>` : ''}</div>
      <button type="button" class="add ${out ? 'notify' : ''}">${out ? (ar ? 'أعلمني عند التوفر' : 'Notify me') : (ar ? 'أضف للسلة' : 'Add to bag')}</button></div>`;
    const go = () => { if (P.url) location.href = P.url; };
    this.onclick = e => { if (!e.target.closest('button')) go(); };
    this.onkeydown = e => { if (e.key === 'Enter' && !e.target.closest('button')) go(); };
    this.querySelector('.fav').onclick = e => { e.stopPropagation(); e.currentTarget.classList.toggle('on'); try { salla.wishlist.toggle(P.id); } catch (err) {} };
    this.querySelector('.add').onclick = e => {
      e.stopPropagation();
      if (out || P.status !== 'sale' || P.has_options || P.type === 'booking') return go();
      try { salla.cart.addItem({ id: P.id, quantity: 1 }).catch(go); } catch (err) { go(); }
    };
   };
})();
