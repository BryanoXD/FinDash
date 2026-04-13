# Test Credentials

## Authentication
- **Method**: Google OAuth via Emergent Auth
- **Login**: Click "Entrar com Google" on login page
- **Session**: Cookie-based (session_token httpOnly cookie)

## API Testing
- **Base URL**: https://parcel-manager-26.preview.emergentagent.com
- **Auth Required**: All /api/* endpoints (except /api/health) require session cookie
- **Health Check**: GET /api/health (no auth needed)

## Key Endpoints
- POST /api/auth/session - Create session from Emergent Auth
- GET /api/auth/me - Get current user
- POST /api/cards/installments/batch - Create N installments for credit card purchase
