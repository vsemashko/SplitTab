# 💳 Phase 6: Payment Integration - Detailed Implementation Plan

**Status:** 🟡 Not Started
**Priority:** P1 - High
**Duration:** 6-8 weeks
**Dependencies:** Phase 4 complete (Phase 5 optional)

---

## 📋 Overview

This phase integrates real payment providers (PayPal, Venmo) to enable in-app settlements. Users can pay and request payments directly through the app, with automatic settlement tracking.

### Goals
- Integrate PayPal for payments
- Integrate Venmo for payments
- Enable payment requests
- Track payment status and history
- Sync payments with settlements

### Current Status
- ❌ No payment integration
- ❌ Payment models not in database
- ❌ Payment webhooks not configured
- ❌ Payment UI not built

---

## 🏗️ Week 1-2: Backend Payment Infrastructure

### Backend Tasks

#### 1. Database Schema Updates
**File:** `backend/prisma/schema.prisma`
**Priority:** P0
**Estimated Time:** 4-6 hours

**Add Payment Model:**
```prisma
model Payment {
  id                String    @id @default(uuid())

  // Payment details
  amount            Decimal   @db.Decimal(19, 4)
  currency          String    @db.Char(3)
  status            String    // pending, processing, completed, failed, refunded

  // Provider details
  provider          String    // paypal, venmo, stripe
  providerPaymentId String?   // External payment ID
  providerStatus    String?   // Provider-specific status

  // Parties
  payerId           String
  payeeId           String
  payer             User      @relation("PaymentPayer", fields: [payerId], references: [id])
  payee             User      @relation("PaymentPayee", fields: [payeeId], references: [id])

  // Related entities
  settlementId      String?   @unique
  settlement        Settlement? @relation(fields: [settlementId], references: [id])
  groupId           String?
  group             Group?    @relation(fields: [groupId], references: [id])

  // Metadata
  description       String?
  metadata          Json?     // Provider-specific data
  failureReason     String?

  // Timestamps
  initiatedAt       DateTime  @default(now())
  completedAt       DateTime?
  refundedAt        DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([payerId])
  @@index([payeeId])
  @@index([settlementId])
  @@index([status])
  @@index([provider])
}
```

**Add Payment Account Model:**
```prisma
model PaymentAccount {
  id                String    @id @default(uuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])

  provider          String    // paypal, venmo
  accountId         String    // Provider account ID/email
  accountName       String?   // Display name
  isVerified        Boolean   @default(false)
  isPrimary         Boolean   @default(false)

  // OAuth tokens (encrypted)
  accessToken       String?
  refreshToken      String?
  tokenExpiry       DateTime?

  // Metadata
  metadata          Json?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([userId, provider, accountId])
  @@index([userId])
}
```

**Migration:**
- [ ] Create migration
- [ ] Test migration locally
- [ ] Apply to development database

---

#### 2. Payment Service
**File:** `backend/src/services/payment.service.ts`
**Priority:** P0
**Estimated Time:** 12-16 hours

**Methods to Implement:**
- [ ] `createPayment()` - Initiate payment
- [ ] `getPayment()` - Get payment details
- [ ] `listPayments()` - List user's payments
- [ ] `cancelPayment()` - Cancel pending payment
- [ ] `refundPayment()` - Refund completed payment
- [ ] `processWebhook()` - Handle provider webhooks
- [ ] `syncPaymentStatus()` - Sync status with provider

---

#### 3. PayPal Integration
**File:** `backend/src/services/providers/paypal.service.ts`
**Priority:** P0
**Estimated Time:** 16-20 hours

**Setup:**
- [ ] Create PayPal developer account
- [ ] Create sandbox app
- [ ] Get API credentials
- [ ] Install PayPal SDK: `npm install @paypal/checkout-server-sdk`

**Methods:**
- [ ] `createOrder()` - Create PayPal order
- [ ] `captureOrder()` - Capture payment
- [ ] `getOrder()` - Get order status
- [ ] `refundPayment()` - Issue refund
- [ ] `verifyWebhook()` - Verify webhook signature

**Webhook Events:**
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`

---

#### 4. Venmo Integration
**File:** `backend/src/services/providers/venmo.service.ts`
**Priority:** P1
**Estimated Time:** 16-20 hours

**Setup:**
- [ ] Apply for Venmo business account
- [ ] Get API access
- [ ] Get API credentials
- [ ] Install Venmo SDK (if available)

**Methods:**
- [ ] `createPayment()` - Create Venmo payment
- [ ] `getPayment()` - Get payment status
- [ ] `requestPayment()` - Request payment from user
- [ ] `completePayment()` - Complete payment

**Note:** Venmo has limited API access. May need to use PayPal's Braintree SDK.

---

#### 5. Payment Controller & Routes
**File:** `backend/src/controllers/payment.controller.ts`
**File:** `backend/src/routes/payment.routes.ts`
**Priority:** P0
**Estimated Time:** 8-10 hours

**Endpoints:**
```
POST   /api/v1/payments                    - Create payment
GET    /api/v1/payments                    - List user payments
GET    /api/v1/payments/:id                - Get payment details
POST   /api/v1/payments/:id/cancel         - Cancel payment
POST   /api/v1/payments/:id/refund         - Refund payment

POST   /api/v1/payments/accounts           - Connect payment account
GET    /api/v1/payments/accounts           - List connected accounts
DELETE /api/v1/payments/accounts/:id       - Disconnect account

POST   /api/v1/payments/webhooks/paypal    - PayPal webhook
POST   /api/v1/payments/webhooks/venmo     - Venmo webhook
```

---

### ✅ Week 1-2 Checklist

**Database:**
- [ ] Payment model added
- [ ] PaymentAccount model added
- [ ] Migration created and applied
- [ ] Indexes added

**Services:**
- [ ] PaymentService created
- [ ] PayPal service created
- [ ] Venmo service created
- [ ] Webhook handling implemented

**API:**
- [ ] Payment controller created
- [ ] Payment routes created
- [ ] Validation schemas added
- [ ] Authorization checks added

**Testing:**
- [ ] Unit tests for payment service
- [ ] Integration tests for PayPal
- [ ] Integration tests for Venmo
- [ ] Webhook tests

---

## 🏗️ Week 3-4: Mobile Payment UI

### 📱 Screens to Build

#### 1. Payment Methods Screen
**File:** `mobile/src/screens/payments/PaymentMethodsScreen.tsx`
**Priority:** P0
**Estimated Time:** 6-8 hours

**Requirements:**
- [ ] List connected payment accounts
- [ ] Add PayPal account button
- [ ] Add Venmo account button
- [ ] Set primary payment method
- [ ] Remove payment account
- [ ] Account status indicators

**API Endpoints:**
- `GET /api/v1/payments/accounts` - List accounts
- `POST /api/v1/payments/accounts` - Connect account
- `DELETE /api/v1/payments/accounts/:id` - Disconnect

---

#### 2. PayPal Connect Screen
**File:** `mobile/src/screens/payments/PayPalConnectScreen.tsx`
**Priority:** P0
**Estimated Time:** 10-12 hours

**Requirements:**
- [ ] WebView for PayPal OAuth
- [ ] Handle OAuth callback
- [ ] Store access tokens
- [ ] Success/error handling

**SDK:**
- Install: `npm install @paypal/react-native-paypal`
- Or use WebView for OAuth flow

---

#### 3. Send Payment Screen
**File:** `mobile/src/screens/payments/SendPaymentScreen.tsx`
**Priority:** P0
**Estimated Time:** 10-12 hours

**Requirements:**
- [ ] Select recipient
- [ ] Enter amount
- [ ] Select payment method
- [ ] Optional note/description
- [ ] Link to settlement (optional)
- [ ] Review and confirm
- [ ] Payment processing indicator
- [ ] Success/failure handling

**API Endpoints:**
- `POST /api/v1/payments` - Create payment

**Components:**
- `RecipientPicker.tsx` - Select recipient
- `PaymentMethodSelector.tsx` - Choose method
- `PaymentConfirmation.tsx` - Review screen

---

#### 4. Request Payment Screen
**File:** `mobile/src/screens/payments/RequestPaymentScreen.tsx`
**Priority:** P1
**Estimated Time:** 8-10 hours

**Requirements:**
- [ ] Select payer
- [ ] Enter amount
- [ ] Optional description
- [ ] Link to settlement (optional)
- [ ] Send request button
- [ ] Confirmation

**API Endpoints:**
- `POST /api/v1/payments/requests` - Create request

---

#### 5. Payment Details Screen
**File:** `mobile/src/screens/payments/PaymentDetailsScreen.tsx`
**Priority:** P1
**Estimated Time:** 6-8 hours

**Requirements:**
- [ ] Display payment amount and status
- [ ] Show payer and payee
- [ ] Provider information
- [ ] Transaction ID
- [ ] Timestamps
- [ ] Refund button (if applicable)
- [ ] Receipt/proof

**API Endpoints:**
- `GET /api/v1/payments/:id` - Get payment details
- `POST /api/v1/payments/:id/refund` - Refund

---

#### 6. Payment History Screen
**File:** `mobile/src/screens/payments/PaymentHistoryScreen.tsx`
**Priority:** P1
**Estimated Time:** 6-8 hours

**Requirements:**
- [ ] List all payments sent/received
- [ ] Filter by status
- [ ] Filter by provider
- [ ] Search functionality
- [ ] Tap to view details

**API Endpoints:**
- `GET /api/v1/payments` - List payments

---

### ✅ Week 3-4 Checklist

**Screens:**
- [ ] PaymentMethodsScreen.tsx
- [ ] PayPalConnectScreen.tsx
- [ ] SendPaymentScreen.tsx
- [ ] RequestPaymentScreen.tsx
- [ ] PaymentDetailsScreen.tsx
- [ ] PaymentHistoryScreen.tsx

**Components:**
- [ ] PaymentMethodCard.tsx
- [ ] RecipientPicker.tsx
- [ ] PaymentMethodSelector.tsx
- [ ] PaymentConfirmation.tsx
- [ ] PaymentStatusBadge.tsx

**API Integration:**
- [ ] usePaymentAccounts hook
- [ ] useConnectPaymentAccount hook
- [ ] useCreatePayment hook
- [ ] usePayments hook
- [ ] usePayment hook
- [ ] useRefundPayment hook

---

## 🏗️ Week 5-6: Settlement Integration

### Features to Integrate

#### 1. Pay Settlement via Payment Provider
**File:** Update `CreateSettlementScreen.tsx`
**Priority:** P0
**Estimated Time:** 8-10 hours

**Requirements:**
- [ ] Add "Pay Now" button
- [ ] Select payment method
- [ ] Create settlement + payment atomically
- [ ] Handle payment success/failure
- [ ] Update settlement status on payment complete

---

#### 2. Request Payment for Settlement
**Priority:** P1
**Estimated Time:** 6-8 hours

**Requirements:**
- [ ] Add "Request Payment" button to settlements
- [ ] Generate payment request with settlement link
- [ ] Notify payee
- [ ] Auto-confirm settlement when payment completes

---

#### 3. Payment Status in Balances
**Priority:** P1
**Estimated Time:** 4-6 hours

**Requirements:**
- [ ] Show pending payments in balance screen
- [ ] Indicate in-progress payments
- [ ] Update balances on payment complete

---

### ✅ Week 5-6 Checklist

**Integration:**
- [ ] Settlement payment integration
- [ ] Payment request integration
- [ ] Balance updates with payments
- [ ] Notification for payment events

**Testing:**
- [ ] E2E test: Pay settlement via PayPal
- [ ] E2E test: Request payment
- [ ] E2E test: Refund flow
- [ ] Payment webhook tests

---

## 🏗️ Week 7-8: Testing & Polish

### Testing Tasks

- [ ] Test PayPal sandbox integration
- [ ] Test Venmo (if available)
- [ ] Test webhook reliability
- [ ] Test error scenarios
- [ ] Test refund flows
- [ ] Load testing for payment processing
- [ ] Security audit for payment data

### Polish Tasks

- [ ] Payment UI polish
- [ ] Loading states
- [ ] Error messages
- [ ] Success animations
- [ ] Payment receipts
- [ ] Transaction history export

### Documentation

- [ ] Payment integration guide
- [ ] Webhook setup instructions
- [ ] Testing guide
- [ ] Troubleshooting guide

---

## 📊 Phase 6 Completion Checklist

### Backend
- [ ] Database models created
- [ ] PayPal integration working
- [ ] Venmo integration working (or documented as unavailable)
- [ ] Webhooks processing correctly
- [ ] Payment service complete
- [ ] API endpoints secured
- [ ] Tests passing

### Mobile
- [ ] All payment screens built
- [ ] Payment methods connected
- [ ] Send payment working
- [ ] Request payment working
- [ ] Settlement integration complete
- [ ] Payment history accessible

### Infrastructure
- [ ] PayPal sandbox configured
- [ ] Venmo sandbox configured (if available)
- [ ] Webhook endpoints exposed
- [ ] SSL certificates for webhooks
- [ ] Payment logs for debugging

### Compliance
- [ ] PCI compliance reviewed
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] User consent flows
- [ ] Data encryption verified

---

## 🚀 Success Criteria

- [ ] Users can connect PayPal accounts
- [ ] Users can send payments via PayPal
- [ ] Payments reflect in settlements automatically
- [ ] Payment success rate > 95%
- [ ] Webhooks processed reliably
- [ ] No payment data leaks
- [ ] Refunds work correctly

---

## 🚨 Important Notes

### Security Considerations
- **Never store raw payment credentials**
- **Use OAuth tokens only**
- **Encrypt sensitive data at rest**
- **Use HTTPS for all payment APIs**
- **Implement fraud detection**
- **Rate limit payment endpoints**

### PayPal Requirements
- Business account required for production
- Sandbox for development
- Webhook verification required
- Compliance documentation needed

### Venmo Limitations
- Limited API access
- May require Braintree SDK
- Business account approval needed
- Alternative: Use PayPal + Braintree

---

**Next:** [Phase 7: Advanced Features](./PHASE_7_ADVANCED_FEATURES.md)

**Previous:** [Phase 5: Enhanced Mobile](./PHASE_5_ENHANCED_MOBILE.md)

**Back to:** [Master Plan](../../MASTER_PLAN.md)
