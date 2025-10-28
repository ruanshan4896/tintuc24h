# 📰 Website Tin Tức - Next.js + Supabase

> Website tin tức hiện đại, SEO-friendly, deploy miễn phí lên Vercel

---

## 🚀 BẮT ĐẦU NHANH

### 1. Cài đặt
```bash
npm install
```

### 2. Setup Supabase
1. Tạo project tại [supabase.com](https://supabase.com)
2. Chạy `supabase/schema.sql` trong SQL Editor
3. Lấy API credentials

### 3. Cấu hình
```bash
# Tạo file .env.local
cp env.example .env.local

# Điền thông tin Supabase vào .env.local
```

### 4. Chạy
```bash
npm run dev
```

Truy cập: **http://localhost:3000**

---

## 📖 TÀI LIỆU ĐẦY ĐỦ

**🔥 Đọc file này để biết mọi thứ:**

### → [HƯỚNG_DẪN_ĐẦY_ĐỦ.md](./HƯỚNG_DẪN_ĐẦY_ĐỦ.md) ←

File này bao gồm:
- ✅ Hướng dẫn setup từ A-Z
- ✅ Deploy lên Vercel chi tiết
- ✅ **Sao chép & deploy nhiều domain**
- ✅ Quản lý Admin Panel
- ✅ Troubleshooting mọi lỗi
- ✅ Tùy chỉnh và mở rộng

---

## ✨ TÍNH NĂNG

- ✅ **Quản lý bài viết**: CRUD hoàn chỉnh
- ✅ **SEO tối ưu**: Metadata, Sitemap, Open Graph, JSON-LD
- ✅ **Responsive**: Mobile, Tablet, Desktop
- ✅ **Admin Panel**: Ẩn, chỉ truy cập qua `/admin`
- ✅ **Mobile Menu**: Sidebar trượt từ phải
- ✅ **Markdown**: GitHub Flavored Markdown
- ✅ **Search**: Tìm kiếm bài viết
- ✅ **Categories**: Công nghệ, Thể thao, Sức khỏe, Ô tô, Giải trí
- ✅ **Dark Mode**: Hỗ trợ dark mode
- ✅ **View Counter**: Đếm lượt xem

---

## 🌐 DEPLOY

### Deploy lên Vercel
```bash
# Push lên GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Vercel tự động deploy khi import repository
```

### Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Chi tiết**: Xem [HƯỚNG_DẪN_ĐẦY_ĐỦ.md](./HƯỚNG_DẪN_ĐẦY_ĐỦ.md)

---

## 🔐 ADMIN

### Đăng nhập Admin

Website có hệ thống đăng nhập admin bảo mật bằng Supabase Auth.

**Truy cập:**
```
Local:      http://localhost:3000/admin
Production: https://your-domain.vercel.app/admin
```

**Setup Admin User:** Xem [HƯỚNG_DẪN_ĐẦY_ĐỦ.md](./HƯỚNG_DẪN_ĐẦY_ĐỦ.md#-admin-panel--authentication)

**Tính năng:**
- ✅ Đăng nhập email/password bảo mật
- ✅ Protected routes (tự động redirect)
- ✅ Session management
- ✅ Logout functionality
- ✅ Password hashing (bcrypt)

---

## 🛠️ TECH STACK

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel
- **Markdown**: react-markdown
- **SEO**: Next.js Metadata API

---

## 📂 CẤU TRÚC

```
ctrlz1/
├── app/                    # Next.js pages
├── components/             # React components
├── lib/                    # API & utilities
├── supabase/              # Database schema
└── HƯỚNG_DẪN_ĐẦY_ĐỦ.md   # 📖 ĐỌC FILE NÀY!
```

---

## 🎯 SAO CHÉP NHIỀU DOMAIN

Muốn tạo nhiều website giống nhau? Xem hướng dẫn chi tiết trong:
**[HƯỚNG_DẪN_ĐẦY_ĐỦ.md](./HƯỚNG_DẪN_ĐẦY_ĐỦ.md)** - Phần "Sao Chép & Deploy Nhiều Domain"

**3 phương án:**
1. Một Database - Nhiều Website (khuyến nghị)
2. Mỗi Site Một Database
3. Template + Script Tự Động

---

## 🐛 TROUBLESHOOTING

Gặp lỗi? Xem phần **Troubleshooting** trong [HƯỚNG_DẪN_ĐẦY_ĐỦ.md](./HƯỚNG_DẪN_ĐẦY_ĐỦ.md)

**Lỗi thường gặp:**
- ❌ "supabaseUrl is required" → Check `.env.local`
- ❌ Không thấy bài viết → Check Supabase RLS
- ❌ Build failed → Xem logs trong Vercel
- ❌ 404 error → Check slug và RLS policies

---

## 📈 PERFORMANCE

- **Lighthouse Score**: 90-100
- **SEO**: 100/100
- **Accessibility**: 95-100
- **Best Practices**: 95-100

---

## 📝 LICENSE

MIT License - Sử dụng tự do cho mọi mục đích

---

## 🆘 SUPPORT

- 📖 **Tài liệu đầy đủ**: [HƯỚNG_DẪN_ĐẦY_ĐỦ.md](./HƯỚNG_DẪN_ĐẦY_ĐỦ.md)
- 💬 **GitHub Issues**: Tạo issue nếu gặp vấn đề
- 📚 **Docs**: Next.js, Supabase, Vercel docs

---

**🎉 Chúc bạn thành công với website tin tức!**

**⭐ Star repository nếu thấy hữu ích!**

