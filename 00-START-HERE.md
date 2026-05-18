# 🚀 Hướng dẫn tài khoản Claude Code mới — Detoxblanc OMS

## Bước 1: Cài đặt môi trường

```bash
# Cài Firebase CLI (nếu chưa có)
npm install -g firebase-tools

# Đăng nhập Firebase với email mới của bạn
firebase login
```

⚠ Email login Firebase phải có quyền truy cập project `detoxblanc-demo-55472`.
Nếu chưa có quyền → liên hệ chủ cũ (tuan@detoxblanc.com) để add bạn làm Owner/Editor qua:
https://console.firebase.google.com/project/detoxblanc-demo-55472/settings/iam

## Bước 2: Đặt project files

Copy nội dung folder này (hoặc giải nén dtx-handover-*.zip) vào nơi bạn muốn dev:

```bash
mkdir -p ~/detoxblanc
cp -r ./* ~/detoxblanc/
cd ~/detoxblanc
```

## Bước 3: Mở Claude Code

```bash
cd ~/detoxblanc
claude
```

## Bước 4: Paste vào message đầu tiên

```
Tôi đang nhận handover dự án Detoxblanc OMS. Đọc file HANDOVER.md trong folder hiện tại để hiểu context, sau đó tôi sẽ chỉ định công việc tiếp theo.
```

Claude sẽ đọc HANDOVER.md, hiểu toàn bộ trạng thái dự án (URL, credentials, files, tasks roadmap) và sẵn sàng tiếp tục dev.

## Bước 5 (tuỳ chọn): Restore conversation history

Nếu muốn Claude đọc TOÀN BỘ lịch sử cuộc trò chuyện trước:

```bash
# Copy transcript vào .claude/projects của tài khoản mới
mkdir -p ~/.claude/projects/detoxblanc-handover/
cp conversation-transcript.jsonl ~/.claude/projects/detoxblanc-handover/handover.jsonl

# Hoặc paste nội dung vào chat trực tiếp (file 14MB → chia nhỏ)
```

⚠ File transcript 14MB chứa cả thông tin nhạy cảm — KHÔNG share công khai.

## Tóm tắt nhanh

- **URL production**: https://detoxblanc-demo-55472.web.app
- **Admin**: https://detoxblanc-demo-55472.web.app/admin/login
- **Credentials**: xem HANDOVER.md mục 3
- **Status**: ✅ Đã deploy, login + Firestore CRUD hoạt động

Đọc HANDOVER.md để biết chi tiết đầy đủ.
