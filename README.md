# 💳 Real-Time Payment Processing System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production-success.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Next.js](https://img.shields.io/badge/next.js-13.5.6-black.svg)

> A production-ready, full-stack real-time payment processing system with <200ms latency, fraud detection, and live transaction monitoring.

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)

## 🎯 Overview

A high-performance payment processing system that simulates real-world fintech infrastructure with real-time transaction monitoring, automated fraud detection, and comprehensive analytics. Built for production use with Docker containerization, cloud deployment guides, and enterprise-grade security.

### Key Highlights

- ⚡ **Sub-200ms Latency**: Optimized transaction processing pipeline
- 🛡️ **Fraud Detection**: ML-based risk scoring and velocity checks
- 📊 **Real-Time Dashboard**: Live transaction monitoring with WebSocket updates
- 🔒 **Production Ready**: Security middleware, rate limiting, and error tracking
- 🚀 **Cloud Deployed**: Fully configured for Render (backend) and Netlify (frontend)

## ✨ Features

### 🔄 Real-Time Processing
- WebSocket-based live transaction streaming
- Automatic stats refresh on new transactions
- Real-time balance validation and updates

### 🛡️ Security & Fraud Detection
- Automated fraud risk scoring (0-1 scale)
- Velocity checks and amount-based anomaly detection
- Merchant reputation analysis

### 📊 Analytics & Monitoring
- Real-time transaction volume charts
- Approval rate tracking and system latency metrics
- Uptime monitoring (99.99% target)

### 🎨 User Interface
- Modern dark-themed dashboard with animated effects
- Responsive design with interactive visualizations

### 🔧 Production Features
- JWT authentication, rate limiting, request validation
- Structured logging, health checks, keep-alive service

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend (Netlify)                          │  │
│  │  • Dashboard UI                                      │  │
│  │  • WebSocket Client                                  │  │
│  │  • Real-time Charts                                  │  │
│  └──────────────┬───────────────────────────────────────┘  │
└─────────────────┼──────────────────────────────────────────┘
                  │ HTTP/WebSocket
┌─────────────────▼──────────────────────────────────────────┐
│                     API LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express.js Backend (Render)                         │  │
│  │  • REST API Endpoints                                │  │
│  │  • WebSocket Server                                  │  │
│  │  • Authentication Middleware                         │  │
│  │  • Rate Limiting                                     │  │
│  └──────────────┬───────────────────────────────────────┘  │
└─────────────────┼──────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────┐
│                  PROCESSING LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Transaction  │  │   Fraud      │  │   Payment    │   │
│  │  Processor   │─►│  Detection   │─►│   Gateway    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────┬──────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL (Render)                                 │  │
│  │  • Transactions                                      │  │
│  │  • Users & Balances                                  │  │
│  │  • Audit Logs                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Redis (Optional - Caching & Rate Limiting)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Overview

| Component | Technology | Purpose | Location |
|-----------|-----------|---------|----------|
| **Frontend** | Next.js 13 + TypeScript | Dashboard UI | `frontend/` |
| **Backend API** | Express.js + Node.js | REST endpoints | `backend/server.js` |
| **WebSocket** | ws library | Real-time updates | `backend/server.js` |
| **Transaction Processor** | Custom Service | Transaction generation | `backend/services/transactionProcessor.js` |
| **Fraud Detection** | ML-based Service | Risk scoring | `backend/services/fraudDetection.js` |
| **Payment Gateway** | Stripe/Square/PayPal/Mock | Payment processing | `backend/services/paymentGateway.js` |
| **Database** | PostgreSQL | Data persistence | Render PostgreSQL |
| **Cache** | Redis (optional) | Performance optimization | External service |

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express.js | 4.18+ | Web framework |
| PostgreSQL | Latest | Primary database |
| WebSocket (ws) | 8.14+ | Real-time communication |
| JWT | 9.0+ | Authentication |
| Winston | 3.11+ | Logging |
| Joi | 17.11+ | Validation |
| Redis (ioredis) | 5.3+ | Caching & rate limiting |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 13.5.6 | React framework |
| TypeScript | 5.2+ | Type safety |
| Tailwind CSS | 3.3+ | Styling |
| Recharts | 2.8+ | Data visualization |
| Framer Motion | 10.16+ | Animations |
| Three.js | 0.182+ | 3D graphics |

### Infrastructure
| Service | Purpose | Provider |
|---------|---------|----------|
| Backend Hosting | API server | Render |
| Frontend Hosting | Static site | Netlify |
| Database | PostgreSQL | Render |
| Cache (Optional) | Redis | External |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker & Docker Compose (for local development)
- PostgreSQL (or use Docker)

### Local Development

```bash
# Clone and setup
git clone https://github.com/ArivunidhiA/Real-Time-Payment-Processing-System.git
cd Real-Time-Payment-Processing-System

# Start PostgreSQL
docker-compose up -d postgres

# Backend
cd backend && npm install && cp env.example .env
# Edit .env with DATABASE_URL, then: npm start

# Frontend (new terminal)
cd frontend && npm install && cp env.example .env.local
# Edit .env.local with NEXT_PUBLIC_BACKEND_URL=http://localhost:3001, then: npm run dev

# Access: http://localhost:3000 (frontend) | http://localhost:3001 (backend)
```

## 📡 API Documentation

### REST Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/transactions` | Get latest transactions | Optional |
| `GET` | `/api/stats` | Get system statistics | Optional |
| `GET` | `/api/health` | Health check | Public |
| `POST` | `/api/transactions/generate` | Generate single transaction | Public |
| `POST` | `/api/transactions/producer/start` | Start transaction producer | Public |
| `POST` | `/api/transactions/producer/stop` | Stop transaction producer | Public |

### WebSocket

```
ws://localhost:3001/stream
wss://your-backend.onrender.com/stream (production)
```

**Message Format:**
```json
{
  "type": "transaction",
  "data": {
    "transaction_id": "txn_123",
    "user_id": 1,
    "amount": 99.99,
    "merchant": "Amazon",
    "status": "APPROVED",
    "timestamp": "2025-12-22T10:00:00Z"
  }
}
```

## 🌐 Deployment

### Backend (Render)
1. Create PostgreSQL database on Render
2. Create Web Service → Connect GitHub repo
3. Set build: `cd backend && npm install`, start: `cd backend && npm start`
4. Add env vars: `DATABASE_URL`, `NODE_ENV=production`, `PORT=10000`, `ENABLE_KEEP_ALIVE=true`, `SERVICE_URL`

### Frontend (Netlify)
1. Import repository on Netlify
2. Set base: `frontend`, build: `npm install && npm run build`, publish: `.next`
3. Add env var: `NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com`

📖 **Detailed Guides:** `RENDER_BACKEND_DEPLOYMENT.md` | `NETLIFY_DEPLOYMENT.md`

## 📁 Project Structure

```
Real-Time-Payment-Processing-System/
├── backend/
│   ├── server.js                 # Main Express server
│   ├── routes.js                 # API route definitions
│   ├── db/
│   │   ├── schema.sql            # Database schema
│   │   └── db.js                 # Database queries
│   ├── services/
│   │   ├── transactionProcessor.js
│   │   ├── fraudDetection.js
│   │   └── paymentGateway.js
│   ├── middleware/               # Auth, validation, rate limiting
│   └── utils/                    # Logging, keep-alive
├── frontend/
│   ├── pages/
│   │   └── index.tsx             # Main dashboard
│   ├── components/
│   │   ├── StatsCards.tsx
│   │   ├── TransactionTable.tsx
│   │   └── VolumeChart.tsx
│   └── components/ui/            # shadcn/ui components
├── docker-compose.yml             # Local PostgreSQL setup
└── netlify.toml                   # Netlify configuration
```

## 🔐 Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production
PORT=10000
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=https://your-site.netlify.app
ENABLE_KEEP_ALIVE=true
SERVICE_URL=https://your-backend.onrender.com
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for real-time payment processing** | [Live Demo](https://real-time-payment-processing.netlify.app) | [Report Bug](https://github.com/ArivunidhiA/Real-Time-Payment-Processing-System/issues)
