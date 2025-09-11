#!/bin/bash

echo "🚀 Starting Real-Time Payment Processing System"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start infrastructure services
echo "📦 Starting infrastructure services (Kafka, PostgreSQL, Zookeeper)..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Copy env.example to .env if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating backend environment file..."
    cp env.example .env
    echo "✅ Backend environment file created. Please review and update .env if needed."
fi

# Start backend in background
echo "🚀 Starting backend server..."
npm start &
BACKEND_PID=$!

# Go back to root directory
cd ..

# Setup frontend
echo "🔧 Setting up frontend..."
cd frontend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Copy env.example to .env.local if .env.local doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating frontend environment file..."
    cp env.example .env.local
    echo "✅ Frontend environment file created. Please review and update .env.local if needed."
fi

# Start frontend
echo "🚀 Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

# Go back to root directory
cd ..

echo ""
echo "✅ System started successfully!"
echo "=============================================="
echo "🌐 Frontend Dashboard: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 Kafka UI: http://localhost:8080"
echo "🗄️  PostgreSQL: localhost:5432"
echo ""
echo "📋 Available API endpoints:"
echo "   GET  /transactions - Get latest transactions"
echo "   GET  /stats - Get system statistics"
echo "   GET  /health - Health check"
echo "   POST /transactions/generate - Generate transaction"
echo ""
echo "🛑 To stop the system:"
echo "   Press Ctrl+C to stop frontend and backend"
echo "   Run 'docker-compose down' to stop infrastructure"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down system..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ System stopped."
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for user to stop
wait
