# Detoxblanc OMS — Hướng dẫn upload cho IT

> Bộ FE đã được build sẵn. Chỉ cần upload toàn bộ file lên web root của host.
> Hỗ trợ mọi nền tảng phổ biến: Apache, Nginx, IIS, Firebase, Cloudflare Pages, Netlify, Vercel.

---

## 📦 Nội dung gói

| Mục | Mô tả |
|---|---|
| **47 file `.html`** | 27 trang public (about, product, checkout…) + 20 trang admin |
| **`assets/`** | CSS, JS, data seed, partials (~380 KB) |
| **`tools/`** | Tool nội bộ (skip nếu không cần) |
| **`.htaccess`** | Config cho Apache (cPanel, Plesk Linux) — auto applied |
| **`web.config`** | Config cho IIS (Plesk Windows, Azure) — auto applied |
| **`firebase.json`** | Config cho Firebase Hosting — chỉ dùng nếu deploy Firebase |
| **`README-FOR-IT.md`** | File này |

⚠ **KHÔNG upload** các file/thư mục sau lên public host (đã loại trong zip):
- `api/` — backend riêng (deploy Cloud Run/VPS riêng nếu cần)
- `*.md` ngoài README này — tài liệu nội bộ
- `Dockerfile`, `nginx.conf`, `cloudbuild.yaml` — chỉ dùng khi deploy container
- `.firebaserc`, `.gcloudignore`, `.dockerignore`

---

## 🚀 Hướng dẫn theo từng loại host

### 1. cPanel / Plesk Linux (Apache) — phổ biến nhất ở VN

1. Login cPanel → **File Manager** → `public_html/` (hoặc subdomain folder)
2. **Xoá** tất cả file demo cũ (nếu có) — TRỪ `.htpasswd` nếu đã set
3. **Upload** zip → click chuột phải → **Extract**
4. Đảm bảo file `.htaccess` được giải nén (mặc định bị ẩn — bật "Show Hidden Files" trong File Manager)
5. Test:
   - `https://your-domain.com/` → trang chủ
   - `https://your-domain.com/admin` → console admin
   - `https://your-domain.com/admin/orders` → trang đơn hàng (URL clean)

**Permissions** (nếu File Manager báo lỗi):
- Folder: 755
- File: 644
- Riêng `.htaccess`: 644

### 2. Plesk Windows / IIS / Azure App Service

1. Plesk → **File Manager** → `wwwroot/` hoặc `httpdocs/`
2. Upload + extract zip
3. `web.config` sẽ tự được IIS đọc — không cần restart
4. Test các URL như mục 1

### 3. Nginx (VPS, Vultr, DigitalOcean)

```bash
# 1. SSH vào VPS, upload zip
scp detoxblanc-fe.zip user@server:/var/www/

# 2. Extract
cd /var/www && unzip detoxblanc-fe.zip -d detoxblanc/

# 3. Set ownership
chown -R www-data:www-data /var/www/detoxblanc

# 4. Tạo Nginx config
cat > /etc/nginx/sites-available/detoxblanc <<'EOF'
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/detoxblanc;
    index index.html;
    charset utf-8;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Clean admin URLs
    location ^~ /admin/ {
        add_header X-Frame-Options "DENY" always;
        add_header X-Robots-Tag "noindex, nofollow" always;
        rewrite ^/admin/?$              /admin.html last;
        rewrite ^/admin/login$          /admin-login.html last;
        rewrite ^/admin/orders$         /admin-orders.html last;
        rewrite ^/admin/customers$      /admin-customers.html last;
        rewrite ^/admin/inventory$      /admin-inventory.html last;
        rewrite ^/admin/products$       /admin-products.html last;
        rewrite ^/admin/products/edit$  /admin-product-edit.html last;
        rewrite ^/admin/collections$    /admin-collections.html last;
        rewrite ^/admin/articles$       /admin-articles.html last;
        rewrite ^/admin/pages$          /admin-pages.html last;
        rewrite ^/admin/reviews$        /admin-reviews.html last;
        rewrite ^/admin/newsletter$     /admin-newsletter.html last;
        rewrite ^/admin/vouchers$       /admin-vouchers.html last;
        rewrite ^/admin/returns$        /admin-returns.html last;
        rewrite ^/admin/reports$        /admin-reports.html last;
        rewrite ^/admin/audit$          /admin-audit.html last;
        rewrite ^/admin/users$          /admin-users.html last;
        rewrite ^/admin/settings$       /admin-settings.html last;
        rewrite ^/admin/dev$            /admin-dev.html last;
        return 404;
    }

    # Cache static
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    location ~* \.html$ { add_header Cache-Control "max-age=300, must-revalidate"; }

    # Public clean URL
    location / { try_files $uri $uri.html $uri/ /index.html; }
}
EOF

# 5. Enable + reload
ln -sf /etc/nginx/sites-available/detoxblanc /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 6. SSL (Let's Encrypt)
certbot --nginx -d your-domain.com
```

### 4. Firebase Hosting (Google) — free + CDN

```bash
# 1. Cài CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Tạo project (qua https://console.firebase.google.com)
# rồi update .firebaserc trong zip:
echo '{"projects":{"default":"YOUR-PROJECT-ID"}}' > .firebaserc

# 4. Deploy
firebase deploy --only hosting
```

URL: `https://YOUR-PROJECT-ID.web.app` (auto SSL, CDN edge global, free 10GB).

### 5. Cloudflare Pages — free tier mạnh

1. https://dash.cloudflare.com → **Pages** → **Create project** → **Direct upload**
2. Upload zip → Cloudflare tự extract + serve
3. URL: `https://your-project.pages.dev`
4. Custom domain: chỉ cần thêm CNAME trong DNS

### 6. Vercel — free tier dễ

```bash
npm install -g vercel
cd detoxblanc
vercel deploy --prod
```

Vercel hiểu `firebase.json` rewrites một phần. Nếu URL clean không hoạt động, tạo file `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/admin/orders", "destination": "/admin-orders.html" },
    ...
  ]
}
```

### 7. Netlify

Tạo file `_redirects` ở root:
```
/admin/orders     /admin-orders.html     200
/admin/customers  /admin-customers.html  200
... (19 dòng)
```

Hoặc upload qua Netlify Drop: https://app.netlify.com/drop

---

## 🔒 Bảo mật

Sau khi upload:

- [ ] Test SSL hoạt động: `https://...` (không phải http)
- [ ] Test header bảo mật admin:
  ```bash
  curl -sI https://your-domain.com/admin/orders | grep -i "x-frame\|x-robots\|cache-control"
  # Phải có: X-Frame-Options: DENY, X-Robots-Tag: noindex, Cache-Control: no-store
  ```
- [ ] Block public access các file `.md`, `.firebaserc`, `Dockerfile` (đã có trong `.htaccess`/`web.config`)
- [ ] Tắt directory listing (`Options -Indexes` trong `.htaccess`)
- [ ] Setup HTTPS redirect (force https):
  ```apache
  # Apache .htaccess
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  ```

---

## 🧪 Smoke test sau khi upload

```bash
DOMAIN="https://your-domain.com"

# Public pages
curl -sI "$DOMAIN/"            | head -1   # phải 200
curl -sI "$DOMAIN/about"       | head -1   # phải 200 (clean URL)
curl -sI "$DOMAIN/about.html"  | head -1   # phải 200 (direct file)

# Admin pages
curl -sI "$DOMAIN/admin"       | head -1   # phải 200
curl -sI "$DOMAIN/admin/orders" | head -1  # phải 200 (rewrite)

# Security headers admin
curl -sI "$DOMAIN/admin/orders" | grep -iE "x-frame|x-robots|cache-control"

# Public CSS load
curl -sI "$DOMAIN/assets/styles.css" | head -1   # phải 200
curl -sI "$DOMAIN/assets/admin.css"  | head -1   # phải 200

# 404 page
curl -sI "$DOMAIN/khong-co-trang-nay" | head -1  # phải 404 (hoặc redirect)
```

---

## ⚙ FE chạy ở chế độ nào?

FE có 2 mode (xem `assets/env-detect.js`):

- **`local`** — data từ seed JS trong file (`assets/data/*.js` + `assets/admin-data*.js`). KHÔNG cần backend. Phù hợp demo / UAT FE thuần.
- **`remote`** — gọi REST API `/v1/...`. Cần deploy backend riêng (xem `api/` folder).

Mặc định `*.web.app` / `*.firebaseapp.com` / `*.run.app` → `local` mode. Domain thật của bạn → `remote` mode (cần BE).

**Khi muốn FE gọi BE thật**, thêm dòng này vào mỗi HTML hoặc trong `<head>` global:
```html
<meta name="dtx-api-base" content="https://api.your-domain.com/v1">
<meta name="dtx-mode" content="remote">
```

---

## 📞 Gặp vấn đề?

| Triệu chứng | Nguyên nhân thường gặp | Fix |
|---|---|---|
| URL `/admin/orders` 404 | mod_rewrite chưa bật | cPanel → Apache modules → enable `mod_rewrite` |
| `.htaccess` không có hiệu lực | `AllowOverride None` | Thêm `AllowOverride All` vào VirtualHost |
| CSS/JS không load | Path tuyệt đối/tương đối | Đảm bảo `assets/` ở cùng level với HTML |
| Modal admin "vỡ" giao diện | Cache CSS cũ | Hard refresh (Ctrl+Shift+R) hoặc thêm query `?v=2` |
| Admin button không hiện | RBAC perms chưa load | Mở DevTools → Application → Local Storage → set `dtx_admin_perms = ["*"]` |

---

## 📋 Hỗ trợ

- Tài liệu chi tiết deploy Google Cloud: `DEPLOY-GOOGLE.md` (trong gói gốc, không có trong zip này)
- Production checklist & rollback: `PRODUCTION-CHECKLIST.md` (như trên)
- Báo lỗi: dev team Detoxblanc

✅ **Khi xong, gửi URL public cho team để verify trước khi go-live.**
