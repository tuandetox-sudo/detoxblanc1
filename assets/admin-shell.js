/* =========================================================================
   Detoxblanc Admin — shared shell (sidebar + topbar) injector.

   Usage in any admin page:
     <body data-adm-page="products">
       <a class="skip-link" href="#adm-content">Đi tới nội dung chính</a>
       <div class="adm-app">
         <div data-adm-shell
              data-crumbs='[{"label":"Admin","href":"admin.html"},{"label":"Sản phẩm"}]'
              data-title="Sản phẩm">
         </div>
         <div class="adm-canvas">
           <!-- topbar + page content rendered by shell -->
         </div>
       </div>
       <script src="assets/admin-shell.js"></script>

   The shell reads:
     body[data-adm-page]       — key matched against nav items (active state)
     [data-adm-shell]          — mount point (replaced by sidebar)
     [data-crumbs]             — JSON array of {label,href?} for breadcrumbs
     [data-title]              — topbar page title (optional)
   ========================================================================= */
(function(){
  'use strict';

  /* ---------------- Navigation config ---------------- */
  const NAV = [
    { group: 'Tổng quan', items: [
      { key:'dashboard', href:'admin.html',            icon:'gauge-high',    label:'Dashboard' },
      { key:'analytics', href:'admin-coming-soon.html?feat=analytics', icon:'chart-line', label:'Phân tích', soon:true },
      { key:'reports',   href:'admin-reports.html',     icon:'file-invoice',  label:'Báo cáo' },
    ]},
    { group: 'Bán hàng', items: [
      { key:'orders',    href:'admin-orders.html',      icon:'cart-shopping', label:'Đơn hàng',    dynamicCount:'orders' },
      { key:'returns',   href:'admin-returns.html',     icon:'arrow-rotate-left', label:'Đổi / trả', dynamicCount:'returns' },
      { key:'vouchers',  href:'admin-vouchers.html',    icon:'ticket',        label:'Voucher' },
      { key:'customers', href:'admin-customers.html',   icon:'users',         label:'Khách hàng' },
    ]},
    { group: 'Sản phẩm', items: [
      { key:'products',  href:'admin-products.html',    icon:'box-archive',   label:'Catalog', dynamicCount:'products' },
      { key:'inventory', href:'admin-inventory.html',   icon:'warehouse',     label:'Kho hàng', dotNew:true },
      { key:'collections', href:'admin-collections.html', icon:'layer-group', label:'Bộ sưu tập' },
      { key:'qr',        href:'admin-coming-soon.html?feat=qr', icon:'qrcode', label:'QR chính hãng', soon:true },
    ]},
    { group: 'Nội dung', items: [
      { key:'articles',  href:'admin-articles.html',    icon:'newspaper',     label:'Bài viết' },
      { key:'pages',     href:'admin-pages.html',       icon:'file-lines',    label:'Trang tĩnh' },
      { key:'footer',    href:'admin-footer.html',      icon:'window-minimize', label:'Chân trang' },
      { key:'reviews',   href:'admin-reviews.html',     icon:'comments',      label:'Đánh giá',    dynamicCount:'reviews' },
      { key:'newsletter',href:'admin-newsletter.html',  icon:'envelope-open-text', label:'Newsletter' },
    ]},
    { group: 'Hệ thống', items: [
      { key:'users',     href:'admin-users.html',       icon:'user-shield',   label:'Người dùng · RBAC' },
      { key:'logs',      href:'admin-audit.html',       icon:'clipboard-list', label:'Nhật ký' },
      { key:'integrations', href:'admin-coming-soon.html?feat=integrations', icon:'plug', label:'Tích hợp', soon:true },
      { key:'settings',  href:'admin-settings.html',    icon:'gear',          label:'Cài đặt' },
    ]},
  ];

  /* ---------------- Helpers ---------------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function productCount(){
    try { return (window.DTX_ADMIN?.all()?.length) ?? 34; } catch(_) { return 34; }
  }
  const COUNTERS = {
    products: () => { try { return window.DTX_ADMIN?.all()?.length ?? 0; } catch(_) { return 0; } },
    orders:   () => { try { return window.DTX_ADMIN_ORDERS?.all()?.filter(o => o.status === 'pending' || o.status === 'packing').length ?? 0; } catch(_) { return 0; } },
    reviews:  () => { try { return window.DTX_ADMIN_REVIEWS?.all()?.filter(r => r.status === 'pending').length ?? 0; } catch(_) { return 0; } },
    returns:  () => { try { return window.DTX_ADMIN_RETURNS?.all()?.filter(r => r.status === 'requested' || r.status === 'approved' || r.status === 'received').length ?? 0; } catch(_) { return 0; } },
  };

  /* ---------------- Sidebar HTML ---------------- */
  function sidebarHTML(activeKey){
    const groupsHTML = NAV.map(g => {
      const itemsHTML = g.items.map(it => {
        const cls = ['nav-item'];
        if (it.key === activeKey) cls.push('active');
        if (it.soon) cls.push('is-soon');
        const dyn = it.dynamicCount;
        const count = dyn
          ? `<span class="count" data-count="${dyn === true ? 'products' : dyn}">${(COUNTERS[dyn === true ? 'products' : dyn] || (()=>0))()}</span>`
          : (it.count != null ? `<span class="count">${it.count}</span>` : '');
        const dot = it.dotNew ? '<span class="dot-new" aria-label="Thông báo mới"></span>' : '';
        const soonBadge = it.soon ? '<span class="soon-badge" title="Tính năng đang phát triển — v1.1">Soon</span>' : '';
        return `<a href="${it.href}" class="${cls.join(' ')}" data-nav="${it.key}">
          <i class="fa-solid fa-${it.icon}" aria-hidden="true"></i> ${esc(it.label)}
          ${count}${soonBadge}${dot}
        </a>`;
      }).join('');
      return `<div class="adm-nav-group">
        <h6>${esc(g.group)}</h6>
        ${itemsHTML}
      </div>`;
    }).join('');

    return `
      <a class="adm-brand" href="admin.html">
        <span class="mark" aria-hidden="true">DB</span>
        <span>
          <strong>Detoxblanc</strong>
          <small>Admin Console</small>
        </span>
      </a>

      <button class="adm-ws" aria-haspopup="menu" aria-expanded="false" aria-label="Chọn workspace">
        <span class="ws-flag">VN</span>
        <span class="ws-meta">
          <strong>Detoxblanc · Việt Nam</strong>
          <span>Production · Primary</span>
        </span>
        <i class="fa-solid fa-chevron-down chev" aria-hidden="true"></i>
      </button>

      <nav class="adm-nav">${groupsHTML}</nav>

      <div class="adm-side-foot">
        <div class="adm-quota">
          <span>Dung lượng media</span>
          <strong style="color:var(--a-ink);margin-left:6px">6.2 / 10 GB</strong>
          <div class="bar"><i></i></div>
        </div>
        <button class="adm-user" aria-haspopup="menu" aria-expanded="false" aria-label="Menu tài khoản">
          <span class="avatar">MA</span>
          <span class="uinfo">
            <strong>Trần Mai Anh</strong>
            <span>mai.anh@detoxblanc.com</span>
          </span>
          <i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i>
        </button>
      </div>
    `;
  }

  /* ---------------- Topbar HTML ---------------- */
  function topbarHTML(crumbs){
    const crumbsList = crumbs.map((c, i, arr) => {
      const last = i === arr.length - 1;
      if (last) return `<span class="cur">${esc(c.label)}</span>`;
      const sep = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
      const link = c.href ? `<a href="${c.href}">${esc(c.label)}</a>` : `<span>${esc(c.label)}</span>`;
      return `${link}${sep}`;
    }).join('');

    return `
      <button class="adm-burger" aria-label="Mở điều hướng" type="button" data-adm-burger>
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>
      <nav class="adm-crumbs" aria-label="Đường dẫn">${crumbsList}</nav>
      <div class="adm-search" role="search">
        <i class="fa-solid fa-magnifying-glass sic" aria-hidden="true"></i>
        <input type="search" placeholder="Tìm đơn hàng, sản phẩm, khách hàng…" aria-label="Tìm kiếm toàn hệ thống" />
        <span class="kbd" aria-hidden="true">⌘K</span>
      </div>
      <div class="adm-topbar-actions">
        <button class="adm-iconbtn" type="button" aria-label="Thay đổi giao diện sáng/tối" data-adm-theme title="Sáng / Tối">
          <i class="fa-solid fa-moon" id="themeIcon" aria-hidden="true"></i>
        </button>
        <button class="adm-iconbtn" type="button" aria-label="Trợ giúp" title="Trợ giúp">
          <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
        </button>
        <button class="adm-iconbtn" type="button" aria-label="Thông báo · 4 mới" title="Thông báo">
          <i class="fa-regular fa-bell" aria-hidden="true"></i>
          <span class="badge">4</span>
        </button>
      </div>
    `;
  }

  /* ---------------- Mount ---------------- */
  function mount(){
    const shellMount = document.querySelector('[data-adm-shell]');
    if (!shellMount) return; // admin.html (inline) or non-shell page

    const activeKey = document.body.getAttribute('data-adm-page') || '';
    let crumbs;
    try { crumbs = JSON.parse(shellMount.getAttribute('data-crumbs') || '[]'); }
    catch(_){ crumbs = [{label:'Admin', href:'admin.html'}]; }
    if (!crumbs.length) crumbs = [{label:'Admin', href:'admin.html'}];

    // Build sidebar <aside>
    const aside = document.createElement('aside');
    aside.className = 'adm-sidebar';
    aside.id = 'adm-sidebar';
    aside.setAttribute('aria-label', 'Điều hướng chính');
    aside.innerHTML = sidebarHTML(activeKey);
    shellMount.replaceWith(aside);

    // Build topbar inside .adm-canvas (prepend)
    const canvas = document.querySelector('.adm-canvas');
    if (canvas){
      const header = document.createElement('header');
      header.className = 'adm-topbar';
      header.setAttribute('role', 'banner');
      header.innerHTML = topbarHTML(crumbs);
      canvas.prepend(header);
    }

    wireTheme();
    wireBurger();
    wireCmdK();
    wireProductCountSync();
  }

  /* ---------------- Wiring ---------------- */
  function wireTheme(){
    // initial apply
    const saved = localStorage.getItem('dtx_admin_theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    syncThemeIcon();

    document.querySelectorAll('[data-adm-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') ||
          (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('dtx_admin_theme', next);
        syncThemeIcon();
      });
    });
  }
  function syncThemeIcon(){
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    const eff = document.documentElement.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    icon.className = eff === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  function wireBurger(){
    document.querySelectorAll('[data-adm-burger]').forEach(b => {
      b.addEventListener('click', () => {
        document.getElementById('adm-sidebar')?.classList.toggle('open');
      });
    });
  }

  function wireCmdK(){
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
        e.preventDefault();
        document.querySelector('.adm-topbar .adm-search input')?.focus();
      }
    });
  }

  function wireProductCountSync(){
    const update = () => {
      document.querySelectorAll('[data-count]').forEach(el => {
        const key = el.dataset.count;
        const fn = COUNTERS[key];
        if (fn) el.textContent = fn();
      });
    };
    window.addEventListener('dtx:products-updated', update);
    window.addEventListener('dtx:orders-updated', update);
    window.addEventListener('dtx:reviews-updated', update);
    window.addEventListener('dtx:returns-updated', update);
  }

  /* ---------------- Toast helper (used by CRUD pages) ---------------- */
  window.admToast = function(msg, kind){
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap){ wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    const icon = kind === 'danger' ? 'circle-exclamation'
               : kind === 'warn'   ? 'triangle-exclamation'
               : kind === 'info'   ? 'circle-info'
               : 'circle-check';
    t.innerHTML = `<i class="fa-solid fa-${icon}" aria-hidden="true"></i><span>${esc(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 2600);
    setTimeout(() => t.remove(), 3000);
  };

  /* ---------------- Init ---------------- */
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
