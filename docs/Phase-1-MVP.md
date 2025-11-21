# Phase 1 - MVP (Minimum Viable Product)

## Overview

Phase 1 focuses on delivering core functionality that allows users to track shared expenses, split bills, and manage settlements. The goal is to launch a functional product that solves the fundamental problem of expense sharing with a clean, intuitive user experience.

**Timeline**: 3-4 months
**Target Launch**: Beta release for early adopters

## Core Features

### 1. User Authentication & Profile Management

#### Features
- **Email/Password Registration**
  - Email verification required
  - Strong password requirements (min 8 chars, mix of upper/lower/numbers)
  - Password strength indicator

- **Social Login**
  - Google Sign-In
  - Apple Sign-In (required for iOS)

- **Profile Management**
  - Profile photo upload
  - Display name
  - Email address (verified)
  - Phone number (optional)
  - Default currency selection
  - Timezone setting

- **Session Management**
  - JWT-based authentication
  - Refresh token mechanism
  - Multi-device support
  - Logout from all devices option

#### Technical Requirements
- Secure password hashing (bcrypt)
- JWT tokens with 15-minute expiry
- Refresh tokens with 30-day expiry
- OAuth 2.0 for social logins
- Email verification within 24 hours

#### User Stories
- As a new user, I want to sign up with my email so I can start tracking expenses
- As a user, I want to sign in with Google so I can avoid creating another password
- As a user, I want to update my profile picture so my friends can recognize me
- As a user, I want to set my default currency so expenses show in my preferred format

---

### 2. Expense Creation & Management

#### Features
- **Create Expense**
  - Amount (required, decimal support)
  - Description (required, max 200 chars)
  - Date (default: today, can be backdated up to 1 year)
  - Category selection (from predefined list)
  - Payer selection (who paid)
  - Participants (who owes)
  - Currency selection (default to user's currency)
  - Optional notes field

- **Predefined Categories**
  - Food & Dining
  - Groceries
  - Transportation
  - Entertainment
  - Utilities
  - Rent & Mortgage
  - Shopping
  - Healthcare
  - Travel
  - Other

- **View Expense Details**
  - All expense information
  - Split breakdown per person
  - Creation timestamp
  - Last modified timestamp
  - Creator information

- **Edit Expense**
  - All fields editable
  - Change notification sent to affected users
  - Version history (who changed what when)

- **Delete Expense**
  - Soft delete (mark as deleted, keep in database)
  - Confirmation dialog
  - Notification sent to affected users
  - Cannot delete if partially settled

#### Split Methods (MVP)
- **Equal Split**
  - Divide amount equally among all participants
  - Automatic calculation
  - Round to 2 decimal places

- **Unequal Split**
  - Manually specify exact amount per person
  - Real-time validation (must sum to total)
  - Visual indicator of remaining amount

- **Percentages**
  - Specify percentage for each person
  - Auto-calculate amounts
  - Validation (must sum to 100%)

#### Technical Requirements
- ACID transactions for expense operations
- Real-time balance updates
- Optimistic UI updates with rollback on failure
- Expense validation (amount > 0, valid currency, valid participants)
- Support for amounts up to 999,999.99

#### User Stories
- As a user, I want to create an expense after splitting dinner so everyone knows what they owe
- As a user, I want to edit an expense if I entered the wrong amount
- As a user, I want to see who paid and who owes for each expense
- As a user, I want to split an expense unequally because we ordered different amounts
- As a user, I want to delete an expense I created by mistake

---

### 3. Group Management

#### Features
- **Create Group**
  - Group name (required, max 50 chars)
  - Group type (Friends, Trip, Home, Couple, Other)
  - Group image/icon (optional)
  - Default currency for group
  - Creator automatically becomes admin

- **Invite Members**
  - Search by email or phone
  - Generate invite link (expires in 7 days)
  - Copy link to clipboard
  - Invitation tracking (pending, accepted, declined)
  - Resend invitation

- **Group Members**
  - View all members
  - Member roles: Admin, Member
  - Admin can remove members
  - Members can leave group
  - Minimum 2 members required

- **Group Activity Feed**
  - Chronological list of all expenses
  - Filter by date range
  - Filter by member
  - Filter by category
  - Search by description
  - Pagination (20 items per page)

- **Group Settings**
  - Edit group name and image
  - Change default currency
  - Simplify debts setting (on/off)
  - Delete group (admin only, must settle all debts first)

#### Group Types & Behavior
- **Friends**: General expenses, equal splits default
- **Trip**: Date range tracking, travel categories prioritized
- **Home**: Recurring expenses support, utilities categories prioritized
- **Couple**: Simplified 2-person view, privacy focused
- **Other**: Generic group type

#### Technical Requirements
- Invite links: UUID-based, expire after 7 days or first use
- Group must have at least one admin at all times
- If admin leaves, another member promoted automatically
- Soft delete for groups (retain for audit purposes)
- Maximum 50 members per group (MVP limit)

#### User Stories
- As a user, I want to create a group for my roommates so we can track household expenses
- As a user, I want to invite friends to a group via email
- As a user, I want to see all expenses in a group in chronological order
- As a user, I want to leave a group I'm no longer part of
- As a group admin, I want to remove inactive members

---

### 4. Balance Calculation & Debt Management

#### Features
- **Balance Overview**
  - Total you owe (aggregate across all groups)
  - Total you're owed (aggregate across all groups)
  - Net balance (positive or negative)
  - Per-person breakdown
  - Per-group breakdown

- **Balance Details**
  - Individual balance with each person
  - Expenses contributing to balance
  - Settlement history
  - Timeline view of balance changes

- **Debt Simplification**
  - Minimize number of payments needed
  - Algorithm: Reduce transactions to minimum
  - Visual representation of simplified debts
  - Toggle on/off per group
  - Recalculate on demand

#### Calculation Rules
- Payer gets credit for full expense amount
- Each participant's share is deducted
- Net effect updates balances
- Multi-currency expenses converted to group currency
- Settlements reduce balances
- All calculations to 2 decimal places

#### Technical Requirements
- Real-time balance updates on any expense change
- Transactional consistency (ACID)
- Efficient debt simplification algorithm (O(n²) acceptable for MVP)
- Balance caching with invalidation strategy
- Historical balance tracking for auditing

#### User Stories
- As a user, I want to see how much I owe in total
- As a user, I want to see who owes me money
- As a user, I want to simplify debts so I make fewer payments
- As a user, I want to see why my balance changed
- As a user, I want to view my balance history over time

---

### 5. Settlement Tracking

#### Features
- **Record Payment**
  - Payer and payee selection
  - Amount paid
  - Payment date (default: today)
  - Payment method (Cash, Bank Transfer, Venmo, PayPal, Other)
  - Reference number (optional)
  - Notes (optional)

- **Payment Confirmation**
  - Notification sent to payee
  - Payee can confirm or dispute
  - Unconfirmed payments marked with indicator
  - Auto-confirm after 7 days (optional setting)

- **Settlement Suggestions**
  - "Settle Up" feature shows optimal payments
  - Calculate who should pay whom
  - Suggest exact amounts to clear all debts
  - Quick action to record suggested payment

- **Payment History**
  - List of all settlements
  - Filter by date, person, group
  - Search functionality
  - Export to CSV

#### Technical Requirements
- Atomic settlement operations
- Balance updates must be transactional
- Settlement notifications within 30 seconds
- Support partial payments
- Prevent negative balances unless intentional

#### User Stories
- As a user, I want to record a cash payment I made
- As a user, I want to be notified when someone pays me
- As a user, I want to see suggested payments to settle all my debts
- As a user, I want to confirm I received a payment
- As a user, I want to view my payment history

---

### 6. Notifications

#### Features (MVP - Basic Only)
- **Push Notifications (iOS)**
  - New expense added
  - Added to expense
  - Payment received
  - Payment reminder (manual trigger)
  - Group invitation

- **Email Notifications**
  - Welcome email
  - Email verification
  - Weekly expense summary (optional)
  - Payment reminders
  - Group invitations

- **In-App Notifications**
  - Notification center/inbox
  - Unread count badge
  - Mark as read
  - Clear all option
  - Last 30 days of notifications

#### Notification Preferences
- Enable/disable push notifications
- Enable/disable email notifications
- Quiet hours (no push during specified times)
- Per-notification type settings

#### Technical Requirements
- APNs integration for iOS
- SendGrid or similar for email
- Notification queue (BullMQ)
- Delivery retry logic (3 attempts)
- Unsubscribe option in all emails

#### User Stories
- As a user, I want to be notified when an expense is added
- As a user, I want to receive payment reminders
- As a user, I want to control notification preferences
- As a user, I want to see my notification history

---

### 7. iOS App Features

#### Core Screens
1. **Authentication**
   - Login screen
   - Sign up screen
   - Password reset

2. **Dashboard**
   - Total balances card
   - You owe / You're owed summary
   - Recent activity feed
   - Quick add expense button (floating)

3. **Groups List**
   - All groups grid/list view
   - Group preview (name, image, balance)
   - Create group button
   - Search groups

4. **Group Detail**
   - Group header (image, name, members)
   - Balance summary for group
   - Expense list
   - Add expense button
   - Group settings button

5. **Add/Edit Expense**
   - Form with all expense fields
   - Participant picker (multi-select)
   - Split method selector
   - Split calculator (live preview)
   - Save button

6. **Expense Detail**
   - All expense information
   - Split breakdown
   - Edit/delete actions
   - Comments (future)

7. **Friends/People List**
   - All contacts
   - Individual balances
   - Recent activity
   - Add friend

8. **Activity Feed**
   - All expenses across groups
   - Filter and search
   - Pull to refresh

9. **Settle Up**
   - Who owes whom
   - Suggested payments
   - Record payment form
   - Payment history

10. **Profile & Settings**
    - Profile information
    - Notification preferences
    - Currency and locale
    - About/Help
    - Logout

#### iOS-Specific Features
- SwiftUI implementation
- Dark mode support
- Dynamic Type (accessibility)
- Haptic feedback
- Pull-to-refresh
- Swipe actions (delete, settle)
- Face ID / Touch ID for login
- Share extension (add expense from Safari)
- Widget showing current balance (home screen)

#### Technical Requirements
- iOS 15+ minimum
- Swift 5.5+
- SwiftUI for UI
- Combine for reactive programming
- Core Data for local persistence
- URLSession for networking
- Keychain for secure storage

---

### 8. Web App Features

#### Core Pages
1. **Authentication**
   - Login page
   - Sign up page
   - Password reset flow

2. **Dashboard**
   - Overview of balances
   - Recent activity
   - Quick actions
   - Summary cards

3. **Groups**
   - Groups list (grid view)
   - Group detail page
   - Create/edit group modal
   - Invite members modal

4. **Expenses**
   - All expenses page
   - Add expense modal
   - Edit expense modal
   - Expense detail view

5. **Friends**
   - Friends list
   - Individual friend view
   - Balance details
   - Add friend

6. **Activity**
   - Activity feed
   - Filters and search
   - Export options

7. **Settle Up**
   - Settlement dashboard
   - Suggested payments
   - Record payment
   - Payment history

8. **Account Settings**
   - Profile settings
   - Notification preferences
   - Security settings
   - Privacy settings

#### Web-Specific Features
- Responsive design (mobile, tablet, desktop)
- Progressive Web App (PWA)
- Offline support (view only)
- Browser notifications
- Keyboard shortcuts
- Multi-tab sync
- Print-friendly views
- Drag-and-drop file upload

#### Technical Requirements
- React 18+
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Query for data fetching
- Zustand or Redux for state
- PWA manifest and service worker

---

## Multi-Currency Support (MVP)

### Features
- **Currency Selection**
  - 20 most common currencies supported
  - Exchange rate API integration
  - Real-time rate fetching
  - Fallback to last known rates

- **Currency Display**
  - Show original currency and converted amount
  - Group default currency for summaries
  - User default currency for personal views
  - Exchange rate used and timestamp

- **Supported Currencies (MVP)**
  - USD, EUR, GBP, CAD, AUD
  - JPY, CNY, INR, BRL, MXN
  - CHF, SEK, NZD, SGD, HKD
  - NOK, DKK, PLN, ZAR, THB

### Technical Requirements
- Exchange rate API: exchangerate-api.com (free tier)
- Cache rates for 1 hour
- Fallback rates in database
- All amounts stored in original currency
- Conversion on display only

---

## Technical Architecture (MVP Scope)

### Backend Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js or NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Queue**: BullMQ with Redis
- **File Storage**: AWS S3 or Cloudflare R2
- **Real-time**: Socket.io

### API Design
- RESTful endpoints
- JWT authentication
- Request validation (Zod)
- Error handling middleware
- Rate limiting (express-rate-limit)
- API versioning (/api/v1)

### Database Schema (Core Tables)
- users
- groups
- group_members
- expenses
- expense_participants
- settlements
- notifications
- sessions
- currencies

### Infrastructure
- Hosting: Railway or Render (MVP)
- Database: Managed PostgreSQL
- Redis: Managed Redis
- File Storage: Cloudflare R2 (free tier)
- Email: Resend or SendGrid
- Monitoring: Sentry (errors)

---

## Non-Functional Requirements

### Performance
- API response time < 200ms (95th percentile)
- Page load time < 2 seconds
- Real-time updates < 1 second latency
- Support 1000 concurrent users

### Reliability
- 99.5% uptime SLA
- Automated backups (daily)
- Point-in-time recovery (7 days)
- Graceful degradation

### Security
- HTTPS only
- JWT token rotation
- Rate limiting (100 req/min per user)
- SQL injection prevention
- XSS prevention
- CSRF protection
- Password hashing (bcrypt, cost 12)

### Scalability
- Horizontal scaling support
- Database connection pooling
- Caching strategy
- CDN for static assets

---

## User Flows

### 1. New User Onboarding
1. User signs up with email
2. Verify email
3. Complete profile (name, photo, currency)
4. View tutorial/walkthrough (optional)
5. Create first group or add expense

### 2. Creating an Expense
1. Navigate to group or dashboard
2. Click "Add Expense"
3. Enter amount and description
4. Select payer
5. Select participants
6. Choose split method
7. Review split breakdown
8. Save expense
9. Notification sent to participants

### 3. Settling a Debt
1. View balance overview
2. Click "Settle Up"
3. See suggested payments
4. Click suggested payment
5. Select payment method
6. Add optional note
7. Record payment
8. Notification sent to payee
9. Balances updated

### 4. Inviting to Group
1. Open group
2. Click "Invite Members"
3. Enter email or generate link
4. Send invitation
5. Invitee receives email
6. Invitee clicks link
7. Invitee signs up/logs in
8. Invitee joins group
9. Group members notified

---

## Testing Requirements

### Unit Testing
- All business logic functions
- API endpoints
- Database queries
- Utility functions
- 80%+ code coverage target

### Integration Testing
- API endpoint flows
- Database transactions
- External service integrations
- Authentication flows

### End-to-End Testing
- Critical user flows
- iOS app (XCTest)
- Web app (Playwright or Cypress)
- Cross-platform scenarios

### Manual Testing
- iOS devices (various models)
- Web browsers (Chrome, Safari, Firefox)
- Different screen sizes
- Accessibility testing
- Localization testing

---

## Launch Criteria

### Must Have (Blocking)
- All core features implemented and tested
- Security audit passed
- Performance benchmarks met
- iOS app approved by Apple
- Web app deployed to production
- Email delivery working
- Push notifications working
- Documentation complete

### Should Have (Non-blocking)
- Tutorial/onboarding flow
- Help documentation
- Terms of Service and Privacy Policy
- Support email setup
- Analytics integration
- Error monitoring setup

### Nice to Have
- App preview video
- Marketing website
- Social media presence
- Press kit

---

## Success Metrics

### Week 1
- 100 sign-ups
- 500 expenses created
- 50 active groups

### Month 1
- 500 users
- 5000 expenses
- 70% 7-day retention
- < 5% error rate
- 4.0+ app store rating

### Month 3
- 2000 users
- 20,000 expenses
- 60% 30-day retention
- 50% month-over-month growth

---

## Known Limitations (MVP)

### Features Not Included
- Receipt scanning/OCR
- Advanced split methods (by-item, weighted)
- Payment integrations (Venmo, PayPal)
- Recurring expenses
- Itemized expenses
- Multiple attachments
- Comments on expenses
- Expense categories customization
- Reporting and analytics
- Export functionality
- Offline mode
- Android app

### Technical Debt
- Basic debt simplification (not optimal)
- Limited currency support
- No caching layer for balance calculations
- Simple search (no full-text search)
- Basic notification system

### Scalability Limits
- 50 members per group
- 1000 expenses per group
- 20 groups per user
- 100 API requests per minute

---

## Post-MVP Priorities

### Immediate (Within 1 month)
1. Bug fixes based on user feedback
2. Performance optimizations
3. Analytics implementation
4. A/B testing framework

### Short-term (Months 2-3)
1. Receipt scanning (Phase 2)
2. Payment integrations (Phase 2)
3. Enhanced splitting methods (Phase 2)
4. Export functionality

### Medium-term (Months 4-6)
1. Reporting and analytics
2. Recurring expenses
3. Mobile web improvements
4. Android app (Phase 3)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Draft
**Dependencies**: PRD-Overview.md, Technical-Architecture.md
