// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  ME: '/auth/me',
  
  // Tables
  TABLES: '/admin/tables',
  TABLE_LOOKUP: '/table/lookup',
  TABLE_DETAILS: '/table',
  
  // Sessions
  SESSION_START: '/session/start',
  SESSION_END: '/session/end',
  SESSION_DETAILS: '/session',
  SESSION_VERIFY_PAYMENT: '/session/verify-payment',
  SESSION_MARK_UNPAID: '/session/mark-unpaid',
  
  // Player
  PLAYER_SESSIONS: '/api/player/sessions',
  PLAYER_ACTIVE_SESSION: '/api/player/active-session',
  
  // Payment
  PAYMENT_SESSION: '/public/payment/session',
  
  // Signup
  GAME_PARLOUR_SIGNUP: '/signup/game-parlour',
  
  // Admin
  ADMIN_TABLES: '/admin/tables',
  REGENERATE_QR: '/admin/regenerate-qr-codes',
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
