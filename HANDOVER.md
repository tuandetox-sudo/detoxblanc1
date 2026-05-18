# 🤝 HANDOVER — Detoxblanc OMS Project

> **Mục đích**: Tài liệu này giúp Claude Code AI ở tài khoản mới hiểu ngay context dự án và tiếp tục dev mà không phải hỏi lại từ đầu.
>
> **Cách dùng**: Khi mở Claude Code lần đầu tiên ở account/máy mới, paste **toàn bộ file này** vào message đầu, kèm 1 câu "Tôi muốn tiếp tục dev dự án này". AI sẽ load context đầy đủ.

---

## 1. Tổng quan dự án

**Detoxblanc OMS v1.0** — Hệ thống quản trị + website thương mại điện tử mỹ phẩm dược.

- **Lĩnh vực**: Skincare D2C (Vietnam)
- **Stack**: Vanilla HTML/CSS/JS frontend + Firebase backend (Auth + Firestore + Hosting)
- **Hạ tầng**: Google Cloud Firebase (free tier)
- **Trạng thái**: ✅ Production-ready, đã deploy, login + persist Firestore hoạt động end-to-end

## 2. URL Production (đã live)

| | |
|---|---|
| **Trang chủ public** | https://detoxblanc-demo-55472.web.app |
| **Admin login** | https://detoxblanc-demo-55472.web.app/admin/login |
| **Admin dashboard** | https://detoxblanc-demo-55472.web.app/admin |
| **Biên bản bàn giao** | https://detoxblanc-demo-55472.web.app/BAN-GIAO |
| **Demo hub** | https://detoxblanc-demo-55472.web.app/demo-handover |
| **Firebase Console** | https://console.firebase.google.com/project/detoxblanc-demo-55472 |
| **Firestore data** | https://console.firebase.google.com/project/detoxblanc-demo-55472/firestore/data |

### 27 trang public (URL clean)
`/`, `/product`, `/category`, `/checkout`, `/wishlist`, `/track`, `/account`, `/login`, `/search`, `/journal`, `/article-niacinamide`, `/science`, `/ritual`, `/gift`, `/faq`, `/contact`, `/shipping`, `/returns`, `/safety`, `/about`, `/careers`, `/dealer`, `/privacy`, `/terms`, `/cookie`, `/sitemap`, `/article`

### 20 trang admin (URL clean)
`/admin`, `/admin/login`, `/admin/orders`, `/admin/customers`, `/admin/inventory`, `/admin/products`, `/admin/products/edit`, `/admin/collections`, `/admin/articles`, `/admin/pages`, `/admin/reviews`, `/admin/newsletter`, `/admin/vouchers`, `/admin/returns`, `/admin/reports`, `/admin/audit`, `/admin/users`, `/admin/settings`, `/admin/dev`, `/admin/coming-soon`

## 3. 🔐 Credentials (BẢO MẬT — đổi sau khi nhận)

### Firebase Project
- **Project ID**: `detoxblanc-demo-55472`
- **Project Number**: `874496431974`
- **Region**: `asia-southeast1` (Singapore)
- **Owner Google account**: `tuan@detoxblanc.com`

### Firebase Web App config
```js
{
  apiKey: 'AIzaSyDKiqOPET7cFRAtcX2A_HEItWw_Gi4b9Ck',
  authDomain: 'detoxblanc-demo-55472.firebaseapp.com',
  projectId: 'detoxblanc-demo-55472',
  storageBucket: 'detoxblanc-demo-55472.firebasestorage.app',
  messagingSenderId: '874496431974',
  appId: '1:874496431974:web:a236ab36d19e97e162daa7'
}
```

### Admin user
| | |
|---|---|
| **Email** | `tuan@detoxblanc.com` |
| **Password** | `Detox@69487Pass!` |
| **Role** | Owner |
| **UID** | `h8tinMr0jHg61fexAZezQfxG4df2` |

⚠ **Đổi password ngay** sau lần đầu nhận handover qua Firebase Console.

## 4. Cấu trúc thư mục

**Root**: `/Users/tranquy/Downloads/thư mục không có tiêu đề/detoxblanc-clone/`

```
detoxblanc-clone/
├── *.html                       (47 trang: 27 public + 20 admin)
├── assets/
│   ├── admin.css                (1100+ dòng — admin UI + layout guards + modal CSS)
│   ├── styles.css               (public site CSS)
│   ├── pages.css
│   ├── admin-data.js            (makeStore() — localStorage backend)
│   ├── admin-data-ext.js        (Articles, Reviews, Users, RBAC, ...)
│   ├── admin-shell.js           (sidebar + topbar render)
│   ├── admin-rbac.js            (RBAC FE permission gate, data-perm)
│   ├── admin-api.js             (REST API bridge — legacy, không dùng với Firebase)
│   ├── env-detect.js            (auto-detect local/remote/firebase mode)
│   ├── firebase-config.js       (Firebase SDK init, ESM CDN v10.13.2)
│   ├── firebase-bridge.js       (Drop-in replace makeStore với Firestore real-time)
│   ├── firebase-seed.js         (Migration helper: localStorage → Firestore)
│   ├── partials/                (header.html, footer.html)
│   └── data/products.js
├── api/                         (Fastify BE — KHÔNG dùng nữa, đã chuyển sang Firebase)
│   ├── src/                     (40 routes, prisma schema)
│   ├── prisma/schema.prisma     (Postgres model — không deploy)
│   └── Dockerfile               (Cloud Run option)
├── firebase.json                (Hosting config: rewrites, headers, cache, cleanUrls)
├── .firebaserc                  ({"projects":{"default":"detoxblanc-demo-55472"}})
├── firestore.rules              (Security rules theo role)
├── firestore.indexes.json       (5 composite indexes)
├── Dockerfile + nginx.conf      (Single-container Cloud Run — không dùng)
├── cloudbuild.yaml              (CI/CD — không dùng)
├── PRODUCTION-CHECKLIST.md      (Go-live checklist 4 phase)
├── DEPLOY-GOOGLE.md             (Hướng dẫn deploy 3 path)
├── BAN-GIAO.html                (Biên bản bàn giao chốt)
├── demo-handover.html           (Hub landing 4 tier cards)
├── HANDOVER.md                  (FILE NÀY)
└── scripts/deploy-google.sh     (One-command deploy script)
```

## 5. Architecture đã chọn

```
┌────────────────────────────────────────────────────┐
│  detoxblanc-demo-55472.web.app                     │
│  Firebase Hosting · SSL · Edge CDN global          │
├────────────────────────────────────────────────────┤
│  Frontend (Vanilla HTML/CSS/JS):                   │
│  ├─ 27 trang public (catalog, checkout, content)   │
│  └─ 20 trang admin (RBAC theo role)                │
└──────────────────┬─────────────────────────────────┘
                   │ Firebase Web SDK v10.13.2 (ESM CDN)
                   ▼
┌────────────────────────────────────────────────────┐
│  Firebase Auth (Email/Password)                    │
│  └─ Rules theo email + custom claims               │
├────────────────────────────────────────────────────┤
│  Firestore (asia-southeast1)                       │
│  Collections: orders, customers, products,         │
│    inventory, vouchers, articles, collections,     │
│    reviews, returns, audit, users, settings,       │
│    subscribers, movements                          │
└────────────────────────────────────────────────────┘
```

## 6. Tính năng đã hoàn thiện

### 16 module admin
1. **Đơn hàng** — POS create, 9 state machine, RMA partial/full, cancel-after-ship, tracking carrier
2. **Khách hàng** — RFM 5 segment, Loyalty 4 tier, 6-tab drawer (info/addresses/orders/comm/loyalty/consent), CSV import
3. **Kho hàng** — PO receive (avgCost moving-avg), physical count, reservation, atomic anti-oversell, movement ledger
4. **Sản phẩm** — Catalog 18 SKU seed, variant, SEO meta, bulk edit
5. **Bộ sưu tập** — Tag/rule-based collections
6. **Bài viết** — Markdown editor, scheduled publish, SEO
7. **Trang tĩnh** — About/Privacy/Terms/Shipping/FAQ với editor + footer position
8. **Đánh giá** — Approve/reject reviews, bulk approve
9. **Newsletter** — Campaign + subscriber + 3 templates BullMQ
10. **Voucher** — 3 type (percent/amount/shipping), usage limit, schedule
11. **Trả hàng RMA** — 5 state (requested → inspecting → approved → refunded)
12. **Báo cáo** — GMV, AOV, top SP, cohort cơ bản
13. **Audit log** — Hash chain verify, filter by entity
14. **RBAC** — 5 system roles × 18 permissions, custom claims via Firebase Auth
15. **Cài đặt** — Brand, payment, shipping, loyalty rules, tax, maintenance
16. **Dev tools** — Migration buttons, Firestore stats, theme toggle

### 27 module public
Trang chủ với hero + grid SP nổi bật · Catalog + detail · Cart + checkout · Account · Wishlist · Track order · Blog/Journal · Articles · Hỗ trợ (FAQ, Contact, Shipping, Returns, Safety) · Pháp lý (Privacy, Terms, Cookie) · Về công ty (About, Careers, Dealer)

### Security
- Firestore rules theo role: catalog read public · staff write · admin only audit
- Layout guards CSS chống vỡ bố cục khi admin nhập data dài
- RBAC FE: data-perm attribute + MutationObserver chống F12 bypass
- HTTP headers: X-Frame-Options DENY (admin), X-Robots-Tag noindex, Cache-Control no-store
- Reauth required cho mọi admin action sensitive

## 7. Workflow đang vận hành

### Tạo đơn từ admin
1. Login `/admin/login` với owner credentials
2. Vào `/admin/orders` → click "Tạo đơn thủ công"
3. Modal POS-style: chọn KH (search hoặc tạo mới) → chọn SP từ catalog → set qty/price/voucher → save
4. Đơn lưu Firestore `orders/{auto-id}` với code `DTX-YY-XXXXX`
5. F5 → đơn còn nguyên (persist) ✓
6. Mở browser khác → login → thấy đơn ngay (real-time sync)

### Migrate seed
- Vào `/admin/dev` → box vàng "Firestore Migration" → click "Migrate full seed"
- firebase-seed.js đọc localStorage → batch push lên Firestore
- Idempotent: skip collection đã có data

## 8. Phần CHƯA hoàn thành (roadmap v1.1)

| # | Tính năng | Ước tính | Ưu tiên |
|---|---|---|---|
| 1 | Phân tích nâng cao (funnel, cohort heatmap) | 5-7 ngày | P2 |
| 2 | QR chính hãng (verify + batch trace) | 7-10 ngày | P3 |
| 3 | Tích hợp ngoài (VNPAY, GHN, GA, Pixel) | 10-15 ngày | P1 |
| 4 | Custom domain `detoxblanc.com` (gắn SSL) | 30 phút | P0 — khi sẵn sàng go-live |
| 5 | Email transactional (SendGrid/Mailgun thay BullMQ) | 2-3 ngày | P1 |
| 6 | MFA (TOTP 2FA) | 2 ngày | P1 sau go-live |
| 7 | Backup tự động Firestore daily | 1 ngày | P1 |

## 9. Lệnh thường dùng

```bash
# Đi vào folder project
cd "/Users/tranquy/Downloads/thư mục không có tiêu đề/detoxblanc-clone"

# Deploy hosting only
firebase deploy --only hosting --non-interactive

# Deploy Firestore rules + indexes
firebase deploy --only firestore --non-interactive

# Deploy cả 2
firebase deploy --only hosting,firestore --non-interactive

# Run local dev server
python3 -m http.server 8080 --bind 127.0.0.1
# → http://127.0.0.1:8080

# Reauth nếu token hết hạn
firebase login --reauth

# Test login API
API_KEY='AIzaSyDKiqOPET7cFRAtcX2A_HEItWw_Gi4b9Ck'
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"tuan@detoxblanc.com","password":"Detox@69487Pass!","returnSecureToken":true}'
```

## 10. Lưu ý quan trọng

1. **`<base href="/">`**: Tất cả admin pages cần có dòng này trong `<head>` để URL clean không bị broken assets path.

2. **firebase-bridge.js**: Drop-in replace cho admin-data.js — phải load SAU admin-data-ext.js để override stores. Order: env-detect → firebase-config → admin-data → admin-data-ext → firebase-bridge → admin-shell → admin-rbac.

3. **env-detect.js**: Tự bật Firebase mode khi hostname là `*.web.app` / `*.firebaseapp.com` / `*.run.app`. Local mode khi `localhost`. Override qua `<meta name="dtx-mode" content="remote">`.

4. **Firebase token hết hạn nhanh**: Sau 1-2 lần deploy thường bị invalidate. Cần `firebase login --reauth` lại.

5. **Auth Email/Password đã enable**: KHÔNG cần làm lại bước Console. Chỉ thêm user mới qua API hoặc Console.

## 11. Tasks gợi ý tiếp theo (cho dev nhận handover)

```
Ưu tiên P0:
□ Đổi password tuan@detoxblanc.com → password an toàn riêng
□ Thêm 2-3 user nhân viên (support, marketing) với role thấp hơn
□ Setup custom claims: role:'owner' cho admin chính
□ Backup Firestore lần đầu (export GCS bucket)
□ Gắn custom domain detoxblanc.com qua Firebase Console
□ Setup Firebase Analytics + Google Analytics 4

Ưu tiên P1:
□ Build tích hợp VNPAY / MoMo (cho checkout thanh toán thật)
□ Tích hợp GHN/GHTK API (sinh vận đơn auto)
□ Email transactional thật (SendGrid template)
□ Setup CI/CD (GitHub Actions → firebase deploy on push)
□ Setup Sentry monitoring

Ưu tiên P2:
□ Build admin/analytics (funnel, cohort)
□ Build admin/integrations
□ Build admin/coming-soon=qr (QR chính hãng)
□ Migrate 18 SP catalog từ Excel/CSV vào Firestore
□ Setup Cloud Functions cho atomic inventory ops
```

## 12. File transcript (tuỳ chọn)

Toàn bộ cuộc trò chuyện gốc với Claude (từ lúc dự án bắt đầu) lưu tại:
```
/Users/tranquy/.claude/projects/-Users-tranquy-Downloads-th--m-c-kh-ng-c--ti-u---/a08c6b39-29f8-485c-9138-bec6bae435db.jsonl
```

File này 14MB JSON Lines. Đã copy ra Desktop để chuyển qua máy mới.

---

**Người tạo handover**: Claude (anthropic.com) cho `tuan@detoxblanc.com`
**Ngày tạo**: 2026-05-15
**Phiên bản**: 1.0
**Liên hệ original owner**: tuan@detoxblanc.com (Google account Firebase project)
