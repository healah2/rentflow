# RentFlow SaaS - Django REST Framework Backend

Production-oriented backend for RentFlow multi-tenant SaaS rental management system.

- **Framework**: Django 5.x & Django REST Framework (DRF)
- **Database**: SQLite 3 (Ready for zero-rewrite migration to PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens via `djangorestframework-simplejwt`)
- **API Versioning**: All endpoints organized under `/api/v1/`
- **Payments**: Safaricom Daraja M-Pesa STK Push and manual code reconciliation
- **Currency**: Kenyan Shillings (KES)

---

## Localhost Setup Instructions

### 1. Requirements
- Python 3.10+ (tested on Python 3.10, 3.11, 3.12)
- pip and virtualenv

### 2. Create and Activate Virtual Environment
```bash
# Navigate to the backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate on Linux / macOS:
source venv/bin/activate

# Or activate on Windows:
venv\Scripts\activate
```

### 3. Install Required Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Migrations & Initialize Database
```bash
python manage.py makemigrations rentflow_app
python manage.py migrate
```

### 5. Create a Superuser / System Admin
```bash
python manage.py createsuperuser
```
(Use this Django superuser's username and password to sign in to the RentFlow System Administrator dashboard.)

### 6. Start Development Server
```bash
python manage.py runserver 8000
```
The Django API will be live at `http://localhost:8000/`.

---

## API Endpoints Overview (`/api/v1/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/token/` | Obtain JWT access and refresh token |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh access token |
| `GET/POST` | `/api/v1/invoices/` | List/create invoices (isolated by role) |
| `POST` | `/api/v1/invoices/{id}/pay_stk/` | Trigger Daraja M-Pesa STK push |
| `POST` | `/api/v1/payments/submit_manual/` | Submit manual M-Pesa reference code |
| `POST` | `/api/v1/payments/{id}/verify/` | Admin/Agent approve/reject manual payment |
| `GET` | `/api/v1/receipts/` | Access digital tamper-evident receipts |
| `GET/POST` | `/api/v1/properties/` | List/create managed apartment buildings |
| `GET/POST` | `/api/v1/units/` | List/create rooms & per-room tariffs |
| `GET/POST` | `/api/v1/complaints/` | Maintenance tickets and repair work orders |
| `POST` | `/api/v1/form-submissions/` | Authenticated frontend form submissions and account provisioning |

Set `VITE_API_BASE_URL` in `frontend/.env` to the backend API URL. Regular role accounts are provisioned by authenticated admin/agent forms and use the registered phone number as their initial password; change it from Django Admin before production use.

The System Administrator role is granted only to Django superusers; frontend role switching is disabled. Form payloads are retained in Django Admin under **Frontend submissions**.

## Cross-Origin and Production Configuration

The API allows local frontend origins and `https://rentflow.tecade.top` by
default. Set `CORS_ALLOWED_ORIGINS` to a comma-separated list of exact browser
origins if you need to change that allowlist. Set `ALLOWED_HOSTS` to the
comma-separated hostnames serving this backend, including
`rentflowapi.xulttech.com` in production. Do not include schemes or URL paths
in `ALLOWED_HOSTS`. The corresponding variables are documented in
`.env.example`.

## Django Admin Console
Visit `http://localhost:8000/admin/` to manage all database records with the superuser credentials.
