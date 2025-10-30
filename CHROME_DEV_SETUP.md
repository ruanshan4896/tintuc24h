# 🔧 CHROME DEV PROFILE - SETUP RIÊNG CHO DEV

## 🎯 MỤC TIÊU

- Tách biệt Chrome dev và Chrome personal
- Không có browser extensions gây hydration error
- Giữ được DevTools settings, bookmarks dev
- Không ảnh hưởng đến Chrome cá nhân

---

## 📋 CÁCH 1: TẠO CHROME PROFILE MỚI (KHUYẾN NGHỊ)

### **Bước 1: Tạo Profile Mới**

1. Mở Chrome hiện tại
2. Click vào **Avatar** (góc trên bên phải)
3. Click **"Add"** hoặc **"Thêm"**
4. Chọn **"Sign in"** hoặc **"Continue without an account"**
5. Đặt tên: **"Dev Profile"**
6. Chọn màu: **Xanh dương** (để dễ phân biệt)
7. Click **"Done"**

### **Bước 2: Disable Extensions Trên Profile Mới**

1. Vào `chrome://extensions/` trên profile mới
2. **KHÔNG CÀI** bất kỳ extension nào
3. Nếu có extension nào, **Disable** hoặc **Remove** hết

### **Bước 3: Cấu Hình DevTools**

1. `F12` để mở DevTools
2. Settings (⚙️) → **Preferences**
3. Cấu hình theo ý muốn:
   - Theme: Dark
   - Font size: 12px
   - Enable custom formatters (nếu cần)

### **Bước 4: Tạo Desktop Shortcut**

**Windows:**
1. Right-click Desktop → **New** → **Shortcut**
2. Location:
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --profile-directory="Profile 2"
   ```
   *(Thay `Profile 2` bằng tên profile mới, thường là `Profile 2`, `Profile 3`...)*

3. Name: **Chrome Dev**
4. Click **Finish**
5. Right-click shortcut → **Properties** → **Change Icon**
6. Chọn icon khác để dễ phân biệt (hoặc giữ nguyên)

**Tìm Profile Directory:**
```
Vào chrome://version/
Tìm dòng "Profile Path": C:\Users\YourName\AppData\Local\Google\Chrome\User Data\Profile 2
```

---

## 📋 CÁCH 2: PORTABLE CHROME (TÁCH BIỆT HOÀN TOÀN)

### **Bước 1: Download Portable Chrome**

1. Download: https://portableapps.com/apps/internet/google_chrome_portable
2. Hoặc: https://chromium.woolyss.com/ (Chromium portable)
3. Extract vào: `C:\Dev\ChromePortable`

### **Bước 2: Tạo Shortcut**

**Windows:**
1. Right-click Desktop → **New** → **Shortcut**
2. Location:
   ```
   C:\Dev\ChromePortable\GoogleChromePortable.exe
   ```
3. Name: **Chrome Dev (Portable)**
4. Click **Finish**

### **Bước 3: Cấu Hình**

1. Mở Chrome Portable
2. **KHÔNG đăng nhập** Google account
3. **KHÔNG cài extensions**
4. Cấu hình DevTools (F12 → Settings)

---

## 📋 CÁCH 3: CHROME CANARY (ADVANCED)

### **Bước 1: Download Chrome Canary**

1. Download: https://www.google.com/chrome/canary/
2. Install (tự động cài vào folder riêng)

### **Bước 2: Launch với Flags**

**Windows - Tạo Shortcut:**
1. Right-click Desktop → **New** → **Shortcut**
2. Location:
   ```
   "C:\Users\YourName\AppData\Local\Google\Chrome SxS\Application\chrome.exe" --disable-extensions --no-first-run --disable-sync
   ```
3. Name: **Chrome Canary Dev**
4. Click **Finish**

**Flags giải thích:**
- `--disable-extensions`: Tắt tất cả extensions
- `--no-first-run`: Không hiện welcome screen
- `--disable-sync`: Không sync với Google account

---

## 🚀 CÁCH SỬ DỤNG

### **Workflow hàng ngày:**

1. **Chrome thường (Profile chính):**
   - Dùng cho web browsing
   - Có LastPass, Bitwarden, Grammarly...
   - Đăng nhập Google, Facebook...

2. **Chrome Dev (Profile riêng):**
   - **CHỈ** dùng cho dev
   - Không có extensions
   - Mở localhost, Vercel dashboard, Supabase...
   - Không có hydration errors! ✅

### **Khi dev:**
```
1. Mở Chrome Dev (từ shortcut)
2. Vào http://localhost:3000
3. F12 → Console → KHÔNG còn hydration warning! 🎉
```

---

## 🎨 TÙY CHỈNH THÊM

### **Thêm Flags Hữu Ích**

**Performance Testing:**
```
--disable-extensions --disable-sync --disable-gpu-vsync --max-old-space-size=4096
```

**Network Throttling:**
```
--disable-extensions --disable-sync --throttling-profile=slow-3g
```

**Auto-open DevTools:**
```
--disable-extensions --auto-open-devtools-for-tabs
```

### **Bookmark Folders**

Trong Chrome Dev, tạo bookmarks:
```
📂 Dev Tools
  - http://localhost:3000
  - http://localhost:3001
  - https://vercel.com/dashboard
  - https://supabase.com/dashboard
  - https://github.com/yourusername
  - https://console.cloud.google.com
```

---

## 📊 SO SÁNH

| Phương pháp | Ưu điểm | Nhược điểm |
|-------------|---------|------------|
| **Chrome Profile Mới** | Dễ setup, share settings | Vẫn dùng chung Chrome |
| **Portable Chrome** | Tách biệt hoàn toàn, portable | Phải download riêng |
| **Chrome Canary** | Bleeding edge, dev features | Có thể không ổn định |

---

## 🎯 KHUYẾN NGHỊ

**Cho beginner:** Dùng **Chrome Profile Mới** (Cách 1)

**Cho advanced:** Dùng **Portable Chrome** (Cách 2)

**Cho testing:** Dùng **Chrome Canary** (Cách 3)

---

## ✅ KIỂM TRA

Sau khi setup xong:

1. Mở Chrome Dev (từ shortcut)
2. Vào `chrome://extensions/` → **PHẢI trống hoặc tất cả disabled**
3. Vào `http://localhost:3000`
4. F12 → Console → **Không còn hydration warning!** ✅

---

## 🆘 TROUBLESHOOTING

### **Profile directory không đúng:**

Tìm profile directory:
```
1. Vào chrome://version/
2. Tìm "Profile Path"
3. Ví dụ: C:\Users\YourName\AppData\Local\Google\Chrome\User Data\Profile 2
4. Dùng tên folder cuối: "Profile 2"
```

### **Shortcut không hoạt động:**

Kiểm tra:
```
1. Path đến chrome.exe đúng chưa?
2. Có dấu ngoặc kép ("...") chưa?
3. Profile directory đúng chưa?
```

Test command:
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --version
```

---

## 🎉 DONE!

**Bây giờ bạn có:**
- ✅ Chrome Dev (clean, no extensions)
- ✅ Chrome Personal (tất cả extensions)
- ✅ Không còn hydration errors
- ✅ Workflow dev sạch sẽ

**Enjoy coding!** 🚀

