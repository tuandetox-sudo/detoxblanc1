# Detoxblanc OMS — Deploy lên Google Cloud

> Hướng dẫn deploy hợp nhất **public website** + **admin console** lên Google host.
> Có 3 path tuỳ độ phức tạp & ngân sách.

---

## TL;DR — chọn 1 trong 3 path

| Path | Phù hợp khi | Chi phí ước tính | Thời gian setup |
|---|---|---|---|
| **A. Cloud Run × 2 services** (recommend) | Production thật, scale auto, custom domain | ~$15-30/tháng (low traffic) | 30 phút |
| **B. Firebase Hosting + Cloud Run API** | Cần CDN edge global, FE static | ~$10-25/tháng | 45 phút |
| **C. Cloud Run single-container** | Demo, staging, MVP | ~$5-15/tháng | 15 phút |

**Lệnh chạy 1 dòng (Path A — production)**:
```bash
PROJECT_ID=detoxblanc-prod ./scripts/deploy-google.sh
```

---

## 0. Chuẩn bị (chung cho cả 3 path)

### 0.1. Cài tool

```bash
# Google Cloud CLI
brew install --cask google-cloud-sdk        # macOS
# hoặc: curl https://sdk.cloud.google.com | bash

# Login & set project
gcloud auth login
gcloud auth application-default login
gcloud config set project detoxblanc-prod
```

### 0.2. Tạo project + bật API

```bash
# Tạo project (skip nếu đã có)
gcloud projects create detoxblanc-prod --name="Detoxblanc Production"
gcloud config set project detoxblanc-prod

# Bật các API cần thiết
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  vpcaccess.googleapis.com

# Tạo Artifact Registry repo
gcloud artifacts repositories create detoxblanc \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="Detoxblanc images"
```

### 0.3. Tạo Postgres + Redis (managed)

```bash
# Cloud SQL Postgres 16 (db-f1-micro tiết kiệm; bump lên db-g1-small khi đông)
gcloud sql instances create detoxblanc-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --storage-size=10GB \
  --storage-auto-increase

gcloud sql databases create detoxblanc --instance=detoxblanc-db
gcloud sql users create dtxapp --instance=detoxblanc-db --password='REPLACE_ME_STRONG'

# Memorystore Redis (BASIC, 1GB tier)
gcloud redis instances create detoxblanc-redis \
  --size=1 --region=asia-southeast1 --tier=basic
```

### 0.4. Lưu secret vào Secret Manager

```bash
# DATABASE_URL
echo -n "postgresql://dtxapp:REPLACE_ME_STRONG@/detoxblanc?host=/cloudsql/detoxblanc-prod:asia-southeast1:detoxblanc-db" | \
  gcloud secrets create detoxblanc-database-url --data-file=-

# REDIS_URL (lấy IP nội bộ từ Memorystore)
REDIS_HOST=$(gcloud redis instances describe detoxblanc-redis --region=asia-southeast1 --format='value(host)')
echo -n "redis://$REDIS_HOST:6379" | gcloud secrets create detoxblanc-redis-url --data-file=-

# JWT secrets (sinh ngẫu nhiên, MIN 32 ký tự)
openssl rand -base64 48 | gcloud secrets create detoxblanc-jwt-secret --data-file=-
openssl rand -base64 48 | gcloud secrets create detoxblanc-jwt-refresh-secret --data-file=-
openssl rand -base64 48 | gcloud secrets create detoxblanc-cookie-secret --data-file=-
```

### 0.5. Service account cho API

```bash
gcloud iam service-accounts create detoxblanc-api \
  --display-name="Detoxblanc API runtime"

# Cấp quyền truy cập secrets
for SECRET in database-url redis-url jwt-secret jwt-refresh-secret cookie-secret; do
  gcloud secrets add-iam-policy-binding "detoxblanc-$SECRET" \
    --member="serviceAccount:detoxblanc-api@detoxblanc-prod.iam.gserviceaccount.com" \
    --role=roles/secretmanager.secretAccessor
done

# Cấp quyền truy cập Cloud SQL
gcloud projects add-iam-policy-binding detoxblanc-prod \
  --member="serviceAccount:detoxblanc-api@detoxblanc-prod.iam.gserviceaccount.com" \
  --role=roles/cloudsql.client
```

### 0.6. Migration DB (chạy 1 lần)

```bash
# Chạy local với Cloud SQL Proxy (an toàn nhất)
cloud-sql-proxy detoxblanc-prod:asia-southeast1:detoxblanc-db &
DATABASE_URL='postgresql://dtxapp:REPLACE_ME_STRONG@127.0.0.1:5432/detoxblanc' \
  pnpm --filter api prisma migrate deploy
DATABASE_URL='postgresql://dtxapp:REPLACE_ME_STRONG@127.0.0.1:5432/detoxblanc' \
  pnpm --filter api prisma:seed         # Base seed (RBAC + 3 SP)
# Tuỳ chọn: rich seed cho UAT (chỉ chạy ở staging)
# DATABASE_URL=... pnpm --filter api prisma:seed:staging
```

---

## A · Cloud Run × 2 services (RECOMMENDED)

**Ý tưởng**: 2 service Cloud Run riêng, FE proxy `/v1/` qua API.

```
┌─────────────────────────────────────────────────┐
│  detoxblanc-web (public)  ── 0.0.0.0:8080      │
│  ├─ /                    nginx serve HTML       │
│  ├─ /admin/*             nginx rewrite admin    │
│  └─ /v1/*                proxy ──┐              │
└──────────────────────────────────┼──────────────┘
                                   ▼
┌─────────────────────────────────────────────────┐
│  detoxblanc-api (internal, IAM-protected)       │
│  ├─ /v1/auth/*                                  │
│  ├─ /v1/orders, /v1/customers...                │
│  └─ Cloud SQL + Memorystore Redis               │
└─────────────────────────────────────────────────┘
```

### Deploy 1 lệnh
```bash
PROJECT_ID=detoxblanc-prod MODE=cloudrun ./scripts/deploy-google.sh
```

Script sẽ:
1. Build & push API image, deploy `detoxblanc-api` (internal, no public access)
2. Build & push Web image, deploy `detoxblanc-web` (public)
3. Cấp quyền Web invoke API (IAM `run.invoker`)
4. Set `API_UPSTREAM` env trên Web → Web nginx tự reverse-proxy

### Custom domain
```bash
# detoxblanc.com → detoxblanc-web
gcloud run domain-mappings create \
  --service=detoxblanc-web \
  --domain=detoxblanc.com \
  --region=asia-southeast1

# DNS ở registrar: copy bản ghi A/AAAA mà gcloud trả về
gcloud run domain-mappings describe \
  --domain=detoxblanc.com --region=asia-southeast1
```

API ở subdomain `api.detoxblanc.com` (KHÔNG bắt buộc — Web đã proxy /v1/, dùng subdomain chỉ khi muốn gọi từ mobile app):

```bash
gcloud run services update detoxblanc-api --allow-unauthenticated --region=asia-southeast1
gcloud run domain-mappings create \
  --service=detoxblanc-api --domain=api.detoxblanc.com --region=asia-southeast1
```

---

## B · Firebase Hosting + Cloud Run API

**Ưu điểm**: CDN edge global (faster cho user xa), free SSL, free tier rộng cho FE.

### Setup

```bash
# 1. Cài firebase CLI
npm install -g firebase-tools
firebase login

# 2. Tạo Firebase project (link với GCP project)
firebase projects:addfirebase detoxblanc-prod

# 3. Init Firebase Hosting trong project (đã có firebase.json sẵn)
firebase use detoxblanc-prod

# 4. Deploy API trước (qua Cloud Run như Path A bước 1)
gcloud run deploy detoxblanc-api --source api/ --region asia-southeast1 ...

# 5. Deploy FE qua Firebase
firebase deploy --only hosting
```

`firebase.json` đã cấu hình **rewrite `/v1/**` → Cloud Run service** ở region asia-southeast1, không cần proxy thủ công.

### Test
- Firebase URL: `https://detoxblanc-prod.web.app`
- Admin: `https://detoxblanc-prod.web.app/admin`
- API: `https://detoxblanc-prod.web.app/v1/health` → forward lên Cloud Run

### Custom domain Firebase
- Console: https://console.firebase.google.com/project/detoxblanc-prod/hosting/sites
- Add domain `detoxblanc.com` → cập nhật DNS theo hướng dẫn (TXT verify + A record)

---

## C · Single-container (DEMO/STAGING)

Đơn giản nhất: 1 container Cloud Run chứa cả Nginx FE + Fastify API.

⚠ **Không khuyến khích cho production** vì:
- Không scale FE/API độc lập được
- Restart 1 → mất cả 2
- Logs khó tách

```bash
# Build image gộp (cần customize Dockerfile thêm)
# Hiện tại Dockerfile root chỉ build FE. Để gộp, cần multi-stage build:
# - Stage 1: build api/ với Node
# - Stage 2: copy api/dist + nginx FE vào 1 image
# - Run nginx + node song song qua supervisord

# Dùng tạm cho staging:
gcloud run deploy detoxblanc-staging \
  --source . \
  --region=asia-southeast1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --set-env-vars="API_UPSTREAM=http://localhost:3000,DATABASE_URL=...,REDIS_URL=..."
```

---

## Smoke test sau khi deploy

```bash
WEB_URL="https://detoxblanc-web-XXXX.run.app"  # thay XXXX

# 1. Healthcheck
curl "$WEB_URL/healthz"                                    # → "ok"
curl "$WEB_URL/v1/healthz"                                 # → API ok

# 2. Static pages
curl -sI "$WEB_URL/" | grep -i "200 OK"                    # homepage
curl -sI "$WEB_URL/about" | grep -i "200 OK"               # clean URL
curl -sI "$WEB_URL/admin" | grep -i "200 OK"               # admin entry

# 3. Auth flow
curl -X POST "$WEB_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tuan@detoxblanc.com","password":"ChangeMe123456!"}'

# 4. Headers bảo mật admin
curl -sI "$WEB_URL/admin/orders" | grep -i "x-robots-tag\|x-frame-options"
```

---

## Cấu hình FE — chọn API base

FE tự detect qua `assets/env-detect.js`:
- `localhost`, `127.x.x.x` → `mode=local`, `base=/v1` (cần local API)
- `*.web.app`, `*.firebaseapp.com`, `*.run.app` → `mode=remote`, `base=/v1` (qua rewrite/proxy)
- `detoxblanc.com` → `mode=remote`, `base=https://api.detoxblanc.com/v1`

**Override** khi cần:
```html
<!-- Trong từng file HTML -->
<meta name="dtx-api-base" content="https://api-staging.detoxblanc.com/v1">
<meta name="dtx-mode" content="remote">
```

Hoặc ở console (dev only):
```js
localStorage.setItem('DTX_API_BASE_OVERRIDE', 'https://api-test.detoxblanc.com/v1');
location.reload();
```

---

## CI/CD qua Cloud Build (auto deploy mỗi push)

```bash
# 1. Connect GitHub/Cloud Source Repo với Cloud Build
gcloud builds connections create github detoxblanc \
  --region=asia-southeast1

# 2. Tạo trigger
gcloud builds triggers create github \
  --name=detoxblanc-main \
  --repo-name=detoxblanc-clone \
  --repo-owner=YOUR_GITHUB_USER \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml \
  --region=asia-southeast1

# 3. Test trigger
gcloud builds triggers run detoxblanc-main --branch=main
```

Mỗi push lên `main` → Cloud Build:
1. Build cả 2 image (FE + API)
2. Push lên Artifact Registry
3. Deploy lên Cloud Run với SHA tag
4. Web tự reload secret/env (zero-downtime rolling update)

---

## Monitoring & rollback

### Sentry / GCP Logs
```bash
# Real-time logs
gcloud run services logs tail detoxblanc-api --region=asia-southeast1
gcloud run services logs tail detoxblanc-web --region=asia-southeast1

# Filter error
gcloud run services logs read detoxblanc-api --region=asia-southeast1 \
  --filter="severity>=ERROR" --limit=50
```

### Rollback
```bash
# List revisions
gcloud run revisions list --service=detoxblanc-api --region=asia-southeast1

# Rollback về revision cũ
gcloud run services update-traffic detoxblanc-api \
  --region=asia-southeast1 \
  --to-revisions=detoxblanc-api-00042-abc=100
```

---

## Cost tip

- **Min instances = 0** trên dev/staging (cold start ~1s, free tier rộng)
- **Min instances = 1** trên production (luôn warm, an toàn nhưng ~$8/tháng/service)
- **CPU allocation**: chỉ cấp khi xử lý request → tiết kiệm 60% so với always-on
- **Cloud SQL `db-f1-micro`** đủ cho tới 50k đơn/tháng
- **Memorystore Basic 1GB** = ~$30/tháng → có thể skip nếu queue throughput thấp, dùng PostgreSQL queue tạm

---

## File liên quan

| File | Mục đích |
|---|---|
| `firebase.json` | Path B — Firebase Hosting config (rewrites + headers) |
| `.firebaserc` | Firebase project mapping |
| `Dockerfile` (root) | Image FE Nginx |
| `nginx.conf` | Config Nginx + reverse proxy |
| `api/Dockerfile` | Image API Fastify |
| `cloudbuild.yaml` | CI/CD pipeline |
| `scripts/deploy-google.sh` | One-command deploy script |
| `assets/env-detect.js` | FE auto chọn API base theo hostname |
| `.gcloudignore` | Skip files khi `gcloud deploy` |
| `.dockerignore` | Skip files khi `docker build` |

---

## Hỗ trợ

- Lỗi build: xem logs ở https://console.cloud.google.com/cloud-build/builds
- Lỗi runtime: `gcloud run services logs tail`
- Tài liệu Cloud Run: https://cloud.google.com/run/docs
- Tài liệu Firebase Hosting: https://firebase.google.com/docs/hosting

Liên quan: [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) cho quy trình go-live.
