/**
 * admin-api.js — fetch wrapper + remote stores matching DTX_ADMIN_* local API.
 *
 * Mode switching:
 *   window.DTX_MODE = 'local' | 'remote'   (default 'local' — backwards compatible)
 *   window.DTX_API_BASE = 'https://api.detoxblanc.com/v1' (default '/v1')
 *
 * Gọi code đã viết (admin-products.html, admin-orders.html, …) vẫn hoạt động
 * khi DTX_MODE = 'local'. Khi 'remote', các store như DTX_ADMIN, DTX_ADMIN_ORDERS
 * sẽ được thay bằng phiên bản remote gọi fetch().
 *
 * Auth:
 *   - Session cookie 'session' được gửi tự động (credentials:'include')
 *   - CSRF double-submit: đọc cookie 'csrf_token', gắn header 'X-CSRF-Token' trên mutation
 *   - 401 → redirect admin-login.html
 *   - 403 → toast bad
 *   - network error → toast bad + retry idempotent (GET only) 1 lần
 */

(function (global) {
  'use strict';

  const DEFAULTS = {
    mode: global.DTX_MODE || 'local',
    base: (global.DTX_API_BASE || '/v1').replace(/\/$/, ''),
    loginPage: 'admin-login.html',
    timeoutMs: 15000,
  };

  // ──────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────

  function readCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function isMutation(method) {
    return /^(POST|PUT|PATCH|DELETE)$/i.test(method);
  }

  function toQs(params) {
    if (!params) return '';
    const pairs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v));
    return pairs.length ? '?' + pairs.join('&') : '';
  }

  function toast(msg, kind) { try { global.admToast?.(msg, kind); } catch (_) {} }

  async function request(path, { method = 'GET', body, params, retry = true } = {}) {
    const url = DEFAULTS.base + path + toQs(params);
    const headers = { 'Accept': 'application/json' };
    const init = {
      method, headers, credentials: 'include',
      signal: AbortSignal.timeout ? AbortSignal.timeout(DEFAULTS.timeoutMs) : undefined,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    if (isMutation(method)) {
      const csrf = readCookie('csrf_token');
      if (csrf) headers['X-CSRF-Token'] = csrf;
    }

    let res;
    try {
      res = await fetch(url, init);
    } catch (err) {
      if (retry && method === 'GET') return request(path, { method, body, params, retry: false });
      toast('Lỗi mạng. Vui lòng thử lại.', 'bad');
      throw err;
    }

    if (res.status === 401) {
      // Session hết hạn → quay về login
      toast('Phiên đăng nhập hết hạn', 'warn');
      const back = encodeURIComponent(location.pathname + location.search);
      location.href = `${DEFAULTS.loginPage}?redirect=${back}`;
      throw new Error('unauthorized');
    }
    if (res.status === 403) {
      toast('Bạn không có quyền thực hiện thao tác này', 'bad');
      throw new Error('forbidden');
    }

    let data = null;
    if (res.status !== 204) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) data = await res.json();
    }

    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      toast(msg, 'bad');
      const e = new Error(msg); e.status = res.status; e.data = data;
      throw e;
    }

    return data;
  }

  const Api = {
    get:   (path, params) => request(path, { method: 'GET', params }),
    post:  (path, body)   => request(path, { method: 'POST', body }),
    patch: (path, body)   => request(path, { method: 'PATCH', body }),
    put:   (path, body)   => request(path, { method: 'PUT', body }),
    del:   (path)         => request(path, { method: 'DELETE' }),
  };

  // ──────────────────────────────────────────────────────────────
  // Remote store factory — mimics makeStore() shape
  //   storeName: emitted event basename ('products', 'orders', …)
  //   basePath: '/products', '/orders', …
  //   toLocal(remoteRow): chuyển camelCase → shape local cần
  //   toRemote(localRow): ngược lại khi create/update
  // ──────────────────────────────────────────────────────────────

  function makeRemoteStore(storeName, basePath, toLocal, toRemote) {
    // Cache list để .all() đồng bộ được với code cũ.
    let cache = [];
    let lastFetch = 0;

    const emitUpdated = () => {
      global.dispatchEvent(new CustomEvent(`dtx:${storeName}-updated`));
    };

    async function refresh() {
      try {
        const res = await Api.get(basePath, { limit: 200 });
        cache = (res.data || []).map(toLocal);
        lastFetch = Date.now();
      } catch (_) { /* toast already */ }
    }

    // Kick off initial load
    refresh().then(emitUpdated);

    return {
      isRemote: true,
      basePath,
      // Mimic local makeStore:
      all() { return cache; },
      get(id) { return cache.find(x => x.id === id) || null; },
      async reload() { await refresh(); emitUpdated(); return cache; },

      async create(patch) {
        const payload = toRemote ? toRemote(patch) : patch;
        const row = await Api.post(basePath, payload);
        const local = toLocal(row);
        cache.unshift(local);
        emitUpdated();
        return local;
      },
      async update(id, patch) {
        const payload = toRemote ? toRemote(patch) : patch;
        const row = await Api.patch(`${basePath}/${id}`, payload);
        const local = toLocal(row);
        cache = cache.map(x => x.id === id ? local : x);
        emitUpdated();
        return local;
      },
      async remove(id) {
        await Api.del(`${basePath}/${id}`);
        cache = cache.filter(x => x.id !== id);
        emitUpdated();
      },
      async reset() {
        // Không có nghĩa server-side. Thay bằng reload.
        await refresh();
        emitUpdated();
      },
    };
  }

  // ──────────────────────────────────────────────────────────────
  // Snake ↔ camel mappers cho từng domain
  // ──────────────────────────────────────────────────────────────

  const map = {
    product: {
      toLocal: r => ({
        id: r.id, code: r.code, slug: r.slug, name: r.name,
        categoryId: r.category_id, category: r.category_id, // local field tên khác
        shortDesc: r.short_desc, description: r.description, ingredients: r.ingredients,
        highlights: r.highlights || [],
        price: r.price, compareAtPrice: r.compare_at_price, cost: r.cost,
        tag: r.tag, tagClass: r.tag_class, status: r.status,
        stock: r.stock, lowStock: r.low_stock_threshold,
        variants: r.variants || [],
        images: r.images || [],
        createdAt: r.created_at, updatedAt: r.updated_at,
      }),
      toRemote: p => ({
        code: p.code, name: p.name, slug: p.slug, categoryId: p.categoryId ?? null,
        shortDesc: p.shortDesc ?? null, description: p.description ?? null,
        ingredients: p.ingredients ?? null, highlights: p.highlights || [],
        price: Number(p.price), compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
        cost: p.cost != null ? Number(p.cost) : null,
        tag: p.tag ?? null, tagClass: p.tagClass ?? null, status: p.status || 'draft',
        lowStockThreshold: p.lowStock ?? 5,
      }),
    },
    order: {
      toLocal: r => ({
        id: r.id, code: r.code, customerId: r.customer_id,
        customerName: r.customer?.name, customerPhone: r.customer?.phone, customerEmail: r.customer?.email,
        status: r.status, paymentStatus: r.payment_status, paymentMethod: r.payment_method,
        subtotal: r.subtotal, discountTotal: r.discount_total, shippingFee: r.shipping_fee, tax: r.tax, total: r.total,
        shippingAddress: r.shipping_address, voucherCode: r.voucher_code, notes: r.notes,
        placedAt: r.placed_at, paidAt: r.paid_at, shippedAt: r.shipped_at, deliveredAt: r.delivered_at,
        items: r.items, events: r.events,
        createdAt: r.created_at, updatedAt: r.updated_at,
      }),
    },
    customer: {
      toLocal: r => ({
        id: r.id, name: r.name, email: r.email, phone: r.phone,
        gender: r.gender ?? null,
        dob: r.dob, tags: r.tags || [], notes: r.notes,
        province: r.province, addresses: r.addresses || [],
        spend: r.spend ?? r.total_spent ?? 0,
        orders: r.orders ?? r.order_count ?? 0,
        loyaltyPoints: r.loyalty_points ?? 0,
        loyaltyTier:   r.loyalty_tier ?? 'bronze',
        segment:       r.segment ?? 'new_cus',
        source:        r.source ?? null,
        consentEmail:  r.consent_email ?? false,
        consentSms:    r.consent_sms ?? false,
        consentCall:   r.consent_call ?? false,
        consentUpdatedAt: r.consent_updated_at ?? null,
        communications: r.communications || [],
        lastOrderAt: r.last_order_at ?? null,
        createdAt: r.created_at, updatedAt: r.updated_at,
      }),
    },
    voucher: {
      toLocal: r => ({
        id: r.id, code: r.code, type: r.type,
        value: r.value, minOrder: r.min_order,
        startAt: r.start_at, endAt: r.end_at,
        usageLimit: r.usage_limit, usedCount: r.used_count,
        status: r.status, description: r.description,
        createdAt: r.created_at, updatedAt: r.updated_at,
      }),
    },
    article: {
      toLocal: r => ({
        id: r.id, slug: r.slug, title: r.title, author: r.author,
        category: r.category, excerpt: r.excerpt, body: r.body,
        coverUrl: r.cover_url, tags: r.tags || [], status: r.status, views: r.views,
        seoTitle: r.seo_title, seoDesc: r.seo_desc,
        publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at,
      }),
    },
    user: {
      toLocal: r => ({
        id: r.id, email: r.email, name: r.name, roles: r.roles || [],
        totp: r.totp_enabled ?? r.totp, status: r.status,
        lastLoginAt: r.last_login_at, createdAt: r.created_at, updatedAt: r.updated_at,
      }),
    },
    audit: {
      toLocal: r => ({
        id: String(r.id), at: r.at, actorId: r.actor_id, actorEmail: r.actor_email,
        actorIp: r.actor_ip, userAgent: r.user_agent,
        action: r.action, entity: r.entity, entityId: r.entity_id,
        diff: r.diff, requestId: r.request_id,
      }),
    },
  };

  // ──────────────────────────────────────────────────────────────
  // Specialized remote stores (thêm methods ngoài CRUD)
  // ──────────────────────────────────────────────────────────────

  function makeOrderRemote() {
    const store = makeRemoteStore('orders', '/orders', map.order.toLocal);
    store.setStatus = async (id, status, note) => {
      const row = await Api.patch(`/orders/${id}/status`, { status, note });
      const local = map.order.toLocal(row);
      await store.reload();
      return local;
    };
    store.setPayment = async (id, paymentStatus, note) => {
      const row = await Api.patch(`/orders/${id}/payment`, { paymentStatus, note });
      await store.reload();
      return map.order.toLocal(row);
    };
    store.addEvent = (id, kind, note, metadata) =>
      Api.post(`/orders/${id}/events`, { kind, note, metadata });

    // === P0 admin operations ==========================
    /**
     * Lên đơn từ Admin (POS-style). payload đã chuẩn schema BE:
     *  { customerId, items[{productId, variantId?, qty, priceUnit?}], paymentMethod,
     *    shippingMethod, shippingAddress, voucherCode?, giftWrap?, giftMessage?,
     *    pointsUsed?, source='admin', channel?, internalNote?, notes? }
     */
    store.adminCreate = async (payload) => {
      const row = await Api.post('/orders/admin-create', payload);
      await store.reload();
      return map.order.toLocal(row);
    };
    /** Gắn/đổi mã vận đơn + carrier */
    store.setTracking = (id, { carrierName, trackingCode, trackingUrl, note }) =>
      Api.patch(`/orders/${id}/tracking`, { carrierName, trackingCode, trackingUrl, note }).then(async row => {
        await store.reload();
        return map.order.toLocal(row);
      });
    /** Huỷ đơn đã ship/delivered (tạo case return tự động) */
    store.cancelAfterShip = (id, { reason, restock = true, refundAmount, note }) =>
      Api.post(`/orders/${id}/cancel-after-ship`, { reason, restock, refundAmount, note }).then(async res => {
        await store.reload();
        return res;
      });
    /** Tạo case RMA partial/full */
    store.createReturn = (id, { reason, items, restock = true, refundAmount, autoApprove = false, notes }) =>
      Api.post(`/orders/${id}/return`, { reason, items, restock, refundAmount, autoApprove, notes }).then(async res => {
        await store.reload();
        return res;
      });
    /** Đổi trạng thái case RMA: requested → inspecting → approved → refunded (hoặc rejected) */
    store.updateReturn = (id, returnId, { status, note }) =>
      Api.patch(`/orders/${id}/returns/${returnId}`, { status, note }).then(async res => {
        await store.reload();
        return res;
      });
    /** List các case RMA của 1 đơn */
    store.listReturns = (id) => Api.get(`/orders/${id}/returns`).then(r => r.data);
    /** Preview voucher trước khi submit (FE create-modal) */
    store.validateVoucher = ({ code, subtotal, shippingFee = 0 }) =>
      Api.post('/orders/validate-voucher', { code, subtotal, shippingFee });

    return store;
  }

  function makeCustomerRemote() {
    const store = makeRemoteStore('customers', '/customers', map.customer.toLocal);

    /** Tính lại tier/segment/totalSpent/loyaltyPoints cho 1 KH */
    store.recomputeLoyalty = (id) =>
      Api.post(`/customers/${id}/recompute-loyalty`, {}).then(async res => {
        await store.reload();
        return res;
      });
    /** Đặt điểm thưởng thủ công (admin adjust ±) */
    store.adjustPoints = (id, { delta, reason }) =>
      Api.post(`/customers/${id}/points`, { delta, reason }).then(async res => {
        await store.reload();
        return res;
      });

    /** ── Communications timeline ────────────────── */
    store.listCommunications = (id) =>
      Api.get(`/customers/${id}/communications`).then(r => r.data);
    /** Thêm log liên hệ (email/sms/call/chat/note) */
    store.addCommunication = (id, { channel, direction, subject, body, status }) =>
      Api.post(`/customers/${id}/communications`, { channel, direction, subject, body, status });

    /** ── Marketing consent ────────────────── */
    store.updateConsent = (id, { email, sms, call, segment }) =>
      Api.patch(`/customers/${id}/consent`, { email, sms, call, segment }).then(async row => {
        await store.reload();
        return map.customer.toLocal(row);
      });

    /** ── Addresses CRUD ────────────────── */
    store.addAddress = (id, address) =>
      Api.post(`/customers/${id}/addresses`, address).then(async row => {
        await store.reload();
        return map.customer.toLocal(row);
      });
    store.updateAddress = (id, addressId, patch) =>
      Api.patch(`/customers/${id}/addresses/${addressId}`, patch).then(async row => {
        await store.reload();
        return map.customer.toLocal(row);
      });
    store.removeAddress = (id, addressId) =>
      Api.del(`/customers/${id}/addresses/${addressId}`).then(async () => {
        await store.reload();
      });
    store.setDefaultAddress = (id, addressId) =>
      Api.patch(`/customers/${id}/addresses/${addressId}/default`, {}).then(async row => {
        await store.reload();
        return map.customer.toLocal(row);
      });

    /** ── Bulk import / merge ────────────────── */
    /**
     * payload = { rows: [{name,phone,email,...}], strategy: 'skip'|'upsert'|'overwrite' }
     * Trả về { created, updated, skipped, errors[] }
     */
    store.import = (payload) =>
      Api.post('/customers/import', payload).then(async res => {
        await store.reload();
        return res;
      });
    /** Gộp 2 KH (chuyển orders+communications từ source → target rồi xoá source) */
    store.merge = ({ sourceId, targetId }) =>
      Api.post('/customers/merge', { sourceId, targetId }).then(async res => {
        await store.reload();
        return res;
      });

    /** List orders của 1 KH (để vẽ tab Orders trong drawer) */
    store.findOrders = (id) =>
      Api.get(`/customers/${id}/orders`).then(r => r.data);

    return store;
  }

  function makeInventoryRemote() {
    return {
      isRemote: true,
      async adjust(productId, delta, reason, note) {
        return Api.post('/inventory/adjust', { productId, delta, reason: reason || 'adjust', note });
      },
      async set(productId, stock, reason, note) {
        return Api.post('/inventory/set', { productId, stock, reason: reason || 'adjust', note });
      },
      async bulkRestock(qty, categoryId) {
        return Api.post('/inventory/restock-bulk', { qty, categoryId });
      },
      async movements(productId, params) {
        const res = await Api.get('/inventory/movements', { productId, ...(params || {}) });
        return res;
      },
      async overview(params) {
        const res = await Api.get('/inventory', params);
        return res;
      },
      // === P0 PO + count + alerts ====================
      /**
       * Nhập kho 1 line: { productId, variantId?, qty, unitCost, poNumber?, supplier?, note? }
       * Trả về { variant_id|product_id, stock, avg_cost }
       */
      async receive(payload) {
        return Api.post('/inventory/receive', payload);
      },
      /**
       * Nhập kho nhiều SKU trong 1 PO:
       * { lines:[{productId,variantId?,qty,unitCost}], poNumber?, supplier?, note? }
       * Trả về { affected, po_number }
       */
      async receiveBulk(payload) {
        return Api.post('/inventory/receive-bulk', payload);
      },
      /**
       * Kiểm kê thực tế 1 line: { productId, variantId?, counted, note? }
       * Server tính delta = counted - stock_hiện_tại và tạo movement reason='count'.
       */
      async count(payload) {
        return Api.post('/inventory/count', payload);
      },
      /** Danh sách low-stock + out-of-stock cho dashboard */
      async alerts() {
        const res = await Api.get('/inventory/alerts');
        return res.data;
      },
    };
  }

  function makeSettingsRemote() {
    let cache = null;
    return {
      isRemote: true,
      async load() {
        const res = await Api.get('/settings');
        cache = { ...res.data, updatedAt: res.updated_at };
        return cache;
      },
      async save(patch) {
        const res = await Api.patch('/settings', patch);
        cache = { ...res.data, updatedAt: res.updated_at };
        global.dispatchEvent(new CustomEvent('dtx:settings-updated'));
        return cache;
      },
      async reset() {
        const res = await Api.post('/settings/reset', {});
        cache = { ...res.data };
        global.dispatchEvent(new CustomEvent('dtx:settings-updated'));
        return cache;
      },
      defaults() { return cache || {}; },
    };
  }

  function makeReportsRemote() {
    return {
      isRemote: true,
      overview: () => Api.get('/reports/overview'),
      revenue: (from, to, granularity) => Api.get('/reports/revenue', { from, to, granularity }),
      topProducts: (limit) => Api.get('/reports/top-products', { limit }),
      cohort: () => Api.get('/reports/customers/cohort'),
    };
  }

  // ──────────────────────────────────────────────────────────────
  // Auth shortcut
  // ──────────────────────────────────────────────────────────────

  const Auth = {
    async login(email, password) {
      return Api.post('/auth/login', { email, password });
    },
    async totp(challengeId, code) {
      return Api.post('/auth/totp', { challenge_id: challengeId, code });
    },
    async logout() {
      try { await Api.post('/auth/logout', {}); } catch (_) {}
      location.href = DEFAULTS.loginPage;
    },
    async me() { return Api.get('/auth/me'); },
  };

  // ──────────────────────────────────────────────────────────────
  // Install remote stores if mode=remote
  // ──────────────────────────────────────────────────────────────

  global.DTX_API = { Api, Auth, request, makeRemoteStore, map };

  if (DEFAULTS.mode === 'remote') {
    global.DTX_ADMIN           = makeRemoteStore('products',  '/products',  map.product.toLocal, map.product.toRemote);
    global.DTX_ADMIN_ORDERS    = makeOrderRemote();
    global.DTX_ADMIN_CUSTOMERS = makeCustomerRemote();
    global.DTX_ADMIN_VOUCHERS  = makeRemoteStore('vouchers',  '/vouchers',  map.voucher.toLocal);
    global.DTX_ADMIN_ARTICLES  = makeRemoteStore('articles',  '/articles',  map.article.toLocal);
    global.DTX_ADMIN_USERS     = makeRemoteStore('users',     '/users',     map.user.toLocal);
    global.DTX_ADMIN_AUDIT     = makeRemoteStore('audit',     '/audit',     map.audit.toLocal);
    global.DTX_ADMIN_INVENTORY = makeInventoryRemote();
    global.DTX_ADMIN_SETTINGS  = makeSettingsRemote();
    global.DTX_ADMIN_REPORTS   = makeReportsRemote();
    console.info('[DTX_API] remote mode active · base =', DEFAULTS.base);
  } else {
    // Local mode: reports helper still useful (tính từ orders local)
    global.DTX_ADMIN_REPORTS = global.DTX_ADMIN_REPORTS || {
      isRemote: false,
      overview() {
        const ords = (global.DTX_ADMIN_ORDERS?.all() || []);
        const now = Date.now();
        const d7 = now - 7 * 86400_000;
        const recent = ords.filter(o => new Date(o.placedAt || o.createdAt).getTime() >= d7);
        const gmv7 = recent.reduce((s, o) => s + Number(o.total || 0), 0);
        return Promise.resolve({
          orders_7d: recent.length,
          gmv_7d: gmv7,
          aov_7d: recent.length ? Math.round(gmv7 / recent.length) : 0,
          pending_orders: ords.filter(o => o.status === 'pending').length,
          packing_orders: ords.filter(o => o.status === 'packing').length,
          low_stock_skus: (global.DTX_ADMIN?.all() || []).filter(p => p.stock <= p.lowStock).length,
          customers_total: (global.DTX_ADMIN_CUSTOMERS?.all() || []).length,
          customers_vip: (global.DTX_ADMIN_CUSTOMERS?.all() || []).filter(c => c.tags?.includes('VIP')).length,
        });
      },
      revenue() {
        const ords = (global.DTX_ADMIN_ORDERS?.all() || []);
        const buckets = new Map();
        ords.forEach(o => {
          const k = new Date(o.placedAt || o.createdAt).toISOString().slice(0, 10);
          const cur = buckets.get(k) || { revenue: 0, orders: 0 };
          cur.revenue += Number(o.total || 0); cur.orders += 1;
          buckets.set(k, cur);
        });
        const series = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b))
          .map(([date, v]) => ({ date, ...v }));
        return Promise.resolve({ series, totals: {
          revenue: series.reduce((s, x) => s + x.revenue, 0),
          orders:  series.reduce((s, x) => s + x.orders, 0),
        }});
      },
      topProducts() {
        const ords = (global.DTX_ADMIN_ORDERS?.all() || []);
        const agg = new Map();
        ords.forEach(o => (o.items || []).forEach(i => {
          const cur = agg.get(i.productId || i.product_id) || { qty: 0, revenue: 0, name: i.name || i.nameSnapshot };
          cur.qty += (i.qty || 0);
          cur.revenue += Number(i.subtotal || 0);
          agg.set(i.productId || i.product_id, cur);
        }));
        return Promise.resolve({
          data: [...agg.entries()].map(([product_id, v]) => ({ product_id, ...v }))
                 .sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        });
      },
    };
  }
})(window);
