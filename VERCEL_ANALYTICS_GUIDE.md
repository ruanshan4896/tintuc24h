# 📊 HƯỚNG DẪN VERCEL ANALYTICS & SPEED INSIGHTS

## ✅ ĐÃ CÀI ĐẶT

### **Packages:**
```bash
✅ @vercel/analytics - Track user behavior
✅ @vercel/speed-insights - Monitor Core Web Vitals
```

### **Setup:**
```typescript
✅ Imported in app/layout.tsx
✅ Added <Analytics /> component
✅ Added <SpeedInsights /> component
```

---

## 🎯 TÍNH NĂNG

### **Vercel Analytics** 📈

**Track:**
- Page views
- Unique visitors
- Top pages
- Top referrers
- Countries
- Devices (Mobile/Desktop)
- Browsers
- Operating systems

**Real-time:**
- Current visitors
- Live page views
- Geographic distribution

### **Speed Insights** ⚡

**Core Web Vitals:**
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTFB** (Time to First Byte)
- **FCP** (First Contentful Paint)
- **INP** (Interaction to Next Paint)

**Metrics:**
- Real user monitoring (RUM)
- Performance score
- Device breakdown
- Page-by-page analysis

---

## 🚀 CÁCH SỬ DỤNG

### **Bước 1: Deploy lên Vercel**

```bash
git add .
git commit -m "feat: Add Vercel Analytics & Speed Insights"
git push origin main
```

Vercel sẽ tự động deploy.

### **Bước 2: Enable Analytics trên Vercel**

1. **Vào Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Chọn project của bạn:**
   ```
   Click vào: tintuc24h-seven (hoặc tên project của bạn)
   ```

3. **Enable Analytics:**
   ```
   Tab "Analytics" → Click "Enable"
   ```

4. **Enable Speed Insights:**
   ```
   Tab "Speed Insights" → Click "Enable"
   ```

**Lưu ý:** Analytics miễn phí cho Hobby plan với giới hạn:
- 2,500 events/month (Hobby)
- Unlimited với Pro plan ($20/month)

### **Bước 3: Chờ dữ liệu**

⏰ **Timeline:**
- **5 phút:** Dữ liệu đầu tiên xuất hiện
- **1 giờ:** Đủ data để phân tích
- **24 giờ:** Dữ liệu đầy đủ và chính xác
- **7 ngày:** Trends và patterns rõ ràng

---

## 📊 XEM DỮ LIỆU

### **Analytics Dashboard**

**Vào:**
```
Vercel Dashboard → Project → Analytics
```

**Tabs:**

1. **Overview:**
   - Total visitors
   - Page views
   - Unique visitors
   - Avg time on site

2. **Top Pages:**
   - Most visited pages
   - Page views per page
   - Unique visitors per page

3. **Top Referrers:**
   - Where traffic comes from
   - Direct, Search, Social, etc.

4. **Audience:**
   - Countries
   - Cities
   - Devices
   - Browsers
   - OS

5. **Real-time:**
   - Current visitors
   - Live page views
   - Active pages

### **Speed Insights Dashboard**

**Vào:**
```
Vercel Dashboard → Project → Speed Insights
```

**Metrics hiển thị:**

```
┌─────────────────────────────────────────┐
│ Core Web Vitals                         │
├─────────────────────────────────────────┤
│ LCP: 1.8s  ✅ Good (75th percentile)   │
│ FID: 50ms  ✅ Good                      │
│ CLS: 0.05  ✅ Good                      │
├─────────────────────────────────────────┤
│ Additional Metrics                      │
├─────────────────────────────────────────┤
│ TTFB: 0.5s                              │
│ FCP: 1.2s                               │
│ Performance Score: 92/100               │
└─────────────────────────────────────────┘
```

**Filters:**
- By page
- By device (Mobile/Desktop)
- By country
- By date range

---

## 📈 HIỂU DỮ LIỆU

### **Core Web Vitals Thresholds**

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** | < 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** | < 100ms | 100ms - 300ms | > 300ms |
| **CLS** | < 0.1 | 0.1 - 0.25 | > 0.25 |

### **Traffic Metrics**

**Page Views:**
- Total số lần page được load
- Bao gồm cả reload

**Unique Visitors:**
- Số người duy nhất
- Không đếm lại khi reload

**Avg Time on Site:**
- Thời gian trung bình user ở lại
- Càng cao càng tốt (> 2 phút)

**Bounce Rate:**
- % người vào rồi thoát ngay
- Càng thấp càng tốt (< 40%)

---

## 🎯 CÁCH TỐI ƯU DỰA TRÊN DATA

### **1. Phân tích Top Pages**

**Nếu một page có:**
- ✅ High views + Low bounce → Keep it up!
- ⚠️ High views + High bounce → Improve content
- ⚠️ Low views → Improve SEO/marketing

**Action:**
```
1. Xem top 5 pages
2. Analyze bounce rate
3. Improve worst performers
4. Replicate best performers
```

### **2. Phân tích Speed Insights**

**Nếu một page có:**
- ❌ LCP > 2.5s → Optimize images
- ❌ FID > 100ms → Reduce JavaScript
- ❌ CLS > 0.1 → Fix layout shifts

**Action:**
```
1. Sort by worst LCP
2. Check images on that page
3. Optimize/lazy load
4. Re-test after 24h
```

### **3. Phân tích Audience**

**Device breakdown:**
```
Mobile: 70%
Desktop: 30%

→ Prioritize mobile optimization!
```

**Country breakdown:**
```
Vietnam: 80%
USA: 10%
Others: 10%

→ Optimize for Vietnam network speeds
```

---

## 🔔 ALERTS & NOTIFICATIONS

### **Setup Alerts**

1. **Vercel Dashboard → Project → Settings**
2. **Notifications**
3. Enable:
   - Performance degradation
   - Error rate increase
   - Traffic spikes

### **Slack/Discord Integration**

```
Settings → Integrations → Add Slack/Discord
```

Nhận thông báo khi:
- Deploy thành công/thất bại
- Performance issues
- Error spikes

---

## 💰 PRICING

### **Hobby Plan (FREE)**
```
Analytics:
- 2,500 events/month
- 7 days retention
- Basic metrics

Speed Insights:
- ✅ Unlimited
- ✅ All metrics
- ✅ All features
```

### **Pro Plan ($20/month)**
```
Analytics:
- Unlimited events
- 90 days retention
- Advanced filters
- Export data

Speed Insights:
- ✅ Same as Hobby
```

**Khuyến nghị:**
- Start với Hobby (FREE)
- Upgrade khi > 2,500 events/month
- Speed Insights luôn FREE!

---

## 📊 DASHBOARD EXAMPLES

### **Good Performance:**
```
┌──────────────────────────────────────┐
│ Analytics (Last 7 days)              │
├──────────────────────────────────────┤
│ 👥 Visitors: 1,234                   │
│ 📄 Page views: 3,456                 │
│ ⏱️  Avg time: 2m 15s                 │
│ 📱 Mobile: 68%                       │
├──────────────────────────────────────┤
│ Speed Insights                       │
├──────────────────────────────────────┤
│ ⚡ Performance: 92/100                │
│ 🎯 LCP: 1.8s ✅                      │
│ 👆 FID: 45ms ✅                      │
│ 📏 CLS: 0.05 ✅                      │
└──────────────────────────────────────┘
```

### **Need Improvement:**
```
┌──────────────────────────────────────┐
│ Analytics (Last 7 days)              │
├──────────────────────────────────────┤
│ 👥 Visitors: 234                     │
│ 📄 Page views: 456                   │
│ ⏱️  Avg time: 0m 45s ⚠️              │
│ 📱 Mobile: 85%                       │
├──────────────────────────────────────┤
│ Speed Insights                       │
├──────────────────────────────────────┤
│ ⚡ Performance: 68/100 ⚠️             │
│ 🎯 LCP: 3.2s ⚠️                      │
│ 👆 FID: 120ms ⚠️                     │
│ 📏 CLS: 0.15 ⚠️                      │
└──────────────────────────────────────┘

→ Action needed: Optimize images, reduce JS
```

---

## 🛠️ ADVANCED: CUSTOM EVENTS

### **Track Custom Events**

Nếu muốn track custom actions (optional):

```typescript
// app/page.tsx hoặc component
'use client';

import { track } from '@vercel/analytics';

function MyComponent() {
  const handleClick = () => {
    // Track custom event
    track('button_clicked', {
      location: 'homepage',
      button: 'read_more'
    });
  };

  return (
    <button onClick={handleClick}>
      Read More
    </button>
  );
}
```

**Custom events tính vào quota:**
- Hobby: 2,500 events/month total
- Pro: Unlimited

---

## 📱 MOBILE APP

### **Vercel Mobile App**

**Download:**
- iOS: App Store
- Android: Google Play

**Features:**
- Real-time dashboard
- Push notifications
- Deploy from mobile
- Monitor analytics
- View Speed Insights

---

## 🔍 MONITORING TIPS

### **Daily:**
```
✅ Check real-time visitors
✅ Monitor error rate
✅ Quick glance at metrics
```

### **Weekly:**
```
✅ Review top pages
✅ Check Core Web Vitals trends
✅ Analyze traffic sources
✅ Review bounce rate
```

### **Monthly:**
```
✅ Deep dive into analytics
✅ Compare with previous month
✅ Identify growth opportunities
✅ Plan content strategy
```

---

## 🎓 BEST PRACTICES

### **1. Set Baselines**
```
Week 1: Record baseline metrics
Week 2-4: Monitor changes
Month 2+: Compare trends
```

### **2. A/B Testing**
```
Deploy changes → Wait 24h → Compare metrics
```

### **3. Mobile-First**
```
If 70%+ mobile → Optimize mobile first
```

### **4. Geographic**
```
If 80%+ Vietnam → Optimize for local users
```

### **5. Core Web Vitals**
```
Keep all metrics in "Good" range
Monitor weekly
Fix degradations immediately
```

---

## 🚨 TROUBLESHOOTING

### **No data showing?**

**Check:**
1. Analytics enabled in Vercel?
2. Deployed to production?
3. Waited at least 5 minutes?
4. Code deployed correctly?

**Verify:**
```bash
# Check package.json
cat package.json | grep vercel

# Should see:
"@vercel/analytics": "^..."
"@vercel/speed-insights": "^..."
```

### **Events limit exceeded?**

**Solutions:**
1. Upgrade to Pro ($20/month)
2. Remove custom events
3. Wait for next month reset
4. Use sampling (only track 50%)

### **Slow data updates?**

**Normal:**
- Real-time: 1-5 minutes delay
- Aggregated: 10-30 minutes delay
- Historical: 1-24 hours

---

## 📚 RESOURCES

- **Docs:** https://vercel.com/docs/analytics
- **Speed Insights:** https://vercel.com/docs/speed-insights
- **Pricing:** https://vercel.com/pricing
- **Status:** https://vercel-status.com

---

## ✅ CHECKLIST

### **Setup:**
- [x] Installed packages
- [x] Added to layout.tsx
- [x] Deployed to Vercel
- [ ] Enabled Analytics in Vercel Dashboard
- [ ] Enabled Speed Insights in Vercel Dashboard
- [ ] Waited 24h for data
- [ ] Reviewed first metrics

### **Ongoing:**
- [ ] Check dashboard weekly
- [ ] Monitor Core Web Vitals
- [ ] Track top pages
- [ ] Analyze traffic sources
- [ ] Optimize based on data

---

## 🎉 SUMMARY

### **Đã cài:**
```
✅ @vercel/analytics
✅ @vercel/speed-insights
✅ Added to layout.tsx
```

### **Next steps:**
```
1. Deploy to Vercel
2. Enable Analytics & Speed Insights
3. Wait 24 hours
4. Check dashboard
5. Optimize based on data
```

### **Benefits:**
```
✅ Real-time monitoring
✅ Core Web Vitals tracking
✅ User behavior insights
✅ Performance trends
✅ Data-driven decisions
```

---

**🎊 Analytics đã sẵn sàng!**

Deploy lên Vercel và bắt đầu track metrics ngay!

```bash
git add .
git commit -m "feat: Add Vercel Analytics & Speed Insights"
git push origin main
```

