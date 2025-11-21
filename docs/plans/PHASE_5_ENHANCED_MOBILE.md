# ✨ Phase 5: Enhanced Mobile Features - Detailed Implementation Plan

**Status:** 🟡 Not Started
**Priority:** P1 - High
**Duration:** 4-6 weeks
**Dependencies:** Phase 4 complete

---

## 📋 Overview

This phase adds advanced features that differentiate SplitTab from basic expense-sharing apps: receipt scanning with OCR, analytics dashboards, and real-time notifications.

### Goals
- Enable receipt scanning and OCR functionality
- Provide comprehensive analytics and insights
- Implement real-time notifications
- Add activity feed for social features

### Backend Status
- ✅ OCR service complete (Google Vision + AWS Textract)
- ✅ Receipt management complete
- ✅ Analytics endpoints complete
- ✅ Socket.IO notifications complete
- ✅ Background job processing with Bull Queue

---

## 🏗️ Week 1-2: Receipt Scanning & OCR

### 📱 Screens to Build

#### 1. Receipt Upload Screen
**File:** `mobile/src/screens/receipts/ReceiptUploadScreen.tsx`
**Priority:** P0
**Estimated Time:** 8-10 hours

**Requirements:**
- [ ] Camera integration for photo capture
- [ ] Gallery picker for existing photos
- [ ] Image preview before upload
- [ ] Crop/rotate functionality
- [ ] Upload progress indicator
- [ ] Navigate to OCR processing screen

**Dependencies:**
- `expo-camera` ✅ (already installed)
- `expo-image-picker` ✅ (already installed)
- `expo-image-manipulator` ✅ (already installed)

**API Endpoints:**
- `POST /api/v1/receipts/upload` - Upload receipt image

**Components:**
- `CameraView.tsx` - Camera interface
- `ImagePreview.tsx` - Preview and crop
- `UploadProgress.tsx` - Progress indicator

---

#### 2. OCR Processing Screen
**File:** `mobile/src/screens/receipts/OCRProcessingScreen.tsx`
**Priority:** P0
**Estimated Time:** 6-8 hours

**Requirements:**
- [ ] Loading animation while OCR processes
- [ ] Poll backend for OCR completion
- [ ] Display extracted data when ready
- [ ] Navigate to correction screen

**API Endpoints:**
- `GET /api/v1/receipts/:id` - Get receipt status
- WebSocket: `receipt:updated` event

**Components:**
- `OCRLoadingAnimation.tsx` - Processing animation
- `ExtractionPreview.tsx` - Quick preview of results

---

#### 3. OCR Correction Screen
**File:** `mobile/src/screens/receipts/OCRCorrectionScreen.tsx`
**Priority:** P0
**Estimated Time:** 10-12 hours

**Requirements:**
- [ ] Display receipt image alongside extracted data
- [ ] Editable fields for all extracted values:
  - [ ] Merchant name
  - [ ] Date
  - [ ] Total amount
  - [ ] Line items (name, quantity, price)
  - [ ] Tax
  - [ ] Tip
- [ ] Add missing line items
- [ ] Remove incorrect line items
- [ ] Confidence indicators per field
- [ ] Accept/Save corrections button
- [ ] Create expense from receipt button

**API Endpoints:**
- `GET /api/v1/receipts/:id` - Get receipt with OCR data
- `PATCH /api/v1/receipts/:id/corrections` - Submit corrections
- `POST /api/v1/expenses/from-receipt` - Create expense from receipt

**Components:**
- `ReceiptImageViewer.tsx` - Image with zoom/pan
- `OCRFieldEditor.tsx` - Editable field with confidence
- `LineItemsList.tsx` - Editable line items
- `ConfidenceIndicator.tsx` - Visual confidence score

---

#### 4. Receipt Library Screen
**File:** `mobile/src/screens/receipts/ReceiptLibraryScreen.tsx`
**Priority:** P2
**Estimated Time:** 6-8 hours

**Requirements:**
- [ ] Grid view of all receipts
- [ ] Filter by date range
- [ ] Filter by merchant
- [ ] Search functionality
- [ ] Tap to view details
- [ ] Long press for actions (delete, share)
- [ ] Pull to refresh

**API Endpoints:**
- `GET /api/v1/receipts` - List all receipts

---

### ✅ Week 1-2 Checklist

**Screens:**
- [ ] ReceiptUploadScreen.tsx
- [ ] OCRProcessingScreen.tsx
- [ ] OCRCorrectionScreen.tsx
- [ ] ReceiptLibraryScreen.tsx

**Components:**
- [ ] CameraView.tsx
- [ ] ImagePreview.tsx
- [ ] ReceiptImageViewer.tsx
- [ ] OCRFieldEditor.tsx
- [ ] LineItemsList.tsx
- [ ] ConfidenceIndicator.tsx

**API Integration:**
- [ ] useUploadReceipt hook
- [ ] useReceipt hook
- [ ] useReceiptCorrections hook
- [ ] useCreateExpenseFromReceipt hook
- [ ] Socket.IO receipt updates

**Testing:**
- [ ] E2E test for receipt upload flow
- [ ] E2E test for OCR correction flow
- [ ] Image processing tests

---

## 🏗️ Week 3-4: Analytics & Insights

### 📱 Screens to Build

#### 5. Analytics Dashboard Screen
**File:** `mobile/src/screens/analytics/AnalyticsDashboardScreen.tsx`
**Priority:** P1
**Estimated Time:** 12-15 hours

**Requirements:**
- [ ] Overview cards:
  - [ ] Total spent this month
  - [ ] Total owed
  - [ ] Total you're owed
  - [ ] Number of expenses this month
- [ ] Spending by category chart (pie chart)
- [ ] Spending trend chart (line chart)
- [ ] Top expense categories list
- [ ] Date range selector (week, month, year, custom)
- [ ] Group filter
- [ ] Export button (defer to Phase 7)

**API Endpoints:**
- `GET /api/v1/analytics/overview` - Get overview stats
- `GET /api/v1/analytics/expenses` - Get expense analytics
- `GET /api/v1/analytics/trends` - Get spending trends

**Charts Library:**
- Use `react-native-chart-kit` or `victory-native`
- Install: `npm install react-native-chart-kit react-native-svg`

**Components:**
- `OverviewCard.tsx` - Summary stat card
- `CategoryPieChart.tsx` - Pie chart for categories
- `SpendingLineChart.tsx` - Line chart for trends
- `TopCategoriesList.tsx` - List of top categories
- `DateRangeSelector.tsx` - Date range picker

---

#### 6. Spending Trends Screen
**File:** `mobile/src/screens/analytics/SpendingTrendsScreen.tsx`
**Priority:** P1
**Estimated Time:** 8-10 hours

**Requirements:**
- [ ] Monthly spending comparison
- [ ] Category breakdown over time
- [ ] Group spending comparison
- [ ] Interactive charts with zoom
- [ ] Date range selector
- [ ] Export chart button

**API Endpoints:**
- `GET /api/v1/analytics/trends` - Get detailed trends

---

#### 7. Expense Analytics Screen
**File:** `mobile/src/screens/analytics/ExpenseAnalyticsScreen.tsx`
**Priority:** P2
**Estimated Time:** 6-8 hours

**Requirements:**
- [ ] Average expense amount
- [ ] Most frequent categories
- [ ] Busiest days/times
- [ ] Comparison with friends (anonymous)
- [ ] Insights and tips

**API Endpoints:**
- `GET /api/v1/analytics/expenses` - Get expense analytics

---

### ✅ Week 3-4 Checklist

**Screens:**
- [ ] AnalyticsDashboardScreen.tsx
- [ ] SpendingTrendsScreen.tsx
- [ ] ExpenseAnalyticsScreen.tsx

**Components:**
- [ ] OverviewCard.tsx
- [ ] CategoryPieChart.tsx
- [ ] SpendingLineChart.tsx
- [ ] TopCategoriesList.tsx
- [ ] DateRangeSelector.tsx

**Libraries:**
- [ ] Install charting library
- [ ] Configure chart themes
- [ ] Create chart utilities

**API Integration:**
- [ ] useAnalyticsOverview hook
- [ ] useExpenseAnalytics hook
- [ ] useSpendingTrends hook

**Testing:**
- [ ] Chart rendering tests
- [ ] Data transformation tests
- [ ] E2E test for analytics flow

---

## 🏗️ Week 5-6: Notifications & Activity

### 📱 Screens to Build

#### 8. Notifications Screen
**File:** `mobile/src/screens/notifications/NotificationsScreen.tsx`
**Priority:** P0
**Estimated Time:** 8-10 hours

**Requirements:**
- [ ] List all notifications
- [ ] Group by date (today, yesterday, this week, older)
- [ ] Mark as read on tap
- [ ] Navigate to related content (expense, group, etc.)
- [ ] Mark all as read button
- [ ] Filter by type
- [ ] Delete notification (swipe action)
- [ ] Pull to refresh
- [ ] Unread badge count

**API Endpoints:**
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/unread/count` - Unread count
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `PATCH /api/v1/notifications/mark-all-read` - Mark all read
- `DELETE /api/v1/notifications/:id` - Delete notification

**WebSocket Events:**
- `notification:new` - New notification received

**Components:**
- `NotificationListItem.tsx` - Single notification
- `NotificationGroupHeader.tsx` - Date group header
- `NotificationBadge.tsx` - Unread count badge

---

#### 9. Activity Feed Screen
**File:** `mobile/src/screens/activity/ActivityFeedScreen.tsx`
**Priority:** P2
**Estimated Time:** 8-10 hours

**Requirements:**
- [ ] Timeline of all group activities
- [ ] Show expense creation, settlements, member joins
- [ ] Filter by group
- [ ] User avatars and actions
- [ ] Navigate to related content
- [ ] Pull to refresh
- [ ] Infinite scroll

**API Endpoints:**
- `GET /api/v1/activity` - Get activity feed (may need to create)

---

### 🔔 Push Notifications Setup

#### iOS Push Notifications
**File:** `mobile/src/services/pushNotifications.ios.ts`
**Estimated Time:** 6-8 hours

**Requirements:**
- [ ] Configure APNs certificates
- [ ] Request notification permissions
- [ ] Register device token with backend
- [ ] Handle notification tap
- [ ] Handle foreground notifications
- [ ] Handle background notifications

**Dependencies:**
- `expo-notifications` ✅ (already installed)

---

#### Android Push Notifications
**File:** `mobile/src/services/pushNotifications.android.ts`
**Estimated Time:** 6-8 hours

**Requirements:**
- [ ] Configure Firebase Cloud Messaging
- [ ] Request notification permissions
- [ ] Register device token with backend
- [ ] Handle notification tap
- [ ] Handle foreground notifications
- [ ] Handle background notifications
- [ ] Notification channels setup

---

### ✅ Week 5-6 Checklist

**Screens:**
- [ ] NotificationsScreen.tsx
- [ ] ActivityFeedScreen.tsx

**Components:**
- [ ] NotificationListItem.tsx
- [ ] NotificationBadge.tsx
- [ ] ActivityTimelineItem.tsx

**Services:**
- [ ] Push notification service (iOS)
- [ ] Push notification service (Android)
- [ ] Device token registration

**API Integration:**
- [ ] useNotifications hook
- [ ] useUnreadCount hook
- [ ] useMarkAsRead hook
- [ ] useMarkAllRead hook
- [ ] Socket.IO notification listener

**Configuration:**
- [ ] APNs certificates
- [ ] Firebase configuration
- [ ] Notification permissions

**Testing:**
- [ ] Push notification delivery tests
- [ ] Notification tap handling tests
- [ ] E2E notification flow

---

## 📊 Phase 5 Completion Checklist

### Screens (9 total)
- [ ] ReceiptUploadScreen ✅
- [ ] OCRProcessingScreen ✅
- [ ] OCRCorrectionScreen ✅
- [ ] ReceiptLibraryScreen ✅
- [ ] AnalyticsDashboardScreen ✅
- [ ] SpendingTrendsScreen ✅
- [ ] ExpenseAnalyticsScreen ✅
- [ ] NotificationsScreen ✅
- [ ] ActivityFeedScreen ✅

### Features
- [ ] Receipt scanning working end-to-end
- [ ] OCR correction functional
- [ ] Analytics charts displaying correctly
- [ ] Push notifications configured
- [ ] Real-time updates via WebSocket
- [ ] Activity feed populated

### Infrastructure
- [ ] APNs configured
- [ ] FCM configured
- [ ] Socket.IO client connected
- [ ] Image upload optimized
- [ ] Charts performant

### Testing
- [ ] E2E tests for receipt flow
- [ ] E2E tests for analytics
- [ ] Push notification tests
- [ ] Performance benchmarks met

---

## 🚀 Success Criteria

- [ ] Users can successfully scan receipts
- [ ] OCR accuracy > 80% for key fields
- [ ] Analytics provide valuable insights
- [ ] Push notifications delivered reliably
- [ ] Real-time updates work smoothly
- [ ] No performance degradation

---

**Next:** [Phase 6: Payment Integration](./PHASE_6_PAYMENT_INTEGRATION.md)

**Previous:** [Phase 4: Mobile MVP](./PHASE_4_MOBILE_MVP.md)

**Back to:** [Master Plan](../../MASTER_PLAN.md)
