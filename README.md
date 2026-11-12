# EventSphere – Smart Event Management & Registration Portal

A full-stack college event management, AI recommendation, interactive seat allocation, and verified student portfolio platform built with **React + Vite + Tailwind CSS** (frontend), **Node.js + Express** (backend), and **SQLite via Prisma** (database).

---

## 🚀 Features Across All 6 Phases

1. **Authentication & Role-Based Access**: Student, Organizer, and Admin accounts with JWT authentication (`password123` for all seeded demo accounts).
2. **Event Discovery & Smart Filtering**: Search and filter 28+ seeded campus events by category, free/paid entry, online/in-person mode, and schedule sorting.
3. **Transactional Registration & QR Tickets**: Atomic seat decrement, solo/team registration, and unique QR ticket generation.
4. **AI Recommendations, Event Compare & Ask AI Assistant**:
   - Personalized match scores (`GET /api/ai/recommendations`)
   - Side-by-side "Which Event Is Better?" decision engine with schedule conflict detection (`POST /api/ai/compare` & `/compare`)
   - Floating "Ask EventSphere AI" chat assistant (`POST /api/ai/chat`)
   - Supports Anthropic Claude API when `ANTHROPIC_API_KEY` is set, with automatic rule-based fallback.
5. **Interactive Venue Seat Allocation & QR Attendance Verification**:
   - Visual auditorium seat grid with wheelchair-accessible rows and Smart Auto-Allocate (`GET /api/seats/event/:eventId`, `POST /api/seats/allocate`)
   - Organizer QR Ticket Verification Scanner with duplicate scan protection (`POST /api/attendance/verify`)
6. **Organizer Command Center**:
   - Real-time KPIs, revenue, attendance rate, AI Demand Prediction, Feedback Sentiment Intelligence, new event creation, and bulk certificate issuance (`/organizer`).
7. **Community Hub & Verified Student Portfolio**:
   - Teammate finder posts, tags, and comment threads (`/community`)
   - Student Portfolio showcasing verified certificates, attendance metrics, and editable skills/interests (`/portfolio`).

---

## 🛠️ Quick Start

### 1. Backend (`server/`)

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run seed
npm test          # Runs end-to-end API integration test suite
npm run dev       # Starts API server on http://localhost:5000
```

### 2. Frontend (`client/`)

```bash
cd client
npm install
npm run dev       # Starts Vite frontend on http://localhost:5173 (proxies /api -> localhost:5000)
```

---

## 🔐 Demo Login Credentials

All demo users use password: **`password123`**

| Role | Email | Name |
|------|-------|------|
| **Admin** | `admin@eventsphere.edu` | Dr. Sarah Administrator |
| **Organizer** | `organizer.tech@eventsphere.edu` | Prof. Alan Turing Club |
| **Organizer** | `organizer.cultural@eventsphere.edu` | Cultural Council Head |
| **Organizer** | `organizer.sports@eventsphere.edu` | Sports Directorate |
| **Student** | `student1@eventsphere.edu` | Alex Chen |
| **Student** | `student2@eventsphere.edu` | Priya Sharma |
| **Student** | `student3@eventsphere.edu` | Marcus Johnson |
| **Student** | `student4@eventsphere.edu` | Emily Davis |
| **Student** | `student5@eventsphere.edu` | Liam Wilson |
| **Student** | `student6@eventsphere.edu` | Sophia Martinez |

---

## 🧪 Complete API Reference

| Module | Method & Endpoint | Description |
|--------|-------------------|-------------|
| **Auth** | `POST /api/auth/register` | Register a student or organizer |
| | `POST /api/auth/login` | Authenticate and receive JWT |
| | `GET /api/auth/me` | Get current user & student profile |
| **Events** | `GET /api/events` | Search, filter & sort published events |
| | `GET /api/events/categories` | List all 9 event categories |
| | `GET /api/events/slug/:slug` | Get event details by slug |
| | `GET /api/events/:id/similar` | Get similar events in same category |
| **Registrations** | `POST /api/registrations` | Register for an event & generate QR ticket |
| | `GET /api/registrations/my-registrations` | List user's tickets and allocated seats |
| **AI Service** | `GET /api/ai/recommendations` | Personalized event recommendations |
| | `POST /api/ai/compare` | Side-by-side event comparison & verdict |
| | `POST /api/ai/chat` | Ask AI campus assistant |
| **Seats & Check-in** | `GET /api/seats/event/:eventId` | Load venue layout & seat availability |
| | `POST /api/seats/allocate` | Manual or smart auto-allocation of seat |
| | `POST /api/attendance/verify` | Verify QR ticket & log attendance |
| **Organizer** | `GET /api/organizer/dashboard` | KPIs, demand prediction & feedback insights |
| | `POST /api/organizer/events` | Create & publish a new event |
| | `POST /api/organizer/events/:id/certificates` | Issue participant/winner certificates |
| **Community** | `GET /api/community/posts` | List community & teammate finder posts |
| | `POST /api/community/posts` | Create post or announcement |
| | `POST /api/community/posts/:postId/comments` | Reply to a community post |
| | `POST /api/community/feedback` | Submit 1–5 star rating & feedback |
| | `GET /api/community/portfolio` | Student portfolio, stats & certificates |
| | `PUT /api/community/profile` | Update student skills & interests |

---

## 📋 Phase Checklist

- [x] **Phase 1** – Project setup, DB schema, auth, seed data ✅
- [x] **Phase 2** – Event listing, search, categories, event details, registration and tickets ✅
- [x] **Phase 3** – AI recommendation, "which event is better" compare tool & Ask AI chat ✅
- [x] **Phase 4** – Seat allocation and QR attendance verification ✅
- [x] **Phase 5** – Organizer dashboard with demand prediction and feedback intelligence ✅
- [x] **Phase 6** – Community hub, student portfolio, tests, and documentation ✅
