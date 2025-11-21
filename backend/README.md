# SplitTab Backend API

Backend API for SplitTab - An expense sharing and bill splitting application.

## 🚀 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+ (via Prisma ORM)
- **Cache**: Redis 7+
- **Authentication**: JWT
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Logging**: Winston

## 📋 Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose (for local development)

## 🛠 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd SplitTab/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables.

### 4. Start services with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### 5. Run database migrations

```bash
npm run migrate
```

### 6. (Optional) Seed database

```bash
npm run db:seed
```

### 7. Start development server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Database
- `npm run migrate` - Run database migrations
- `npm run migrate:deploy` - Deploy migrations (production)
- `npm run db:push` - Push schema changes without migrations
- `npm run db:seed` - Seed database with test data
- `npm run studio` - Open Prisma Studio (database GUI)

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

## 🐳 Docker Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f api
```

### Rebuild containers
```bash
docker-compose up -d --build
```

### Access database shell
```bash
docker-compose exec postgres psql -U splittab -d splittab_dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── index.ts     # Main config
│   │   ├── database.ts  # Prisma client
│   │   └── redis.ts     # Redis client
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── requestLogger.ts
│   │   └── notFound.ts
│   ├── models/          # Business logic models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   │   └── logger.ts    # Winston logger
│   ├── app.ts           # Express app configuration
│   └── index.ts         # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   └── seed.ts          # Seed script
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── .env.example         # Environment variables template
├── Dockerfile           # Docker configuration (dev)
├── Dockerfile.prod      # Docker configuration (prod)
├── docker-compose.yml   # Docker Compose config
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.json       # ESLint configuration
├── .prettierrc.json     # Prettier configuration
└── package.json         # Dependencies and scripts
```

## 🔐 Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `ALLOWED_ORIGINS` - CORS allowed origins

## 🧪 Testing

Run tests with:
```bash
npm test
```

Generate coverage report:
```bash
npm run test:coverage
```

## 📚 API Documentation

API documentation will be available at:
- Development: `http://localhost:3000/api/v1/docs`
- Swagger/OpenAPI spec (coming soon)

## 🔄 Database Migrations

### Create a new migration
```bash
npx prisma migrate dev --name <migration-name>
```

### Apply migrations
```bash
npm run migrate
```

### Reset database (⚠️ destructive)
```bash
npx prisma migrate reset
```

## 🏗 Development Workflow

1. Create a new branch from `develop`
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Commit your changes
6. Push and create a pull request

## 🐛 Debugging

### VS Code Launch Configuration
Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 📝 Code Style

This project uses:
- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** strict mode

Code is automatically formatted on commit using Git hooks (coming soon).

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting PR

## 📄 License

ISC

## 🆘 Troubleshooting

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres
```

### Prisma Client out of sync
```bash
# Regenerate Prisma Client
npx prisma generate
```

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ by the SplitTab Team**
