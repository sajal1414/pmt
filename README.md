# PMT Portal (Nfolks Atlas Monorepo)

Monorepo containing the Backend (Flask + SQLAlchemy + PostgreSQL + S3/MinIO) and Frontend (React + Vite + TypeScript + Tailwind CSS) for the PMT Portal.

---

## 📁 Repository Structure

```
pmt/
├── backend/                  # Flask backend API
│   ├── alembic/              # Database migrations
│   ├── app/                  # Application code (auth, courses, deliveries, instructors, lessons)
│   ├── tests/                # Unit and E2E tests
│   ├── Dockerfile            # Backend Dockerfile
│   ├── requirements.txt      # Python dependencies
│   └── ...
├── frontend/                 # React + Vite frontend SPA
│   ├── src/                  # TypeScript / React source components & pages
│   ├── public/               # Static assets & sample templates
│   ├── Dockerfile            # Multi-stage production build (Node -> Nginx)
│   ├── nginx.conf            # Reverse proxy configuration
│   ├── package.json          # Node dependencies & scripts
│   └── ...
├── .github/workflows/        # CI / CD workflows (test & deploy)
├── docker-compose.yaml       # Local development stack (Backend + Frontend + Postgres + MinIO)
├── docker-compose.prod.yaml  # Production stack (Backend + Frontend with external DB/S3)
├── .env.example              # Root environment template
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- *Or* Python 3.12+ and Node.js 20+

### Option 1: Run Everything with Docker Compose

1. Copy the environment variables:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Start all services (Backend, Frontend, Postgres, MinIO):
   ```bash
   docker compose up --build
   ```

   - **Frontend**: http://localhost:80
   - **Backend API**: http://localhost:8000
   - **MinIO Console**: http://localhost:9001 (Credentials: `minioadmin` / `minioadmin123`)

---

### Option 2: Running Services Locally

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure your .env file
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start development server
python -m app.flask_server
```

#### 2. Frontend Setup
```bash
cd frontend
npm install

# Configure your .env file
cp .env.example .env

# Start Vite dev server
npm run dev
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest -v
```

### Frontend Build & Lint
```bash
cd frontend
npm run lint
npm run build
```

---

## 🚢 Production Deployment

For production deployments using `docker-compose.prod.yaml`:

1. Populate environment variables (see `.env.example`):
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET`
   - `AWS_REGION`

2. Deploy using Docker Compose:
   ```bash
   docker compose -f docker-compose.prod.yaml up -d --build
   docker compose -f docker-compose.prod.yaml exec backend alembic upgrade head
   ```
