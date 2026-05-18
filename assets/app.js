/* Detoxblanc — unified interactions.
   Trước tiên swap header/footer về bản partial chuẩn,
   sau đó mới gắn các event handler dựa trên DOM thực tế.         */

(async function(){

  // ======== 1) SWAP HEADER + FOOTER PARTIALS (đồng nhất mọi trang) ========
  if (location.protocol !== 'file:') {
    try {
      const [headHtml, footHtml] = await Promise.all([
        fetch('assets/partials/header.html').then(r => r.ok ? r.text() : ''),
        fetch('assets/partials/footer.html').then(r => r.ok ? r.text() : '')
      ]);

      // HEADER: thay thế announce + topbar + site-header hiện có
      const announce = document.querySelector('body > .announce');
      const topbar   = document.querySelector('body > .topbar');
      const header   = document.querySelector('body > header.site-header');
      if (headHtml){
        const tpl = document.createElement('template');
        tpl.innerHTML = headHtml.trim();
        if (announce){
          topbar?.remove();
          header?.remove();
          announce.replaceWith(tpl.content);
        } else {
          document.body.prepend(tpl.content);
        }
      }

      // FOOTER: thay newsletter + site-footer + floating
      const existingNewsletter = document.querySelector('body > .newsletter');
      const footer   = document.querySelector('body > footer.site-footer');
      const floating = document.querySelector('body > .floating');
      if (footHtml){
        const tpl = document.createElement('template');
        tpl.innerHTML = footHtml.trim();
        if (footer){
          existingNewsletter?.remove();
          floating?.remove();
          footer.replaceWith(tpl.content);
        } else {
          document.body.append(tpl.content);
        }
      }
    } catch(err){ console.warn('Partial load failed:', err); }
  }

  // ======== 1.5) OVERRIDE FOOTER NỘI DUNG TỪ FIRESTORE (nếu có) ========
  applyFooterConfig();
  window.addEventListener('dtx:firebase-ready', applyFooterConfig, { once: true });

  async function applyFooterConfig(){
    try {
      let cfg = null;
      if (window.DTX_FIREBASE?.enabled){
        const fb = window.DTX_FIREBASE;
        const snap = await fb.dbMethods.getDoc(fb.dbMethods.doc(fb.db, 'settings', 'footer'));
        if (snap.exists()) cfg = snap.data();
      } else {
        const ls = localStorage.getItem('dtx_footer_config');
        if (ls) cfg = JSON.parse(ls);
      }
      if (!cfg) return;
      applyFooterToDOM(cfg);
    } catch(err){ console.warn('Footer config load failed:', err); }
  }

  function applyFooterToDOM(c){
    const esc = s => String(s||'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const footer = document.querySelector('footer.site-footer');
    if (!footer) return;

    // Company block
    if (c.company){
      const aboutP = footer.querySelector('.footer-about');
      if (aboutP) aboutP.textContent = c.company.description || aboutP.textContent;
      const logoText = footer.querySelector('.logo-light .logo-text');
      if (logoText){
        logoText.innerHTML = `<strong>${esc(c.company.brand||'DETOXBLANC')}</strong><em>${esc(c.company.slogan||'')}</em>`;
      }
      const contact = footer.querySelector('.footer-contact');
      if (contact){
        contact.innerHTML = `
          <li><i class="fa-solid fa-location-dot"></i> ${esc(c.company.address||'')}</li>
          <li><i class="fa-solid fa-phone"></i> <a href="tel:${esc((c.company.phone||'').replace(/\s+/g,''))}">${esc(c.company.phone||'')}</a></li>
          <li><i class="fa-solid fa-envelope"></i> <a href="mailto:${esc(c.company.email||'')}">${esc(c.company.email||'')}</a></li>
        `;
      }
    }

    // Socials
    if (Array.isArray(c.socials)){
      const sc = footer.querySelector('.socials');
      if (sc){
        sc.innerHTML = c.socials.map(s =>
          `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}"><i class="${esc(s.icon)}"></i></a>`
        ).join('');
      }
    }

    // Columns (Thương hiệu, Mua sắm, Hỗ trợ)
    if (Array.isArray(c.columns)){
      const cols = footer.querySelectorAll('.footer-grid > div');
      // cols[0] = company, cols[1..3] = menu columns, cols[4] = app
      c.columns.forEach((col, i) => {
        const target = cols[i+1];
        if (!target) return;
        target.innerHTML = `
          <h4>${esc(col.title)}</h4>
          <ul>${(col.links||[]).map(l => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('')}</ul>
        `;
      });
    }

    // App + Payments
    if (c.app){
      const appCol = footer.querySelectorAll('.footer-grid > div')[4];
      if (appCol){
        const paymentsHTML = (c.payments||[]).map(p => `<span class="pay">${esc(p)}</span>`).join('');
        appCol.innerHTML = `
          <h4>${esc(c.app.title||'Ứng dụng')}</h4>
          <p class="footer-app">${esc(c.app.description||'')}</p>
          <div class="store-btns sm">
            <a href="${esc(c.app.iosUrl||'#')}" target="_blank" rel="noopener" class="store-btn"><i class="fa-brands fa-apple"></i><span><small>Tải về trên</small>App Store</span></a>
            <a href="${esc(c.app.androidUrl||'#')}" target="_blank" rel="noopener" class="store-btn"><i class="fa-brands fa-google-play"></i><span><small>Tải về trên</small>Google Play</span></a>
          </div>
          <h4 class="mt-24">Thanh toán</h4>
          <div class="pay-row">${paymentsHTML}</div>
        `;
      }
    }

    // Copyright
    if (c.copyright){
      const cr = footer.querySelector('.copyright-inner');
      if (cr){
        cr.innerHTML = `
          <span>${esc(c.copyright.text||'')}</span>
          <div class="legal">${(c.copyright.links||[]).map(l => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</div>
        `;
      }
    }
  }

  // ======== 2) MARK ACTIVE NAV ITEM ========
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const navMap = {
    'index.html':'index','':'index',
    'category.html':'category','product.html':'category','gift.html':'category','wishlist.html':'category','search.html':'category',
    'about.html':'about','safety.html':'about','careers.html':'about','dealer.html':'about',
    'science.html':'science',
    'ritual.html':'ritual',
    'article.html':'article','journal.html':'article',
    'contact.html':'contact',
    // login, account, terms, cookie, sitemap — không làm active main nav
  };
  const active = navMap[page];
  if (active){
    document.querySelectorAll('.main-nav [data-nav="'+active+'"]').forEach(a => a.classList.add('active'));
  }

  // ======== 3) GẮN HANDLERS ========
  attachCoreHandlers();
  attachPageHandlers();

})();


/* --------------------------- CORE HANDLERS --------------------------- */
function attachCoreHandlers(){

  // Header scrolled state + back-to-top
  const header = document.querySelector('.site-header');
  const toTop  = document.getElementById('toTop');
  const onScroll = () => {
    header?.classList.toggle('scrolled', window.scrollY > 20);
    toTop?.classList.toggle('show', window.scrollY > 500);
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  // Smooth anchor scroll trong cùng trang
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id && id.length > 1){
        const el = document.querySelector(id);
        if (el){ e.preventDefault(); el.scrollIntoView({ behavior:'smooth', block:'start' }); }
      }
    });
  });

  // Back-to-top
  toTop?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

  // Burger mở/đóng main-nav trên mobile (giữ aria-expanded đồng bộ)
  const burger = document.querySelector('.burger');
  const nav    = document.querySelector('.main-nav');
  burger?.addEventListener('click', () => {
    const opened = nav?.classList.toggle('open');
    burger.setAttribute('aria-expanded', opened ? 'true' : 'false');
  });

  // Locale dropdown — đồng bộ aria-expanded theo focus/hover
  const localeBtn = document.querySelector('.locale-btn');
  const localeBox = document.querySelector('.locale');
  if (localeBtn && localeBox){
    const setExpanded = v => localeBtn.setAttribute('aria-expanded', v ? 'true' : 'false');
    localeBox.addEventListener('mouseenter', () => setExpanded(true));
    localeBox.addEventListener('mouseleave', () => setExpanded(false));
    localeBox.addEventListener('focusin',   () => setExpanded(true));
    localeBox.addEventListener('focusout',  () => setExpanded(false));
  }

  // Seed giỏ hàng demo nếu chưa có (giữ trải nghiệm nhất quán với giao diện)
  if (!localStorage.getItem('dtx_cart')){
    localStorage.setItem('dtx_cart', JSON.stringify([
      { id:'DTX-N01-30ML', name:'Radiance Serum N°1', qty:1, price:980000 },
      { id:'DTX-SUN-50',   name:'Sun Shield Fluid SPF50+', qty:1, price:620000 }
    ]));
  }

  // Cart badge — đồng bộ với localStorage('dtx_cart')
  syncCartBadge();
  window.addEventListener('storage', e => { if (e.key === 'dtx_cart') syncCartBadge(); });
  window.addEventListener('dtx:cart-updated', syncCartBadge);
}

/* Đọc dtx_cart từ localStorage và cập nhật badge trên icon giỏ hàng.
   Format dự kiến: [{id, qty, ...}] — fallback về số nguyên nếu là số. */
function syncCartBadge(){
  const badge = document.querySelector('.header-actions a[aria-label="Giỏ hàng"] .badge');
  if (!badge) return;
  let count = 0;
  try {
    const raw = localStorage.getItem('dtx_cart');
    if (raw){
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)){
        count = parsed.reduce((s, it) => s + (Number(it?.qty) || 1), 0);
      } else if (typeof parsed === 'number'){
        count = parsed;
      }
    }
  } catch(_){ /* noop */ }
  if (count > 0){
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = '';
  } else {
    badge.textContent = '0';
    badge.style.display = 'none';
  }
}


/* --------------------------- PAGE-LEVEL HANDLERS --------------------------- */
function attachPageHandlers(){

  // Product tabs (nếu có)
  document.querySelectorAll('.product-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.product-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
  document.querySelectorAll(`
    .cat-card,.product-card,.tm-card,.news-card,
    .hero-copy,.hero-visual,.story-copy,.story-visual,
    .ing-visual,.ing-copy,.sci-stat,.ritual-step,.value-card,
    .statement-head,.ba-slider,.ba-copy,.finder-card,.certstrip li,
    .cat-hero-visual,.method-card,.active-card,.commit-card,.blist-item,
    .gift-card,.tier-pane,.db-card,.cv,.job-card,.team-card
  `).forEach(el => { el.classList.add('reveal'); io.observe(el); });

  // Finder card select
  document.querySelectorAll('.finder-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.finder-card').forEach(c => c.style.background = '');
      card.style.background = 'var(--brand)';
      card.style.color = '#fff';
    });
  });

  // Counter animation
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const int = setInterval(() => {
          cur += step;
          if (cur >= target){ cur = target; clearInterval(int); }
          el.textContent = cur;
        }, 28);
        counterIO.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.sci-num').forEach(el => counterIO.observe(el));

  // Before / After slider
  const slider = document.getElementById('baSlider');
  if (slider){
    const handle = document.getElementById('baHandle');
    const before = document.getElementById('baBefore');
    let active = false;
    const setPos = xPct => {
      const p = Math.max(5, Math.min(95, xPct));
      handle.style.left = p + '%';
      before.style.clipPath = `inset(0 ${100-p}% 0 0)`;
    };
    const onMove = e => {
      if (!active) return;
      const rect = slider.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX);
      setPos(((cx - rect.left) / rect.width) * 100);
    };
    slider.addEventListener('mousedown', e => { active = true; onMove(e); });
    slider.addEventListener('touchstart', e => { active = true; onMove(e); }, { passive:true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive:true });
    window.addEventListener('mouseup', () => active = false);
    window.addEventListener('touchend', () => active = false);
    setPos(50);
  }

  // Wishlist toggle (UI only)
  document.querySelectorAll('.wish').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const icon = btn.querySelector('i');
      const filled = icon.classList.contains('fa-solid');
      icon.classList.toggle('fa-regular', filled);
      icon.classList.toggle('fa-solid', !filled);
      btn.style.color = filled ? '' : 'var(--brand)';
    });
  });

  // Dot-swatch selected state
  document.querySelectorAll('.variants').forEach(group => {
    const dots = group.querySelectorAll('.dot-swatch');
    dots.forEach(d => d.addEventListener('click', () => {
      dots.forEach(x => x.style.outline = '');
      d.style.outline = '2px solid var(--brand)';
      d.style.outlineOffset = '2px';
    }));
  });

  // Chip / tab / view — toggle active trong cùng parent (robust selector)
  const toggleGroups = [
    '.cat-filters-trig .cat-chip',
    '.jobs-filter .cat-chip',
    '.gift-occasions .gift-occasion',
    '.cat-view button',
  ];
  toggleGroups.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('click', () => {
        const parent = el.parentElement;
        if (!parent) return;
        [...parent.children].forEach(s => s.classList.remove('active'));
        el.classList.add('active');
      });
    });
  });

  // FAQ sidebar active (scroll-spy based)
  const faqLinks = document.querySelectorAll('.faq-side nav a');
  if (faqLinks.length){
    const targets = [...faqLinks].map(a => document.querySelector(a.getAttribute('href')));
    const spy = () => {
      const y = window.scrollY + 120;
      let idx = 0;
      targets.forEach((t, i) => { if (t && t.offsetTop <= y) idx = i; });
      faqLinks.forEach((l, i) => l.classList.toggle('active', i === idx));
    };
    window.addEventListener('scroll', spy, { passive:true });
    spy();
  }

  // Mega-menu: submenu toggle khi tap trên mobile
  document.querySelectorAll('.nav-item.has-mega > a').forEach(a => {
    a.addEventListener('click', e => {
      if (window.innerWidth <= 1080){
        e.preventDefault();
        a.parentElement.classList.toggle('open-sub');
      }
    });
  });
}
