# การปรับปรุงด้าน Security, Performance และ Testing

## 📋 สรุปการปรับปรุง

เอกสารนี้สรุปการปรับปรุงที่สำคัญทั้งหมดที่ได้ทำในระบบ Construction Management & QC Platform เพื่อเพิ่มความปลอดภัย ประสิทธิภาพ และความน่าเชื่อถือของระบบก่อนการ deploy production

---

## 🔒 Security Enhancements

### 1. CSRF Protection
**ไฟล์:** `server/_core/csrf.ts`, `client/src/hooks/useCsrf.ts`

- ใช้ **Double Submit Cookie pattern** สำหรับป้องกัน CSRF attacks
- Middleware ตรวจสอบ CSRF token ในทุก state-changing requests (POST, PUT, DELETE)
- Client-side hook (`useCsrf`) สำหรับจัดการ CSRF token อัตโนมัติ
- ข้าม CSRF check สำหรับ safe methods (GET, HEAD, OPTIONS) และ public endpoints

**การใช้งาน:**
```typescript
// Client-side - CSRF token ถูกส่งอัตโนมัติในทุก tRPC requests
// ไม่ต้องทำอะไรเพิ่มเติม - ระบบจัดการให้อัตโนมัติ
```

### 2. Virus Scanning
**ไฟล์:** `server/_core/virusScanner.ts`

- Integration กับ **ClamAV** สำหรับสแกนไฟล์ที่อัปโหลด
- รองรับทั้ง file path และ buffer scanning
- Graceful degradation: หาก ClamAV ไม่พร้อมใช้งาน จะ log warning แต่ยังอนุญาตให้อัปโหลดได้
- ป้องกันไฟล์ที่มี malware จากการเข้าสู่ระบบ

**การติดตั้ง ClamAV (Production):**
```bash
# Ubuntu/Debian
sudo apt-get install clamav clamav-daemon
sudo freshclam
sudo systemctl start clamav-daemon
```

### 3. Enhanced Rate Limiting
**ไฟล์:** `server/_core/rateLimiter.ts`

Rate limiters แบบหลายระดับสำหรับ endpoints ต่างๆ:

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| `generalLimiter` | 15 min | 100 | API endpoints ทั่วไป |
| `authLimiter` | 15 min | 5 | Authentication endpoints |
| `uploadLimiter` | 1 hour | 20 | File uploads |
| `sensitiveLimiter` | 1 hour | 10 | Sensitive operations |
| `criticalLimiter` | 1 hour | 3 | Critical operations |
| `readLimiter` | 15 min | 200 | Read-only operations |

**Features:**
- Skip rate limiting ใน development mode
- Return rate limit info ใน `RateLimit-*` headers
- Custom error messages พร้อม retry-after info

---

## ⚡ Performance Optimization

### 1. Database Indexes
**ไฟล์:** `drizzle/add-performance-indexes.sql`, `drizzle/schema.ts`

เพิ่ม indexes ครอบคลุม **43 tables** รวมถึง:

**Single Column Indexes:**
- Foreign keys: `projectId`, `taskId`, `userId`, `assigneeId`
- Status fields: `status`, `priority`, `severity`
- Date fields: `startDate`, `endDate`, `createdAt`, `resolvedAt`
- Search fields: `category`, `type`, `stage`

**Composite Indexes:**
- `task_project_status_idx`: (`projectId`, `status`)
- `task_assignee_status_idx`: (`assigneeId`, `status`)
- `defect_task_status_idx`: (`taskId`, `status`)
- `notification_user_read_idx`: (`userId`, `readAt`)

**ผลลัพธ์:**
- ✅ แก้ไข N+1 query problems
- ✅ เร่งความเร็วการ query ข้อมูล
- ✅ ลด database load

### 2. Bundle Size Optimization
**ไฟล์:** `vite.config.ts`

**Code Splitting Strategy:**
```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'scheduler'],
  'trpc-vendor': ['@trpc/*', '@tanstack/react-query'],
  'chart-vendor': ['recharts', 'd3-*'],
  'ui-vendor': ['@radix-ui/*'],
  'icon-vendor': ['lucide-react'],
  'date-vendor': ['date-fns'],
  'form-vendor': ['react-hook-form', 'zod'],
  'gantt-vendor': ['frappe-gantt'],
  'animation-vendor': ['framer-motion'],
  'xlsx-vendor': ['xlsx'],
  'pdf-vendor': ['jspdf', 'html2canvas'],
  'socket-vendor': ['socket.io-client'],
}
```

**Additional Optimizations:**
- ✅ CSS Code Splitting
- ✅ Tree Shaking
- ✅ Module Preload disabled (modern browsers)
- ✅ Bundle analyzer (run with `ANALYZE=true pnpm build`)

**ผลลัพธ์:**
- Vendor chunks แยกตามหมวดหมู่
- Lazy loading สำหรับ features ที่ไม่ได้ใช้ทันที
- Reduced initial bundle size

---

## 🧪 Test Coverage

### 1. E2E Testing (Playwright)
**ไฟล์:** `playwright.config.ts`, `tests/e2e/*.spec.ts`

**Test Suites:**
- ✅ Authentication Flow (`auth.spec.ts`)
  - Login redirect
  - Session persistence
  - Logout functionality
- ✅ Inspection Workflow (`inspection.spec.ts`)
  - View inspection list
  - Navigate to detail
  - Complete checklist
  - Handle failed inspections

**Configuration:**
- รองรับ 5 browsers: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- Screenshot และ video on failure
- Trace on retry
- HTML report generation

**การรัน E2E Tests:**
```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug mode
pnpm test:e2e:debug
```

### 2. Integration Testing (Vitest)
**ไฟล์:** `tests/integration/security.test.ts`

**Test Coverage:**
- ✅ CSRF Protection validation
- ✅ Rate Limiting enforcement
- ✅ File upload validation (type, size)
- ✅ Virus scanning availability
- ✅ Authentication security

**การรัน Integration Tests:**
```bash
# Run integration tests only
pnpm test:integration

# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# UI mode
pnpm test:ui
```

---

## 📊 Test Scripts Summary

| Command | Description |
|---------|-------------|
| `pnpm test` | รัน unit tests ทั้งหมด |
| `pnpm test:watch` | รัน tests ใน watch mode |
| `pnpm test:ui` | เปิด Vitest UI |
| `pnpm test:integration` | รัน integration tests |
| `pnpm test:e2e` | รัน E2E tests ทั้งหมด |
| `pnpm test:e2e:ui` | เปิด Playwright UI |
| `pnpm test:e2e:headed` | รัน E2E tests แบบเห็น browser |
| `pnpm test:e2e:debug` | Debug E2E tests |

---

## 🚀 Deployment Checklist

### ก่อน Deploy Production:

#### 1. Security
- [ ] ติดตั้ง ClamAV บน production server
- [ ] ตรวจสอบ CSRF protection ทำงานถูกต้อง
- [ ] ทดสอบ rate limiting ใน production-like environment
- [ ] Review และอัปเดต rate limit values ตามความเหมาะสม

#### 2. Performance
- [ ] รัน `ANALYZE=true pnpm build` เพื่อดู bundle size
- [ ] ตรวจสอบ bundle size < 500KB per chunk (ถ้าเป็นไปได้)
- [ ] ทดสอบ load time บน production build
- [ ] ตรวจสอบ database indexes ทำงานถูกต้อง

#### 3. Testing
- [ ] รัน `pnpm test` - ต้อง pass ทั้งหมด
- [ ] รัน `pnpm test:integration` - ต้อง pass ทั้งหมด
- [ ] รัน `pnpm test:e2e` - ต้อง pass หลัก workflows
- [ ] Manual testing สำหรับ critical features

#### 4. Environment Variables
- [ ] ตั้งค่า `NODE_ENV=production`
- [ ] ตรวจสอบ database connection string
- [ ] ตรวจสอบ S3 credentials
- [ ] ตรวจสอบ OAuth configuration

---

## 📝 Known Issues & Limitations

### 1. Virus Scanning
- **Issue:** ClamAV ต้องติดตั้งและรันบน server
- **Workaround:** ระบบจะ log warning แต่ยังอนุญาตให้อัปโหลดได้
- **Solution:** ติดตั้ง ClamAV ตาม deployment checklist

### 2. E2E Tests
- **Issue:** บาง tests ต้องการ authentication setup
- **Workaround:** Tests ถูก skip ใน CI environment
- **Solution:** ตั้งค่า test user accounts สำหรับ CI/CD

### 3. Rate Limiting
- **Issue:** Rate limiting ถูก skip ใน development mode
- **Workaround:** ทดสอบ rate limiting ใน production-like environment
- **Solution:** ใช้ `NODE_ENV=production` เมื่อทดสอบ

---

## 🔄 Next Steps

### Recommended Improvements:

1. **CI/CD Pipeline**
   - ตั้งค่า GitHub Actions หรือ GitLab CI
   - Automated testing บน every commit
   - Automated deployment to staging/production

2. **Monitoring & Logging**
   - Integration กับ Sentry สำหรับ error tracking
   - APM (Application Performance Monitoring)
   - Database query performance monitoring

3. **Additional Security**
   - CAPTCHA สำหรับ login/register
   - Two-factor authentication (2FA)
   - Security headers audit

4. **Performance**
   - CDN สำหรับ static assets
   - Redis caching layer
   - Database query optimization ต่อเนื่อง

---

## 📚 References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [ClamAV Documentation](https://docs.clamav.net/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)

---

**เอกสารนี้สร้างเมื่อ:** 18 พฤศจิกายน 2568  
**Version:** 1.0  
**Checkpoint:** c5189bd1
