/**
 * admin-rbac.js — permission gate cho admin UI.
 *
 * Cách dùng:
 *   1. Mount file này trước admin-orders.html / admin-customers.html / admin-inventory.html.
 *   2. Đặt thuộc tính `data-perm="orders:write"` lên button/menu cần check.
 *      → Khi DOMContentLoaded, nếu user không có quyền, button sẽ bị xoá khỏi DOM
 *        (không phải display:none — tránh F12 bypass).
 *   3. Trong JS có thể gọi:
 *        DTX_ADMIN_PERMS.has('orders:write')  → boolean
 *        DTX_ADMIN_PERMS.requireOrToast('orders:write')  → boolean (toast nếu thiếu)
 *        DTX_ADMIN_PERMS.hide('.btn-cancel')  → ẩn 1 selector cứng
 *
 * Nguồn permission:
 *   - Remote mode: gọi GET /v1/auth/me → res.permissions[]
 *   - Local mode (demo): đọc localStorage 'dtx_admin_perms' (mảng JSON);
 *     nếu không có → mặc định cấp tất cả (super-admin) để không cản trở demo.
 *
 * Roles → permissions mapping (tham khảo, server là nguồn đúng):
 *   super_admin : *
 *   admin       : orders:*, customers:*, products:*, inventory:*, vouchers:*, articles:*
 *   ops_lead    : orders:*, inventory:*
 *   ops         : orders:read, orders:write (giới hạn status), inventory:read
 *   marketing   : customers:*, vouchers:*, articles:*
 *   support     : orders:read, customers:read, customers:write
 *   finance     : orders:read, payments:write
 *   viewer      : *:read
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'dtx_admin_perms';

  let perms = null;        // Set<string>  — đã resolve
  let user  = null;        // { id, email, name, roles, permissions }
  const waiters = [];      // hàng chờ — chạy khi perms resolve xong

  function normalize(arr) {
    if (!arr || !Array.isArray(arr)) return new Set();
    return new Set(arr.map(p => String(p).toLowerCase().trim()).filter(Boolean));
  }

  function fromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? normalize(arr) : null;
    } catch (_) { return null; }
  }

  function toStorage(set) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch (_) {}
  }

  function has(perm) {
    if (!perms) return true; // chưa resolve → cho phép tạm; UI sẽ enforce sau
    if (!perm) return true;
    const p = String(perm).toLowerCase();
    if (perms.has('*') || perms.has('admin') || perms.has('super_admin')) return true;
    if (perms.has(p)) return true;
    // wildcard: 'orders:*' bao toàn 'orders:read', 'orders:write', …
    const [domain] = p.split(':');
    return perms.has(`${domain}:*`);
  }

  function requireOrToast(perm, msg) {
    if (has(perm)) return true;
    try { global.admToast?.(msg || `Bạn không có quyền: ${perm}`, 'warn'); } catch (_) {}
    return false;
  }

  /** Xoá element nếu thiếu quyền (không chỉ display:none — chống bypass F12) */
  function hide(selector) {
    document.querySelectorAll(selector).forEach(el => el.remove());
  }
  function disable(selector, reason) {
    document.querySelectorAll(selector).forEach(el => {
      el.setAttribute('disabled', 'disabled');
      el.classList.add('is-disabled');
      if (reason) el.title = reason;
      el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, { capture: true });
    });
  }

  /** Quét toàn bộ DOM theo data-perm và data-perm-disable */
  function applyDomGate() {
    if (!perms) return;
    document.querySelectorAll('[data-perm]').forEach(el => {
      const need = el.getAttribute('data-perm');
      if (!has(need)) el.remove();
    });
    document.querySelectorAll('[data-perm-disable]').forEach(el => {
      const need = el.getAttribute('data-perm-disable');
      if (!has(need)) {
        el.setAttribute('disabled', 'disabled');
        el.classList.add('is-disabled');
        el.title = `Cần quyền ${need}`;
      }
    });
  }

  function flushWaiters() {
    while (waiters.length) {
      const fn = waiters.shift();
      try { fn(); } catch (e) { console.error(e); }
    }
  }

  /** Resolve permissions: remote (GET /auth/me) hoặc localStorage */
  async function resolve() {
    // Remote: thử gọi /auth/me nếu DTX_API có sẵn
    if (global.DTX_API?.Auth?.me) {
      try {
        const me = await global.DTX_API.Auth.me();
        user = me?.user || me;
        const arr = me?.permissions || me?.user?.permissions || [];
        perms = normalize(arr);
        toStorage(perms);
        applyDomGate();
        flushWaiters();
        return perms;
      } catch (_) {
        // fall through → storage
      }
    }
    // Storage fallback
    const stored = fromStorage();
    if (stored && stored.size > 0) {
      perms = stored;
    } else {
      // Demo mode: mặc định super-admin để không cản trở
      perms = new Set(['*']);
    }
    applyDomGate();
    flushWaiters();
    return perms;
  }

  /** Cho phép FE override permissions thủ công (test/demo) */
  function set(arr) {
    perms = normalize(arr);
    toStorage(perms);
    applyDomGate();
  }

  function whenReady(fn) {
    if (perms) { fn(); return; }
    waiters.push(fn);
  }

  // Tự chạy khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { resolve(); });
  } else {
    resolve();
  }

  // Re-apply gate sau mỗi lần list/store được cập nhật → row-level actions
  // (table render lại sau khi reload từ server) cũng được kiểm soát quyền.
  ['products', 'orders', 'customers', 'inventory', 'vouchers', 'articles', 'users']
    .forEach(name => {
      global.addEventListener(`dtx:${name}-updated`, () => {
        // requestAnimationFrame để chờ DOM render xong
        requestAnimationFrame(applyDomGate);
      });
    });
  // Tránh F12 khôi phục lại button: nếu DOM mutation thêm element có data-perm
  // mới mà thiếu quyền → xoá luôn.
  if (typeof MutationObserver !== 'undefined') {
    const obs = new MutationObserver(muts => {
      if (!perms) return;
      for (const m of muts) {
        m.addedNodes.forEach(n => {
          if (n.nodeType !== 1) return;
          // check chính nó
          if (n.matches?.('[data-perm]')) {
            const need = n.getAttribute('data-perm');
            if (!has(need)) n.remove();
          }
          // check con cháu
          n.querySelectorAll?.('[data-perm]').forEach(el => {
            const need = el.getAttribute('data-perm');
            if (!has(need)) el.remove();
          });
        });
      }
    });
    if (document.body) obs.observe(document.body, { childList: true, subtree: true });
    else document.addEventListener('DOMContentLoaded', () => obs.observe(document.body, { childList: true, subtree: true }));
  }

  global.DTX_ADMIN_PERMS = {
    has,
    hide,
    disable,
    requireOrToast,
    applyDomGate,
    set,
    resolve,
    whenReady,
    get user() { return user; },
    get perms() { return perms ? [...perms] : null; },
  };
})(window);
