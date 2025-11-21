# Phase 2 - Enhanced Features

## Overview

Phase 2 builds upon the MVP foundation by adding advanced features that significantly enhance user experience and differentiate SplitTab from competitors. This phase focuses on automation, convenience, and deeper integrations.

**Timeline**: 2-3 months
**Prerequisites**: Phase 1 MVP successfully launched and stable

## Goals

1. **Reduce Manual Entry**: Receipt scanning and OCR to minimize typing
2. **Advanced Splitting**: Support complex real-world expense scenarios
3. **Payment Integration**: Enable in-app and linked payment settlements
4. **Rich Notifications**: Contextual and actionable notifications
5. **Insights & Analytics**: Help users understand spending patterns

---

## Feature Categories

### 1. Receipt Scanning & OCR

#### Overview
Automatically extract expense details from receipt photos using OCR technology, reducing manual data entry and improving accuracy.

#### Features

##### Receipt Capture
- **Camera Integration**
  - Native camera access
  - Real-time edge detection
  - Auto-capture when receipt detected
  - Flash control
  - Focus and exposure adjustment
  - Multiple photo mode (front/back of receipt)

- **Gallery Upload**
  - Select from photo library
  - Select multiple receipts (batch processing)
  - Support for screenshots
  - PDF receipt support

- **Image Enhancement**
  - Auto-rotate based on text orientation
  - Brightness and contrast adjustment
  - Perspective correction
  - Crop and resize
  - Grayscale conversion for better OCR

##### OCR Processing
- **Data Extraction**
  - Total amount
  - Subtotal (pre-tax)
  - Tax amount
  - Tip amount (if present)
  - Date and time
  - Merchant name
  - Merchant address
  - Line items with prices
  - Payment method (if visible)

- **OCR Providers**
  - Primary: Google Cloud Vision API
  - Fallback: AWS Textract
  - Offline: Tesseract (basic, limited)

- **Processing Flow**
  1. Upload image to cloud storage
  2. Submit to OCR service
  3. Parse OCR response
  4. Extract structured data
  5. Apply business rules and validation
  6. Present to user for confirmation
  7. Save expense

##### Manual Correction Interface
- **Field-by-Field Review**
  - Side-by-side view (receipt image + extracted data)
  - Edit any field
  - Mark fields as correct/incorrect
  - Confidence score indicators
  - Highlight uncertain extractions

- **Line Item Assignment**
  - List of extracted items
  - Assign each item to participants
  - Split individual items
  - Add/remove items
  - Edit item prices

- **Learning System**
  - Track correction patterns
  - Improve future extractions
  - Merchant-specific templates
  - User feedback loop

##### Receipt Management
- **Storage**
  - Original image stored in cloud
  - Thumbnail generation
  - Multiple receipts per expense
  - Receipt gallery view
  - Download original

- **Search**
  - Search by merchant
  - Search by amount
  - Search by date range
  - Filter by OCR confidence

- **Batch Processing**
  - Queue multiple receipts
  - Background processing
  - Progress indicator
  - Notification on completion

#### Technical Requirements

##### OCR Service Integration
- **Google Cloud Vision**
  - Document text detection API
  - Receipt-specific training
  - Multi-language support
  - Confidence scores

- **AWS Textract**
  - Expense analysis API
  - Automatic table detection
  - Key-value pair extraction

- **Rate Limiting**
  - Max 100 receipts per user per day (free tier)
  - Premium: unlimited
  - Queue management for batch processing

##### Image Processing
- **Client-Side**
  - Resize before upload (max 2048px)
  - JPEG compression (85% quality)
  - EXIF data stripping (privacy)

- **Server-Side**
  - Additional compression
  - Format conversion
  - Thumbnail generation (200px)
  - Virus scanning

##### Storage
- **Cloud Storage**
  - S3 or Cloudflare R2
  - Organized by user ID / expense ID
  - Lifecycle policy (delete after 1 year)
  - CDN for fast retrieval

- **Database**
  - Receipt metadata
  - OCR results (cached)
  - Processing status
  - User corrections

##### Performance
- OCR processing < 10 seconds for single receipt
- Batch processing: 5 receipts in < 30 seconds
- Image upload < 3 seconds
- Thumbnail generation < 1 second

#### User Stories
- As a user, I want to scan a receipt to avoid typing expense details
- As a user, I want to correct OCR mistakes before saving
- As a user, I want to assign individual items from a receipt to different people
- As a user, I want to process multiple receipts at once
- As a user, I want to view receipt images attached to expenses

---

### 2. Advanced Splitting Methods

#### Overview
Support complex real-world scenarios where simple equal splits don't work.

#### Features

##### Itemized Splitting
- **Item-Level Assignment**
  - List items with prices
  - Assign each item to one or more people
  - Shared items (split equally among selected)
  - Quantities (person ordered 2 of item X)
  - Item-level notes

- **Tax & Tip Distribution**
  - Split tax equally
  - Split tax proportionally by item total
  - Split tip equally
  - Split tip proportionally
  - Exclude certain people from tip/tax

- **Visual Builder**
  - Drag-and-drop interface
  - Item cards with person avatars
  - Running total per person
  - Visual validation (all items assigned)

##### Weighted Splits
- **Use Cases**
  - Adults vs. children
  - Different consumption levels
  - Income-based splitting
  - Custom fairness factors

- **Implementation**
  - Assign weight to each participant (default: 1.0)
  - Calculate proportional shares
  - Support decimal weights
  - Preset weight templates (adult=1, child=0.5)

##### Multiple Payers
- **Scenarios**
  - Two people paid different portions
  - One person paid cash, another card
  - Splitting payment across credit cards

- **Features**
  - Assign multiple payers with amounts
  - Validation: sum of payments = total
  - Complex settlement calculation
  - Each payer gets proportional credit

##### Split by Shares/Ratios
- **Ratio Entry**
  - Simple ratio notation (2:1:1)
  - Named shares (Alice: 2, Bob: 1, Carol: 1)
  - Auto-calculate percentages and amounts

- **Common Ratios**
  - 1:1 (equal)
  - 2:1 (one person pays double)
  - 3:2:1 (graduated split)

##### Split Adjustments
- **Scenarios**
  - One person should pay $X more/less
  - Remainder split equally
  - Fixed amount + percentage

- **Implementation**
  - Set base amounts for some participants
  - Auto-distribute remainder
  - Minimum/maximum constraints

##### Split Templates
- **Personal Templates**
  - Save common split patterns
  - Name templates ("Dinner with kids", "Roommate utilities")
  - Quick apply to new expenses
  - Edit and delete templates

- **Group Templates**
  - Default split for group
  - Applied automatically to new expenses
  - Override per expense
  - Admin-managed

#### Technical Requirements
- Real-time calculation engine
- Validation: amounts must sum to total
- Rounding strategy: banker's rounding
- Support for complex split rules
- Undo/redo functionality
- Split calculation history

#### User Stories
- As a user, I want to assign specific items to people so everyone pays for what they ordered
- As a user, I want to split an expense where children pay half of adult share
- As a user, I want two people to split payment and others to owe
- As a user, I want to save a split template for recurring scenarios
- As a user, I want to adjust one person's share and split the rest equally

---

### 3. Payment Integrations

#### Overview
Enable users to settle debts directly through integrated payment services.

#### Supported Payment Methods

##### Venmo Integration
- **Features**
  - Deep link to Venmo app
  - Pre-filled amount and note
  - Payment completion detection
  - Transaction ID capture

- **Implementation**
  - Venmo URL scheme
  - OAuth for Venmo account linking (future)
  - Webhook for payment confirmation (future)

##### PayPal Integration
- **Features**
  - PayPal.me link generation
  - Pre-filled payment details
  - Transaction tracking
  - Payment confirmation

- **Implementation**
  - PayPal REST API
  - OAuth for account linking
  - Payment request creation
  - Webhook for payment status

##### Cash App
- **Features**
  - Cash App deep link
  - Pre-filled $cashtag and amount
  - Payment tracking

##### Zelle
- **Features**
  - Pre-filled email/phone
  - Amount and note
  - Manual confirmation

##### Stripe Integration (In-App Payment)
- **Features**
  - Credit/debit card payments
  - Apple Pay / Google Pay
  - ACH bank transfers (US)
  - SEPA (Europe)

- **Implementation**
  - Stripe Connect for user-to-user payments
  - Payment intents API
  - Webhook for payment events
  - PCI compliance (Stripe handles card data)

- **Fees**
  - 2.9% + $0.30 per transaction
  - Display fee before payment
  - Option for payer or payee to cover fee

#### Payment Flow

##### 1. Initiate Payment
1. User selects debt to settle
2. Chooses payment method
3. Confirms amount
4. App opens payment provider

##### 2. Process Payment
- **External (Venmo, PayPal, etc.)**
  1. User completes payment in external app
  2. Returns to SplitTab
  3. Records payment (pending confirmation)

- **In-App (Stripe)**
  1. Enter payment details
  2. Process payment
  3. Receive confirmation
  4. Auto-record settlement

##### 3. Confirm Payment
- Payment marked as pending
- Notification to payee
- Payee confirms receipt
- Settlement recorded
- Balances updated

#### Payment Tracking
- **Payment Status**
  - Initiated
  - Processing
  - Completed
  - Failed
  - Disputed

- **Transaction Details**
  - Payment ID from provider
  - Timestamp
  - Amount and currency
  - Fee breakdown
  - Payment method
  - Status

#### Payment Reminders
- **Automated Reminders**
  - Gentle reminder after 7 days
  - Follow-up after 14 days
  - Final reminder after 30 days
  - Customizable frequency

- **Manual Reminders**
  - Send one-time reminder
  - Custom message
  - Multiple people at once

#### Technical Requirements
- OAuth 2.0 for payment provider auth
- Secure token storage
- Webhook handling
- Idempotency for payment operations
- PCI DSS compliance for Stripe
- Transaction logging
- Refund support
- Dispute handling

#### User Stories
- As a user, I want to pay my friend via Venmo directly from the app
- As a user, I want to receive payment through Stripe using my credit card
- As a user, I want to be reminded to pay outstanding debts
- As a user, I want to track payment status and confirmations
- As a user, I want to dispute a payment if needed

---

### 4. Enhanced Notifications

#### Overview
Provide richer, more contextual notifications with actions and personalization.

#### Notification Types & Content

##### Expense Notifications
- **New Expense Added**
  - Who added it
  - Amount and description
  - Your share
  - Quick view action
  - Quick confirm action

- **Expense Modified**
  - What changed
  - Old vs. new amount
  - Reason (if provided)
  - View details action

- **Expense Deleted**
  - Who deleted it
  - Original details
  - Impact on balance

- **You Were Tagged**
  - Tagged in expense note/comment
  - Context preview
  - Reply action

##### Payment Notifications
- **Payment Received**
  - Who paid
  - Amount
  - Confirm/dispute actions
  - View payment details

- **Payment Reminder**
  - Amount owed
  - Who to pay
  - Pay now action (deep link to payment)
  - Remind me later

- **Payment Confirmed**
  - Payee confirmed
  - Updated balance
  - Transaction reference

##### Group Notifications
- **Group Invitation**
  - Who invited you
  - Group name and type
  - Member count
  - Accept/decline actions

- **Member Joined**
  - Who joined
  - Group name
  - Current member count

- **Member Left**
  - Who left
  - Outstanding balance (if any)
  - Settle before leaving reminder

##### Balance Notifications
- **Balance Changed**
  - New balance
  - What caused change
  - Trend indicator

- **Debt Cleared**
  - With whom
  - Congratulations message
  - Celebration animation

- **You're Owed Over $X**
  - Total amount
  - Request payment action

#### Notification Channels

##### Push Notifications (Enhanced)
- **Rich Notifications**
  - Images (receipt thumbnails, profile pictures)
  - Action buttons (Confirm, Pay, View)
  - Grouping (multiple expenses in one)
  - Priority levels

- **Interactive Actions**
  - Confirm payment without opening app
  - Quick reply to comments
  - Snooze reminder
  - Mark as read

##### Email Notifications (Enhanced)
- **Rich HTML Templates**
  - Branded design
  - Embedded images
  - Action buttons
  - Expense summary tables

- **Email Types**
  - Instant notifications
  - Daily digest (all activity)
  - Weekly summary (analytics)
  - Monthly report

##### In-App Notifications (Enhanced)
- **Notification Center**
  - Categorized tabs (All, Payments, Expenses, Groups)
  - Unread indicators
  - Mark all as read
  - Archive old notifications

- **Live Updates**
  - Real-time notification stream
  - Toast notifications for urgent items
  - Badge updates
  - Sound effects (optional)

#### Smart Notification Features

##### Intelligent Timing
- Respect quiet hours
- Time zone awareness
- Don't send at night
- Batch similar notifications

##### Personalization
- User's preferred name
- Relevant context (recent history)
- Frequency preferences
- Channel preferences per type

##### Notification Settings (Granular)
- Per notification type toggles
- Per group notification settings
- Per person notification settings
- Quiet hours configuration
- Do not disturb mode

#### Technical Requirements
- Notification queue with priority
- Delivery tracking
- Read receipts
- Retry logic for failed deliveries
- Template engine for emails
- Push notification certificates (APNs)
- Notification analytics

#### User Stories
- As a user, I want to confirm a payment from the notification
- As a user, I want rich notifications with images and context
- As a user, I want to receive daily digests instead of individual notifications
- As a user, I want to disable notifications for a specific group
- As a user, I want payment reminders during business hours only

---

### 5. Recurring Expenses

#### Overview
Automatically create expenses on a schedule for regular bills and subscriptions.

#### Features

##### Recurring Expense Creation
- **Schedule Options**
  - Daily
  - Weekly (select day)
  - Bi-weekly
  - Monthly (select date or last day)
  - Quarterly
  - Yearly
  - Custom interval (every X days)

- **Recurrence Settings**
  - Start date
  - End date (optional)
  - Number of occurrences (optional)
  - Never end option

- **Expense Template**
  - Amount (fixed or variable)
  - Description with date placeholders
  - Category
  - Payer (can rotate)
  - Split method
  - Notes

##### Auto-Creation
- **Background Job**
  - Check daily for due recurring expenses
  - Create expenses automatically
  - Send notifications
  - Handle failures gracefully

- **Variable Amounts**
  - Flag as "amount varies"
  - Create draft expense
  - User fills in amount
  - Auto-submit after X days

##### Payer Rotation
- **Rotating Payer**
  - Define rotation order
  - Auto-assign next payer
  - Notification to upcoming payer
  - Fair distribution

##### Management
- **View All Recurring**
  - List of active recurring expenses
  - Next occurrence date
  - History of created expenses
  - Edit recurrence

- **Pause/Resume**
  - Temporarily pause recurrence
  - Resume at any time
  - Skip next occurrence

- **Modify Recurrence**
  - Edit any field
  - Apply to future occurrences only
  - Recalculate schedule

- **Delete Recurrence**
  - Stop future occurrences
  - Keep historical expenses
  - Confirmation dialog

#### Technical Requirements
- Cron job or scheduler (node-cron, BullMQ)
- Run daily at optimal time (e.g., 6 AM)
- Handle timezone differences
- Idempotency (don't create duplicates)
- Notification on auto-creation
- Audit log for created expenses

#### User Stories
- As a user, I want to set up recurring rent payment every month
- As a user, I want utility bills to rotate payer each month
- As a user, I want to pause recurring expense when on vacation
- As a user, I want notification before recurring expense is created
- As a user, I want to see history of all auto-created expenses

---

### 6. Reporting & Analytics

#### Overview
Provide insights into spending patterns, trends, and financial habits.

#### Reports

##### Spending Summary
- **Time Periods**
  - This week
  - This month
  - Last month
  - Last 3 months
  - Last 6 months
  - Last year
  - Custom date range

- **Metrics**
  - Total spent
  - Total you paid
  - Total others paid
  - Average expense
  - Number of expenses
  - Most expensive expense

##### Category Breakdown
- **Visualizations**
  - Pie chart (category distribution)
  - Bar chart (category comparison)
  - Line chart (category over time)
  - Table view with percentages

- **Details**
  - Amount per category
  - Percentage of total
  - Number of expenses
  - Average per expense
  - Trend vs. previous period

##### Group Analytics
- **Group Spending**
  - Total group expenses
  - Per-member contribution
  - Category breakdown
  - Time series
  - Most active period

- **Comparison**
  - Your spending vs. group average
  - Category preferences
  - Payment patterns

##### Personal Insights
- **Spending Trends**
  - Weekly/monthly trends
  - Seasonal patterns
  - Anomaly detection (unusual spending)
  - Predictions (based on history)

- **Habits**
  - Most frequent categories
  - Typical expense amounts
  - Common merchants
  - Busiest days/times

##### Balance Analytics
- **Balance Timeline**
  - Graph of balance over time
  - Highlight settlements
  - Forecast (if trends continue)

- **Settlement Stats**
  - Average time to settle
  - Total settled amount
  - Preferred payment methods
  - Settlement frequency

#### Export Features

##### Export Formats
- **CSV**
  - All expenses
  - Filtered expenses
  - Settlements
  - Balances

- **Excel (XLSX)**
  - Multiple sheets
  - Formatted tables
  - Charts included
  - Formulas for totals

- **PDF**
  - Formatted report
  - Charts and graphs
  - Summary statistics
  - Group branding

##### Export Options
- Date range selection
- Group selection
- Category filter
- Include/exclude settlements
- Include receipt images
- Email export file

#### Visualizations

##### Charts
- Line charts (trends over time)
- Pie charts (category distribution)
- Bar charts (comparisons)
- Stacked bar charts (category over time)
- Heat maps (spending by day/time)

##### Interactive Features
- Hover for details
- Click to drill down
- Date range selector
- Filter by category/member
- Zoom and pan

#### Technical Requirements
- Chart library (Recharts, Chart.js)
- PDF generation (jsPDF, PDFKit)
- Excel generation (xlsx)
- CSV generation (native)
- Query optimization for analytics
- Caching for expensive calculations
- Background job for large exports

#### User Stories
- As a user, I want to see my spending by category
- As a user, I want to compare my spending this month vs. last month
- As a user, I want to export all expenses to Excel for tax purposes
- As a user, I want to see group spending trends over time
- As a user, I want insights on my spending habits

---

### 7. Attachment Support

#### Overview
Allow users to attach multiple files (images, PDFs) to expenses for documentation.

#### Features

##### Attachment Types
- Images (JPEG, PNG, HEIC)
- PDFs
- Maximum 10 attachments per expense
- Maximum 10MB per file

##### Upload Methods
- Camera capture
- Photo library
- File picker
- Drag and drop (web)
- Email forwarding (future)

##### Attachment Management
- **View Attachments**
  - Thumbnail grid
  - Full-screen viewer
  - Swipe between attachments
  - Zoom and pan

- **Edit Attachments**
  - Add more attachments
  - Remove attachments
  - Reorder attachments
  - Rotate images

- **Download**
  - Download original file
  - Download all as ZIP

##### Storage & Organization
- Cloud storage (S3/R2)
- Organized by expense ID
- Thumbnail generation
- Lazy loading
- CDN delivery

#### Technical Requirements
- Virus scanning on upload
- File type validation
- Size limits enforced
- Secure URLs (signed, expiring)
- Image optimization
- Thumbnail generation

#### User Stories
- As a user, I want to attach warranty documentation to an expense
- As a user, I want to attach multiple receipt images
- As a user, I want to view all attachments in full screen
- As a user, I want to download all attachments for an expense

---

### 8. Comments & Collaboration

#### Overview
Enable discussion and clarification on expenses.

#### Features

##### Commenting
- **Add Comment**
  - Text comments (max 500 chars)
  - @ mentions
  - Reply to comments (threading)
  - Edit own comments
  - Delete own comments

- **Comment Feed**
  - Chronological order
  - Author and timestamp
  - Edited indicator
  - Unread indicators

##### Mentions
- **@mention Users**
  - Autocomplete member names
  - Notification to mentioned user
  - Highlight in comment

##### Notifications
- New comment on expense you're in
- @mentioned in comment
- Reply to your comment

#### Technical Requirements
- Real-time comment updates
- Markdown support (basic)
- Mention parsing
- Comment moderation (admin)
- Soft delete for comments

#### User Stories
- As a user, I want to ask a question about an expense
- As a user, I want to @mention someone to clarify their share
- As a user, I want to see all comments on an expense
- As a user, I want to be notified when someone replies to my comment

---

## Technical Requirements (Phase 2)

### Infrastructure Upgrades
- Upgrade to production-grade hosting (AWS, GCP)
- Implement CDN (CloudFlare)
- Add load balancer
- Set up auto-scaling
- Enhanced monitoring (DataDog, New Relic)

### Database Optimizations
- Implement caching layer (Redis)
- Database read replicas
- Query optimization
- Index tuning
- Archival strategy for old data

### API Enhancements
- GraphQL consideration
- API rate limiting tiers
- Webhook support
- API documentation (Swagger/OpenAPI)
- SDK for integrations

---

## Migration & Rollout Strategy

### Feature Flags
- All Phase 2 features behind feature flags
- Gradual rollout to users
- A/B testing capability
- Quick rollback if issues

### Data Migration
- Add new tables/columns
- Backfill existing data if needed
- Zero-downtime migrations
- Rollback scripts prepared

### User Communication
- Announce new features
- Tutorial/walkthrough for major features
- Help documentation
- Email campaign

---

## Success Metrics (Phase 2)

### Adoption Metrics
- 60% of users try receipt scanning
- 40% use recurring expenses
- 30% use payment integrations
- 50% view analytics/reports

### Engagement Metrics
- 30% increase in expense creation
- 40% increase in settlements
- 20% increase in daily active users

### Quality Metrics
- OCR accuracy > 85%
- Receipt processing time < 10s
- Payment success rate > 95%
- Notification delivery rate > 99%

---

## Known Limitations (Phase 2)

### Receipt Scanning
- Limited to English receipts (initially)
- May struggle with handwritten receipts
- Confidence threshold: 70%
- Manual correction required for low confidence

### Payment Integrations
- Limited to US payment providers (initially)
- Stripe fees apply (2.9% + $0.30)
- External payment confirmation manual

### Analytics
- Historical data limited to 2 years
- Complex queries may be slow
- Export size limited to 10,000 rows

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Draft
**Dependencies**: Phase-1-MVP.md, Technical-Architecture.md
