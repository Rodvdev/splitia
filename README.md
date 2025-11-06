# Splitia - Expense Splitting Made Easy

<div align="center">

![Splitia Logo](https://via.placeholder.com/200x60/3b82f6/ffffff?text=Splitia)

**A comprehensive financial management platform for tracking, splitting, and analyzing expenses in both personal and group contexts.**

[Features](#-features) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Support](#-support)

</div>

---

## 📖 Overview

**Splitia** is a modern, intelligent expense splitting application designed to simplify shared financial responsibilities. Whether you're managing expenses with roommates, splitting bills on a group trip, or tracking personal finances, Splitia provides the tools you need to maintain transparency, fairness, and financial control.

### The Problem Splitia Solves

Managing shared expenses can be challenging and often leads to:
- **Relationship strain** from financial conflicts
- **Complex calculations** when dividing expenses fairly
- **Lack of transparency** in expense tracking
- **Lost financial control** without proper tools
- **Inefficient communication** across multiple channels
- **No motivation** to maintain consistent financial tracking

Splitia addresses these challenges by providing an intuitive, automated, and transparent platform for expense management.

---

## ✨ Features

### 🎯 Core Functionality

#### **Personal Expense Tracking**
- Track individual expenses with categories, dates, and attachments
- Unlimited expense history
- Custom categories for personalized organization
- Multi-currency support with automatic conversion
- Monthly budgeting with progress tracking
- Spending analytics and visualizations

#### **Group Expense Management**
- Create groups for shared expenses (trips, households, events)
- Automatic expense splitting with multiple options:
  - **Equal split**: Divide expenses equally among all members
  - **Percentage split**: Allocate expenses by percentage
  - **Fixed amount**: Assign specific amounts to each member
- Real-time balance calculations
- Settlement optimization to minimize transactions
- Group dashboard with financial overview
- Complete expense history with filtering

#### **Smart Division Options**
- Equal distribution
- Percentage-based allocation
- Fixed amount assignment
- Custom splitting rules

#### **Multi-Currency Support**
- Track expenses in different currencies
- Automatic currency conversion
- Perfect for international trips
- Support for 100+ currencies

#### **Monthly Budgeting**
- Set monthly spending limits by category
- Track budget progress in real-time
- Visual budget reports
- Budget alerts and notifications

#### **Settlement System**
- Optimized payment suggestions
- Minimize number of transactions
- Track payment history
- Generate settlement reports

#### **Statistics & Visualization**
- Interactive charts and graphs
- Spending pattern analysis
- Trend identification
- Category-wise breakdowns
- Exportable reports

### 💬 Communication Features

#### **Integrated Chat**
- Real-time messaging within groups
- Direct communication with group members
- Message history and search
- File attachments support

#### **AI Assistant** (Premium Feature)
- Personalized financial insights
- Natural language expense creation
- Automated expense categorization
- Spending pattern analysis
- Budget recommendations
- Smart settlement suggestions

### 👥 Group Management

- **Role-Based Permissions**: ADMIN, MEMBER, GUEST, ASSISTANT roles
- **Invitation System**: Shareable links to add members
- **Group Dashboard**: Overview of finances and activity
- **Expense History**: Complete history with advanced filtering
- **Member Management**: Add, remove, and manage group members

### 🌍 Internationalization

- **Multi-language Support**: English, Spanish, Portuguese
- **Currency Preferences**: Set default currency per user
- **Localized Experience**: Region-specific formatting

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm**, **yarn**, **pnpm**, or **bun**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/splitia.git
   cd splitia
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/splitia?schema=public"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3002"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # Stripe (for subscriptions)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PREMIUM_PRICE_ID="price_..."
   STRIPE_ENTERPRISE_PRICE_ID="price_..."
   
   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3002"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Start the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3002](http://localhost:3002)

### Initial Setup Steps

1. **Create an account**: Sign up with your email and password
2. **Set your preferences**: Choose your default currency and language
3. **Create your first group** (optional): Start by creating a group for shared expenses
4. **Add expenses**: Begin tracking your expenses individually or within groups
5. **Invite members**: Share group links to invite friends, family, or roommates

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.2.4** - React framework with App Router
- **React 18.2.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **next-intl** - Internationalization
- **next-themes** - Theme management
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless API
- **GraphQL Yoga** - GraphQL server
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **NextAuth.js** - Authentication
- **bcrypt** - Password hashing

### Services & Integrations
- **Stripe** - Payment processing for subscriptions
- **GraphQL** - API query language
- **Zod** - Schema validation

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Prisma Studio** - Database management

---

## 💳 Subscription Plans

### 🆓 Free Plan
**Perfect for personal use and small groups**

- ✅ Unlimited personal expenses
- ✅ Up to 3 groups
- ✅ Up to 5 members per group
- ✅ Basic expense splitting
- ✅ Basic analytics
- ✅ Multi-currency support
- ✅ Email support
- ❌ AI Assistant
- ❌ Advanced analytics
- ❌ Priority support

### 👑 Premium Plan - $9.99/month
**Best for active users and larger groups**

- ✅ Everything in Free plan
- ✅ Unlimited groups
- ✅ Unlimited group members
- ✅ **AI Assistant** with natural language processing
- ✅ Advanced analytics and predictions
- ✅ Custom categories (unlimited)
- ✅ Data export
- ✅ Priority customer support
- ✅ 14-day free trial

### 🏢 Enterprise Plan - $29.99/month
**For businesses and organizations**

- ✅ Everything in Premium plan
- ✅ Administrative dashboard
- ✅ Enterprise user management
- ✅ Custom integrations
- ✅ 24/7 support
- ✅ Enterprise reporting
- ✅ Custom API access
- ✅ Dedicated account manager

---

## 🎁 Benefits

### 👤 Individual Benefits

#### **Financial Control**
- **Complete Visibility**: See exactly where your money goes
- **Budget Management**: Set and track monthly budgets
- **Spending Insights**: Understand your spending patterns
- **Goal Setting**: Set financial goals and track progress

#### **Convenience**
- **Quick Expense Entry**: Add expenses in seconds
- **Automatic Calculations**: No manual math required
- **Multi-Device Access**: Access from any device
- **Offline Support**: Work offline and sync when online

#### **Organization**
- **Categorization**: Organize expenses by category
- **Search & Filter**: Find expenses quickly
- **Export Data**: Export reports for accounting
- **Receipt Storage**: Attach receipts to expenses

### 👥 Group Benefits

#### **Transparency**
- **Real-Time Balances**: Always know who owes what
- **Complete History**: Full audit trail of all expenses
- **Fair Distribution**: Multiple splitting options ensure fairness
- **Settlement Tracking**: Track all payments and settlements

#### **Efficiency**
- **Automated Calculations**: Automatic balance updates
- **Optimized Settlements**: Minimize number of transactions
- **Group Communication**: Built-in chat for coordination
- **Bulk Operations**: Manage multiple expenses at once

#### **Relationship Management**
- **Conflict Prevention**: Clear records prevent disputes
- **Shared Responsibility**: Everyone can see and contribute
- **Flexible Roles**: Different permission levels
- **Easy Invitations**: Simple process to add members

#### **Use Cases**
- **Roommates**: Split rent, utilities, groceries
- **Group Trips**: Manage travel expenses, hotels, meals
- **Events**: Organize parties, dinners, activities
- **Projects**: Track shared project costs
- **Families**: Manage household expenses

---

## 📚 Documentation

### API Documentation

- **GraphQL API**: Available at `/api/graphql`
- **REST Endpoints**: See API routes in `/src/app/api`

### Database Schema

- **Prisma Schema**: See `prisma/schema.prisma`
- **Database Models**: User, Group, Expense, ExpenseShare, Settlement, Subscription, SupportTicket

### Key Concepts

#### **Expense Splitting**
- **Equal Split**: Divide total amount equally among all members
- **Percentage Split**: Allocate based on percentages (must sum to 100%)
- **Fixed Amount**: Assign specific amounts to each member

#### **Settlements**
- **Optimized Payments**: System suggests minimum transactions needed
- **Settlement History**: Track all completed settlements
- **Pending Settlements**: View and manage pending payments

#### **Groups**
- **Roles**: ADMIN (full control), MEMBER (can add expenses), GUEST (view only), ASSISTANT (AI helper)
- **Invitations**: Shareable links or email invitations
- **Privacy**: Groups are private to members only

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server on port 3002

# Production
npm run build        # Build for production
npm start            # Start production server on port 3002

# Database
npx prisma generate  # Generate Prisma Client
npx prisma migrate   # Run database migrations
npx prisma studio    # Open Prisma Studio

# Code Quality
npm run lint         # Run ESLint
```

### Project Structure

```
splitia/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── [locale]/        # Localized routes
│   │   ├── api/             # API routes
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   └── ...              # Feature components
│   ├── lib/                 # Utility functions
│   ├── i18n/                # Internationalization
│   └── hooks/               # Custom React hooks
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── public/                  # Static assets
└── package.json
```

### Environment Variables

See the [Installation](#installation) section for required environment variables.

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

Splitia can be deployed on any platform that supports Next.js:
- **Netlify**
- **Railway**
- **AWS Amplify**
- **DigitalOcean App Platform**
- **Self-hosted** with Docker

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more information.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

### Get Help

- **Documentation**: Check our documentation for detailed guides
- **Support Tickets**: Create a ticket in the app dashboard
- **Email**: support@splitia.com
- **GitHub Issues**: Report bugs and request features

### Feature Requests

Have an idea for a new feature? We'd love to hear it!
- Create an issue on GitHub
- Submit a support ticket
- Contact us directly

---

## 🎯 Roadmap

### Upcoming Features

- [ ] Mobile apps (iOS & Android)
- [ ] Recurring expenses
- [ ] Expense templates
- [ ] Bill reminders
- [ ] Integration with banking APIs
- [ ] Expense approval workflows
- [ ] Advanced reporting
- [ ] Team workspaces

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Charts from [Recharts](https://recharts.org)

---

<div align="center">

**Made with ❤️ by the Splitia Team**

[Website](https://splitia.com) • [Documentation](https://docs.splitia.com) • [Twitter](https://twitter.com/splitia) • [GitHub](https://github.com/splitia)

</div>
