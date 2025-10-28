# 📰 HƯỚNG DẪN ĐẦY ĐỦ - WEBSITE TIN TỨC

> **Hướng dẫn hoàn chỉnh để setup, deploy và sao chép website tin tức lên nhiều domain khác nhau**

---

## 📑 MỤC LỤC

1. [Tổng Quan](#-tổng-quan)
2. [Setup Lần Đầu](#-setup-lần-đầu)
3. [Cách Sử Dụng](#-cách-sử-dụng)
4. [Deploy Lên Vercel](#-deploy-lên-vercel)
5. [Sao Chép & Deploy Nhiều Domain](#-sao-chép--deploy-nhiều-domain)
6. [Admin Panel](#-admin-panel)
7. [Troubleshooting](#-troubleshooting)
8. [Tùy Chỉnh](#-tùy-chỉnh)

---

## 🎯 TỔNG QUAN

### Công nghệ sử dụng
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Markdown**: react-markdown, remark-gfm
- **Date**: date-fns
- **Deployment**: Vercel
- **SEO**: Next.js Metadata API

### Tính năng chính
- ✅ Quản lý bài viết (CRUD)
- ✅ **Đăng nhập Admin bảo mật** (Supabase Auth)
- ✅ SEO tối ưu toàn diện (Metadata, Sitemap, Robots.txt, Open Graph, JSON-LD)
- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ Mobile menu sidebar trượt từ phải
- ✅ Search functionality
- ✅ Category & Tags
- ✅ View counter
- ✅ Markdown support (GitHub flavored)
- ✅ Admin panel với authentication
- ✅ Image optimization (Next.js Image)
- ✅ Dark mode support

### Categories hiện tại
- 💻 Công nghệ
- ⚽ Thể thao
- ❤️ Sức khỏe
- 🚗 Ô tô
- 🎬 Giải trí

---

## 🚀 SETUP LẦN ĐẦU

### Bước 1: Clone Repository (1 phút)

```bash
# Clone repository
git clone <your-repo-url>
cd ctrlz1

# Cài đặt dependencies
npm install
```

### Bước 2: Setup Supabase Database (5 phút)

#### 2.1. Tạo Project Supabase
1. Truy cập [https://supabase.com](https://supabase.com)
2. Click **Start your project** → Đăng nhập bằng GitHub
3. Click **New project**
4. Điền thông tin:
   - **Name**: `tintuc` (hoặc tên bạn muốn)
   - **Database Password**: Tạo password mạnh và **LƯU LẠI**
   - **Region**: `Southeast Asia (Singapore)` (nhanh nhất cho VN)
5. Click **Create new project**
6. Đợi 2-3 phút để project khởi tạo

#### 2.2. Tạo Database Schema
1. Trong Supabase Dashboard, click **SQL Editor** ở sidebar
2. Click **New query**
3. Mở file `supabase/schema.sql` trong project
4. Copy toàn bộ nội dung và paste vào SQL Editor
5. Click **Run** (hoặc Ctrl/Cmd + Enter)
6. Bạn sẽ thấy thông báo thành công
7. Click **Table Editor** để kiểm tra → Sẽ thấy table `articles` với 2 bài mẫu

#### 2.3. Lấy API Credentials
1. Click **Settings** (icon bánh răng) → **API**
2. **LƯU LẠI** 3 thông tin sau (rất quan trọng):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGc...` (key dài)
   - **service_role** key: `eyJhbGc...` (key dài, **BẢO MẬT**)

### Bước 3: Cấu Hình Environment Variables (1 phút)

#### 3.1. Tạo file `.env.local`

```bash
# Windows
copy env.example .env.local

# Mac/Linux
cp env.example .env.local
```

#### 3.2. Điền thông tin vào `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **LƯU Ý**: File `.env.local` **KHÔNG BAO GIỜ** commit lên Git (đã có trong `.gitignore`)

### Bước 4: Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

🎉 **Xong!** Bạn sẽ thấy website với 2 bài viết mẫu.

---

## 💡 CÁCH SỬ DỤNG

### Truy cập Admin Panel

Admin panel đã được ẩn khỏi menu công khai. Truy cập qua URL trực tiếp:

**Local:**
```
http://localhost:3000/admin
```

**Production:**
```
https://your-domain.vercel.app/admin
```

### Quản lý bài viết

#### Xem danh sách bài viết
- Truy cập `/admin`
- Xem tất cả bài viết với filter:
  - **All**: Tất cả
  - **Published**: Đã xuất bản
  - **Draft**: Nháp

#### Tạo bài viết mới
1. Click **+ Thêm bài viết mới**
2. Điền form:
   - **Tiêu đề**: Tên bài viết
   - **Slug**: URL-friendly (tự động tạo từ tiêu đề, có thể chỉnh sửa)
   - **Mô tả**: Mô tả ngắn (cho SEO)
   - **Nội dung**: Viết bằng Markdown
   - **Hình ảnh URL**: Link hình ảnh (từ Unsplash hoặc CDN)
   - **Category**: Chọn chuyên mục
   - **Tags**: Các tag cách nhau bởi dấu phẩy
   - **Tác giả**: Tên tác giả
   - **Xuất bản ngay**: Check để publish, bỏ check để lưu draft
3. Click **Lưu bài viết**

#### Chỉnh sửa bài viết
1. Ở danh sách bài viết, click nút **Sửa**
2. Chỉnh sửa thông tin
3. Click **Cập nhật bài viết**

#### Xóa bài viết
1. Click nút **Xóa** ở bài viết
2. Confirm để xóa vĩnh viễn

### Viết bài với Markdown

Website hỗ trợ GitHub Flavored Markdown:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
~~Strikethrough~~

[Link text](https://example.com)
![Image alt](https://example.com/image.jpg)

- Unordered list item 1
- Unordered list item 2

1. Ordered list item 1
2. Ordered list item 2

`Inline code`

\`\`\`javascript
// Code block
console.log('Hello World');
\`\`\`

> Blockquote

---

| Table | Header |
|-------|--------|
| Cell  | Cell   |
```

### Lấy hình ảnh miễn phí

**Unsplash** (khuyến nghị):
```
https://images.unsplash.com/photo-xxxxx?w=1200&h=630&fit=crop
```

**Pexels**:
```
https://images.pexels.com/photos/xxxxx/image.jpg
```

**Lưu ý**: Đã cấu hình `next.config.ts` cho phép tất cả domain (`**`) trong development.

---

## 🌐 DEPLOY LÊN VERCEL

### Bước 1: Push Code Lên GitHub

#### 1.1. Tạo repository trên GitHub
1. Truy cập [github.com/new](https://github.com/new)
2. Đặt tên: `tintuc-website` (hoặc tên bạn muốn)
3. Chọn **Public** hoặc **Private**
4. **KHÔNG** chọn Initialize with README
5. Click **Create repository**

#### 1.2. Push code
```bash
# Khởi tạo git (nếu chưa có)
git init

# Add tất cả file
git add .

# Commit
git commit -m "Initial commit: News website"

# Add remote
git remote add origin https://github.com/username/tintuc-website.git

# Push
git branch -M main
git push -u origin main
```

### Bước 2: Deploy Trên Vercel

#### 2.1. Import Project
1. Truy cập [https://vercel.com](https://vercel.com)
2. Đăng nhập bằng GitHub
3. Click **Add New...** → **Project**
4. Chọn repository `tintuc-website`
5. Click **Import**

#### 2.2. Cấu hình Project
Vercel tự động detect Next.js, bạn chỉ cần:
- **Project Name**: Đặt tên (vd: `my-tintuc`)
- **Framework Preset**: Next.js ✅ (auto)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

#### 2.3. Thêm Environment Variables

**QUAN TRỌNG**: Click **Environment Variables** và thêm:

| Key | Value | Environments |
|-----|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | (để trống) | Production, Preview, Development |

#### 2.4. Deploy
1. Click **Deploy**
2. Đợi 2-3 phút
3. Khi thấy 🎉, click **Visit** để xem website live

#### 2.5. Cập nhật SITE_URL
1. Copy URL (vd: `https://my-tintuc.vercel.app`)
2. Vercel Dashboard → **Settings** → **Environment Variables**
3. Tìm `NEXT_PUBLIC_SITE_URL`, click **Edit**
4. Paste URL và **Save**
5. Tab **Deployments** → Click **...** → **Redeploy**

### Bước 3: Custom Domain (Optional)

Nếu có domain riêng (vd: `tintuc.vn`):

1. Vercel Dashboard → **Settings** → **Domains**
2. Click **Add** → Nhập domain → **Add**
3. Vercel hiển thị DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Vào nhà cung cấp domain (GoDaddy, Namecheap, etc.)
5. Thêm DNS records như trên
6. Đợi 5-30 phút
7. Domain tự động verify

---

## 🔄 SAO CHÉP & DEPLOY NHIỀU DOMAIN

### Scenario: Bạn muốn tạo nhiều website tin tức giống nhau

Ví dụ:
- `tintuc-1.vercel.app` → Tin tức công nghệ
- `tintuc-2.vercel.app` → Tin tức thể thao
- `tintuc-3.vercel.app` → Tin tức giải trí

### Phương án 1: Một Database - Nhiều Website (Khuyến nghị)

**Ưu điểm**: Quản lý tập trung, dễ sync data
**Nhược điểm**: Tất cả site share chung database

#### Bước 1: Tạo các repository
```bash
# Site 1
cp -r ctrlz1 tintuc-cong-nghe
cd tintuc-cong-nghe
# Chỉnh sửa branding, logo, title
git init
git add .
git commit -m "Tech news site"
git remote add origin https://github.com/username/tintuc-cong-nghe.git
git push -u origin main

# Site 2
cp -r ctrlz1 tintuc-the-thao
cd tintuc-the-thao
# Chỉnh sửa branding, logo, title
git init
git add .
git commit -m "Sports news site"
git remote add origin https://github.com/username/tintuc-the-thao.git
git push -u origin main

# Site 3 tương tự...
```

#### Bước 2: Deploy từng site lên Vercel
1. Vercel → **Add New Project**
2. Import `tintuc-cong-nghe`
3. Thêm **CÙNG Environment Variables** (cùng Supabase)
4. Deploy
5. Lặp lại cho các site khác

**Kết quả**: Tất cả site cùng dùng 1 database, admin từ bất kỳ site nào đều quản lý được tất cả bài viết.

### Phương án 2: Mỗi Site Một Database (Độc lập)

**Ưu điểm**: Hoàn toàn độc lập, phân quyền rõ ràng
**Nhược điểm**: Phải quản lý nhiều database

#### Bước 1: Tạo nhiều Supabase Projects
1. Supabase → **New Project** → `tintuc-cong-nghe-db`
2. Chạy `schema.sql`
3. Lấy API credentials → Lưu riêng
4. Lặp lại cho mỗi site

#### Bước 2: Setup mỗi site với database riêng
```bash
# Site 1
cd tintuc-cong-nghe
# .env.local dùng credentials của tintuc-cong-nghe-db
git init && git add . && git commit -m "Tech site"
# Push lên GitHub

# Site 2
cd tintuc-the-thao
# .env.local dùng credentials của tintuc-the-thao-db
git init && git add . && git commit -m "Sports site"
# Push lên GitHub
```

#### Bước 3: Deploy từng site
Deploy lên Vercel, mỗi site dùng Environment Variables của database riêng.

### Phương án 3: Template + Script Tự Động

Tạo script để clone nhanh:

**File**: `clone-site.sh`
```bash
#!/bin/bash

# Usage: ./clone-site.sh tintuc-giai-tri "Giải trí"

SITE_NAME=$1
SITE_TITLE=$2

echo "🚀 Creating new site: $SITE_NAME"

# Clone source
cp -r ctrlz1 $SITE_NAME
cd $SITE_NAME

# Update branding
sed -i "s/TinTức/$SITE_TITLE/g" app/layout.tsx
sed -i "s/📰 TinTức/📰 $SITE_TITLE/g" components/Header.tsx

# Git setup
rm -rf .git
git init
git add .
git commit -m "Initial commit: $SITE_TITLE"

echo "✅ Done! Now:"
echo "1. Create GitHub repo: $SITE_NAME"
echo "2. git remote add origin <repo-url>"
echo "3. git push -u origin main"
echo "4. Deploy on Vercel"
```

**Sử dụng**:
```bash
chmod +x clone-site.sh
./clone-site.sh tintuc-giai-tri "Giải trí"
```

### Checklist Khi Deploy Nhiều Site

- [ ] Mỗi site có repository GitHub riêng
- [ ] Đặt tên project Vercel khác nhau
- [ ] Environment variables đã cấu hình đúng
- [ ] Mỗi site có branding riêng (logo, title, colors)
- [ ] Test admin panel từng site
- [ ] Sitemap mỗi site khác nhau (`NEXT_PUBLIC_SITE_URL`)
- [ ] Custom domain (nếu có)

---

## 🔐 ADMIN PANEL & AUTHENTICATION

### Tổng quan hệ thống đăng nhập

Website đã tích hợp **Supabase Authentication** để bảo vệ admin panel.

**Tính năng:**
- ✅ Đăng nhập email/password bảo mật
- ✅ Session management tự động
- ✅ Protected routes (tự động redirect nếu chưa login)
- ✅ Logout functionality
- ✅ UI đẹp, responsive
- ✅ Password hashing (bcrypt)
- ✅ Session timeout configurable

---

## 🚀 SETUP ADMIN AUTHENTICATION

### Bước 1: Enable Email Authentication trong Supabase

1. Truy cập [Supabase Dashboard](https://supabase.com)
2. Chọn project của bạn
3. Sidebar → **Authentication** → **Providers**
4. Tìm **Email** provider
5. Bật **Enable Email provider** (nếu chưa bật)
6. **Confirm email**: 
   - ❌ Tắt để test nhanh trong development
   - ✅ Bật cho production (khuyến nghị)
7. Click **Save**

### Bước 2: Tạo Admin User

#### Option A: Qua Dashboard (Khuyến nghị - Dễ nhất)

1. Supabase Dashboard → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Điền thông tin:
   - **Email**: `admin@yourdomain.com`
   - **Password**: Mật khẩu mạnh (tối thiểu 12 ký tự)
     - Bao gồm: chữ hoa, chữ thường, số, ký tự đặc biệt
     - VD: `Admin@2025!SecurePass`
   - **Auto Confirm User**: ✅ Bật (để skip email confirmation)
4. Click **Create user**
5. **⚠️ LƯU LẠI** email và password này!

#### Option B: Qua SQL Editor (Nâng cao)

```sql
-- Chạy trong SQL Editor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@yourdomain.com',
  crypt('your-strong-password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);
```

### Bước 3: Test Đăng Nhập Local

1. **Chạy dev server:**
   ```bash
   npm run dev
   ```

2. **Truy cập admin:**
   ```
   http://localhost:3000/admin
   ```
   - Sẽ tự động redirect đến `/admin/login`

3. **Đăng nhập:**
   - **Email**: `admin@yourdomain.com`
   - **Password**: (password bạn vừa tạo)
   - Click **Đăng nhập**

4. **Kiểm tra thành công:**
   - ✅ Redirect về `/admin` dashboard
   - ✅ Thấy email hiển thị ở góc phải
   - ✅ Có nút "Đăng xuất"
   - ✅ Có thể tạo/sửa/xóa bài viết

---

## 📍 CÁC TRANG ADMIN

### URLs

**Development (Local):**
```
Login:       http://localhost:3000/admin/login
Dashboard:   http://localhost:3000/admin
New Post:    http://localhost:3000/admin/new
Edit Post:   http://localhost:3000/admin/edit/[id]
```

**Production:**
```
Login:       https://your-domain.vercel.app/admin/login
Dashboard:   https://your-domain.vercel.app/admin
New Post:    https://your-domain.vercel.app/admin/new
Edit Post:   https://your-domain.vercel.app/admin/edit/[id]
```

### Bảng chức năng

| URL | Chức năng | Auth Required | Redirect nếu chưa login |
|-----|-----------|---------------|------------------------|
| `/admin/login` | Đăng nhập admin | ❌ | - |
| `/admin` | Dashboard - Quản lý bài viết | ✅ | → `/admin/login` |
| `/admin/new` | Tạo bài viết mới | ✅ | → `/admin/login` |
| `/admin/edit/[id]` | Chỉnh sửa bài viết | ✅ | → `/admin/login` |

---

## 👥 QUẢN LÝ ADMIN USERS

### Tạo thêm Admin User

**Qua Dashboard:**
1. Supabase Dashboard → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Điền email/password
4. **Auto Confirm User**: ✅
5. **Create user**

**Qua SQL:**
```sql
INSERT INTO auth.users (...)
-- (Xem Bước 2 Option B)
```

### Xóa Admin User

1. **Authentication** → **Users**
2. Tìm user cần xóa
3. Click **...** (menu)
4. Click **Delete user**
5. Confirm deletion

### Đổi Password Admin

**Cách 1: User tự đổi (trong app - có thể thêm sau)**
```typescript
const { error } = await supabase.auth.updateUser({
  password: 'new-strong-password'
});
```

**Cách 2: Admin đổi qua Dashboard**
1. **Authentication** → **Users**
2. Click vào user
3. **Reset password**
4. Gửi email reset password

**Cách 3: Force change qua SQL**
```sql
UPDATE auth.users
SET encrypted_password = crypt('new-password', gen_salt('bf'))
WHERE email = 'admin@example.com';
```

### Liệt kê tất cả Admin Users

```sql
-- Xem tất cả users
SELECT id, email, email_confirmed_at, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

---

## 🔧 CẤU HÌNH CHO PRODUCTION

### Enable Email Confirmation (Khuyến nghị)

**Tại sao cần:**
- Xác nhận email là thật
- Tránh spam users
- Bảo mật cao hơn

**Cách bật:**

1. **Bật Email Confirmation:**
   - Supabase → **Authentication** → **Providers** → **Email**
   - **Confirm email**: ✅ Bật
   - **Save**

2. **Cấu hình Email Templates:**
   - **Authentication** → **Email Templates**
   - Chọn **Confirm signup**
   - Customize template:

```html
<h2>Xác nhận tài khoản Admin</h2>
<p>Xin chào {{ .Email }},</p>
<p>Bạn đã được thêm làm admin cho website TinTức.</p>
<p>Click vào link bên dưới để xác nhận tài khoản:</p>
<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Xác nhận tài khoản</a></p>
<p>Hoặc copy link này vào trình duyệt:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Link này sẽ hết hạn sau 24 giờ.</p>
<br>
<p style="color: #666; font-size: 12px;">Nếu bạn không yêu cầu email này, vui lòng bỏ qua.</p>
```

3. **Cấu hình Redirect URLs:**
   - **Authentication** → **URL Configuration**
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: Thêm các URLs:
     ```
     https://your-domain.vercel.app/admin
     https://your-domain.vercel.app/admin/login
     http://localhost:3000/admin
     http://localhost:3000/admin/login
     ```
   - **Save**

### Custom Email Server (Optional)

Mặc định Supabase gửi email qua GoTrue. Để dùng SMTP riêng:

1. **Authentication** → **Settings** → Scroll xuống **SMTP Settings**
2. Điền thông tin:
   - **Enable Custom SMTP**: ✅
   - **Sender name**: `TinTức Admin`
   - **Sender email**: `noreply@yourdomain.com`
   - **Host**: `smtp.gmail.com` (hoặc provider khác)
   - **Port**: `587`
   - **Username**: `your-email@gmail.com`
   - **Password**: (App Password nếu dùng Gmail)
3. **Save**

**Gmail App Password:**
1. Google Account → Security
2. 2-Step Verification → App passwords
3. Generate app password
4. Copy và paste vào Supabase

---

## 🔒 BẢO MẬT

### Best Practices

#### 1. Password Mạnh
- **Tối thiểu**: 12 ký tự
- **Bao gồm**:
  - Chữ hoa (A-Z)
  - Chữ thường (a-z)
  - Số (0-9)
  - Ký tự đặc biệt (!@#$%^&*)
- **KHÔNG dùng**:
  - Từ điển thông dụng
  - Thông tin cá nhân (tên, ngày sinh)
  - Password đã dùng ở nơi khác
  - Chuỗi đơn giản (123456, qwerty)

**Ví dụ password tốt:**
- `MyN3ws$ite2025!`
- `Adm!n@TinTuc#2025`
- `$ecure*P@ssw0rd!`

#### 2. Email Riêng
- Dùng email riêng cho admin (không public)
- VD: `admin@internal.yourdomain.com`
- Không dùng email cá nhân
- Có thể tạo email group: `admins@yourdomain.com`

#### 3. 2FA/MFA (Tùy chọn - Nâng cao)
Supabase hỗ trợ Multi-Factor Authentication:

```typescript
// Enable MFA for user
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
});
```

Xem docs: https://supabase.com/docs/guides/auth/auth-mfa

#### 4. Session Timeout
- **Mặc định**: 1 tuần (604800 giây)
- **Cấu hình**: **Authentication** → **Settings** → **Session Settings**
  - **JWT expiry**: 3600 (1 giờ) cho bảo mật cao
  - **Refresh token expiry**: 604800 (1 tuần)

#### 5. IP Whitelist (Nâng cao)
Chỉ cho phép IP cố định truy cập admin:

**File**: `middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_IPS = ['123.456.789.0', '111.222.333.444'];

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const ip = request.ip || request.headers.get('x-forwarded-for');
    
    if (!ALLOWED_IPS.includes(ip || '')) {
      return new NextResponse('Access Denied', { status: 403 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
```

#### 6. Environment Variables Security

**Local (.env.local):**
```bash
# ✅ ĐÚNG - Không commit file này
.env.local  # Đã có trong .gitignore
```

**Production (Vercel):**
- Add vào Vercel Environment Variables
- **KHÔNG** hardcode trong code
- **KHÔNG** commit keys lên Git

**Check .gitignore:**
```bash
# Verify
cat .gitignore | grep env

# Nên thấy:
.env*.local
.env.local
```

---

## 🌍 DEPLOY NHIỀU DOMAIN VỚI AUTH

### Scenario 1: Mỗi domain một admin riêng

**Setup:**
1. Tạo Supabase project riêng cho mỗi domain:
   ```
   Domain A → Supabase Project A → Admin User A
   Domain B → Supabase Project B → Admin User B
   Domain C → Supabase Project C → Admin User C
   ```

2. Mỗi domain có Environment Variables riêng:
   ```
   # Site A (Vercel)
   NEXT_PUBLIC_SUPABASE_URL=https://project-a.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=key-a
   SUPABASE_SERVICE_ROLE_KEY=service-key-a
   
   # Site B (Vercel)
   NEXT_PUBLIC_SUPABASE_URL=https://project-b.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=key-b
   SUPABASE_SERVICE_ROLE_KEY=service-key-b
   ```

3. Mỗi admin chỉ login vào domain của mình

**Ưu điểm:**
- ✅ Hoàn toàn độc lập
- ✅ Bảo mật tối đa
- ✅ Dễ phân quyền

**Nhược điểm:**
- ❌ Phải quản lý nhiều database
- ❌ Chi phí cao hơn (nếu vượt free tier)

### Scenario 2: Một Supabase - Nhiều admin

**Setup:**
1. Tạo nhiều admin users trong cùng 1 Supabase:
   ```sql
   -- Admin cho site A
   INSERT INTO auth.users (...) VALUES ('admin-a@example.com', ...);
   
   -- Admin cho site B
   INSERT INTO auth.users (...) VALUES ('admin-b@example.com', ...);
   
   -- Admin cho site C
   INSERT INTO auth.users (...) VALUES ('admin-c@example.com', ...);
   ```

2. Tất cả domains share chung Supabase credentials

3. Mỗi admin login bằng email riêng

4. **(Optional)** Phân quyền bằng RLS policies:
   ```sql
   -- Thêm site_id vào articles table
   ALTER TABLE articles ADD COLUMN site_id TEXT;
   
   -- RLS policy: User chỉ thấy articles của site mình
   CREATE POLICY "Users see own site articles"
   ON articles
   FOR ALL
   USING (site_id = auth.jwt() -> 'user_metadata' ->> 'site_id');
   ```

**Ưu điểm:**
- ✅ Quản lý tập trung
- ✅ Tiết kiệm chi phí
- ✅ Dễ sync data

**Nhược điểm:**
- ❌ Cần cẩn thận với RLS
- ❌ Rủi ro nếu một admin bị hack

---

## 🐛 TROUBLESHOOTING AUTHENTICATION

### ❌ "Email not confirmed"

**Nguyên nhân:** Email confirmation đang bật nhưng user chưa confirm

**Giải pháp 1: Confirm manually**
1. Supabase → **Authentication** → **Users**
2. Tìm user → Click vào
3. **Email Confirmed At**: Set = current time
4. Save

**Giải pháp 2: Tắt email confirmation**
1. **Authentication** → **Providers** → **Email**
2. **Confirm email**: ❌ Tắt
3. Save
4. Recreate user

### ❌ "Invalid login credentials"

**Nguyên nhân:** Email hoặc password sai

**Giải pháp:**
1. **Check email chính xác:**
   ```sql
   SELECT email FROM auth.users;
   ```

2. **Reset password qua Dashboard:**
   - **Authentication** → **Users** → Click user
   - **Reset password**

3. **Hoặc tạo user mới:**
   - Delete user cũ
   - Create user mới

### ❌ Redirect loop `/admin/login`

**Nguyên nhân:** Session không được lưu / cookies bị block

**Giải pháp:**

1. **Clear browser cache:**
   ```
   Chrome: Ctrl+Shift+Delete → Clear cookies
   ```

2. **Check Supabase credentials:**
   ```bash
   # Verify .env.local
   cat .env.local
   
   # Should have:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Check console logs:**
   - F12 → Console
   - Tìm errors liên quan đến Supabase

4. **Try incognito mode:**
   - Nếu work → Issue là cookies/cache

### ❌ "Auth session missing"

**Nguyên nhân:** Environment variables không đúng hoặc thiếu

**Giải pháp:**

```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Check content
cat .env.local

# 3. Verify keys are correct
# So sánh với Supabase Dashboard → Settings → API

# 4. Restart dev server
# Ctrl+C
npm run dev
```

### ❌ Build error: "AuthContext is not defined"

**Nguyên nhân:** Server-side rendering issues

**Giải pháp:**

Đảm bảo các file đã được mark `'use client'`:

1. **lib/contexts/AuthContext.tsx:**
   ```typescript
   'use client';  // ← PHẢI có dòng này ở đầu
   
   import { createContext, ... } from 'react';
   ```

2. **app/admin/layout.tsx:**
   ```typescript
   'use client';  // ← PHẢI có dòng này ở đầu
   
   import { AuthProvider } from '@/lib/contexts/AuthContext';
   ```

### ❌ "Cross-site cookie" warning

**Nguyên nhân:** SameSite cookie policy

**Giải pháp:**
- Ignore trong development (localhost)
- Production với HTTPS sẽ tự động OK
- Vercel tự động handle

### ❌ Logout không hoạt động

**Giải pháp:**

```typescript
// Check signOut implementation
const signOut = async () => {
  await supabase.auth.signOut();
  router.push('/admin/login');
  router.refresh(); // ← Thêm dòng này
};
```

---

## ✅ CHECKLIST PRODUCTION

Trước khi deploy production, check:

**Supabase:**
- [ ] Admin user đã tạo
- [ ] Password đủ mạnh (12+ ký tự)
- [ ] Email confirmation đã bật (nếu cần)
- [ ] Redirect URLs đã cấu hình đúng
- [ ] Email templates đã customize
- [ ] SMTP đã cấu hình (nếu dùng custom email)
- [ ] Session timeout đã set

**Vercel:**
- [ ] Environment variables đã add đầy đủ
- [ ] `NEXT_PUBLIC_SUPABASE_URL` đúng
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` đúng
- [ ] `SUPABASE_SERVICE_ROLE_KEY` đúng
- [ ] Deploy thành công

**Testing:**
- [ ] Test login thành công
- [ ] Test logout hoạt động
- [ ] Test protected routes redirect đúng
- [ ] Test tạo/sửa/xóa bài viết
- [ ] Test trên mobile
- [ ] Check console không có errors

**Security:**
- [ ] `.env.local` không commit lên Git
- [ ] Service role key không public
- [ ] HTTPS enabled (Vercel tự động)
- [ ] Password đã đổi từ default

---

## 🎯 TÍNH NĂNG NÂNG CAO (Optional)

### 1. Forgot Password Page

Thêm trang quên mật khẩu:

**File**: `app/admin/forgot-password/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Quên mật khẩu</h2>
        
        {sent ? (
          <div className="bg-green-50 p-4 rounded">
            <p className="text-green-800">
              Đã gửi email reset password! Kiểm tra hộp thư của bạn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            {error && (
              <div className="bg-red-50 p-3 rounded mb-4 text-red-800">
                {error}
              </div>
            )}
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
              className="w-full px-4 py-2 border rounded mb-4"
              required
            />
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Gửi email reset
            </button>
          </form>
        )}
        
        <Link href="/admin/login" className="block mt-4 text-center text-blue-600">
          ← Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
```

**Thêm link trong login page:**
```typescript
// app/admin/login/page.tsx
<Link href="/admin/forgot-password" className="text-sm text-blue-600">
  Quên mật khẩu?
</Link>
```

### 2. Role-Based Access Control (RBAC)

Phân quyền admin (super admin, editor, viewer):

**Setup roles:**
```sql
-- Thêm role vào user metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'admin@example.com';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "editor"}'::jsonb
WHERE email = 'editor@example.com';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "viewer"}'::jsonb
WHERE email = 'viewer@example.com';
```

**Check role trong code:**
```typescript
// components/RoleGuard.tsx
'use client';

import { useAuth } from '@/lib/contexts/AuthContext';

export function RoleGuard({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user } = useAuth();
  const role = user?.user_metadata?.role;
  
  if (!allowedRoles.includes(role)) {
    return <div>Bạn không có quyền truy cập chức năng này.</div>;
  }
  
  return <>{children}</>;
}

// Sử dụng:
<RoleGuard allowedRoles={['super_admin']}>
  <button onClick={handleDelete}>Xóa bài viết</button>
</RoleGuard>
```

### 3. Activity Logs

Track admin actions:

```sql
-- Tạo table logs
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins xem được tất cả logs
CREATE POLICY "Super admins view all logs"
ON admin_logs
FOR SELECT
USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin'
);
```

**Log actions:**
```typescript
// lib/utils/log.ts
import { supabaseAdmin } from '@/lib/supabase/server';

export async function logAdminAction(
  userId: string,
  userEmail: string,
  action: string,
  details: any,
  ipAddress?: string
) {
  await supabaseAdmin.from('admin_logs').insert({
    user_id: userId,
    user_email: userEmail,
    action,
    details,
    ip_address: ipAddress,
  });
}

// Sử dụng:
await logAdminAction(
  user.id,
  user.email,
  'DELETE_ARTICLE',
  { articleId: '123', title: 'Article Title' },
  request.ip
);
```

---

## 📚 TÀI LIỆU THAM KHẢO

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Supabase Auth Helpers**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Next.js Authentication**: https://nextjs.org/docs/authentication
- **Supabase MFA**: https://supabase.com/docs/guides/auth/auth-mfa
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security

---

## 🐛 TROUBLESHOOTING

### Lỗi "supabaseUrl is required"

**Nguyên nhân**: Thiếu environment variables

**Giải pháp**:
```bash
# 1. Kiểm tra file .env.local tồn tại
ls -la .env.local

# 2. Kiểm tra nội dung
cat .env.local

# 3. Restart dev server
# Ctrl+C để stop
npm run dev
```

### Không thấy bài viết trên trang chủ

**Kiểm tra**:
1. Supabase Dashboard → **Table Editor** → `articles`
2. Đảm bảo có bài viết với `published = true`
3. Check RLS policies: **Authentication** → **Policies**
4. Test query trong SQL Editor:
   ```sql
   SELECT * FROM articles WHERE published = true;
   ```

### Lỗi 404 khi truy cập bài viết

**Nguyên nhân**: RLS blocking hoặc slug không đúng

**Giải pháp**:
1. Check slug trong database khớp với URL
2. File `lib/api/articles-server.ts` đã dùng `supabaseAdmin` (bypass RLS)
3. Check console logs trong terminal

### Build Failed trên Vercel

**Xem logs**:
1. Vercel Dashboard → **Deployments** → Click deployment failed
2. Xem **Build Logs**

**Nguyên nhân thường gặp**:
- TypeScript errors → Fix code
- Missing environment variables → Thêm trong Settings
- Package version conflicts → Update `package.json`

**Fix**:
```bash
# Local test build trước
npm run build

# Nếu pass, push lại
git add .
git commit -m "Fix build"
git push
```

### CORS Error

**Supabase CORS**:
1. Supabase → **Settings** → **API**
2. **Allowed origins**: Add domain Vercel của bạn
3. Save

### Lỗi Dark Mode - Chữ không hiển thị

**Đã fix**: File `components/ArticleForm.tsx` và `app/globals.css` đã có dark mode classes.

**Nếu vẫn lỗi**:
- Check browser dark mode setting
- Hard reload (Ctrl+Shift+R)

### Hydration Mismatch Warning

**Đã fix**: `app/layout.tsx` đã có `suppressHydrationWarning` trên `<html>` và `<body>`.

### Mobile Menu không trượt

**Kiểm tra**:
1. Resize browser xuống mobile size (< 768px)
2. Click hamburger icon
3. Menu phải slide từ bên phải

**Nếu không hoạt động**: Check console logs, có thể do JavaScript error.

---

## 🎨 TÙY CHỈNH

### Đổi tên website

**File**: `app/layout.tsx`
```typescript
export const metadata: Metadata = {
  title: 'YourSiteName - Website Tin Tức', // Đổi ở đây
  description: 'Tin tức nóng hổi mỗi ngày',
  // ...
};
```

### Đổi logo

**File**: `components/Header.tsx`
```typescript
<Link href="/" className="flex items-center">
  <span className="text-2xl font-bold text-blue-600">
    🚀 YourBrand // Đổi emoji và text
  </span>
</Link>
```

### Thêm/Xóa Categories

**File**: `lib/constants.ts`
```typescript
export const CATEGORIES = [
  'Công nghệ',
  'Thể thao',
  'Sức khỏe',
  'Ô tô',
  'Giải trí',
  'Your New Category', // Thêm category mới
] as const;
```

**Lưu ý**: Sau khi thay đổi, cần update:
1. `components/ArticleForm.tsx` - Form select
2. `components/Header.tsx` - Navigation links
3. `components/Footer.tsx` - Footer links

### Đổi màu chủ đạo

**File**: `tailwind.config.ts`
```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B', // Đổi màu chính
        secondary: '#4ECDC4',
      }
    }
  }
}
```

**Sau đó replace**:
- `blue-600` → `primary`
- `blue-700` → `primary-dark`

### Đổi font chữ

**File**: `app/layout.tsx`
```typescript
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin', 'vietnamese'],
});

// Trong body:
<body className={roboto.className}>
```

### Thay đổi số bài viết hiển thị

**File**: `app/page.tsx`
```typescript
// Thêm pagination
const articlesPerPage = 12; // Thay đổi số lượng
```

### Custom Metadata mỗi site

Khi clone nhiều site, custom metadata:

**File**: `app/layout.tsx`
```typescript
export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'TinTức',
  description: process.env.NEXT_PUBLIC_SITE_DESC || 'Website tin tức',
  // ...
};
```

**Environment Variables**:
```env
NEXT_PUBLIC_SITE_NAME=Tin Công Nghệ
NEXT_PUBLIC_SITE_DESC=Tin tức công nghệ mới nhất
```

---

## 📊 SEO & PERFORMANCE

### Sitemap

Tự động generate tại: `/sitemap.xml`

**Bao gồm**:
- Trang chủ
- Tất cả bài viết published
- Tất cả category pages

### Robots.txt

Tự động generate tại: `/robots.txt`

**Cấu hình**:
- Allow: Tất cả pages public
- Disallow: `/admin`
- Sitemap: Link đến sitemap.xml

### Metadata động

Mỗi trang tự động có:
- Title tag (unique)
- Meta description
- Keywords
- Open Graph tags (Facebook, LinkedIn)
- Twitter Cards
- Canonical URL
- JSON-LD structured data

### Submit lên Google

1. [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://your-domain.vercel.app`
3. Verify ownership
4. Submit sitemap: `https://your-domain.vercel.app/sitemap.xml`

### Performance Tips

- ✅ Images: Dùng `next/image` (đã implement)
- ✅ Fonts: Google Fonts với `next/font` (đã implement)
- ✅ SSR: Next.js server-side rendering (đã implement)
- ✅ Code splitting: Automatic với Next.js
- ✅ Compression: Vercel tự động gzip

**Expected Lighthouse Score**:
- Performance: 90-100
- Accessibility: 95-100
- Best Practices: 95-100
- SEO: 100

---

## 📦 QUẢN LÝ VÀ CẬP NHẬT

### Cập nhật code

```bash
# 1. Sửa code local
# 2. Test
npm run dev

# 3. Build test
npm run build

# 4. Commit và push
git add .
git commit -m "Update: feature X"
git push origin main

# 5. Vercel tự động deploy
```

### Rollback version

**Vercel Dashboard**:
1. **Deployments** tab
2. Tìm deployment cũ (working version)
3. Click **...** → **Promote to Production**

### Backup Database

**Supabase**:
1. Dashboard → **Database** → **Backups**
2. Free plan: Daily automatic backups (7 days retention)
3. Manual backup: **Create backup**

**Export SQL**:
```sql
-- Trong SQL Editor
COPY (SELECT * FROM articles) TO '/tmp/articles_backup.csv' CSV HEADER;
```

### Monitor

**Vercel Analytics** (Enable trong Settings):
- Real-time visitors
- Page views
- Top pages
- Countries
- Devices

**Supabase Monitoring**:
- Database size
- API requests
- Active connections
- Query performance

---

## 🔧 ADVANCED

### Enable Vercel Analytics

```bash
npm install @vercel/analytics
```

**File**: `app/layout.tsx`
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Enable Speed Insights

```bash
npm install @vercel/speed-insights
```

**File**: `app/layout.tsx`
```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

<body>
  {children}
  <SpeedInsights />
</body>
```

### Thêm Google Analytics

**File**: `app/layout.tsx`
```typescript
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script
    dangerouslySetInnerHTML={{
      __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
      `,
    }}
  />
</head>
```

### Thêm Comments (Disqus)

Install:
```bash
npm install disqus-react
```

**File**: `app/articles/[slug]/page.tsx`
```typescript
import { DiscussionEmbed } from 'disqus-react';

// Trong component
<DiscussionEmbed
  shortname='your-disqus-shortname'
  config={{
    url: `https://your-site.com/articles/${article.slug}`,
    identifier: article.id,
    title: article.title,
  }}
/>
```

---

## ✅ PRODUCTION CHECKLIST

Trước khi deploy production:

### Code Quality
- [ ] `npm run build` thành công không lỗi
- [ ] `npm run lint` không có errors
- [ ] Test tất cả features local
- [ ] Responsive test (mobile, tablet, desktop)
- [ ] Dark mode hoạt động tốt

### Content
- [ ] Xóa bài viết mẫu
- [ ] Thêm bài viết thật (ít nhất 5-10 bài)
- [ ] Images đã optimize
- [ ] Metadata đầy đủ

### SEO
- [ ] Title tags unique mỗi trang
- [ ] Meta descriptions đầy đủ
- [ ] Sitemap.xml hoạt động
- [ ] Robots.txt đúng
- [ ] Open Graph images
- [ ] Submit Google Search Console

### Security
- [ ] Environment variables an toàn
- [ ] Supabase RLS enabled
- [ ] Admin panel có authentication
- [ ] HTTPS enabled (Vercel tự động)
- [ ] Service role key KHÔNG public

### Performance
- [ ] Lighthouse score > 90
- [ ] Images lazy load
- [ ] No console errors
- [ ] Fast page load (< 3s)

### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Error tracking setup
- [ ] Backup strategy
- [ ] Domain DNS configured (nếu custom domain)

---

## 🎓 CẤU TRÚC PROJECT

```
ctrlz1/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Trang chủ
│   ├── globals.css              # Global styles
│   ├── articles/
│   │   └── [slug]/
│   │       └── page.tsx         # Chi tiết bài viết
│   ├── category/
│   │   └── [category]/
│   │       └── page.tsx         # Trang category
│   ├── search/
│   │   └── page.tsx             # Trang tìm kiếm
│   ├── admin/
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── new/
│   │   │   └── page.tsx         # Tạo bài viết
│   │   └── edit/
│   │       └── [id]/
│   │           └── page.tsx     # Sửa bài viết
│   ├── api/
│   │   └── admin/
│   │       └── articles/
│   │           └── route.ts     # API routes (bypass RLS)
│   ├── sitemap.ts               # Dynamic sitemap
│   ├── robots.ts                # Robots.txt
│   ├── manifest.ts              # PWA manifest
│   ├── not-found.tsx            # 404 page
│   └── loading.tsx              # Loading state
│
├── components/                   # React Components
│   ├── Header.tsx               # Header + mobile menu
│   ├── Footer.tsx               # Footer
│   ├── ArticleCard.tsx          # Card bài viết
│   ├── ArticleForm.tsx          # Form CRUD
│   └── LoadingSpinner.tsx       # Loading spinner
│
├── lib/                          # Utilities
│   ├── api/
│   │   ├── articles.ts          # Client-side API
│   │   ├── articles-server.ts   # Server-side API (bypass RLS)
│   │   └── admin-articles.ts    # Admin API functions
│   ├── supabase/
│   │   ├── client.ts            # Supabase client
│   │   └── server.ts            # Supabase admin client
│   ├── types/
│   │   └── article.ts           # TypeScript interfaces
│   ├── constants.ts             # Constants (categories, etc.)
│   └── utils.ts                 # Helper functions
│
├── supabase/
│   └── schema.sql               # Database schema + RLS
│
├── public/                       # Static files
│
├── .env.local                    # Environment variables (local)
├── env.example                   # Environment template
├── next.config.ts                # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── HƯỚNG_DẪN_ĐẦY_ĐỦ.md          # File này
```

---

## 🆘 SUPPORT & RESOURCES

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

### Communities
- **Next.js Discord**: https://nextjs.org/discord
- **Supabase Discord**: https://discord.supabase.com
- **Stack Overflow**: Tag `next.js`, `supabase`

### Troubleshooting
- **GitHub Issues**: Tạo issue nếu gặp bug
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.io

---

## 📝 CHANGELOG

### v1.0.0 (Current)
- ✅ Full CRUD cho bài viết
- ✅ SEO optimization toàn diện
- ✅ Responsive design
- ✅ Mobile sidebar menu
- ✅ Admin panel ẩn
- ✅ Dark mode support
- ✅ Markdown editor
- ✅ Search functionality
- ✅ Category system: Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí
- ✅ View counter
- ✅ Supabase RLS
- ✅ Server-side rendering
- ✅ API routes (bypass RLS)

---

## 🎉 KẾT LUẬN

Bạn đã có trong tay:
- ✅ Website tin tức professional
- ✅ Admin panel mạnh mẽ
- ✅ SEO tối ưu 100%
- ✅ Database PostgreSQL miễn phí
- ✅ Deploy miễn phí trên Vercel
- ✅ Khả năng sao chép không giới hạn
- ✅ Tài liệu đầy đủ

### Roadmap tiếp theo (Optional)

1. **Authentication**: Thêm login/register cho users
2. **Comments**: Tích hợp Disqus hoặc custom comments
3. **Newsletter**: Subscribe email với Mailchimp
4. **Social Share**: Share buttons cho Facebook, Twitter
5. **Related Posts**: Gợi ý bài viết liên quan
6. **Author Profiles**: Trang profile cho tác giả
7. **Advanced Search**: Filter theo date, category, author
8. **Bookmarks**: Users có thể bookmark bài viết
9. **RSS Feed**: Tạo RSS feed cho readers
10. **Multi-language**: i18n support

---

**🚀 Chúc bạn thành công với website tin tức!**

**📧 Có câu hỏi?** Tạo issue trên GitHub hoặc liên hệ support.

**⭐ Hữu ích?** Đừng quên star repository!

---

*Last updated: October 2025*
*Version: 1.0.0*

