# 🧠 ENG.AI — Your AI-powered English Coach

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-blueviolet?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-Llama3%20%2F%20Mixtral-orange?style=for-the-badge&logo=openai)](https://groq.com/)

ENG.AI là một hệ thống phần mềm học tiếng Anh tích hợp Trí tuệ Nhân tạo thế hệ mới (Next-Gen AI). Hệ thống hỗ trợ đắc lực cho người học tối ưu phản xạ qua 6 kỹ năng cốt lõi (Giao tiếp, Từ vựng, Viết luận, Phát âm, Luyện nghe và Đọc hiểu) thông qua phản hồi thông minh tức thời (Real-time corrections).

---

## 🎯 Tính năng cốt lõi

### 1. AI Conversation Partner (Luyện nói)
- Đối thoại tiếng Anh trực tiếp với AI theo các kịch bản thực tiễn: Phỏng vấn xin việc (Job Interview), Mua sắm (Shopping), Du lịch (Travel), Đi khám bệnh (Medical),...
- AI phản hồi với độ trễ thấp dưới 1 giây.
- **AI Correction Box**: Tự động phát hiện lỗi ngữ pháp, dùng từ và chính tả sau mỗi câu thoại của người học kèm đề xuất sửa lỗi chi tiết.

### 2. Spaced Repetition Vocabulary (Từ vựng SRS)
- Lưu từ vựng tự động từ các buổi trò chuyện AI.
- Thuật toán ôn tập Lặp lại ngắt quãng (Spaced Repetition System - SRS) tự động lập lịch ngày ôn tập tối ưu để tối đa khả năng ghi nhớ dài hạn.

### 3. AI Writing Evaluator (Chấm bài viết)
- Gửi bài luận, email công sở hoặc bài thi IELTS Writing.
- AI phân tích cấu trúc, ngữ pháp, độ đa dạng từ vựng và sự mạch lạc của văn bản để cho điểm và hướng dẫn viết lại.

### 4. Interactive Dashboard
- Theo dõi Streak học tập đều đặn.
- Biểu đồ radar 6 kỹ năng (Recharts) đánh giá điểm mạnh/yếu thời gian thực.
- Thử thách hàng ngày (Daily Challenges) thúc đẩy học viên rèn luyện đều đặn để tích lũy điểm kinh nghiệm (XP) và thăng cấp.

---

## 🏗️ Cấu trúc thư mục dự án

```
engai/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx           ← Đăng nhập đẹp mắt, hỗ trợ Google OAuth
│   │   ├── register/page.tsx        ← Đăng ký tài khoản với Zod Form Validation
│   │   └── layout.tsx               ← Split layout, glassmorphism panel
│   ├── (dashboard)/
│   │   ├── layout.tsx               ← Sidebar + Header + Mobile navigation panel
│   │   ├── dashboard/page.tsx       ← Trang chủ Overview (Stats, Recharts, Challenge)
│   │   ├── conversation/page.tsx    ← Luyện hội thoại AI theo tình huống
│   │   └── profile/page.tsx         ← Chỉnh sửa hồ sơ, lộ trình học & badge đạt được
│   ├── api/
│   │   ├── ai/chat/route.ts         ← API Streaming hội thoại kết nối Groq (Llama-3.1-8b)
│   │   ├── ai/evaluate/route.ts     ← API Chấm bài viết chuyên sâu (Llama-3.3-70b)
│   │   ├── ai/vocabulary/route.ts   ← API Tạo thẻ từ vựng tự động dạng cấu trúc JSON
│   │   └── ai/lesson/route.ts       ← API Khởi tạo bài học thông minh thích ứng
│   ├── auth/callback/route.ts       ← Endpoint xử lý xác thực OAuth callback
│   ├── globals.css                  ← CSS variables cho theme, scrollbar, hiệu ứng glow
│   ├── layout.tsx                   ← Root layout thiết lập Inter/JetBrains Mono fonts
│   └── page.tsx                     ← Trang Landing chính visual-first quảng bá dự án
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx              ← Menu điều hướng 10 trang kèm các trạng thái hover/active
│   │   └── Header.tsx               ← Header chứa Notification, Theme switcher, XP bar
│   └── theme-provider.tsx           ← Provider chuyển Light/Dark mode của next-themes
├── lib/
│   ├── supabase/
│   │   ├── client.ts                ← Trình khách kết nối Supabase Client (browser)
│   │   └── server.ts                ← Trình khách kết nối Supabase Server (cookies)
│   ├── groq/
│   │   ├── client.ts                ← SDK Groq Client và ánh xạ Model
│   │   └── prompts.ts               ← Quản lý các prompt hệ thống tinh chỉnh cho AI
│   ├── utils/
│   │   └── cn.ts                    ← className utility kết hợp clsx & tailwind-merge
│   └── types/
│       └── database.ts              ← Kiểu dữ liệu strict type đồng bộ từ PostgreSQL
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   ← Script tạo cấu trúc bảng, trigger & RLS policies
├── middleware.ts                    ← Middleware bảo mật định tuyến & làm mới session cookies
├── package.json
└── README.md
```

---

## 🗄️ Cấu trúc Cơ sở dữ liệu (Supabase Schema)

Hệ thống được thiết kế trên PostgreSQL với các bảng chính:
- **`profiles`**: Lưu thông tin học viên (Level, XP, Streak, Goal, Learning Style, Daily Goal).
- **`skill_stats`**: Thống kê tỷ lệ chính xác và cấp độ riêng cho 6 kỹ năng.
- **`conversations`**: Lịch sử hội thoại AI và các ghi nhận phản hồi tổng thể.
- **`vocabulary`**: Thẻ từ vựng cá nhân, tích hợp các tham số SRS (`ease_factor`, `interval_days`, `repetitions`, `next_review_date`).
- **`writing_submissions`**: Kết quả chấm bài luận từ AI (Overall, grammar, vocab, coherence).
- **`daily_challenges`**: Nhiệm vụ hàng ngày của học viên.
- **`achievements`**: Các huy hiệu đã mở khóa.

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Clone mã nguồn và cài đặt thư viện
```bash
git clone <repository_url>
cd engai
npm install
```

### 2. Thiết lập biến môi trường
Tạo file `.env.local` ở thư mục gốc dựa theo mẫu dưới đây:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

GROQ_API_KEY=gsk_your_groq_api_key_here

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ENG.AI
```

### 3. Thiết lập Cơ sở dữ liệu (Supabase SQL)
1. Đăng nhập vào trang quản trị [Supabase Console](https://supabase.com).
2. Tạo dự án mới và mở trình soạn thảo SQL **SQL Editor**.
3. Sao chép toàn bộ mã SQL trong file `supabase/migrations/001_initial_schema.sql` dán vào và nhấn **Run**.
4. Các Trigger tự động tạo hồ sơ học viên khi đăng ký và hàm tính toán XP sẽ tự động được thiết lập.

### 4. Chạy ứng dụng chế độ Development
```bash
npm run dev
```
Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000).

---

## ⚡ API Documentation & Models sử dụng

| Endpoint | Method | Trách nhiệm | Model AI |
|---|---|---|---|
| `/api/ai/chat` | `POST` | Live Streaming hội thoại scenario | `llama-3.1-8b-instant` |
| `/api/ai/evaluate` | `POST` | Chấm điểm bài viết luận & sửa lỗi | `llama-3.3-70b-versatile` |
| `/api/ai/vocabulary` | `POST` | Tạo thẻ từ vựng context tự động | `llama-3.3-70b-versatile` |
| `/api/ai/lesson` | `POST` | Khởi tạo cấu trúc bài học | `llama-3.3-70b-versatile` |
