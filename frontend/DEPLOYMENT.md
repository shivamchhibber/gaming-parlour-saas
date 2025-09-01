# Frontend Deployment Guide

## Environment Configuration

The frontend uses environment variables to switch between development and production configurations.

### Environment Files

- **`env.development`** - For local development (currently points to deployed backend)
- **`env.production`** - For production deployment (points to deployed backend)

### Simple Environment Switching

1. **For Local Development**:
   ```bash
   cp env.development .env
   npm start
   ```

2. **For Production Build**:
   ```bash
   cp env.production .env
   npm run build
   ```

### What Was Updated

The following files have been updated to use centralized API configuration:

- `src/config/api.js` - Centralized API configuration
- `src/services/authService.js` - Authentication service
- `src/views/player/PlayerDashboard.jsx` - Player dashboard
- `src/views/user/TableScan.jsx` - Table scanning
- `src/views/user/UserDetails.jsx` - User details
- `src/views/user/QuickStart.jsx` - Quick start
- `src/views/user/GameSession.jsx` - Game session management
- `src/views/public/GameParlourSignup.jsx` - Business signup
- `src/views/public/PaymentSuccess.jsx` - Payment success
- `src/views/admin/user-interface/index.jsx` - Admin interface

### API Endpoints

All API calls now use the centralized configuration from `src/config/api.js`:

```javascript
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

// Instead of hardcoded URLs:
// axios.get('http://localhost:8000/table/123')

// Use centralized configuration:
axios.get(buildApiUrl(`${API_ENDPOINTS.TABLE_DETAILS}/123`))
```

### Current Setup

- **Both environments**: Currently point to deployed backend (`https://api.botarmy.tech`)
- **Local development**: Frontend runs locally but connects to remote backend
- **Future**: When running backend locally, update `env.development` to point to `http://localhost:8000`

### Testing

- **Development**: Frontend connects to deployed backend (https://api.botarmy.tech)
- **Production**: Frontend connects to deployed backend (https://api.botarmy.tech)

### Deployment

1. Copy the production environment file:
   ```bash
   cp env.production .env
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy the `build` folder to your static hosting service.

### Environment Variables

The application automatically reads from the `.env` file. Key variables:

- `REACT_APP_API_BASE_URL` - Backend API URL
- `REACT_APP_ENVIRONMENT` - Environment identifier
