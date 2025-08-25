#!/bin/bash

# Game Parlour Management System Startup Script

echo "🎮 Starting Game Parlour Management System..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Function to start backend
start_backend() {
    echo "🔧 Starting FastAPI Backend..."
    cd backend
    
    # Install Python dependencies if requirements.txt exists
    if [ -f "requirements.txt" ]; then
        echo "📦 Installing Python dependencies..."
        pip install -r requirements.txt
    fi
    
    # Start FastAPI server in background
    echo "🚀 Starting backend server at http://localhost:8000"
    python main.py &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
}

# Function to start frontend
start_frontend() {
    echo "⚛️  Starting React Frontend..."
    cd frontend
    
    # Install npm dependencies if package.json exists
    if [ -f "package.json" ]; then
        echo "📦 Installing npm dependencies..."
        npm install
    fi
    
    # Start React development server
    echo "🚀 Starting frontend server at http://localhost:3000"
    npm start &
    FRONTEND_PID=$!
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo "✅ Shutdown complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start both servers
start_backend
start_frontend

echo ""
echo "✅ Game Parlour Management System is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait
