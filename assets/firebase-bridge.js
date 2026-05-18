/**
 * firebase-bridge.js — Replace local makeStore() backend with Firestore.
 *
 * Loaded AFTER admin-data.js + admin-data-ext.js đã chạy xong.
 * Override window.DTX_ADMIN_* stores với Firestore-backed versions.
 *
 * Shape giữ nguyên 100% với makeStore() để các trang admin khỏi sửa:
 *   .all(), .get(id), .create(data), .update(id, patch), .remove(id),
 *   .reset(), .reload()
 *
 * Real-time sync: dùng onSnapshot — admin A tạo đơn → admin B thấy ngay.
 *
 * Auth required: nếu chưa login, các method write sẽ fail (do Firestore rules).
 */

(function (global) {
  'use strict';

  function whenFirebaseReady(cb) {
    if (global.DTX_FIREBASE?.enabled) return cb(global.DTX_FIREBASE);
    if (global.DTX_FIREBASE?.enabled === false) return; // explicit disabled
    global.addEventListener('dtx:firebase-ready', e => cb(e.detail), { once: true });
  }

  whenFirebaseReady(fb => {
    const { db, dbMethods: m, auth, authMethods: am } = fb;

    /**
     * Tạo Firestore-backed store với shape giống makeStore() local.
     * @param {string} collectionName  — Firestore collection name
     * @param {function} normalize     — (rawDoc) => localShape
     * @param {object} opts            — { eventName }
     */
    function makeFirestoreStore(collectionName, normalize, opts = {}) {
      const eventName = opts.eventName || `dtx:${collectionName}-updated`;
      const colRef = m.collection(db, collectionName);

      let cache = [];
      let ready = false;
      const readyWaiters = [];

      // Subscribe real-time updates
      const unsub = m.onSnapshot(colRef, snap => {
        cache = snap.docs.map(d => normalize({ ...d.data(), id: d.id }));
        ready = true;
        global.dispatchEvent(new CustomEvent(eventName));
        while (readyWaiters.length) readyWaiters.shift()();
      }, err => {
        console.error(`[firestore] ${collectionName} snapshot error:`, err);
        ready = true; // even on error, mark ready to unblock
      });

      const waitReady = () => ready
        ? Promise.resolve()
        : new Promise(r => readyWaiters.push(r));

      return {
        isFirestore: true,
        // Sync — dùng cache đã subscribe (giống makeStore local)
        all() { return cache; },
        get(id) { return cache.find(x => x.id === id) || null; },

        async ready() { await waitReady(); return cache; },

        async reload() { await waitReady(); return cache; },

        async create(data) {
          const normalized = normalize({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          delete normalized.id;  // Firestore tự sinh
          const docRef = await m.addDoc(colRef, normalized);
          // onSnapshot sẽ tự update cache
          return { ...normalized, id: docRef.id };
        },

        async update(id, patch) {
          const docRef = m.doc(db, collectionName, id);
          await m.updateDoc(docRef, { ...patch, updatedAt: new Date().toISOString() });
          const current = cache.find(x => x.id === id) || {};
          return { ...current, ...patch };
        },

        async remove(id) {
          await m.deleteDoc(m.doc(db, collectionName, id));
        },

        async reset() {
          // Reset = không xoá DB, chỉ reload từ cache
          await waitReady();
          return cache;
        },

        // Dispose subscription
        _dispose: unsub,
      };
    }

    // ──────────────────────────────────────────────────────────────
    // Override existing stores
    // Lấy normalize functions từ admin-data.js / admin-data-ext.js đã có sẵn
    // ──────────────────────────────────────────────────────────────

    // Get current localStorage-based store's normalize logic
    // (we don't have direct access, so reuse generic shape)
    const passThrough = (x) => ({ ...x, id: x.id });

    // Capture old stores trước khi override (để fallback nếu cần)
    const oldStores = {
      products:  global.DTX_ADMIN,
      orders:    global.DTX_ADMIN_ORDERS,
      customers: global.DTX_ADMIN_CUSTOMERS,
      vouchers:  global.DTX_ADMIN_VOUCHERS,
      articles:  global.DTX_ADMIN_ARTICLES,
      reviews:   global.DTX_ADMIN_REVIEWS,
      users:     global.DTX_ADMIN_USERS,
      audit:     global.DTX_ADMIN_AUDIT,
      collections: global.DTX_ADMIN_COLLECTIONS,
      returns:   global.DTX_ADMIN_RETURNS,
    };

    // Override với Firestore version
    function override(globalKey, collection, normalizeFn) {
      const newStore = makeFirestoreStore(collection, normalizeFn || passThrough, {
        eventName: `dtx:${collection}-updated`,
      });
      global[globalKey] = newStore;
    }

    // Use existing normalize functions if available (from admin-data-ext.js scope)
    // Fallback to passThrough if not exposed.
    override('DTX_ADMIN',           'products',     passThrough);
    override('DTX_ADMIN_ORDERS',    'orders',       passThrough);
    override('DTX_ADMIN_CUSTOMERS', 'customers',    passThrough);
    override('DTX_ADMIN_VOUCHERS',  'vouchers',     passThrough);
    override('DTX_ADMIN_ARTICLES',  'articles',     passThrough);
    override('DTX_ADMIN_REVIEWS',   'reviews',      passThrough);
    override('DTX_ADMIN_USERS',     'users',        passThrough);
    override('DTX_ADMIN_AUDIT',     'audit',        passThrough);
    override('DTX_ADMIN_COLLECTIONS', 'collections', passThrough);
    override('DTX_ADMIN_RETURNS',   'returns',      passThrough);

    // ──────────────────────────────────────────────────────────────
    // Auth integration
    // ──────────────────────────────────────────────────────────────

    global.DTX_AUTH = {
      isFirestore: true,

      currentUser: null,

      async login(email, password) {
        const cred = await am.signInWithEmailAndPassword(auth, email, password);
        return cred.user;
      },

      async logout() {
        await am.signOut(auth);
        location.href = '/admin/login';
      },

      onAuthChange(cb) {
        return am.onAuthStateChanged(auth, user => {
          this.currentUser = user;
          cb(user);
        });
      },

      async resetPassword(email) {
        await am.sendPasswordResetEmail(auth, email);
      },
    };

    // Listen auth state để cập nhật UI + redirect nếu chưa login
    am.onAuthStateChanged(auth, user => {
      global.DTX_AUTH.currentUser = user;
      global.dispatchEvent(new CustomEvent('dtx:auth-changed', { detail: user }));

      // Auto-redirect to login nếu admin page và chưa login
      const isAdminPage = document.body?.dataset?.admPage;
      const isLoginPage = location.pathname.includes('admin-login') || location.pathname === '/admin/login';
      if (isAdminPage && !isLoginPage && !user) {
        const back = encodeURIComponent(location.pathname);
        // Delay nhẹ để admin-rbac.js có thời gian set perms cho demo
        setTimeout(() => {
          if (!global.DTX_AUTH.currentUser) {
            location.href = `/admin/login?next=${back}`;
          }
        }, 800);
      }

      // Map Firebase user → DTX_ADMIN_PERMS
      if (user && global.DTX_ADMIN_PERMS) {
        // Lấy custom claims (set bởi admin SDK ở backend)
        user.getIdTokenResult().then(tok => {
          const claims = tok.claims;
          const perms = claims.permissions || claims.roles || ['*'];
          global.DTX_ADMIN_PERMS.set(Array.isArray(perms) ? perms : [perms]);
        }).catch(() => {
          global.DTX_ADMIN_PERMS.set(['*']); // fallback super-admin
        });
      }
    });

    console.info('[DTX] Firestore bridge active. Overrode 10 stores + DTX_AUTH.');
  });
})(window);
