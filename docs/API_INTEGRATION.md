# API Integration Guide

Guide for integrating with the SplitTab backend API from both Web and iOS applications.

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Making Requests](#making-requests)
4. [Error Handling](#error-handling)
5. [Web Integration](#web-integration)
6. [iOS Integration](#ios-integration)
7. [Common Patterns](#common-patterns)
8. [Best Practices](#best-practices)

## API Overview

### Base URL

```
Development: http://localhost:3000/v1
Production:  https://api.splittab.com/v1
```

### Response Format

All API responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-01T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-01T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  },
  "meta": { ... }
}
```

## Authentication

### JWT Tokens

SplitTab uses JWT (JSON Web Tokens) for authentication.

**Token Types:**
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (30 days), used to get new access tokens

### Login Flow

1. User submits credentials
2. API returns access token and refresh token
3. Store tokens securely
4. Include access token in subsequent requests
5. Refresh access token when expired

### Token Storage

**Web (Browser):**
- Access Token: localStorage
- Refresh Token: localStorage (httpOnly cookie preferred)

**iOS:**
- Both tokens: iOS Keychain

### Authentication Endpoints

**Login:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900,
    "user": { ... }
  }
}
```

**Refresh Token:**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Logout:**
```http
POST /auth/logout
Authorization: Bearer eyJhbGc...
```

## Making Requests

### Including Authentication

Add the access token to the Authorization header:

```http
GET /users/me
Authorization: Bearer eyJhbGc...
```

### Common Endpoints

**Users:**
```http
GET    /users/me              # Get current user
PATCH  /users/me              # Update profile
POST   /users/me/profile-picture  # Upload profile picture
```

**Groups:**
```http
GET    /groups                # List groups (paginated)
POST   /groups                # Create group
GET    /groups/:id            # Get group details
PATCH  /groups/:id            # Update group
DELETE /groups/:id            # Delete group
POST   /groups/:id/members    # Add member
DELETE /groups/:id/members/:userId  # Remove member
```

**Expenses:**
```http
GET    /expenses              # List expenses (paginated)
POST   /expenses              # Create expense
GET    /expenses/:id          # Get expense details
PATCH  /expenses/:id          # Update expense
DELETE /expenses/:id          # Delete expense
POST   /expenses/:id/receipt  # Upload receipt
GET    /groups/:id/expenses   # Get group expenses
```

**Settlements:**
```http
GET    /settlements           # List settlements
POST   /settlements           # Create settlement
GET    /settlements/:id       # Get settlement details
POST   /settlements/:id/mark-paid  # Mark as paid
POST   /settlements/:id/cancel     # Cancel settlement
```

**Balances:**
```http
GET    /balances              # Get all balances
GET    /groups/:id/balances   # Get group balances
```

## Error Handling

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/expired token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

### Error Types

**Validation Error:**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

**Authentication Error:**
```json
{
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

**Not Found:**
```json
{
  "code": "NOT_FOUND",
  "message": "Resource not found"
}
```

## Web Integration

### API Client Setup

```typescript
import { createAPIClient } from '@splittab/shared';
import { TokenManager } from '@/lib/api-client';

const apiClient = createAPIClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  apiVersion: 'v1',
  getAccessToken: async () => TokenManager.getAccessToken(),
  onTokenExpired: async () => {
    // Refresh token or redirect to login
    await refreshTokens();
  },
  onError: (error) => {
    console.error('API Error:', error);
  },
});
```

### Making Requests

```typescript
// GET request
const user = await apiClient.get<User>('/users/me');

// POST request
const group = await apiClient.post<Group>('/groups', {
  name: 'Trip to Paris',
  currency: 'EUR',
});

// PATCH request
const updated = await apiClient.patch<User>('/users/me', {
  name: 'New Name',
});

// DELETE request
await apiClient.delete(`/groups/${groupId}`);

// Paginated request
const groups = await apiClient.requestPaginated<Group>(
  '/groups',
  1,  // page
  20  // limit
);

// Upload file
const receipt = await apiClient.upload<Receipt>(
  `/expenses/${expenseId}/receipt`,
  file
);
```

### With React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query
const { data: user, isLoading, error } = useQuery({
  queryKey: ['user'],
  queryFn: () => apiClient.get<User>('/users/me'),
});

// Mutation
const queryClient = useQueryClient();

const createGroupMutation = useMutation({
  mutationFn: (data: GroupCreate) => apiClient.post<Group>('/groups', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  },
});
```

## iOS Integration

### Network Manager Setup

The NetworkManager is already configured in the iOS app.

### Making Requests

```swift
// GET request
let user: User = try await NetworkManager.shared.request(.currentUser)

// POST request
let expenseData = ExpenseCreate(...)
let expense: Expense = try await NetworkManager.shared.request(
    .expenses,
    method: .post,
    body: expenseData
)

// PATCH request
let updateData = UserProfileUpdate(name: "New Name")
let updated: User = try await NetworkManager.shared.request(
    .updateProfile,
    method: .patch,
    body: updateData
)

// DELETE request
try await NetworkManager.shared.requestEmpty(
    .group(groupId),
    method: .delete
)

// Paginated request
let groups: PaginatedResponse<Group> = try await NetworkManager.shared.requestPaginated(
    .groups,
    page: 1,
    limit: 20
)

// Upload file
let receipt: Receipt = try await NetworkManager.shared.upload(
    .uploadReceipt(expenseId),
    fileData: imageData,
    fileName: "receipt.jpg",
    mimeType: "image/jpeg"
)
```

### In ViewModels

```swift
@MainActor
class GroupsViewModel: ObservableObject {
    @Published var groups: [Group] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func fetchGroups() async {
        isLoading = true
        errorMessage = nil

        do {
            let response: PaginatedResponse<Group> = try await NetworkManager.shared.requestPaginated(
                .groups,
                page: 1,
                limit: 20
            )
            groups = response.data
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func createGroup(_ data: GroupCreate) async throws {
        let group: Group = try await NetworkManager.shared.request(
            .groups,
            method: .post,
            body: data
        )
        groups.append(group)
    }
}
```

## Common Patterns

### Pagination

**Web:**
```typescript
const [page, setPage] = useState(1);

const { data } = useQuery({
  queryKey: ['groups', page],
  queryFn: () => apiClient.requestPaginated<Group>('/groups', page, 20),
});

// Next page
if (data?.pagination.hasNext) {
  setPage(page + 1);
}
```

**iOS:**
```swift
@Published var groups: [Group] = []
@Published var currentPage = 1
@Published var hasNextPage = true

func loadMore() async {
    guard hasNextPage else { return }

    let response: PaginatedResponse<Group> = try await NetworkManager.shared.requestPaginated(
        .groups,
        page: currentPage,
        limit: 20
    )

    groups.append(contentsOf: response.data)
    currentPage += 1
    hasNextPage = response.pagination.hasNext
}
```

### Optimistic Updates

**Web:**
```typescript
const updateExpenseMutation = useMutation({
  mutationFn: (data) => apiClient.patch(`/expenses/${id}`, data),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['expense', id] });
    const previous = queryClient.getQueryData(['expense', id]);
    queryClient.setQueryData(['expense', id], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['expense', id], context?.previous);
  },
});
```

### Caching

**Web (React Query):**
```typescript
const { data } = useQuery({
  queryKey: ['user'],
  queryFn: () => apiClient.get<User>('/users/me'),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**iOS:**
```swift
// Manual caching
private var cachedGroups: [Group]?
private var cacheExpiry: Date?

func fetchGroups() async throws -> [Group] {
    if let cached = cachedGroups,
       let expiry = cacheExpiry,
       Date() < expiry {
        return cached
    }

    let response: PaginatedResponse<Group> = try await NetworkManager.shared.requestPaginated(.groups)
    cachedGroups = response.data
    cacheExpiry = Date().addingTimeInterval(5 * 60) // 5 minutes
    return response.data
}
```

## Best Practices

### 1. Token Management

- Store tokens securely (Keychain for iOS, localStorage/cookie for web)
- Implement automatic token refresh
- Clear tokens on logout
- Handle 401 responses globally

### 2. Error Handling

- Display user-friendly error messages
- Log errors for debugging
- Implement retry logic for transient failures
- Handle network offline state

### 3. Loading States

- Show loading indicators during requests
- Implement skeleton screens for better UX
- Disable buttons during submission
- Show progress for long operations

### 4. Validation

- Validate input on client side before API call
- Handle validation errors from API
- Display field-specific error messages
- Prevent duplicate submissions

### 5. Performance

- Implement pagination for large lists
- Cache frequently accessed data
- Use optimistic updates for better UX
- Debounce search and autocomplete

### 6. Security

- Never log sensitive data (tokens, passwords)
- Use HTTPS in production
- Validate all user input
- Implement CSRF protection

## Testing

### Mock API Responses

**Web:**
```typescript
// Mock Service Worker (MSW)
import { rest } from 'msw';

export const handlers = [
  rest.get('/users/me', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: { id: '1', name: 'Test User', email: 'test@example.com' },
      })
    );
  }),
];
```

**iOS:**
```swift
// Protocol-based mocking
protocol NetworkManagerProtocol {
    func request<T: Codable>(_ endpoint: APIEndpoint, method: HTTPMethod, body: Encodable?) async throws -> T
}

class MockNetworkManager: NetworkManagerProtocol {
    var mockResponse: Any?

    func request<T: Codable>(_ endpoint: APIEndpoint, method: HTTPMethod, body: Encodable?) async throws -> T {
        return mockResponse as! T
    }
}
```

## Resources

- [Backend API Specifications](./API-Specifications.md)
- [Data Models Documentation](./Data-Models.md)
- [Frontend Setup Guide](./FRONTEND_SETUP.md)

## Troubleshooting

### Cannot connect to API

1. Check API URL in configuration
2. Ensure backend is running
3. Check network connectivity
4. Verify CORS settings (web only)

### 401 Unauthorized

1. Check access token is valid
2. Try refreshing token
3. Re-authenticate if refresh fails
4. Check token expiry time

### 400 Bad Request

1. Check request payload format
2. Verify required fields are present
3. Validate data types
4. Check API documentation

### Network timeout

1. Check internet connection
2. Increase timeout value
3. Implement retry logic
4. Check API performance
