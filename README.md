# SplitTab - Expense Sharing & Bill Splitting Application

![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![License](https://img.shields.io/badge/license-ISC-green)

SplitTab is a comprehensive expense sharing and bill splitting application inspired by Splitwise. It features receipt scanning with OCR, real-time notifications, advanced analytics, and seamless expense management across groups.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## ✨ Features

### Phase 1 (MVP) - ✅ Completed
- User authentication (JWT-based)
- Group management
- Expense creation and tracking
- Multiple split methods (equal, unequal, percentage)
- Balance calculation
- Settlement tracking
- Basic notifications

### Phase 2 (Enhanced Features) - ✅ Completed
- Receipt scanning with OCR (Google Cloud Vision, AWS Textract)
- Background job processing with Bull Queue
- Manual OCR correction
- Advanced split methods
- File upload management with S3

### Phase 3 (Advanced Features) - ✅ Completed
- Real-time updates with Socket.IO
- Comprehensive notification system
- Analytics and reporting
- Spending trends
- Priority-based notifications

## 🚀 Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Cache:** Redis 7+
- **Queue:** Bull
- **Real-time:** Socket.IO
- **Authentication:** JWT
- **Validation:** Zod

### Infrastructure
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions
- **File Storage:** AWS S3
- **OCR:** Google Cloud Vision, AWS Textract
- **Monitoring:** Winston Logger

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **PostgreSQL** >= 15
- **Redis** >= 7
- **Docker** and **Docker Compose** (optional, for containerized setup)
- **Git**

## 🛠 Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SplitTab
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Start PostgreSQL and Redis

#### Option A: Using Docker
```bash
docker run -d --name splittab-postgres \
  -e POSTGRES_USER=splittab \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=splittab_dev \
  -p 5432:5432 \
  postgres:15-alpine

docker run -d --name splittab-redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### Option B: Using Local Installation
Ensure PostgreSQL and Redis are running on your system.

### 5. Run Database Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 6. (Optional) Seed Database

```bash
npm run db:seed
```

### 7. Start Development Server

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start OCR worker
npm run dev:worker
```

The API will be available at `http://localhost:3000/api/v1`

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

1. **Create `.env` file**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - API Server (port 3000)
   - OCR Worker (background process)

3. **Run database migrations**
   ```bash
   docker-compose exec api npx prisma migrate deploy
   ```

4. **View logs**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f api
   docker-compose logs -f worker
   ```

5. **Stop all services**
   ```bash
   docker-compose down
   ```

6. **Stop and remove volumes**
   ```bash
   docker-compose down -v
   ```

## 🔐 Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Environment
NODE_ENV=development

# Server
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://splittab:password@localhost:5432/splittab_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
UPLOAD_DIR=./uploads/receipts
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=splittab-uploads

# OCR Configuration
OCR_PROVIDER=google # Options: google, aws, both
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./google-cloud-credentials.json
AWS_TEXTRACT_REGION=us-east-1
OCR_CONFIDENCE_THRESHOLD=0.8
OCR_MAX_RETRIES=3

# Background Jobs (Bull Queue)
BULL_REDIS_HOST=localhost
BULL_REDIS_PORT=6379
BULL_REDIS_PASSWORD=
OCR_QUEUE_CONCURRENCY=5

# Logging
LOG_LEVEL=debug
```

## 💾 Database Setup

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: destroys all data)
npx prisma migrate reset
```

### Database Studio

View and edit data using Prisma Studio:

```bash
npm run studio
```

Open `http://localhost:5555` in your browser.

## 🏃 Running the Application

### Development Mode

```bash
# Start API server with hot reload
npm run dev

# Start OCR worker with hot reload
npm run dev:worker
```

### Production Mode

```bash
# Build the application
npm run build

# Start API server
npm start

# Start OCR worker
npm run start:worker
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Health Check
```
GET /api/v1/health
```

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### User Endpoints
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update current user
- `GET /api/v1/users/:id` - Get user by ID

### Group Endpoints
- `GET /api/v1/groups` - List user's groups
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups/:id` - Get group details
- `PATCH /api/v1/groups/:id` - Update group
- `DELETE /api/v1/groups/:id` - Delete group

### Expense Endpoints
- `GET /api/v1/expenses` - List expenses
- `POST /api/v1/expenses` - Create expense
- `GET /api/v1/expenses/:id` - Get expense details
- `PATCH /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

### Receipt Endpoints
- `POST /api/v1/receipts/upload` - Upload receipt
- `GET /api/v1/receipts/:id` - Get receipt details
- `PATCH /api/v1/receipts/:id/corrections` - Submit OCR corrections

### Notification Endpoints
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/unread/count` - Get unread count
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `PATCH /api/v1/notifications/mark-all-read` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Analytics Endpoints
- `GET /api/v1/analytics/overview` - Get overview statistics
- `GET /api/v1/analytics/receipts` - Get receipt analytics
- `GET /api/v1/analytics/expenses` - Get expense analytics
- `GET /api/v1/analytics/trends` - Get spending trends

### WebSocket Events

Connect to `ws://localhost:3000` with authentication token:

**Client → Server:**
- `join:group` - Join a group room
- `leave:group` - Leave a group room

**Server → Client:**
- `connected` - Connection established
- `notification:new` - New notification received
- `receipt:updated` - Receipt updated
- `expense:updated` - Expense updated
- `settlement:updated` - Settlement updated

## 📁 Project Structure

```
SplitTab/
├── backend/
│   ├── prisma/
│   │   ├── migrations/        # Database migrations
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── workers/           # Background workers
│   │   ├── app.ts             # Express app setup
│   │   └── index.ts           # Server entry point
│   ├── tests/                 # Test files
│   │   ├── api/               # API integration tests
│   │   ├── integration/       # Integration tests
│   │   └── unit/              # Unit tests
│   ├── uploads/               # File uploads directory
│   ├── .env.example           # Environment variables template
│   ├── docker-compose.yml     # Docker Compose configuration
│   ├── Dockerfile             # Development Dockerfile
│   ├── Dockerfile.prod        # Production Dockerfile
│   ├── jest.config.js         # Jest configuration
│   ├── package.json           # Dependencies
│   └── tsconfig.json          # TypeScript configuration
├── docs/                      # Project documentation
│   ├── API-Specifications.md
│   ├── Data-Models.md
│   ├── Implementation-Roadmap.md
│   ├── Phase-1-MVP.md
│   ├── Phase-2-Enhanced-Features.md
│   ├── Phase-3-Advanced-Features.md
│   ├── Security-Compliance.md
│   ├── Technical-Architecture.md
│   ├── Testing-Strategy.md
│   └── UI-UX-Guidelines.md
└── README.md                  # This file
```

## 🔄 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Write code following the project's coding standards
- Add tests for new functionality
- Update documentation as needed

### 3. Run Tests and Linting
```bash
npm test
npm run lint
npm run format
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -U splittab -d splittab_dev
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
redis-cli ping
```

### Prisma Issues
```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database
npx prisma migrate reset
```

### Docker Issues
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# View container logs
docker-compose logs -f
```

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Use strong JWT secrets** in production
3. **Enable HTTPS** in production
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Follow rate limiting** - Already configured in the application
6. **Sanitize user input** - Using Zod validation
7. **Use prepared statements** - Prisma handles this automatically

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Team

- **Product Team:** product@splittab.com
- **Engineering Team:** engineering@splittab.com
- **Design Team:** design@splittab.com

## 🔗 Links

- [Full Documentation](./docs/README.md)
- [API Specifications](./docs/API-Specifications.md)
- [Technical Architecture](./docs/Technical-Architecture.md)
- [Security & Compliance](./docs/Security-Compliance.md)
- [Testing Strategy](./docs/Testing-Strategy.md)

---

**Built with ❤️ by the SplitTab Team**

**Last Updated:** 2025-11-21
