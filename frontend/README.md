# RentFlow Frontend

A modern, responsive multi-tenant SaaS rental management frontend built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Recharts**, and **Lucide Icons**.

## Features

- **Universal Single Login Form**: Authenticate as System Admin, Managing Agent, Landlord, or Tenant using Email and registered Phone Number as password.
- **Strict Role-Based Access Control (RBAC)**: Enforces complete data isolation across 4 distinct tenant boundaries.
- **System Admin Console**: Global SaaS revenue tracking (Pipeline A), M-Pesa manual clearance queue, and "Add Agent" with custom monthly SaaS platform subscription fee.
- **Managing Agent Dashboard**: Add Landlords, Add Apartments & Custom Room Configurations (with live tariffs), Add Tenants (with auto-filled rent/deposit tariffs), Issue itemized tenant/landlord invoices.
- **Landlord Property Portal**: Apartment occupancy metrics, gross rental collection vs management fee deductions, net payout breakdown.
- **Tenant Portal**: Occupied room details, utilities billing, M-Pesa STK push and manual reference submission with instant PDF/printable receipt.

## Localhost Setup & Running

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm or pnpm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

## API Configuration and Deployment

The API client uses `http://localhost:8000/api/v1` during development and
`https://rentflowapi.xulttech.com/api/v1` in production builds. To use another
API server, set `VITE_API_BASE_URL` in the frontend environment before starting
Vite or building. For example, set it to `http://localhost:8000/api/v1` for local
development or `https://rentflowapi.xulttech.com/api/v1` for production.

The backend must allow the deployed frontend origin
(`https://rentflow.tecade.top`) in its `CORS_ALLOWED_ORIGINS` environment
variable. See `../backend/.env.example` for local and production examples.
