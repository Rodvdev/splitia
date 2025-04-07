# Software Specifications Document (SSD)

## Product Name
**Splitia**

## 1. System Overview
Splitia is a full-stack web application for managing personal and group expenses. The system supports expense tracking, smart division, real-time communication via chat, and an optional AI-powered assistant for intelligent expense automation. The platform is optimized for modern web usage and is intended to be scalable, secure, and user-friendly.

---

## 2. Functional Requirements

### 2.1 User Authentication
- Sign up/login with email and password
- OAuth support (Google, GitHub, etc.)
- Session handling with JWT or NextAuth.js

### 2.2 Expense Management
- Create/edit/delete expenses
- Select who paid and how it's divided (equal, % or fixed)
- Support for personal and group expenses
- Categorize expenses (custom or predefined)
- Attach notes and location data
- Multi-currency support with automatic currency conversion

### 2.3 Groups
- Create/edit/delete groups
- Add/remove members with roles: Admin, Member, Guest
- View group-specific expense history
- Generate and manage shareable invitation links
- QR codes for quick group joining

### 2.4 Budgeting
- Set monthly personal budgets
- Track progress vs. actual spending
- Support for multiple currencies in budget planning

### 2.5 Chat System
- Group chat per group
- Direct chat between users
- Optional AI chat assistant (Premium)
- Message read receipts (seen status)

### 2.6 AI Assistant (Premium)
- Understand natural language commands
- Perform CRUD operations on expenses
- Suggest financial optimizations
- Log and audit every AI action

### 2.7 Internationalization
- Support for multiple languages (English, Spanish, Portuguese initially)
- Currency formatting based on locale
- Date/time formatting based on user preference
- RTL support for applicable languages

---

## 3. Non-Functional Requirements

### 3.1 Performance
- Sub-500ms response time for main user actions
- Realtime sync for chat and expense updates

### 3.2 Scalability
- Horizontal scalability with serverless architecture (Vercel)

### 3.3 Security
- HTTPS for all traffic
- Secure password storage (bcrypt)
- Role-based access control (RBAC)
- Expirable invitation links with usage limits

### 3.4 Maintainability
- Modular architecture with reusable components
- Prisma for typed DB access

### 3.5 Accessibility
- Keyboard navigable UI
- Basic ARIA roles and attributes
- Support for screen readers
- Color contrast compliance

---

## 4. Technology Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- **State Management:** Zustand
- **Forms & Validation:** React Hook Form, Zod
- **Database:** PostgreSQL via Prisma ORM
- **Backend API:** GraphQL
- **Authentication:** Clerk
- **Realtime:** graphql-ws
- **AI:** OpenAI API (GPT-4+)
- **Deployment:** Vercel
- **i18n:** next-intl
- **Currency:** Currency.js with exchange rate API

---

## 5. Database Models
See complete Prisma schema for all models:
- User, Group, GroupUser
- Expense, ExpenseShare
- Budget, CustomCategory
- Conversation, ConversationParticipant
- Message, MessageSeen
- AIAction
- UserPreference (language, currency, etc.)
- GroupInvitation

---

## 6. Future Enhancements
- Native mobile apps (React Native)
- Bank integration
- Offline mode
- Expense image receipts
- Recurring expenses