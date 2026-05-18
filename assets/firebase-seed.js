/**
 * firebase-seed.js — Migration helper.
 * Đẩy seed data từ admin-data.js (localStorage seeders) lên Firestore lần đầu.
 *
 * KHÔNG load tự động. Chỉ chạy khi admin click nút "Khởi tạo dữ liệu mẫu"
 * trong /admin/dev hoặc gọi tay từ DevTools console:
 *
 *   await DTX_SEED_FIRESTORE.run()        // seed full
 *   await DTX_SEED_FIRESTORE.run('products')   // chỉ products
 *   await DTX_SEED_FIRESTORE.wipe('orders')    // xoá hết orders (cẩn thận!)
 */

(function (global) {
  'use strict';

  global.DTX_SEED_FIRESTORE = {
    /**
     * Seed 1 collection từ localStorage seed của admin-data.
     * @param {string} collection - tên collection ('products','orders',...)
     * @returns {Promise<{added:number,skipped:number}>}
     */
    async run(collection = null) {
      if (!global.DTX_FIREBASE?.enabled) {
        throw new Error('Firebase chưa init. Mở trang admin trên *.web.app trước.');
      }
      const { db, dbMethods: m } = global.DTX_FIREBASE;
      const COLLECTIONS = collection ? [collection] : [
        'products', 'orders', 'customers', 'vouchers',
        'articles', 'reviews', 'collections', 'returns',
      ];

      // Map từ collection → key localStorage seed
      const SEED_KEYS = {
        products:    'dtx_admin_products',
        orders:      'dtx_admin_orders',
        customers:   'dtx_admin_customers',
        vouchers:    'dtx_admin_vouchers',
        articles:    'dtx_admin_articles',
        reviews:     'dtx_admin_reviews',
        collections: 'dtx_admin_collections',
        returns:     'dtx_admin_returns',
      };

      const summary = {};
      for (const col of COLLECTIONS) {
        const key = SEED_KEYS[col];
        if (!key) { summary[col] = 'skip-no-seed-key'; continue; }

        let rows = [];
        try {
          const raw = localStorage.getItem(key);
          rows = raw ? JSON.parse(raw) : [];
        } catch (_) {}
        if (!Array.isArray(rows) || rows.length === 0) {
          summary[col] = 'skip-empty';
          continue;
        }

        // Check existing — nếu collection đã có data, skip (idempotent)
        const colRef = m.collection(db, col);
        const snap = await m.getDocs(m.query(colRef, m.limit(1)));
        if (!snap.empty) {
          summary[col] = `skip-exists (${rows.length} rows in seed)`;
          continue;
        }

        // Batch write — Firestore tối đa 500 ops / batch
        let added = 0;
        for (let i = 0; i < rows.length; i += 400) {
          const batch = m.writeBatch(db);
          const slice = rows.slice(i, i + 400);
          for (const row of slice) {
            const { id, ...data } = row;
            const docRef = id ? m.doc(db, col, String(id)) : m.doc(colRef);
            batch.set(docRef, {
              ...data,
              _seededAt: new Date().toISOString(),
            });
            added++;
          }
          await batch.commit();
        }
        summary[col] = `added ${added}`;
        console.info(`[seed] ${col}: ${added} docs`);
      }

      return summary;
    },

    /**
     * Xoá toàn bộ documents trong 1 collection.
     * Cần auth + permission. Dùng khi reset staging.
     */
    async wipe(collection) {
      if (!global.DTX_FIREBASE?.enabled) throw new Error('Firebase chưa init');
      const { db, dbMethods: m } = global.DTX_FIREBASE;
      if (!confirm(`⚠ Xoá TOÀN BỘ documents trong /${collection}? Không hoàn tác được!`)) return;

      const colRef = m.collection(db, collection);
      const snap = await m.getDocs(colRef);
      let deleted = 0;
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = m.writeBatch(db);
        snap.docs.slice(i, i + 400).forEach(d => { batch.delete(d.ref); deleted++; });
        await batch.commit();
      }
      console.info(`[wipe] ${collection}: ${deleted} docs deleted`);
      return { deleted };
    },

    /** Hiển thị summary các collection trong Firestore */
    async stats() {
      if (!global.DTX_FIREBASE?.enabled) throw new Error('Firebase chưa init');
      const { db, dbMethods: m } = global.DTX_FIREBASE;
      const out = {};
      const cols = ['products','orders','customers','vouchers','articles','reviews','collections','returns','users','audit','movements'];
      for (const c of cols) {
        try {
          const snap = await m.getDocs(m.query(m.collection(db, c), m.limit(1000)));
          out[c] = snap.size;
        } catch (e) { out[c] = 'err:' + e.code; }
      }
      console.table(out);
      return out;
    },
  };
})(window);
