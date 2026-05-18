# Detoxblanc OMS — Production Readiness Checklist

> Tài liệu này là cẩm nang để chuyển hệ thống từ DEV → STAGING → PROD an toàn.
> Mỗi mục có chủ thể, tiêu chí Done, và lệnh thực thi nếu áp dụng.

---

## 0. Bản tóm tắt scope hiện tại (đã có)

- ✅ FE: `admin-orders.html`, `admin-customers.html`, `admin-inventory.html` với 3 modal/drawer chính.
- ✅ BE: `api/src/routes/{orders,customers,inventory}.ts` với tất cả endpoint chính + reservation/loyalty service.
- ✅ Prisma schema mở rộng (reserved, avgCost, loyaltyTier, segment, communications, return/RMA, tracking, Product.stock).
- ✅ Layout guards CSS chống vỡ bố cục khi admin nhập dữ liệu thật (table truncate, modal scroll, word-break).
- ✅ **P0 BE inventory bugs đã fix** (commitStock/receiveStock/reserveStock — atomic + product-level).
- ✅ **P0 BE returns/cancel-after-ship/tracking đã add** + loyalty points refund chuẩn.
- ✅ **P0 FE-BE bridge đã thêm 17 functions** vào `assets/admin-api.js`.
- ✅ **P0 RBAC FE đã add** `assets/admin-rbac.js` + `data-perm` trên 3 trang admin.
- ✅ **Rich seed staging** `api/prisma/seed-staging.ts` (50 KH × 70 đơn × 18 SP × 6 voucher).
- ⏳ Còn lại: chạy `prisma migrate dev` trên staging, smoke test, phối duyệt.

---

## 1. CHECKLIST P0 — bắt buộc trước go-live

### 1.1 Sửa bug logic kho — ĐÃ HOÀN TẤT

| # | Mô tả | File | Done |
|---|---|---|---|
| ✅ | `commitStock` trừ `Product.stock` khi SP không có variantId (atomic UPDATE…WHERE stock>=qty) | `api/src/inventory/reservation.ts` | x |
| ✅ | `receiveStock` cộng `Product.stock` + recompute `Product.avgCost` khi không có variantId | `api/src/inventory/reservation.ts` | x |
| ✅ | `reserveStock` dùng `UPDATE … WHERE (stock-reserved)>=qty` chống oversell + product-level | `api/src/inventory/reservation.ts` | x |
| ✅ | `releaseStock` atomic + clamp-to-zero để idempotent với double-release | `api/src/inventory/reservation.ts` | x |
| ✅ | List/alerts/adjust/set/count/receive routes hỗ trợ SP không có variant | `api/src/routes/inventory.ts` | x |
| ✅ | Schema thêm `Product.stock` field | `api/prisma/schema.prisma` | x |

### 1.2 Bổ sung route nghiệp vụ thiếu — ĐÃ HOÀN TẤT

| # | Endpoint | File | Done |
|---|---|---|---|
| ✅ | `POST /orders/:id/return` — RMA partial/full, optional autoApprove, restock, refund points tỉ lệ | `api/src/routes/orders.ts` | x |
| ✅ | `PATCH /orders/:id/returns/:returnId` — duyệt/từ chối/refund (state machine 5 trạng thái) | `api/src/routes/orders.ts` | x |
| ✅ | `GET /orders/:id/returns` — list cases RMA của đơn | `api/src/routes/orders.ts` | x |
| ✅ | `POST /orders/:id/cancel-after-ship` — huỷ shipping/delivered + tự tạo RTN approved | `api/src/routes/orders.ts` | x |
| ✅ | `PATCH /orders/:id/tracking` — gắn carrier + trackingCode + trackingUrl | `api/src/routes/orders.ts` | x |
| ✅ | Schema mới: `OrderReturn` + `OrderReturnItem` + `Order.{carrierName,trackingCode,trackingUrl,cancelReason,returnedAt}` | `api/prisma/schema.prisma` | x |
| ✅ | Refund points: `recomputeCustomer` + route set `Order.pointsEarned -= pointsRefund` khi approve | `api/src/customers/loyalty.ts` + orders.ts | x |

### 1.3 FE-BE bridge — ĐÃ HOÀN TẤT

Đã thêm 17 functions vào `assets/admin-api.js`:

```js
// Orders
DTX_ADMIN_ORDERS.adminCreate(payload)              // POST /orders/admin-create
DTX_ADMIN_ORDERS.setTracking(id, payload)          // PATCH /orders/:id/tracking
DTX_ADMIN_ORDERS.cancelAfterShip(id, payload)      // POST /orders/:id/cancel-after-ship
DTX_ADMIN_ORDERS.createReturn(id, payload)         // POST /orders/:id/return
DTX_ADMIN_ORDERS.updateReturn(id, returnId, p)     // PATCH /orders/:id/returns/:returnId
DTX_ADMIN_ORDERS.listReturns(id)                   // GET  /orders/:id/returns
DTX_ADMIN_ORDERS.validateVoucher(payload)          // POST /orders/validate-voucher

// Customers
DTX_ADMIN_CUSTOMERS.recomputeLoyalty(id)           // POST /customers/:id/recompute-loyalty
DTX_ADMIN_CUSTOMERS.adjustPoints(id, payload)      // POST /customers/:id/points
DTX_ADMIN_CUSTOMERS.listCommunications(id)         // GET  /customers/:id/communications
DTX_ADMIN_CUSTOMERS.addCommunication(id, payload)  // POST /customers/:id/communications
DTX_ADMIN_CUSTOMERS.updateConsent(id, payload)     // PATCH /customers/:id/consent
DTX_ADMIN_CUSTOMERS.addAddress(id, address)        // POST /customers/:id/addresses
DTX_ADMIN_CUSTOMERS.updateAddress(id, addrId, p)   // PATCH /customers/:id/addresses/:addrId
DTX_ADMIN_CUSTOMERS.removeAddress(id, addrId)      // DELETE
DTX_ADMIN_CUSTOMERS.setDefaultAddress(id, addrId)  // PATCH .../default
DTX_ADMIN_CUSTOMERS.import({rows,strategy})        // POST /customers/import
DTX_ADMIN_CUSTOMERS.merge({sourceId,targetId})     // POST /customers/merge
DTX_ADMIN_CUSTOMERS.findOrders(id)                 // GET  /customers/:id/orders

// Inventory
DTX_ADMIN_INVENTORY.receive(payload)               // POST /inventory/receive
DTX_ADMIN_INVENTORY.receiveBulk(payload)           // POST /inventory/receive-bulk
DTX_ADMIN_INVENTORY.count(payload)                 // POST /inventory/count
DTX_ADMIN_INVENTORY.alerts()                       // GET  /inventory/alerts
DTX_ADMIN_INVENTORY.movements(productId, params)   // GET  /inventory/movements
```

### 1.4 RBAC FE — ĐÃ HOÀN TẤT

File mới: `assets/admin-rbac.js` — tự load, tự gọi `/auth/me`, dựng permissions Set, áp `data-perm`/`data-perm-disable` lên DOM. Có `MutationObserver` để row mới render ra cũng được gate.

```html
<!-- 3 trang admin đều đã include: -->
<script src="assets/admin-rbac.js"></script>

<!-- HTML buttons gate bằng attribute: -->
<button data-perm="orders:write">Tạo đơn</button>
<button data-perm-disable="inventory:write">Nhập kho</button>  <!-- disable thay vì remove -->
```

API JS dùng được:
```js
DTX_ADMIN_PERMS.has('orders:write')            // boolean
DTX_ADMIN_PERMS.requireOrToast('orders:write') // false + toast nếu thiếu
DTX_ADMIN_PERMS.applyDomGate()                 // re-scan DOM
DTX_ADMIN_PERMS.set(['orders:read'])           // override (dev/test)
```

Server vẫn là nguồn đúng: tất cả route đã `requirePermission(...)` → bypass FE không bypass được BE.

### 1.5 Database migration & seed

⚠ **Lệnh dưới chạy 1 lần trên môi trường mới**. Schema đã thêm: `Product.stock`, `Order.{carrierName,trackingCode,trackingUrl,cancelReason,cancelledBy,returnedAt}`, model `OrderReturn` + `OrderReturnItem` + enum `ReturnStatus`.

```bash
cd api

# 1. Tạo migration mới (dev — chỉ chạy local DB)
pnpm prisma migrate dev --name oms_v1_returns_tracking

# 2. Review SQL ở api/prisma/migrations/<timestamp>_oms_v1_returns_tracking/migration.sql
#    Đặc biệt check: ALTER TABLE products ADD COLUMN stock INT DEFAULT 0;
#    + CREATE TABLE order_returns/order_return_items
#    + Index trên (orderId), (status), (trackingCode)

# 3. Backfill Product.stock từ variants (nếu DB cũ đã có data):
#    UPDATE products p SET stock = COALESCE(
#      (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id), 0)
#    WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id);
#    (chỉ set cho SP không có variant — SP có variant để stock=0 vì variant giữ tồn)

# 4. Lên staging
DATABASE_URL=$STAGING_URL pnpm prisma migrate deploy
DATABASE_URL=$STAGING_URL pnpm prisma:seed              # base RBAC + 3 SP
DATABASE_URL=$STAGING_URL pnpm prisma:seed:staging      # rich UAT data (50 KH × 70 đơn × 18 SP × 6 voucher)

# 5. Lên prod (sau UAT pass)
DATABASE_URL=$PROD_URL pnpm prisma migrate deploy
DATABASE_URL=$PROD_URL pnpm prisma:seed                  # CHỈ base seed — KHÔNG seed:staging
```

### 1.6 Env vars phải có ở PROD

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<min 32 char>
JWT_REFRESH_SECRET=<min 32 char>
COOKIE_SECRET=<min 32 char>
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=no-reply@detoxblanc.com
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
MOMO_PARTNER_CODE=...
GHN_TOKEN=...
SENTRY_DSN=...
ADMIN_BASE_URL=https://admin.detoxblanc.com
PUBLIC_BASE_URL=https://detoxblanc.com
NODE_ENV=production
LOG_LEVEL=info
```

### 1.7 Smoke test sau deploy

```bash
# Tạo qua API
curl -X POST $API/orders/admin-create -H "Authorization: Bearer $TOK" \
  -d '{"customer":{"name":"Test"},"items":[...]}' | jq .ok

# Reserve → ship → deliver
curl -X PATCH $API/orders/$ID/status -d '{"status":"confirmed"}'   # reserveStock
curl -X PATCH $API/orders/$ID/status -d '{"status":"shipping"}'    # commitStock
curl -X PATCH $API/orders/$ID/status -d '{"status":"delivered"}'   # earn loyalty

# Verify stock đã giảm
curl $API/inventory | jq '.data[] | select(.id=="...")'
```

---

## 2. CHECKLIST P1 — Khuyến nghị nhưng có thể sau go-live

| # | Tính năng | Effort | Done |
|---|---|---|---|
| ☐ | In nhãn ship + invoice VAT (dùng PDFKit/Puppeteer) | 3 ngày | |
| ☐ | Partial shipment (1 đơn 2 kiện, mỗi kiện 1 tracking) | 5 ngày | |
| ☐ | Multi-warehouse (Location + Stock per location) | 1 tuần | |
| ☐ | Lot/expiry tracking (mỹ phẩm cần date hết hạn) | 5 ngày | |
| ☐ | Payment-split (đặt cọc 30% + thanh toán phần còn lại) | 4 ngày | |
| ☐ | COD ledger reconciliation với GHN | 3 ngày | |
| ☐ | Refund partial + auto hoàn điểm loyalty | 3 ngày | |
| ☐ | Bulk action trong admin-customers (gắn tag, thay segment) | 2 ngày | |
| ☐ | Export PDF báo cáo doanh thu cuối ngày | 2 ngày | |

---

## 3. ROLLOUT PLAN — 4 giai đoạn

### Giai đoạn 0 — Chuẩn bị (D-7 → D-3)

| Ngày | Việc | Chủ thể |
|---|---|---|
| D-7 | Hoàn tất P0 1.1, 1.2 | Dev |
| D-6 | Hoàn tất P0 1.3, 1.4 | Dev |
| D-5 | Tạo migration + seed staging | Dev |
| D-4 | Cấu hình env staging + smoke test | Dev + DevOps |
| D-3 | Tạo bộ tài liệu hướng dẫn admin (10 video 2'/clip) | PM |

### Giai đoạn 1 — UAT nội bộ (D-3 → D-0)

**Tester**: 1 PO + 2 ops + 1 dev. Kịch bản test đầy đủ:

```
KB1 — Tạo đơn POS
  • 30 đơn: 10 KH cũ, 10 KH mới, 10 hỗn hợp voucher percent/amount/shipping
  • Verify: voucher.usedCount tăng đúng, KH mới tự upsert, address lưu nếu tích saveAsAddress
KB2 — Inventory
  • Reserve 5 SKU → cancel 2 → confirm lại → ship → deliver
  • Verify: reserved=0, stock=stock-qty, movement đầy đủ
KB3 — PO nhập kho
  • Nhập 10 SKU, mỗi SKU qty=50, cost khác giá hiện tại
  • Verify: avgCost tính đúng (moving-average), stock tăng đúng
KB4 — Kiểm kê
  • Đếm 20 SKU với 5 SKU âm, 5 SKU dương
  • Verify: movement count đúng delta
KB5 — Drawer KH
  • Edit info, thêm 3 địa chỉ, ghi 50 communication, đổi consent, recompute
  • Verify: tất cả thay đổi persist + audit
KB6 — Concurrent
  • 2 admin tạo đơn cùng 1 SKU last-piece → chỉ 1 thành công, đơn còn lại lỗi 409
KB7 — Layout stress
  • Tạo KH tên 120 ký tự, email 80 ký tự, address 200 ký tự, ghi chú 2000 ký tự
  • Verify: không vỡ bố cục, không xuất hiện scrollbar ngang ngoài ý muốn
```

**Exit criteria**: 0 P0 bug, < 5 P1 bug, audit log đầy đủ, layout không vỡ.

### Giai đoạn 2 — Pilot 1 team (W1–W2 sau cutover)

- 1 team CSKH/ops thật vận hành 100% trên admin mới, hệ cũ chỉ-đọc.
- Backup PROD DB mỗi 1 giờ trong 7 ngày đầu.
- Metrics theo dõi (Grafana/Prometheus):
  - `orders_created_total{source="admin"}` — tăng đều mỗi giờ ban ngày
  - `request_duration_seconds{route="/orders/admin-create"}` — p95 < 500 ms
  - `request_errors_total{status="5xx"}` < 1%
  - `inventory_drift_total` (so giữa Σ stock − Σ Σ movement) = 0
  - `voucher_used_count_skew` (so DB vs `Σ orders.voucherCode`) = 0

### Giai đoạn 3 — Full go-live (W3+)

- Switch toàn bộ traffic admin (DNS / `DTX_API_MODE=remote`).
- Tắt hệ cũ chỉ-đọc.
- Daily standup 15' review log + bug trong tuần đầu.
- On-call dev 2 ca / 24h × 7 ngày đầu.

---

## 4. ROLLBACK PLAN

### 4.1 Rollback trong 24h
- Đặt `DTX_API_MODE=local` ở FE config → toàn bộ admin chạy localStorage tạm.
- DB: nếu chỉ migration mới gây sự cố:
  ```bash
  DATABASE_URL=$PROD pnpm prisma migrate resolve --rolled-back <migration_name>
  # Restore từ snapshot pre-cutover
  pg_restore -d $PROD_DB backup_pre_cutover.dump
  ```
- Pause BullMQ queue, drain dần để không mất job.

### 4.2 Rollback từng phần
- Tắt riêng admin-create (feature flag): admin tạm tạo đơn qua hệ cũ.
- Tắt riêng PO receive: ops nhập tay qua DB tool tạm 1-2 ngày.

### 4.3 Verify sau rollback
- Smoke test 1.7 chạy lại toàn bộ.
- Đối soát stock: Σ delivered orders × qty = Σ stock_movements{reason='sale'}.

---

## 5. MONITORING & ALERTS

### 5.1 Sentry — error tracking
```ts
// api/src/main.ts
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: env.SENTRY_DSN, tracesSampleRate: 0.1 });
```

### 5.2 Alert rules (PagerDuty / Slack)

| Alert | Điều kiện | Severity |
|---|---|---|
| API 5xx rate | `> 1%` trong 5 phút | P1 |
| Order create failure | `> 5/phút` | P0 |
| Inventory drift | tổng stock chênh > 10 đơn vị/ngày | P0 |
| Reserve oversell | có movement reason=reserve mà reserved>stock | P0 |
| Disk usage | `> 80%` | P1 |
| DB connection pool | `> 80%` saturated | P1 |

---

## 6. SECURITY CHECKLIST

- ☐ JWT_SECRET ≥ 32 ký tự ngẫu nhiên (KHÔNG phải string mặc định)
- ☐ Cookie HttpOnly + Secure + SameSite=Strict
- ☐ CORS chỉ allow origin `admin.detoxblanc.com` + `detoxblanc.com`
- ☐ Rate limit 60 req/phút cho login, 600/phút cho API thường
- ☐ Bcrypt ≥ 12 rounds
- ☐ Audit log mọi action `*:write`
- ☐ Webhook payment có signature verify
- ☐ SQL injection: tất cả query dùng Prisma (không có raw query với user input)
- ☐ XSS: `escape()` mọi user-content render
- ☐ CSP header strict-dynamic
- ☐ Backup DB mã hoá tại rest, retention 30 ngày

---

## 7. HANDOVER cho ops

### 7.1 Tài liệu cho admin thật
- ☐ Slide 30 trang "Hướng dẫn vận hành OMS" (PO viết)
- ☐ 10 video clip 2'/clip (Loom): tạo đơn / nhập kho / kiểm kê / xem KH / xử lý hoàn trả
- ☐ FAQ 50 câu hỏi thường gặp
- ☐ Hotline support nội bộ giờ hành chính

### 7.2 Quyền truy cập
- 1 tuan@detoxblanc.com (full)
- 2 admin@ (tất cả trừ users:write)
- 5 support@ (orders:* + customers:*)
- 2 stockkeeper@ (inventory:*)
- 1 accountant@ (reports:read + audit:read)

### 7.3 Backup admin credentials
- Lưu Bitwarden/1Password chia sẻ với 2 founder + 1 dev lead
- TOTP backup codes in giấy, niêm phong, két công ty

---

**Ngày dự kiến go-live đề xuất**: D = 2026-05-15 (cho phép 2-3 tuần hoàn thiện P0).

**Người chịu trách nhiệm**:
- Tech lead: ____
- PM: ____
- DevOps: ____
- QA: ____
