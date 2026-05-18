/* =========================================================================
   Detoxblanc Admin — extended data layers (orders, customers, inventory,
   vouchers, articles, users, audit, settings).

   Same pattern as admin-data.js: localStorage-backed CRUD + seed + events.
   Each domain exposes DTX_ADMIN_<domain> on window with: all/get/create/update/remove/reset.
   Load AFTER admin-data.js.
   ========================================================================= */
(function () {
  'use strict';

  const uid = (p) => p + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const nowISO = () => new Date().toISOString();
  const fmtVND = (n) => (n == null ? '' : Number(n).toLocaleString('vi-VN') + '₫');

  function makeStore(key, seedKey, seed, opts) {
    const { eventName, normalize } = opts || {};
    function load() {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch (_) {}
      return null;
    }
    function save(list) {
      localStorage.setItem(key, JSON.stringify(list));
      if (eventName) window.dispatchEvent(new CustomEvent(eventName, { detail: { count: list.length } }));
    }
    function seedIfNeeded() {
      if (localStorage.getItem(seedKey)) return load() || [];
      const seeded = (typeof seed === 'function' ? seed() : seed).map((x, i) =>
        normalize ? normalize(x, i) : x,
      );
      save(seeded);
      localStorage.setItem(seedKey, '1');
      return seeded;
    }
    return {
      all() { return load() || seedIfNeeded(); },
      get(id) { return this.all().find((x) => x.id === id) || null; },
      create(partial) {
        const list = this.all();
        const x = normalize ? normalize(partial, list.length) : partial;
        list.unshift(x);
        save(list);
        return x;
      },
      update(id, patch) {
        const list = this.all();
        const idx = list.findIndex((x) => x.id === id);
        if (idx < 0) return null;
        list[idx] = normalize
          ? normalize({ ...list[idx], ...patch, id }, idx)
          : { ...list[idx], ...patch, id, updatedAt: nowISO() };
        save(list);
        return list[idx];
      },
      remove(id) { save(this.all().filter((x) => x.id !== id)); },
      removeMany(ids) {
        const set = new Set(ids);
        save(this.all().filter((x) => !set.has(x.id)));
      },
      reset() {
        localStorage.removeItem(key);
        localStorage.removeItem(seedKey);
        return this.all();
      },
      save,
    };
  }

  /* ───────────────── Orders ───────────────────────────────────── */

  const ORDER_STATUSES = ['pending', 'confirmed', 'packing', 'shipping', 'delivered', 'returned', 'cancelled'];
  const PAY_METHODS = ['cod', 'vnpay', 'momo', 'bank_transfer'];
  const PAY_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

  function seedOrders() {
    const customers = [
      { name: 'Nguyễn Mai Anh',   phone: '0901234567', province: 'TP. Hồ Chí Minh' },
      { name: 'Trần Thu Hà',      phone: '0912345678', province: 'Hà Nội' },
      { name: 'Lê Minh Tuấn',     phone: '0923456789', province: 'Đà Nẵng' },
      { name: 'Phạm Ngọc Linh',   phone: '0934567890', province: 'Cần Thơ' },
      { name: 'Vũ Thanh Hằng',    phone: '0945678901', province: 'Hải Phòng' },
      { name: 'Đỗ Quang Huy',     phone: '0956789012', province: 'Nghệ An' },
      { name: 'Hoàng Bảo Châu',   phone: '0967890123', province: 'Bình Dương' },
      { name: 'Bùi Gia Khánh',    phone: '0978901234', province: 'Quảng Ninh' },
    ];
    const products = [
      { name: 'Radiance Serum N°1', price: 980000 },
      { name: 'Bright C+ Serum N°7', price: 820000 },
      { name: 'Barrier Cream N°4', price: 890000 },
      { name: 'Night Retinol N°9', price: 1050000 },
      { name: 'Sun Shield Fluid SPF50+', price: 620000 },
      { name: 'Melano Expert Set', price: 1780000 },
      { name: 'Azelaic Booster', price: 720000 },
    ];
    const out = [];
    for (let i = 0; i < 48; i++) {
      const c = customers[i % customers.length];
      const nItems = 1 + (i % 3);
      const items = [];
      let subtotal = 0;
      for (let j = 0; j < nItems; j++) {
        const p = products[(i + j) % products.length];
        const qty = 1 + ((i + j) % 3);
        items.push({ name: p.name, priceUnit: p.price, qty, subtotal: p.price * qty });
        subtotal += p.price * qty;
      }
      const shippingFee = 30000;
      const discount = i % 5 === 0 ? 50000 : 0;
      const total = subtotal + shippingFee - discount;
      const daysAgo = Math.floor(i / 2);
      const placedAt = new Date(Date.now() - daysAgo * 86400000 - (i % 24) * 3600000).toISOString();
      const statusIdx = Math.min(ORDER_STATUSES.length - 1, Math.floor(i / 8) + (i % 7 === 0 ? 1 : 0));
      out.push({
        customer: c,
        items,
        subtotal,
        discountTotal: discount,
        shippingFee,
        total,
        status: ORDER_STATUSES[Math.min(statusIdx, 4)],
        paymentStatus: i % 3 === 0 ? 'paid' : i % 5 === 0 ? 'pending' : 'paid',
        paymentMethod: PAY_METHODS[i % PAY_METHODS.length],
        shippingAddress: { fullName: c.name, phone: c.phone, province: c.province, district: 'Quận 1', ward: 'Phường Bến Nghé', line1: `${12 + i} Lý Tự Trọng` },
        voucherCode: i % 5 === 0 ? 'WELCOME50' : null,
        notes: i % 7 === 0 ? 'Giao giờ hành chính' : '',
        placedAt,
      });
    }
    return out;
  }

  function normalizeOrder(o, i) {
    const id = o.id || uid('ord');
    const code = o.code || 'DTX-' + new Date().getFullYear().toString().slice(-2) + '-' + String(10000 + i + 1);
    return {
      id,
      code,
      customer: o.customer || { name: 'Khách vãng lai', phone: '', province: '' },
      items: Array.isArray(o.items) ? o.items : [],
      subtotal: Number(o.subtotal || 0),
      discountTotal: Number(o.discountTotal || 0),
      shippingFee: Number(o.shippingFee || 0),
      tax: Number(o.tax || 0),
      total: Number(o.total || 0),
      status: o.status || 'pending',
      paymentStatus: o.paymentStatus || 'pending',
      paymentMethod: o.paymentMethod || 'cod',
      shippingAddress: o.shippingAddress || null,
      billingAddress: o.billingAddress || null,
      voucherCode: o.voucherCode || null,
      notes: o.notes || '',
      placedAt: o.placedAt || nowISO(),
      paidAt: o.paidAt || null,
      shippedAt: o.shippedAt || null,
      deliveredAt: o.deliveredAt || null,
      cancelledAt: o.cancelledAt || null,
      createdAt: o.createdAt || nowISO(),
      updatedAt: nowISO(),
    };
  }

  const Orders = makeStore('dtx_admin_orders', 'dtx_admin_orders_seeded_v1', seedOrders, {
    eventName: 'dtx:orders-updated',
    normalize: normalizeOrder,
  });
  Orders.STATUSES = ORDER_STATUSES;
  Orders.PAY_METHODS = PAY_METHODS;
  Orders.PAY_STATUSES = PAY_STATUSES;
  Orders.statusLabel = (s) => ({
    pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', packing: 'Đang đóng gói',
    shipping: 'Đang giao', delivered: 'Đã giao', returned: 'Đã trả', cancelled: 'Đã huỷ',
  })[s] || s;
  Orders.paymentLabel = (s) => ({ pending: 'Chưa thanh toán', paid: 'Đã thanh toán', refunded: 'Đã hoàn', failed: 'Thất bại' })[s] || s;

  /* ───────────────── Customers ────────────────────────────────── */

  function seedCustomers() {
    const base = [
      { name: 'Nguyễn Mai Anh',   email: 'maianh@example.com',   phone: '0901234567', province: 'TP. Hồ Chí Minh', tags: ['VIP'], spend: 12_480_000, orders: 18 },
      { name: 'Trần Thu Hà',      email: 'thuha@example.com',    phone: '0912345678', province: 'Hà Nội',          tags: ['VIP', 'Newsletter'], spend: 8_920_000, orders: 14 },
      { name: 'Lê Minh Tuấn',     email: 'mtuan@example.com',    phone: '0923456789', province: 'Đà Nẵng',         tags: ['Quan tâm Retinol'], spend: 3_450_000, orders: 6 },
      { name: 'Phạm Ngọc Linh',   email: 'nlinh@example.com',    phone: '0934567890', province: 'Cần Thơ',         tags: [], spend: 1_800_000, orders: 3 },
      { name: 'Vũ Thanh Hằng',    email: 'hang.vu@example.com',  phone: '0945678901', province: 'Hải Phòng',       tags: ['Newsletter'], spend: 920_000, orders: 2 },
      { name: 'Đỗ Quang Huy',     email: 'huy.do@example.com',   phone: '0956789012', province: 'Nghệ An',         tags: [], spend: 580_000, orders: 1 },
      { name: 'Hoàng Bảo Châu',   email: 'chau.hb@example.com',  phone: '0967890123', province: 'Bình Dương',      tags: ['VIP'], spend: 15_200_000, orders: 22 },
      { name: 'Bùi Gia Khánh',    email: 'khanh.bg@example.com', phone: '0978901234', province: 'Quảng Ninh',      tags: ['Quan tâm SPF'], spend: 2_100_000, orders: 4 },
      { name: 'Ngô Thị Thu Thuỷ', email: 'thuy.nt@example.com',  phone: '0989012345', province: 'Thanh Hoá',       tags: [], spend: 450_000, orders: 1 },
      { name: 'Phan Đức Minh',    email: 'minh.pd@example.com',  phone: '0990123456', province: 'Thừa Thiên Huế',  tags: ['Newsletter'], spend: 1_240_000, orders: 3 },
    ];
    // pad 40 thêm
    for (let i = 0; i < 40; i++) {
      const src = base[i % base.length];
      base.push({
        ...src,
        name: src.name + ' ' + String.fromCharCode(65 + (i % 26)),
        email: i + src.email.replace('@', '+' + i + '@'),
        phone: String(Number(src.phone) + i + 1).slice(-10),
        spend: Math.floor(src.spend / 2 + (i * 170000)),
        orders: 1 + (i % 8),
        tags: i % 4 === 0 ? ['Newsletter'] : [],
      });
    }
    return base;
  }

  // Loyalty helpers (FE simulation — mirrors api/src/customers/loyalty.ts thresholds)
  function computeTier(spend) {
    if (spend >= 50_000_000) return 'platinum';
    if (spend >= 10_000_000) return 'gold';
    if (spend >=  2_000_000) return 'silver';
    return 'bronze';
  }
  function computeSegment(c) {
    if (c.segment === 'blacklist') return 'blacklist';
    const now = Date.now();
    const daysCreate = (now - new Date(c.createdAt || Date.now()).getTime()) / 86400000;
    const daysOrder = c.lastOrderAt
      ? (now - new Date(c.lastOrderAt).getTime()) / 86400000
      : Infinity;
    if (c.spend >= 10_000_000 || c.orders >= 10) return 'vip';
    if (daysOrder > 180) return 'churn';
    if (daysOrder > 60 && c.orders >= 2) return 'at_risk';
    if (daysCreate <= 30 && c.orders <= 1) return 'new_cus';
    return 'active';
  }

  function normalizeCustomer(c, i) {
    const base = {
      id: c.id || uid('cus'),
      name: c.name || 'Khách ẩn danh',
      email: c.email || null,
      phone: c.phone || '',
      province: c.province || '',
      gender: c.gender || null,
      addresses: Array.isArray(c.addresses) ? c.addresses : [],
      tags: Array.isArray(c.tags) ? c.tags : [],
      notes: c.notes || '',
      dob: c.dob || null,
      spend: Number(c.spend || 0),
      orders: Number(c.orders || 0),
      lastOrderAt: c.lastOrderAt || null,
      // consent
      consentMarketing: c.consentMarketing !== false,
      consentEmail: c.consentEmail !== false,
      consentSms: c.consentSms === true,
      consentCall: c.consentCall === true,
      consentUpdatedAt: c.consentUpdatedAt || null,
      // loyalty
      loyaltyPoints: Number(c.loyaltyPoints || 0),
      loyaltyTier: c.loyaltyTier || null,
      segment: c.segment || null,
      source: c.source || null,
      // communications: [{id, channel:'email'|'sms'|'call'|'chat'|'note', direction:'in'|'out', subject, body, actor, at}]
      communications: Array.isArray(c.communications) ? c.communications : [],
      status: c.status || 'active',
      createdAt: c.createdAt || new Date(Date.now() - i * 86400000 * 3).toISOString(),
      updatedAt: nowISO(),
    };
    base.loyaltyTier = base.loyaltyTier || computeTier(base.spend);
    base.segment = base.segment || computeSegment(base);
    return base;
  }

  const Customers = makeStore('dtx_admin_customers', 'dtx_admin_customers_seeded_v1', seedCustomers, {
    eventName: 'dtx:customers-updated',
    normalize: normalizeCustomer,
  });
  Customers.TIERS = ['bronze', 'silver', 'gold', 'platinum'];
  Customers.SEGMENTS = ['new_cus', 'active', 'vip', 'at_risk', 'churn', 'blacklist'];
  Customers.tierLabel = (t) => ({ bronze:'Đồng', silver:'Bạc', gold:'Vàng', platinum:'Bạch kim' })[t] || t;
  Customers.segmentLabel = (s) => ({
    new_cus:'Khách mới', active:'Đang hoạt động', vip:'VIP',
    at_risk:'Có nguy cơ', churn:'Đã rời bỏ', blacklist:'Blacklist',
  })[s] || s;
  Customers.computeTier = computeTier;
  Customers.computeSegment = computeSegment;
  Customers.addCommunication = function (custId, data) {
    const c = this.get(custId); if (!c) return null;
    const entry = {
      id: uid('comm'),
      channel: data.channel || 'note',
      direction: data.direction || 'out',
      subject: data.subject || '',
      body: data.body || '',
      actor: data.actor || 'admin',
      at: data.at || nowISO(),
    };
    const communications = [entry, ...(c.communications || [])];
    this.update(custId, { communications });
    return entry;
  };
  Customers.findOrdersFor = function (custId) {
    const ords = (window.DTX_ADMIN_ORDERS?.all() || []);
    return ords.filter(o => o.customerId === custId || o.customer?.id === custId ||
      (o.customer?.phone && o.customer.phone === this.get(custId)?.phone));
  };

  /* ───────────────── Vouchers ─────────────────────────────────── */

  function seedVouchers() {
    return [
      { code: 'WELCOME50', type: 'percent',  value: 5,  minOrder: 500000, startAt: '2025-01-01', endAt: '2026-12-31', usageLimit: 1000, usedCount: 148, status: 'active', description: 'Giảm 5% cho khách mới · đơn ≥ 500k' },
      { code: 'VIP100',    type: 'amount',   value: 100000, minOrder: 1000000, startAt: '2025-06-01', endAt: '2026-06-30', usageLimit: 500, usedCount: 67,  status: 'active', description: 'Giảm 100.000₫ cho VIP' },
      { code: 'SUMMER25',  type: 'percent',  value: 25, minOrder: 800000, startAt: '2025-06-01', endAt: '2025-09-30', usageLimit: 2000, usedCount: 1823, status: 'expired', description: 'Khuyến mãi hè — đã hết hạn' },
      { code: 'FREESHIP',  type: 'shipping', value: 0,  minOrder: 300000, startAt: '2025-01-01', endAt: '2026-12-31', usageLimit: null, usedCount: 4821, status: 'active', description: 'Miễn phí vận chuyển' },
      { code: 'BLACKFRI',  type: 'percent',  value: 30, minOrder: 1500000, startAt: '2026-11-20', endAt: '2026-11-30', usageLimit: 500, usedCount: 0,  status: 'scheduled', description: 'Black Friday — 30% nguyên đơn' },
    ];
  }

  function normalizeVoucher(v, i) {
    return {
      id: v.id || uid('vou'),
      code: (v.code || 'CODE' + i).toUpperCase(),
      type: v.type || 'percent',
      value: Number(v.value || 0),
      minOrder: Number(v.minOrder || 0),
      startAt: v.startAt || null,
      endAt: v.endAt || null,
      usageLimit: v.usageLimit === null ? null : Number(v.usageLimit || 0),
      usedCount: Number(v.usedCount || 0),
      status: v.status || 'active',
      description: v.description || '',
      createdAt: v.createdAt || nowISO(),
      updatedAt: nowISO(),
    };
  }

  const Vouchers = makeStore('dtx_admin_vouchers', 'dtx_admin_vouchers_seeded_v1', seedVouchers, {
    eventName: 'dtx:vouchers-updated',
    normalize: normalizeVoucher,
  });

  /* ───────────────── Articles ─────────────────────────────────── */

  function seedArticles() {
    return [
      { title: 'Niacinamide 10% — hoạt chất đa năng cho da hỗn hợp', slug: 'niacinamide-10-hoat-chat-da-nang', excerpt: 'Tại sao Niacinamide là hoạt chất “ai cũng dùng được”?', author: 'BS. Mai Anh', category: 'Khoa học làm đẹp', status: 'published', views: 12420, publishedAt: '2025-08-14' },
      { title: 'Retinol cho người mới — lộ trình an toàn 12 tuần', slug: 'retinol-cho-nguoi-moi', excerpt: 'Bắt đầu retinol đúng cách để da không bong tróc.', author: 'DS. Thu Hà', category: 'Khoa học làm đẹp', status: 'published', views: 8_920, publishedAt: '2025-09-02' },
      { title: 'Chống nắng: SPF bao nhiêu là đủ cho người Việt Nam?', slug: 'chong-nang-spf-bao-nhieu', excerpt: 'UV index VN cao — cần SPF50 + PA++++ khi ra nắng.', author: 'BS. Mai Anh', category: 'Chống nắng', status: 'published', views: 15_300, publishedAt: '2025-10-15' },
      { title: 'Đánh giá nguyên liệu 2026 — xu hướng gì sẽ lên ngôi?', slug: 'xu-huong-nguyen-lieu-2026', excerpt: 'Peptide, exosome, postbiotic — đâu là thật, đâu là hype?', author: 'TS. Gia Khánh', category: 'Xu hướng', status: 'draft', views: 0, publishedAt: null },
      { title: 'Làm sạch đúng cách cho da dầu mụn', slug: 'lam-sach-da-dau-mun', excerpt: 'Double cleansing có thật sự cần thiết?', author: 'DS. Thu Hà', category: 'Hướng dẫn', status: 'published', views: 6_420, publishedAt: '2025-11-20' },
      { title: 'Azelaic Acid — hoạt chất dịu nhẹ cho da nhạy cảm', slug: 'azelaic-acid-da-nhay-cam', excerpt: 'Thay thế tốt cho BHA ở da mỏng yếu.', author: 'BS. Mai Anh', category: 'Khoa học làm đẹp', status: 'scheduled', views: 0, publishedAt: '2026-05-10' },
    ];
  }

  function normalizeArticle(a, i) {
    return {
      id: a.id || uid('art'),
      title: a.title || 'Bài chưa đặt tiêu đề',
      slug: a.slug || 'bai-' + i,
      excerpt: a.excerpt || '',
      body: a.body || '',
      author: a.author || 'Detoxblanc Team',
      category: a.category || 'Chưa phân loại',
      coverUrl: a.coverUrl || null,
      tags: Array.isArray(a.tags) ? a.tags : [],
      status: a.status || 'draft',
      views: Number(a.views || 0),
      seoTitle: a.seoTitle || '',
      seoDesc: a.seoDesc || '',
      publishedAt: a.publishedAt || null,
      createdAt: a.createdAt || nowISO(),
      updatedAt: nowISO(),
    };
  }

  const Articles = makeStore('dtx_admin_articles', 'dtx_admin_articles_seeded_v1', seedArticles, {
    eventName: 'dtx:articles-updated',
    normalize: normalizeArticle,
  });

  /* ───────────────── Users + RBAC ────────────────────────────── */

  const ROLES = [
    { key: 'owner',      name: 'Owner',      description: 'Toàn quyền · không revoke được bởi admin khác' },
    { key: 'admin',      name: 'Admin',      description: 'Quản trị chung trừ billing + user management' },
    { key: 'editor',     name: 'Editor',     description: 'Chỉnh catalog + content' },
    { key: 'support',    name: 'Support',    description: 'Xử lý đơn, xem khách hàng' },
    { key: 'accountant', name: 'Accountant', description: 'Xem doanh thu + báo cáo' },
  ];
  const PERMISSIONS = [
    'products:read','products:write',
    'orders:read','orders:write',
    'customers:read','customers:write',
    'inventory:read','inventory:write',
    'vouchers:read','vouchers:write',
    'articles:read','articles:write',
    'users:read','users:write',
    'audit:read',
    'reports:read',
    'settings:read','settings:write',
  ];
  const ROLE_PERMS = {
    owner: [...PERMISSIONS],
    admin: PERMISSIONS.filter(p => !p.startsWith('users:') && p !== 'settings:write'),
    editor: ['products:read','products:write','inventory:read','articles:read','articles:write','vouchers:read','customers:read'],
    support: ['products:read','orders:read','orders:write','customers:read','customers:write','inventory:read'],
    accountant: ['products:read','orders:read','customers:read','reports:read','audit:read'],
  };

  function seedUsers() {
    return [
      { email: 'tuan@detoxblanc.com',   name: 'Trần Mai Anh',    roles: ['owner'],  totp: true,  lastLoginAt: nowISO() },
      { email: 'tuan@detoxblanc.com',    name: 'Lê Minh Tuấn',    roles: ['admin'],  totp: true,  lastLoginAt: new Date(Date.now() - 3600000).toISOString() },
      { email: 'thuha@detoxblanc.com',   name: 'Trần Thu Hà',     roles: ['editor'], totp: true,  lastLoginAt: new Date(Date.now() - 86400000).toISOString() },
      { email: 'linh@detoxblanc.com',    name: 'Phạm Ngọc Linh',  roles: ['support'],totp: false, lastLoginAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { email: 'hang@detoxblanc.com',    name: 'Vũ Thanh Hằng',   roles: ['accountant'], totp: true, lastLoginAt: new Date(Date.now() - 7 * 86400000).toISOString() },
      { email: 'khanh@detoxblanc.com',   name: 'Bùi Gia Khánh',   roles: ['editor'], totp: false, lastLoginAt: null, status: 'invited' },
    ];
  }

  function normalizeUser(u, i) {
    return {
      id: u.id || uid('usr'),
      email: u.email || `user${i}@example.com`,
      name: u.name || 'User ' + i,
      avatarUrl: u.avatarUrl || null,
      roles: Array.isArray(u.roles) ? u.roles : ['support'],
      totp: !!u.totp,
      status: u.status || 'active',
      lastLoginAt: u.lastLoginAt || null,
      createdAt: u.createdAt || nowISO(),
      updatedAt: nowISO(),
    };
  }

  const Users = makeStore('dtx_admin_users', 'dtx_admin_users_seeded_v1', seedUsers, {
    eventName: 'dtx:users-updated',
    normalize: normalizeUser,
  });
  Users.ROLES = ROLES;
  Users.PERMISSIONS = PERMISSIONS;
  Users.ROLE_PERMS = ROLE_PERMS;
  Users.permissionsFor = (roleKeys) => {
    const out = new Set();
    for (const r of roleKeys) for (const p of (ROLE_PERMS[r] || [])) out.add(p);
    return [...out];
  };

  /* ───────────────── Audit log ────────────────────────────────── */

  function seedAudit() {
    const actors = [
      { id: 'u1', email: 'tuan@detoxblanc.com' },
      { id: 'u2', email: 'tuan@detoxblanc.com' },
      { id: 'u3', email: 'thuha@detoxblanc.com' },
      { id: 'u4', email: 'linh@detoxblanc.com' },
    ];
    const actions = [
      { action: 'auth.login.success', entity: null },
      { action: 'product.update', entity: 'product' },
      { action: 'product.create', entity: 'product' },
      { action: 'order.update',   entity: 'order' },
      { action: 'voucher.create', entity: 'voucher' },
      { action: 'user.invite',    entity: 'user' },
      { action: 'auth.login.failed', entity: null },
      { action: 'article.publish', entity: 'article' },
      { action: 'inventory.adjust', entity: 'product' },
    ];
    const out = [];
    for (let i = 0; i < 120; i++) {
      const a = actors[i % actors.length];
      const ac = actions[i % actions.length];
      out.push({
        actorId: a.id,
        actorEmail: a.email,
        actorIp: '14.161.' + (10 + (i % 200)) + '.' + (i % 250),
        action: ac.action,
        entity: ac.entity,
        entityId: ac.entity ? 'ent_' + (i % 40) : null,
        diff: ac.action.endsWith('update')
          ? { before: { price: 800000 + (i * 1000) }, after: { price: 820000 + (i * 1000) } }
          : null,
        at: new Date(Date.now() - i * 1800_000).toISOString(),
      });
    }
    return out;
  }

  function normalizeAudit(e, i) {
    return {
      id: e.id || uid('aud'),
      at: e.at || nowISO(),
      actorId: e.actorId || null,
      actorEmail: e.actorEmail || null,
      actorIp: e.actorIp || null,
      userAgent: e.userAgent || null,
      action: e.action || 'unknown',
      entity: e.entity || null,
      entityId: e.entityId || null,
      diff: e.diff || null,
      requestId: e.requestId || uid('req'),
    };
  }

  const Audit = makeStore('dtx_admin_audit', 'dtx_admin_audit_seeded_v1', seedAudit, {
    eventName: 'dtx:audit-updated',
    normalize: normalizeAudit,
  });

  /* ───────────────── Settings ────────────────────────────────── */

  const DEFAULT_SETTINGS = {
    brand: {
      name: 'Detoxblanc',
      legalName: 'Công ty TNHH Detoxblanc',
      taxCode: '0123456789',
      address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      phone: '1900 6789',
      email: 'hello@detoxblanc.com',
      website: 'https://detoxblanc.com',
      logoUrl: '',
    },
    locale: { currency: 'VND', timezone: 'Asia/Ho_Chi_Minh', language: 'vi' },
    payments: {
      cod: { enabled: true },
      vnpay: { enabled: false, merchantId: '', secret: '' },
      momo: { enabled: false, partnerCode: '', accessKey: '', secret: '' },
      bank: { enabled: false, accountName: '', accountNumber: '', bankName: '' },
    },
    shipping: {
      ghn: { enabled: false, token: '', shopId: '' },
      ghtk: { enabled: false, token: '' },
      viettelpost: { enabled: false, token: '' },
      freeThreshold: 500000,
      flatFee: 30000,
    },
    einvoice: { provider: 'viettel', enabled: false, apiKey: '' },
    email: { provider: 'resend', apiKey: '', fromAddress: 'noreply@detoxblanc.com' },
    seo: {
      defaultTitle: 'Detoxblanc · Dược mỹ phẩm chuẩn lâm sàng',
      defaultDesc: 'Công thức rõ nồng độ · bao bì xanh · sản xuất tại Việt Nam',
      ogImage: '',
      analytics: { plausible: true, ga4: '', pixel: '' },
    },
    security: {
      sessionHours: 8,
      requireTotpForOwners: true,
      lockoutAfterFails: 5,
      passwordMinLen: 10,
    },
    compliance: {
      pdpdConsent: true,
      cookieBanner: true,
      privacyUrl: 'privacy.html',
      termsUrl: 'terms.html',
    },
    notifications: {
      slackWebhook: '',
      emailAlerts: ['tuan@detoxblanc.com'],
    },
    updatedAt: nowISO(),
  };

  const Settings = {
    KEY: 'dtx_admin_settings',
    defaults() { return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); },
    load() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) return { ...this.defaults(), ...JSON.parse(raw) };
      } catch (_) {}
      return this.defaults();
    },
    save(patch) {
      const current = this.load();
      const merged = { ...current, ...patch, updatedAt: nowISO() };
      localStorage.setItem(this.KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('dtx:settings-updated'));
      return merged;
    },
    reset() {
      localStorage.removeItem(this.KEY);
      window.dispatchEvent(new CustomEvent('dtx:settings-updated'));
      return this.defaults();
    },
  };

  /* ───────────────── Inventory helpers ────────────────────────── */

  // Inventory movements ledger (persisted separately so products table stays light)
  const MOVEMENTS_KEY = 'dtx_admin_inv_movements';
  const Movements = {
    all() {
      try { return JSON.parse(localStorage.getItem(MOVEMENTS_KEY) || '[]'); } catch(_) { return []; }
    },
    save(list) {
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(list.slice(0, 2000))); // cap 2k
      window.dispatchEvent(new CustomEvent('dtx:movements-updated'));
    },
    add(m) {
      const entry = {
        id: uid('mov'),
        productId: m.productId,
        variantId: m.variantId || null,
        reason: m.reason,             // receive|sale|adjust|reserve|release|count|promo|return
        qty: Number(m.qty || 0),      // signed
        before: Number(m.before || 0),
        after: Number(m.after || 0),
        unitCost: m.unitCost != null ? Number(m.unitCost) : null,
        note: m.note || '',
        refType: m.refType || null,   // purchase_order | order | manual
        refId: m.refId || null,
        actor: m.actor || (window.DTX_ADMIN_ACTOR || 'tuan@detoxblanc.com'),
        createdAt: nowISO(),
      };
      const list = this.all(); list.unshift(entry); this.save(list);
      return entry;
    },
    forProduct(productId, limit = 50) {
      return this.all().filter(m => m.productId === productId).slice(0, limit);
    },
    reset() { localStorage.removeItem(MOVEMENTS_KEY); window.dispatchEvent(new CustomEvent('dtx:movements-updated')); },
  };

  const REASON_LABEL = {
    receive:'Nhập kho', sale:'Bán', adjust:'Điều chỉnh', reserve:'Giữ hàng',
    release:'Huỷ giữ', count:'Kiểm kê', promo:'Quà tặng', return:'Hoàn trả',
  };

  const Inventory = {
    STATUSES: ['ok', 'low', 'out'],
    REASONS: ['receive', 'sale', 'adjust', 'reserve', 'release', 'count', 'promo', 'return'],
    reasonLabel: (r) => REASON_LABEL[r] || r,
    forProducts(products) {
      return products.map(p => {
        const stock = Number(p.stock || 0);
        const reserved = Number(p.reserved || 0);
        const available = Math.max(0, stock - reserved);
        const avgCost = Number(p.avgCost || 0);
        return {
          id: p.id, code: p.code, name: p.name, category: p.category,
          stock, reserved, available, lowStock: p.lowStock, status: p.status,
          avgCost, inventoryValue: stock * avgCost,
          state: stock === 0 ? 'out' : available <= p.lowStock ? 'low' : 'ok',
          price: p.price,
        };
      });
    },
    summary(products) {
      const items = this.forProducts(products);
      return {
        total: items.length,
        out: items.filter(x => x.state === 'out').length,
        low: items.filter(x => x.state === 'low').length,
        ok: items.filter(x => x.state === 'ok').length,
        stockTotal: items.reduce((s, x) => s + x.stock, 0),
        reservedTotal: items.reduce((s, x) => s + x.reserved, 0),
        availableTotal: items.reduce((s, x) => s + x.available, 0),
        inventoryValue: items.reduce((s, x) => s + x.inventoryValue, 0),
      };
    },
    adjust(productId, delta, reason, note) {
      if (!window.DTX_ADMIN) return null;
      const p = window.DTX_ADMIN.get(productId);
      if (!p) return null;
      const before = Number(p.stock || 0);
      const next = Math.max(0, before + delta);
      window.DTX_ADMIN.update(productId, { stock: next });
      Movements.add({ productId, reason: reason || 'adjust', qty: delta, before, after: next, note });
      try {
        Audit.create({
          action: 'inventory.adjust',
          actorEmail: (window.DTX_ADMIN_ACTOR || 'tuan@detoxblanc.com'),
          entity: 'product', entityId: productId,
          diff: { before: { stock: before }, after: { stock: next }, reason, note },
        });
      } catch (_) {}
      return { before, after: next };
    },
    /** Nhập kho theo đơn PO — cộng stock + cập nhật moving-average cost. */
    receive({ productId, qty, unitCost, note, refType, refId }) {
      if (!window.DTX_ADMIN) return null;
      const p = window.DTX_ADMIN.get(productId); if (!p) return null;
      qty = Number(qty); unitCost = Number(unitCost || 0);
      if (!qty || qty <= 0) return null;
      const before = Number(p.stock || 0);
      const oldAvg = Number(p.avgCost || 0);
      const after = before + qty;
      const newAvg = after > 0
        ? Math.round((before * oldAvg + qty * unitCost) / after)
        : unitCost;
      window.DTX_ADMIN.update(productId, { stock: after, avgCost: newAvg });
      Movements.add({
        productId, reason: 'receive', qty, before, after,
        unitCost, note, refType: refType || 'purchase_order', refId,
      });
      return { before, after, newAvg };
    },
    /** Nhập kho nhiều dòng (1 PO = nhiều SKU) — trả lại summary. */
    receiveBulk(lines, meta) {
      const poId = (meta?.refId) || uid('po');
      const results = [];
      for (const l of lines) {
        const r = this.receive({
          productId: l.productId, qty: l.qty, unitCost: l.unitCost,
          note: meta?.note, refType: 'purchase_order', refId: poId,
        });
        if (r) results.push({ productId: l.productId, ...r });
      }
      try {
        Audit.create({
          action: 'inventory.receive.bulk',
          actorEmail: (window.DTX_ADMIN_ACTOR || 'tuan@detoxblanc.com'),
          entity: 'product', entityId: null,
          diff: { after: { poId, lines: results.length, totalQty: lines.reduce((s,l)=>s+Number(l.qty||0),0) } },
        });
      } catch(_){}
      return { poId, results };
    },
    /** Kiểm kê vật lý — so sánh stock hệ thống với số đếm, tạo movement delta. */
    count({ productId, counted, note }) {
      if (!window.DTX_ADMIN) return null;
      const p = window.DTX_ADMIN.get(productId); if (!p) return null;
      const before = Number(p.stock || 0);
      const after = Math.max(0, Number(counted) || 0);
      const delta = after - before;
      window.DTX_ADMIN.update(productId, { stock: after });
      Movements.add({ productId, reason: 'count', qty: delta, before, after, note, refType: 'physical_count' });
      return { before, after, delta };
    },
    /** Reserve N qty — increment reserved (không đụng stock). */
    reserve({ productId, qty, refId }) {
      const p = window.DTX_ADMIN.get(productId); if (!p) return null;
      const stock = Number(p.stock || 0);
      const reserved = Number(p.reserved || 0);
      if (reserved + qty > stock) return { error: `Không đủ ${stock - reserved} để giữ ${qty}` };
      window.DTX_ADMIN.update(productId, { reserved: reserved + qty });
      Movements.add({ productId, reason: 'reserve', qty, before: reserved, after: reserved + qty, refType:'order', refId });
      return { before: reserved, after: reserved + qty };
    },
    release({ productId, qty, refId }) {
      const p = window.DTX_ADMIN.get(productId); if (!p) return null;
      const reserved = Number(p.reserved || 0);
      const next = Math.max(0, reserved - qty);
      window.DTX_ADMIN.update(productId, { reserved: next });
      Movements.add({ productId, reason: 'release', qty: -qty, before: reserved, after: next, refType:'order', refId });
      return { before: reserved, after: next };
    },
    /** Alert list — out + low (dùng available = stock - reserved). */
    alerts(products) {
      const items = this.forProducts(products);
      return {
        out: items.filter(x => x.stock === 0),
        low: items.filter(x => x.stock > 0 && x.available <= x.lowStock),
      };
    },
    movements: Movements,
  };

  /* ───────────────── Reviews ──────────────────────────────────── */

  function seedReviews() {
    const names = ['Minh Anh', 'Thu Trang', 'Quốc Bảo', 'Thanh Thảo', 'Hải Yến', 'Khánh Linh', 'Đức Anh', 'Ngọc Hân', 'Phương Thảo', 'Quang Huy'];
    const bodies = [
      'Da mình dịu hẳn sau 2 tuần. Đóng gói chỉn chu, có thư cảm ơn viết tay.',
      'Texture mỏng nhẹ, thấm nhanh, không bí da. Sẽ mua lại.',
      'Giá hơi cao nhưng chất lượng xứng đáng.',
      'Sản phẩm tốt nhưng mùi hơi nồng với mình.',
      'Tư vấn viên rất tận tâm, freeship HCM là điểm cộng.',
      'Hiệu quả rõ rệt sau 1 tháng dùng đều đặn.',
    ];
    const out = [];
    for (let i = 0; i < 32; i++) {
      out.push({
        id: uid('rv'),
        productId: 'prd_' + (1 + (i % 6)),
        productName: ['Tẩy trang dịu nhẹ','Gel rửa mặt PHA','Toner niacinamide','Serum B5','Kem chống nắng SPF50','Dưỡng ẩm cấp ẩm'][i % 6],
        rating: 3 + (i % 3), // 3-5 sao
        title: ['Rất tốt!','Đáng tiền','Sẽ mua lại','Ổn áp','Tuyệt vời'][i % 5],
        body: bodies[i % bodies.length],
        status: i % 7 === 0 ? 'pending' : i % 11 === 0 ? 'rejected' : 'approved',
        authorName: names[i % names.length],
        verified: i % 3 !== 0,
        createdAt: new Date(Date.now() - i * 4 * 3600_000).toISOString(),
      });
    }
    return out;
  }

  function normalizeReview(r, i) {
    return {
      id: r.id || uid('rv'),
      productId: r.productId || 'prd_0',
      productName: r.productName || 'Sản phẩm',
      rating: Math.max(1, Math.min(5, Number(r.rating || 5))),
      title: r.title || '',
      body: r.body || '',
      status: r.status || 'pending',
      authorName: r.authorName || 'Khách',
      verified: !!r.verified,
      createdAt: r.createdAt || nowISO(),
    };
  }

  const Reviews = makeStore('dtx_admin_reviews', 'dtx_admin_reviews_seeded_v1', seedReviews, {
    eventName: 'dtx:reviews-updated',
    normalize: normalizeReview,
  });

  /* ───────────────── Returns (RMA) ─────────────────────────────── */

  function seedReturns() {
    const reasons = ['Giao sai sản phẩm', 'Sản phẩm lỗi bao bì', 'Không hợp da', 'Khách đổi ý', 'Hết hạn gần kề'];
    const statuses = ['requested', 'approved', 'received', 'refunded', 'rejected'];
    const out = [];
    for (let i = 0; i < 14; i++) {
      out.push({
        id: uid('ret'),
        code: 'RMA-25-' + String(1000 + i).slice(-4),
        orderId: 'ord_' + (i % 48),
        orderCode: 'DTX-25-' + String(20000 + i).padStart(5, '0').slice(-5),
        customerName: ['Nguyễn Văn A','Trần Thị B','Lê Minh C','Phạm Thu D'][i % 4],
        reason: reasons[i % reasons.length],
        note: i % 4 === 0 ? 'Khách yêu cầu hoàn tiền qua chuyển khoản.' : '',
        amount: 450000 + (i * 35000),
        status: statuses[i % statuses.length],
        createdAt: new Date(Date.now() - i * 86400_000).toISOString(),
        updatedAt: nowISO(),
      });
    }
    return out;
  }

  function normalizeReturn(r) {
    return {
      id: r.id || uid('ret'),
      code: r.code || ('RMA-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0')),
      orderId: r.orderId || null,
      orderCode: r.orderCode || '',
      customerName: r.customerName || 'Khách',
      reason: r.reason || 'Không rõ lý do',
      note: r.note || '',
      amount: Number(r.amount || 0),
      status: r.status || 'requested',
      createdAt: r.createdAt || nowISO(),
      updatedAt: nowISO(),
    };
  }

  const Returns = makeStore('dtx_admin_returns', 'dtx_admin_returns_seeded_v1', seedReturns, {
    eventName: 'dtx:returns-updated',
    normalize: normalizeReturn,
  });

  /* ───────────────── Collections ──────────────────────────────── */

  function seedCollections() {
    return [
      { slug: 'best-sellers', name: 'Best-sellers', description: 'Top 8 sản phẩm bán chạy tháng này.', isSmart: true,  rule: { sort: 'sales', limit: 8 }, productIds: [], position: 1, published: true },
      { slug: 'new-arrivals', name: 'Hàng mới về',   description: 'Các sản phẩm ra mắt 30 ngày gần nhất.', isSmart: true,  rule: { newWithin: 30 }, productIds: [], position: 2, published: true },
      { slug: 'vegan',        name: 'Vegan & cruelty-free', description: 'Không nguồn động vật, không thử nghiệm.', isSmart: true, rule: { tag: 'vegan' }, productIds: [], position: 3, published: true },
      { slug: 'ritual-am',    name: 'Ritual AM',     description: 'Ritual buổi sáng: làm sạch, dưỡng, chống nắng.', isSmart: false, productIds: ['prd_1','prd_3','prd_5'], position: 4, published: true },
      { slug: 'gift-set',     name: 'Gift set',      description: 'Combo quà tặng dịp lễ.', isSmart: false, productIds: ['prd_2','prd_4'], position: 5, published: false },
    ];
  }

  function normalizeCollection(c, i) {
    return {
      id: c.id || uid('col'),
      slug: c.slug || 'bst-' + i,
      name: c.name || 'Bộ sưu tập',
      description: c.description || '',
      coverUrl: c.coverUrl || null,
      isSmart: !!c.isSmart,
      rule: c.rule || null,
      productIds: Array.isArray(c.productIds) ? c.productIds : [],
      position: Number(c.position || 0),
      published: c.published !== false,
      createdAt: c.createdAt || nowISO(),
      updatedAt: nowISO(),
    };
  }

  const Collections = makeStore('dtx_admin_collections', 'dtx_admin_collections_seeded_v1', seedCollections, {
    eventName: 'dtx:collections-updated',
    normalize: normalizeCollection,
  });

  /* ───────────────── Helpers global ───────────────────────────── */

  window.DTX_ADMIN_ORDERS = Orders;
  window.DTX_ADMIN_CUSTOMERS = Customers;
  window.DTX_ADMIN_VOUCHERS = Vouchers;
  window.DTX_ADMIN_ARTICLES = Articles;
  window.DTX_ADMIN_USERS = Users;
  window.DTX_ADMIN_AUDIT = Audit;
  window.DTX_ADMIN_SETTINGS = Settings;
  window.DTX_ADMIN_INVENTORY = Inventory;
  window.DTX_ADMIN_REVIEWS = Reviews;
  window.DTX_ADMIN_RETURNS = Returns;
  window.DTX_ADMIN_COLLECTIONS = Collections;
  window.DTX_ADMIN_FMT = { vnd: fmtVND, date: (d) => new Date(d).toLocaleDateString('vi-VN'), dt: (d) => new Date(d).toLocaleString('vi-VN') };
})();
