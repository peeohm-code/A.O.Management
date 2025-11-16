# Construction Management & QC Platform

ระบบจัดการโครงการก่อสร้างและควบคุมคุณภาพ (Quality Control) แบบครบวงจร พัฒนาด้วย React, TypeScript, tRPC และ MySQL

## ✨ Features

### การจัดการโครงการ

- สร้างและจัดการโครงการก่อสร้าง
- กำหนดงาน (Tasks) แบบ hierarchical พร้อม dependencies
- Gantt Chart แสดง timeline และความคืบหน้า
- ติดตามความคืบหน้าแบบ real-time (Plan vs Actual)
- Archive โครงการที่เสร็จสิ้นแล้ว

### ระบบ QC (Quality Control)

- สร้าง Checklist Templates สำหรับการตรวจสอบคุณภาพ
- ผูก Checklist เข้ากับงาน (Pre-execution, In-progress, Post-execution)
- บันทึกผลการตรวจสอบ (Pass/Fail/N/A) พร้อมรูปภาพ
- ลายเซ็นดิจิทัล (Digital Signature) สำหรับผู้ตรวจสอบ
- สร้าง PDF Report สำหรับการตรวจสอบแต่ละครั้ง

### การจัดการ Defects

- บันทึก Defects ที่พบระหว่างการตรวจสอบ
- กำหนดผู้รับผิดชอบและกำหนดเวลาแก้ไข
- แนบรูปภาพ Before/After
- Re-inspection workflow พร้อมบันทึกประวัติ
- ติดตามสถานะ Defects แบบ real-time

### การจัดการทีม

- ระบบ Role-based Access Control (Admin, Project Manager, QC Inspector, Worker)
- มอบหมายงานให้สมาชิกทีม
- ติดตามภาระงาน (Workload) ของแต่ละคน
- Dashboard แยกตาม Role
- Team Activity Feed

### การแจ้งเตือน

- Real-time Notifications ด้วย Server-Sent Events (SSE)
- แจ้งเตือนเมื่อมีงานใหม่ที่ได้รับมอบหมาย
- แจ้งเตือนเมื่อพบ Defect ใหม่
- แจ้งเตือนงานใกล้ครบกำหนด
- Push Notifications สำหรับ PWA
- Email Notifications

### รายงานและวิเคราะห์

- Dashboard แสดงสถิติโครงการ
- Analytics Dashboard พร้อมกราฟและแผนภูมิ
- Export รายงานเป็น PDF และ Excel
- Daily/Weekly Progress Reports
- Defect Tracking Reports

### Mobile Support

- Progressive Web App (PWA) พร้อม offline mode
- Responsive design สำหรับทุกขนาดหน้าจอ
- Camera integration สำหรับถ่ายรูป Defects
- GPS location tagging
- Touch-optimized UI

## 🛠️ Tech Stack

### Frontend

- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI components
- **tRPC** - Type-safe API
- **React Query** - Data fetching
- **Wouter** - Routing
- **Recharts** - Charts and visualizations
- **Frappe Gantt** - Gantt chart

### Backend

- **Express** - Web server
- **tRPC** - API layer
- **MySQL** - Database
- **Drizzle ORM** - Database ORM
- **AWS S3** - File storage
- **Nodemailer** - Email notifications
- **Node-cron** - Scheduled tasks

### DevOps

- **Vite** - Build tool
- **Husky** - Git hooks
- **Lint-staged** - Pre-commit linting
- **GitHub Actions** - CI/CD
- **Docker** - Containerization (optional)

## 📦 Installation

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL 8+

### Setup

1. Clone the repository

```bash
git clone <repository-url>
cd construction_management_app
```

2. Install dependencies

```bash
pnpm install
```

3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Push database schema

```bash
pnpm db:push
```

5. Start development server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## 🚀 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm type-check` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema changes

### Pre-commit Hooks

The project uses Husky and lint-staged to run checks before commits:

- TypeScript type checking
- ESLint auto-fix
- Prettier formatting

If any check fails, the commit will be rejected.

## 📝 Database Schema

### Core Tables

- `users` - ผู้ใช้งานและบทบาท
- `projects` - โครงการก่อสร้าง
- `tasks` - งานในโครงการ
- `taskDependencies` - ความสัมพันธ์ระหว่างงาน
- `taskAssignments` - การมอบหมายงาน
- `checklistTemplates` - แม่แบบ Checklist
- `checklistItems` - รายการใน Checklist
- `taskChecklists` - Checklist ที่ผูกกับงาน
- `checklistResults` - ผลการตรวจสอบ
- `defects` - ข้อบกพร่องที่พบ
- `defectPhotos` - รูปภาพ Defects
- `taskComments` - ความคิดเห็นในงาน
- `taskAttachments` - ไฟล์แนบในงาน
- `activityLogs` - บันทึกกิจกรรม
- `notifications` - การแจ้งเตือน

## 🔐 Authentication & Authorization

ระบบใช้ Manus OAuth สำหรับการ authentication และ JWT สำหรับ session management

### Roles

- **Admin** - เข้าถึงทุกฟีเจอร์
- **Project Manager** - จัดการโครงการและทีม
- **QC Inspector** - ตรวจสอบคุณภาพและบันทึก Defects
- **Worker** - ดูงานที่ได้รับมอบหมายและอัปเดตความคืบหน้า

## 📱 PWA Features

- Offline mode สำหรับการทำงานในพื้นที่ไม่มีสัญญาณ
- Install to home screen
- Push notifications
- Background sync
- Service worker caching

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 🚢 Deployment

### Production Build

```bash
pnpm build
pnpm start
```

### Environment Variables

Required environment variables for production:

- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `VITE_APP_TITLE` - Application title
- `VITE_APP_LOGO` - Logo URL
- `BUILT_IN_FORGE_API_KEY` - API key for built-in services
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration (optional)

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.
