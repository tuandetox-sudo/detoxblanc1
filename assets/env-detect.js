/**
 * env-detect.js — chạy SỚM, trước admin-api.js, để tự cấu hình:
 *   - DTX_MODE       : 'local' (file://, demo) hoặc 'remote' (deploy)
 *   - DTX_API_BASE   : URL gốc API (cùng origin /v1, hoặc subdomain)
 *
 * Hostname logic (override được bằng meta tag <meta name="dtx-api-base" content="...">):
 *   • localhost / 127.x.x.x / file://       → mode=local, base=/v1 (chỉ dùng nếu Python http.server có proxy)
 *   • *.web.app / *.firebaseapp.com         → mode=remote, base=/v1 (Firebase rewrite → Cloud Run)
 *   • *.run.app                             → mode=remote, base=/v1 (Cloud Run cùng container)
 *   • detoxblanc.com / www.detoxblanc.com   → mode=remote, base=https://api.detoxblanc.com/v1
 *   • staging.detoxblanc.com                → mode=remote, base=https://api-staging.detoxblanc.com/v1
 *   • mặc định khác                         → mode=remote, base=/v1
 */

(function (global) {
  'use strict';

  function metaContent(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? (el.getAttribute('content') || '').trim() : '';
  }

  function detect() {
    // Override #1: meta tag (mạnh nhất — set ở từng môi trường)
    const metaBase = metaContent('dtx-api-base');
    const metaMode = metaContent('dtx-mode');
    if (metaBase) return { base: metaBase, mode: metaMode || 'remote' };

    // Override #2: localStorage (dev quick-toggle)
    try {
      const ls = localStorage.getItem('DTX_API_BASE_OVERRIDE');
      if (ls) return { base: ls, mode: 'remote' };
    } catch (_) {}

    const host = location.hostname;
    const proto = location.protocol;

    // Local file open hoặc dev
    if (proto === 'file:' || host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return { base: '/v1', mode: 'local' };
    }

    // Production domain mapping
    if (/^(www\.)?detoxblanc\.com$/i.test(host)) {
      return { base: 'https://api.detoxblanc.com/v1', mode: 'remote' };
    }
    if (/^staging\./i.test(host) && /detoxblanc\.com$/i.test(host)) {
      return { base: 'https://api-staging.detoxblanc.com/v1', mode: 'remote' };
    }

    // Firebase Hosting / *.run.app: mặc định LOCAL mode (demo FE qua seed)
    // Khi BE đã deploy, override bằng:
    //   <meta name="dtx-mode" content="remote">
    //   <meta name="dtx-api-base" content="https://api.example.com/v1">
    // hoặc localStorage.setItem('DTX_API_BASE_OVERRIDE', '...').
    if (/\.web\.app$/i.test(host) || /\.firebaseapp\.com$/i.test(host) || /\.run\.app$/i.test(host)) {
      return { base: '/v1', mode: 'local' };
    }

    // Mặc định
    return { base: '/v1', mode: 'remote' };
  }

  const cfg = detect();
  global.DTX_API_BASE = cfg.base;
  global.DTX_MODE     = cfg.mode;

  // Banner debug nhỏ trên trang admin (góc dưới phải) khi mode=remote
  // Giúp ops biết FE đang gọi API nào, khỏi confused.
  global.addEventListener('DOMContentLoaded', () => {
    if (!document.body?.dataset?.admPage) return;          // chỉ trang admin
    if (location.search.includes('hideEnvBanner')) return;
    const dot = document.createElement('div');
    dot.className = 'adm-env-banner';
    dot.style.cssText = [
      'position:fixed', 'bottom:8px', 'right:8px', 'z-index:60',
      'padding:4px 9px', 'border-radius:999px', 'font:500 11px/1.2 system-ui',
      'background:' + (cfg.mode === 'local' ? '#FEF3C7' : '#DCFCE7'),
      'color:' + (cfg.mode === 'local' ? '#92400E' : '#166534'),
      'border:1px solid', 'border-color:' + (cfg.mode === 'local' ? '#FDE68A' : '#86EFAC'),
      'opacity:.85', 'cursor:default',
    ].join(';');
    dot.title = `API base: ${cfg.base}\nClick để ẩn`;
    dot.textContent = cfg.mode === 'local' ? '● LOCAL' : '● ' + (cfg.base.replace(/^https?:\/\//, '').replace(/\/v1.*$/, '') || 'API');
    dot.addEventListener('click', () => dot.remove());
    document.body.appendChild(dot);
  });
})(window);
