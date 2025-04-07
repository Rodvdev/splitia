# Product Requirements Document (PRD)

## Product Name
**Splitia**

## Overview
Splitia is a web platform that enables users to register, visualize, and manage personal and group expenses with intelligent automation and a built-in chat system. The app also includes an AI assistant (available in the premium plan) that allows users to manage their expenses using natural language and receive personalized financial suggestions.

## Goals
- Simplify expense tracking for individuals and groups
- Automate expense splitting and debt calculation
- Provide insights and optimizations through statistics and AI
- Enable real-time communication between users
- Enhance productivity through AI-powered interactions
- Support global users with multi-currency and language support

## Key Features

### Core
- Personal and group expense tracking
- Smart division of expenses (equal, percentage, fixed amount)
- User-created groups with role-based permissions
- Monthly personal budgeting
- Expense filtering and history
- Graphs and statistics (by category, user, date, group)
- Multi-currency support with exchange rate conversion
- Group invitation links for easy member addition

### Communication
- Group chat per group
- One-on-one chat between users
- Read receipts for messages

### AI Assistant (Premium Feature)
- Chat interface with AI
- CRUD operations on expenses via natural language
- Personalized financial suggestions
- Auditing of AI-generated actions (create, update, delete, suggest)

### User Experience
- Multilingual support (internationalization)
- Currency preferences and formatting
- Shareable group invitation links

## User Roles

| Role          | Permissions                                             |
|---------------|---------------------------------------------------------|
| User          | Manage own expenses, view groups and dashboards        |
| Group Admin   | Edit any expense in group (deletion tracked)           |
| Guest         | Limited access without an account                      |
| AI (virtual)  | Executes actions on behalf of the user via prompts     |

## Technical Constraints
- Web-only application for initial version
- PostgreSQL database via Prisma ORM
- Next.js for frontend and backend
- Vercel for deployment
- OpenAI (or compatible) for AI interactions (premium only)
- i18n support for multilingual interface

## Success Metrics
- Number of registered users
- Daily active users (DAU)
- Number of expenses registered
- AI assistant usage and success rate
- Chat engagement per group
- Conversion rate of invitation links

## Assumptions
- Users are familiar with modern web apps
- Most groups consist of 2–10 members
- Privacy and data control are critical for user trust
- Users may need to track expenses in different currencies

## Out of Scope (for MVP)
- Native mobile apps (planned for later)
- Bank account integration
- Offline mode