# Real-Time Payment Processing System

A production-ready, full-stack real-time payment processing system built with Node.js, Next.js, Apache Kafka, and PostgreSQL. This system simulates a fintech infrastructure with <200ms latency and 99.99% uptime metrics.

## 📸 Live Demo

### Real-Time Dashboard
![Real-Time Payment Dashboard](cc1.png)
*Live dashboard showing real-time transaction monitoring, KPI cards, and system analytics*

### Transaction Processing
![Recent Transactions Table](cc2.png)
*Real-time transaction table with fraud detection and balance validation in action*

## 🚀 Features

- **Real-time Transaction Processing**: Kafka-based event streaming with WebSocket updates
- **Fraud Detection**: Automated fraud checks for high-value transactions (>$5000)
- **Balance Validation**: Real-time balance checking and updates
- **Live Dashboard**: Real-time transaction monitoring with charts and analytics
- **High Performance**: Simulated <200ms latency and 99.99% uptime
- **Production Ready**: Docker containerization and cloud deployment guides

## 📋 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Infrastructure│
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Kafka + DB)  │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • Kafka Broker  │
│ • Real-time UI  │    │ • WebSocket     │    │ • PostgreSQL    │
│ • Charts        │    │ • Consumer      │    │ • Zookeeper     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API and WebSocket server
- **Apache Kafka** - Event streaming and message queuing
- **PostgreSQL** - Transaction and user data storage
- **WebSocket** - Real-time communication

### Frontend
- **Next.js** - React framework with SSR
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization library

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local development environment

## 📁 Project Structure

```
real-time-payments/
├── backend/
│   ├── server.js              # Main server file
│   ├── kafka/
│   │   ├── producer.js        # Transaction producer
│   │   └── consumer.js        # Transaction consumer
│   ├── db/
│   │   ├── schema.sql         # Database schema
│   │   └── db.js             # Database connection & queries
│   ├── routes.js             # API routes
│   ├── package.json          # Backend dependencies
│   └── env.example           # Environment variables template
├── frontend/
│   ├── pages/
│   │   ├── index.js          # Main dashboard page
│   │   └── _app.js           # App wrapper
│   ├── components/
│   │   ├── StatsCards.js     # KPI cards component
│   │   ├── VolumeChart.js    # Transaction volume chart
│   │   └── TransactionTable.js # Transaction table
│   ├── styles/
│   │   └── globals.css       # Global styles
│   ├── package.json          # Frontend dependencies
│   └── env.example           # Environment variables template
├── docker-compose.yml        # Local development setup
└── README.md                 # This file
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 16+ and npm
- Docker and Docker Compose

### 1. Clone and Setup
```bash
git clone <repository-url>
cd real-time-payments
```

### 2. Start Infrastructure
```bash
# Start Kafka, PostgreSQL, and Zookeeper
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose logs -f
```

### 3. Setup Backend
```bash
cd backend
npm install

# Copy environment file
cp env.example .env

# Edit .env file with your settings
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/real_time_payments
# KAFKA_BROKER=localhost:9092
# PORT=3001

# Start backend server
npm start
```

### 4. Setup Frontend
```bash
cd frontend
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local file
# NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Start frontend development server
npm run dev
```

### 5. Access the Application
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Kafka UI**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## 📊 API Endpoints

### REST API
- `GET /transactions` - Get latest 50 transactions
- `GET /stats` - Get system statistics and metrics
- `GET /health` - Health check endpoint
- `POST /transactions/generate` - Generate a single transaction
- `POST /transactions/producer/start` - Start transaction producer
- `POST /transactions/producer/stop` - Stop transaction producer

### WebSocket
- `ws://localhost:3001/stream` - Real-time transaction stream

### Example API Usage
```bash
# Get transactions
curl http://localhost:3001/transactions

# Get system stats
curl http://localhost:3001/stats

# Generate a transaction
curl -X POST http://localhost:3001/transactions/generate
```

## 🚀 Production Deployment

### Backend Deployment (Render/Heroku)

#### Option 1: Render Deployment

1. **Create Render Account**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub repository

2. **Setup Confluent Cloud Kafka**
   - Sign up at [confluent.cloud](https://confluent.cloud)
   - Create a new cluster (free tier available)
   - Create a topic named `transactions`
   - Get your cluster credentials

3. **Setup Database**
   - Use Render PostgreSQL or Supabase
   - Create a new PostgreSQL database
   - Run the schema from `backend/db/schema.sql`

4. **Deploy Backend**
   - Create a new Web Service on Render
   - Connect your GitHub repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Add environment variables:
     ```
     DATABASE_URL=postgresql://user:pass@host:port/db
     KAFKA_BROKER=pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
     KAFKA_USERNAME=your_username
     KAFKA_PASSWORD=your_password
     KAFKA_TOPIC=transactions
     NODE_ENV=production
     PORT=10000
     ```

#### Option 2: Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   cd backend
   heroku create your-app-name
   ```

3. **Add PostgreSQL Addon**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Setup Confluent Cloud Kafka** (same as Render)

5. **Set Environment Variables**
   ```bash
   heroku config:set DATABASE_URL=$(heroku config:get DATABASE_URL)
   heroku config:set KAFKA_BROKER=pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
   heroku config:set KAFKA_USERNAME=your_username
   heroku config:set KAFKA_PASSWORD=your_password
   heroku config:set KAFKA_TOPIC=transactions
   heroku config:set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   git subtree push --prefix backend heroku main
   ```

### Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub repository

2. **Deploy Frontend**
   - Import your repository on Vercel
   - Set root directory to `frontend`
   - Add environment variable:
     ```
     NEXT_PUBLIC_BACKEND_URL=https://your-backend-app.onrender.com
     ```
   - Deploy

3. **Custom Domain (Optional)**
   - Add your custom domain in Vercel dashboard
   - Update DNS settings as instructed

## 🔧 Environment Variables

### Backend (.env)
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/real_time_payments

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_TOPIC=transactions

# Server Configuration
PORT=3001
NODE_ENV=development

# Confluent Cloud Kafka (for production)
KAFKA_BROKER=pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
KAFKA_USERNAME=your_username
KAFKA_PASSWORD=your_password
```

### Frontend (.env.local)
```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# For production
NEXT_PUBLIC_BACKEND_URL=https://your-backend-app.onrender.com
```

## 📈 Monitoring and Metrics

### System Metrics
- **Latency**: Simulated <200ms average processing time
- **Uptime**: Simulated 99.99% availability
- **Throughput**: Real-time transactions per second
- **Approval Rate**: Percentage of approved transactions

### Monitoring Tools
- **Kafka UI**: http://localhost:8080 (local development)
- **Health Check**: `GET /health` endpoint
- **Real-time Dashboard**: Live transaction monitoring

## 🧪 Testing

### Manual Testing
1. Start the system using Docker Compose
2. Open the frontend dashboard
3. Click "Generate Transaction" to create test transactions
4. Monitor real-time updates in the dashboard
5. Check Kafka UI for message flow

### Load Testing
```bash
# Generate multiple transactions
for i in {1..10}; do
  curl -X POST http://localhost:3001/transactions/generate
  sleep 1
done
```

## 🔒 Security Considerations

- Environment variables for sensitive data
- Database connection encryption in production
- Kafka authentication for cloud deployment
- CORS configuration for API access
- Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

1. **Kafka Connection Failed**
   - Ensure Docker services are running: `docker-compose ps`
   - Check Kafka logs: `docker-compose logs kafka`
   - Verify broker address in environment variables

2. **Database Connection Failed**
   - Check PostgreSQL is running: `docker-compose logs postgres`
   - Verify DATABASE_URL format
   - Ensure database exists and schema is loaded

3. **WebSocket Connection Failed**
   - Check backend server is running
   - Verify WebSocket URL in frontend
   - Check browser console for errors

4. **Frontend Not Loading**
   - Verify NEXT_PUBLIC_BACKEND_URL is set correctly
   - Check backend API is accessible
   - Ensure all dependencies are installed

### Logs and Debugging
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f kafka
docker-compose logs -f postgres

# Backend logs
cd backend && npm start

# Frontend logs
cd frontend && npm run dev
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the deployment guides

---

**Built with ❤️ for real-time payment processing**
