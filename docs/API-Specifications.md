# API Specifications

## Overview

This document provides detailed specifications for the SplitTab REST API, including endpoints, request/response formats, authentication, and error handling.

**Version**: v1
**Base URL**: `https://api.splittab.com/v1`
**Last Updated**: 2025-11-21

---

## API Design Principles

1. **RESTful**: Follow REST conventions
2. **Consistency**: Consistent naming and response formats
3. **Versioning**: API version in URL path
4. **Stateless**: No server-side session state
5. **Pagination**: All list endpoints support pagination
6. **Filtering**: Support filtering and sorting
7. **Error Handling**: Clear, actionable error messages

---

## Authentication

### JWT Bearer Token

All authenticated requests must include a valid JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Types

#### Access Token
- **Expiry**: 15 minutes
- **Usage**: API requests
- **Format**: JWT

```json
{
  "sub": "user_123",
  "email": "user@example.com",
  "iat": 1700000000,
  "exp": 1700000900,
  "type": "access"
}
```

#### Refresh Token
- **Expiry**: 30 days
- **Usage**: Obtain new access token
- **Storage**: HTTP-only cookie or secure storage

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "timestamp": "2025-11-21T12:00:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than 0"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-11-21T12:00:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  },
  "meta": {
    "timestamp": "2025-11-21T12:00:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## API Endpoints

## Authentication Endpoints

### Register

Create a new user account.

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "defaultCurrency": "USD"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "profilePictureUrl": null,
      "defaultCurrency": "USD",
      "createdAt": "2025-11-21T12:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "dGhpcyBp...",
      "expiresIn": 900
    }
  }
}
```

**Errors**:
- `400`: Email already exists
- `400`: Password too weak

---

### Login

Authenticate and obtain tokens.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "profilePictureUrl": "https://...",
      "defaultCurrency": "USD"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "dGhpcyBp...",
      "expiresIn": 900
    }
  }
}
```

**Errors**:
- `401`: Invalid credentials
- `429`: Too many login attempts

---

### Refresh Token

Obtain a new access token using refresh token.

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "dGhpcyBp..."
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "expiresIn": 900
  }
}
```

---

### Logout

Revoke current session.

```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response**: `204 No Content`

---

## User Endpoints

### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "emailVerified": true,
    "name": "John Doe",
    "profilePictureUrl": "https://...",
    "phoneNumber": "+1234567890",
    "phoneVerified": false,
    "defaultCurrency": "USD",
    "timezone": "America/New_York",
    "language": "en",
    "createdAt": "2025-11-21T12:00:00Z",
    "updatedAt": "2025-11-21T12:00:00Z"
  }
}
```

---

### Update User Profile

```http
PUT /users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "defaultCurrency": "EUR",
  "timezone": "Europe/London"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    // Updated user object
  }
}
```

---

### Upload Profile Picture

```http
POST /users/:userId/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "profilePictureUrl": "https://cdn.splittab.com/users/user_123/profile.jpg"
  }
}
```

---

### Get User Balances

Get all balances for the current user.

```http
GET /users/:userId/balances
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOwed": 150.00,
      "totalOwing": 75.50,
      "netBalance": 74.50,
      "currency": "USD"
    },
    "balances": [
      {
        "userId": "user_456",
        "userName": "Alice Smith",
        "profilePictureUrl": "https://...",
        "balance": 50.00,
        "currency": "USD",
        "lastExpenseAt": "2025-11-20T15:30:00Z"
      },
      {
        "userId": "user_789",
        "userName": "Bob Jones",
        "profilePictureUrl": "https://...",
        "balance": -25.50,
        "currency": "USD",
        "lastExpenseAt": "2025-11-19T10:00:00Z"
      }
    ]
  }
}
```

---

## Group Endpoints

### List Groups

```http
GET /groups?page=1&limit=20
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "group_123",
      "name": "Roommates",
      "groupType": "home",
      "imageUrl": "https://...",
      "defaultCurrency": "USD",
      "memberCount": 3,
      "yourBalance": -45.00,
      "createdAt": "2025-10-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### Create Group

```http
POST /groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Trip to Paris",
  "groupType": "trip",
  "defaultCurrency": "EUR",
  "simplifyDebts": true
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "group_456",
    "name": "Trip to Paris",
    "groupType": "trip",
    "imageUrl": null,
    "defaultCurrency": "EUR",
    "simplifyDebts": true,
    "members": [
      {
        "userId": "user_123",
        "role": "admin",
        "joinedAt": "2025-11-21T12:00:00Z"
      }
    ],
    "createdBy": "user_123",
    "createdAt": "2025-11-21T12:00:00Z"
  }
}
```

---

### Get Group Details

```http
GET /groups/:groupId
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "group_123",
    "name": "Roommates",
    "description": "Shared apartment expenses",
    "groupType": "home",
    "imageUrl": "https://...",
    "defaultCurrency": "USD",
    "simplifyDebts": true,
    "requireExpenseApproval": false,
    "members": [
      {
        "userId": "user_123",
        "userName": "John Doe",
        "profilePictureUrl": "https://...",
        "role": "admin",
        "joinedAt": "2025-10-01T12:00:00Z"
      },
      {
        "userId": "user_456",
        "userName": "Alice Smith",
        "profilePictureUrl": "https://...",
        "role": "member",
        "joinedAt": "2025-10-02T12:00:00Z"
      }
    ],
    "statistics": {
      "totalExpenses": 45,
      "totalAmount": 2500.00,
      "lastExpenseAt": "2025-11-20T15:30:00Z"
    },
    "createdBy": "user_123",
    "createdAt": "2025-10-01T12:00:00Z",
    "updatedAt": "2025-11-21T12:00:00Z"
  }
}
```

---

### Update Group

```http
PUT /groups/:groupId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "New description",
  "simplifyDebts": false
}
```

**Response**: `200 OK`

---

### Delete Group

```http
DELETE /groups/:groupId
Authorization: Bearer <token>
```

**Response**: `204 No Content`

**Errors**:
- `400`: Cannot delete group with unsettled debts
- `403`: Only admins can delete groups

---

### Invite Member

```http
POST /groups/:groupId/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "friend@example.com"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "inviteId": "invite_xyz",
    "email": "friend@example.com",
    "inviteLink": "https://splittab.com/invite/xyz",
    "expiresAt": "2025-11-28T12:00:00Z"
  }
}
```

---

### Remove Member

```http
DELETE /groups/:groupId/members/:userId
Authorization: Bearer <token>
```

**Response**: `204 No Content`

**Errors**:
- `400`: Cannot remove last admin
- `403`: Only admins can remove members

---

### Get Group Balances

```http
GET /groups/:groupId/balances
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "simplified": [
      {
        "from": "user_123",
        "fromName": "John Doe",
        "to": "user_456",
        "toName": "Alice Smith",
        "amount": 50.00,
        "currency": "USD"
      }
    ],
    "detailed": [
      {
        "userId": "user_123",
        "userName": "John Doe",
        "totalPaid": 500.00,
        "totalOwed": 450.00,
        "netBalance": 50.00
      },
      {
        "userId": "user_456",
        "userName": "Alice Smith",
        "totalPaid": 400.00,
        "totalOwed": 450.00,
        "netBalance": -50.00
      }
    ]
  }
}
```

---

## Expense Endpoints

### List Expenses

```http
GET /expenses?groupId=group_123&page=1&limit=20&category=food_dining
Authorization: Bearer <token>
```

**Query Parameters**:
- `groupId`: Filter by group (optional)
- `category`: Filter by category (optional)
- `startDate`: Filter by start date (optional)
- `endDate`: Filter by end date (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "expense_123",
      "groupId": "group_123",
      "groupName": "Roommates",
      "amount": 45.50,
      "currency": "USD",
      "description": "Dinner at Italian restaurant",
      "category": "food_dining",
      "date": "2025-11-20",
      "notes": "Birthday celebration",
      "splitMethod": "equal",
      "participants": [
        {
          "userId": "user_123",
          "userName": "John Doe",
          "paidAmount": 45.50,
          "owedAmount": 22.75
        },
        {
          "userId": "user_456",
          "userName": "Alice Smith",
          "paidAmount": 0,
          "owedAmount": 22.75
        }
      ],
      "receiptCount": 1,
      "createdBy": "user_123",
      "createdAt": "2025-11-20T20:30:00Z",
      "updatedAt": "2025-11-20T20:30:00Z"
    }
  ],
  "pagination": {
    // ... pagination info
  }
}
```

---

### Create Expense

```http
POST /expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "groupId": "group_123",
  "amount": 45.50,
  "currency": "USD",
  "description": "Dinner at Italian restaurant",
  "category": "food_dining",
  "date": "2025-11-20",
  "notes": "Birthday celebration",
  "splitMethod": "equal",
  "participants": [
    {
      "userId": "user_123",
      "paidAmount": 45.50,
      "owedAmount": 22.75
    },
    {
      "userId": "user_456",
      "paidAmount": 0,
      "owedAmount": 22.75
    }
  ]
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    // Full expense object
  }
}
```

**Validations**:
- `amount`: Must be > 0
- `participants`: Sum of `paidAmount` must equal `amount`
- `participants`: Sum of `owedAmount` must equal `amount`
- All participants must be group members

---

### Get Expense Details

```http
GET /expenses/:expenseId
Authorization: Bearer <token>
```

**Response**: `200 OK`

---

### Update Expense

```http
PUT /expenses/:expenseId
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description",
  "amount": 50.00
}
```

**Response**: `200 OK`

**Notes**:
- Sends notification to all participants
- Creates audit trail entry

---

### Delete Expense

```http
DELETE /expenses/:expenseId
Authorization: Bearer <token>
```

**Response**: `204 No Content`

**Notes**:
- Soft delete (mark as deleted)
- Updates group balances
- Sends notification to participants

---

### Upload Receipt

```http
POST /expenses/:expenseId/receipts
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_or_pdf>
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "receipt_123",
    "expenseId": "expense_123",
    "fileUrl": "https://cdn.splittab.com/receipts/receipt_123.jpg",
    "thumbnailUrl": "https://cdn.splittab.com/receipts/receipt_123_thumb.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024567,
    "ocrStatus": "pending",
    "createdAt": "2025-11-21T12:00:00Z"
  }
}
```

---

### Get Receipt OCR Results

```http
GET /receipts/:receiptId/ocr
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "confidence": 92.5,
    "extractedData": {
      "total": 45.67,
      "subtotal": 42.00,
      "tax": 3.15,
      "tip": 0.52,
      "merchantName": "Restaurant ABC",
      "merchantAddress": "123 Main St",
      "date": "2025-11-21",
      "items": [
        {
          "name": "Burger",
          "quantity": 2,
          "price": 15.00
        }
      ]
    },
    "processedAt": "2025-11-21T12:00:30Z"
  }
}
```

---

## Settlement Endpoints

### List Settlements

```http
GET /settlements?groupId=group_123&page=1&limit=20
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "settlement_123",
      "groupId": "group_123",
      "payer": {
        "userId": "user_456",
        "userName": "Alice Smith"
      },
      "payee": {
        "userId": "user_123",
        "userName": "John Doe"
      },
      "amount": 50.00,
      "currency": "USD",
      "paymentMethod": "venmo",
      "referenceNumber": "VEN123456",
      "confirmed": true,
      "confirmedAt": "2025-11-20T16:00:00Z",
      "date": "2025-11-20",
      "createdAt": "2025-11-20T15:30:00Z"
    }
  ],
  "pagination": {
    // ... pagination info
  }
}
```

---

### Create Settlement

```http
POST /settlements
Authorization: Bearer <token>
Content-Type: application/json

{
  "groupId": "group_123",
  "payerId": "user_456",
  "payeeId": "user_123",
  "amount": 50.00,
  "currency": "USD",
  "paymentMethod": "venmo",
  "referenceNumber": "VEN123456",
  "date": "2025-11-20"
}
```

**Response**: `201 Created`

---

### Confirm Settlement

```http
POST /settlements/:settlementId/confirm
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "settlement_123",
    "confirmed": true,
    "confirmedAt": "2025-11-21T12:00:00Z",
    "confirmedBy": "user_123"
  }
}
```

**Notes**:
- Only payee can confirm
- Updates balances immediately

---

### Delete Settlement

```http
DELETE /settlements/:settlementId
Authorization: Bearer <token>
```

**Response**: `204 No Content`

**Notes**:
- Only creator can delete
- Cannot delete confirmed settlements (must dispute first)

---

## Notification Endpoints

### List Notifications

```http
GET /notifications?unreadOnly=true&page=1&limit=20
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "expense_created",
      "title": "New expense added",
      "message": "Alice added \"Groceries\" for $45.50",
      "read": false,
      "createdAt": "2025-11-21T12:00:00Z",
      "relatedExpense": {
        "id": "expense_123",
        "description": "Groceries"
      }
    }
  ],
  "pagination": {
    // ... pagination info
  }
}
```

---

### Mark as Read

```http
POST /notifications/:notificationId/read
Authorization: Bearer <token>
```

**Response**: `204 No Content`

---

### Mark All as Read

```http
POST /notifications/read-all
Authorization: Bearer <token>
```

**Response**: `204 No Content`

---

## Rate Limiting

### Rate Limits

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/auth/login` | 10 requests | 15 minutes |
| `/auth/register` | 5 requests | 1 hour |
| `/expenses` (POST) | 100 requests | 1 hour |
| `/receipts` (POST) | 50 requests | 1 day |
| All other endpoints | 1000 requests | 15 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1700001600
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 900
  }
}
```

---

## Webhooks (Phase 2)

### Webhook Events

- `expense.created`
- `expense.updated`
- `expense.deleted`
- `settlement.created`
- `settlement.confirmed`
- `group.member_added`
- `group.member_removed`

### Webhook Payload

```json
{
  "event": "expense.created",
  "timestamp": "2025-11-21T12:00:00Z",
  "data": {
    // Event-specific data
  }
}
```

---

## API Versioning

### Version Strategy
- Version in URL: `/v1`, `/v2`
- Maintain backward compatibility for 1 year
- Deprecation warnings in headers

### Deprecation Header

```http
Deprecation: true
Sunset: Sat, 01 Jan 2026 00:00:00 GMT
Link: <https://docs.splittab.com/migration-guide>; rel="deprecation"
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Draft
