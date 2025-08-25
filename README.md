# 🎮 Game Parlour Management System

A complete web application for managing gaming tables, tracking sessions, and calculating charges automatically. Built with React frontend and FastAPI backend.

## 🌟 Features

### Admin Panel
- **Table Management**: Create, update, and delete gaming tables
- **Rate Setting**: Set hourly rates for each table
- **QR Code Generation**: Automatic QR code generation for each table
- **Session Tracking**: Monitor all active and completed sessions
- **Revenue Dashboard**: Real-time statistics and revenue tracking

### User Experience
- **QR Code Scanning**: Users scan table QR codes to start sessions
- **Simple Registration**: Quick user details entry (name and phone)
- **Real-time Tracking**: Live session timer and charge calculation
- **Automatic Billing**: Precise billing based on actual usage time
- **Session Management**: Easy session start/end process

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│    │ SQLite Database │
│                 │    │                 │    │                 │
│ • Admin Panel   │◄──►│ • REST APIs     │◄──►│ • Tables        │
│ • User Interface│    │ • Session Mgmt  │    │ • Sessions      │
│ • QR Integration│    │ • Charge Calc   │    │ • Users         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ 
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI server**
   ```bash
   python main.py
   ```
   
   The backend will run at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the React development server**
   ```bash
   npm start
   ```
   
   The frontend will run at `http://localhost:3000`

## 📱 Usage Flow

### For Administrators

1. **Access Admin Panel**
   - Navigate to `http://localhost:3000/admin`
   - View dashboard with statistics

2. **Create Tables**
   - Add table number (e.g., "T001")
   - Set hourly rate (e.g., ₹100/hour)
   - QR code generates automatically

3. **Manage Sessions**
   - Monitor active sessions
   - View session history
   - Track revenue

### For Users

1. **Scan QR Code**
   - Users scan the QR code on their gaming table
   - Redirects to table information page

2. **Enter Details**
   - Provide name and phone number
   - Click "Start Gaming Session"

3. **Gaming Session**
   - Session timer starts automatically
   - Real-time charge calculation
   - End session when done

4. **Billing**
   - Automatic bill generation
   - Shows duration, rate, and total charge
   - Session ends and table becomes available

## 🔧 API Endpoints

### Admin Endpoints
- `GET /admin/tables` - Get all tables
- `POST /admin/tables` - Create new table
- `PUT /admin/tables/{id}` - Update table
- `DELETE /admin/tables/{id}` - Delete table
- `GET /admin/sessions` - Get all sessions

### User Endpoints
- `GET /table/{id}` - Get table information
- `POST /session/start` - Start gaming session
- `POST /session/end` - End session and calculate bill
- `GET /session/{id}` - Get session details

## 🗄️ Database Schema

### Tables
```sql
- id (Primary Key)
- table_number (Unique)
- rate_per_hour (Float)
- qr_code (Text)
- is_active (Boolean)
```

### Game Sessions
```sql
- id (Primary Key)
- session_id (Unique UUID)
- table_id (Foreign Key)
- user_name (String)
- user_phone (String)
- start_time (DateTime)
- end_time (DateTime, Nullable)
- duration_minutes (Integer, Nullable)
- total_charge (Float, Nullable)
- status (String: 'active'/'completed')
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Lightweight database
- **Pydantic**: Data validation
- **QRCode**: QR code generation
- **Uvicorn**: ASGI server

### Frontend
- **React 18**: UI library
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Modern CSS**: Responsive design
- **QR Scanner**: QR code scanning (future enhancement)

## 🎨 Design Features

- **Responsive Design**: Works on all device sizes
- **Modern UI**: Clean and intuitive interface
- **Real-time Updates**: Live session tracking
- **Gradient Themes**: Beautiful color schemes
- **Card-based Layout**: Organized information display

## 🔒 Security Features

- **Input Validation**: All user inputs are validated
- **CORS Configuration**: Proper cross-origin setup
- **Error Handling**: Comprehensive error management
- **Data Privacy**: Minimal data collection

## 📊 Business Benefits

- **Automation**: Reduces manual tracking errors
- **Accuracy**: Precise time and charge calculation
- **Efficiency**: Streamlined session management
- **Analytics**: Revenue and usage insights
- **Scalability**: Easy to add more tables
- **Cost-effective**: Minimal infrastructure requirements

## 🚀 Future Enhancements

- **Payment Integration**: Online payment processing
- **Mobile App**: Native mobile applications
- **Advanced Analytics**: Detailed reporting and insights
- **Multi-location**: Support for multiple gaming centers
- **User Accounts**: User registration and history
- **Booking System**: Advance table reservations
- **Inventory Management**: Gaming equipment tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and queries, please create an issue in the repository or contact the development team.

---

**Happy Gaming! 🎮**
