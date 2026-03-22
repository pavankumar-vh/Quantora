# Deployment Guide — Quantora AI v3.0

Complete guide for deploying Quantora AI across development, staging, and production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Production Deployment](#production-deployment)
   - [Backend (FastAPI)](#backend-deployment)
   - [Frontend (Next.js)](#frontend-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Deployment](#cloud-deployment)
   - [AWS](#aws)
   - [Railway / Render](#railway--render)
   - [Vercel + External API](#vercel--external-api)
8. [Reverse Proxy (Nginx)](#reverse-proxy-nginx)
9. [SSL / TLS](#ssl--tls)
10. [Monitoring & Logging](#monitoring--logging)
11. [Security Checklist](#security-checklist)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| npm | 9+ | Package manager |
| Git | 2.x | Version control |
| PostgreSQL | 15+ | Production database (optional, SQLite for dev) |
| Docker | 24+ | Containerized deployment (optional) |

---

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/pavankumar-vh/Quantora.git
cd Quantora
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env               # or create manually (see Configuration)

# Start the server
python main.py
```

The API server starts at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

The dashboard starts at `http://localhost:3000`.

### 4. Verify Installation

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", "uptime": "...", "transactions": 0, "active_alerts": 0}
```

---

## Environment Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# ─── Database ───
DATABASE_URL=sqlite+aiosqlite:///./quantora.db
# For PostgreSQL:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/quantora

# ─── Authentication ───
SECRET_KEY=generate-a-64-char-random-string-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# ─── CORS ───
CORS_ORIGINS=["http://localhost:3000"]
# Production:
# CORS_ORIGINS=["https://your-domain.com"]

# ─── Application ───
APP_NAME=Quantora AI
DEBUG=false
SEED_DATA=false
```

### Generate a Secure Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
# Backend API URL (used by next.config.js proxy)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `sqlite+aiosqlite:///./quantora.db` | Database connection string |
| `SECRET_KEY` | Yes | (insecure default) | JWT signing key — **must change in production** |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `480` | Token lifetime (8 hours) |
| `CORS_ORIGINS` | No | `["http://localhost:3000"]` | Allowed CORS origins (JSON array) |
| `DEBUG` | No | `false` | Enable debug mode |
| `SEED_DATA` | No | `false` | Seed demo data on startup |

---

## Database Setup

### Development (SQLite)

No setup required. The database file (`quantora.db`) is created automatically on first run.

```env
DATABASE_URL=sqlite+aiosqlite:///./quantora.db
```

### Production (PostgreSQL)

#### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update && sudo apt install postgresql-15

# Docker
docker run -d --name quantora-db \
  -e POSTGRES_USER=quantora \
  -e POSTGRES_PASSWORD=your-secure-password \
  -e POSTGRES_DB=quantora \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 2. Create Database

```sql
CREATE USER quantora WITH PASSWORD 'your-secure-password';
CREATE DATABASE quantora OWNER quantora;
GRANT ALL PRIVILEGES ON DATABASE quantora TO quantora;
```

#### 3. Update Connection String

```env
DATABASE_URL=postgresql+asyncpg://quantora:your-secure-password@localhost:5432/quantora
```

#### 4. Install AsyncPG Driver

```bash
pip install asyncpg
```

> Tables are created automatically via SQLAlchemy's `create_all()` on application startup.

---

## Production Deployment

### Backend Deployment

#### 1. Install Production Dependencies

```bash
cd backend
pip install -r requirements.txt
pip install gunicorn uvloop httptools
```

#### 2. Run with Gunicorn + Uvicorn Workers

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

#### 3. Systemd Service (Linux)

Create `/etc/systemd/system/quantora-api.service`:

```ini
[Unit]
Description=Quantora AI API Server
After=network.target postgresql.service

[Service]
Type=exec
User=quantora
Group=quantora
WorkingDirectory=/opt/quantora/backend
Environment="PATH=/opt/quantora/backend/.venv/bin"
EnvironmentFile=/opt/quantora/backend/.env
ExecStart=/opt/quantora/backend/.venv/bin/gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 127.0.0.1:8000 \
  --timeout 120
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable quantora-api
sudo systemctl start quantora-api
sudo systemctl status quantora-api
```

### Frontend Deployment

#### 1. Build for Production

```bash
cd frontend
npm run build
```

#### 2. Start Production Server

```bash
npm run start
# Runs on port 3000 by default
```

#### 3. Custom Port

```bash
PORT=3001 npm run start
```

#### 4. Systemd Service (Linux)

Create `/etc/systemd/system/quantora-web.service`:

```ini
[Unit]
Description=Quantora AI Frontend
After=network.target

[Service]
Type=exec
User=quantora
Group=quantora
WorkingDirectory=/opt/quantora/frontend
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## Docker Deployment

### Dockerfile — Backend

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn uvloop httptools

COPY . .

EXPOSE 8000

CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120"]
```

### Dockerfile — Frontend

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### Docker Compose

Create `docker-compose.yml` in the project root:

```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: quantora
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      POSTGRES_DB: quantora
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U quantora"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://quantora:${POSTGRES_PASSWORD:-changeme}@db:5432/quantora
      SECRET_KEY: ${SECRET_KEY:-generate-a-secure-key}
      CORS_ORIGINS: '["http://localhost:3000"]'
      SEED_DATA: "true"
    depends_on:
      db:
        condition: service_healthy
    restart: always

  web:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:8000
    depends_on:
      - api
    restart: always

volumes:
  pgdata:
```

### Run with Docker Compose

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down

# Stop and remove volumes (⚠️ deletes database)
docker compose down -v
```

---

## Cloud Deployment

### AWS

#### EC2 Instance

1. Launch an Ubuntu 22.04 EC2 instance (t3.medium or larger)
2. Configure Security Group:
   - Inbound: 22 (SSH), 80 (HTTP), 443 (HTTPS)
3. SSH into the instance and install dependencies:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv nodejs npm nginx certbot python3-certbot-nginx

# Clone and deploy
git clone https://github.com/pavankumar-vh/Quantora.git /opt/quantora
cd /opt/quantora

# Setup backend
cd backend && python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt gunicorn uvloop httptools

# Setup frontend
cd ../frontend && npm ci --legacy-peer-deps && npm run build

# Create systemd services (see Production Deployment above)
# Configure Nginx reverse proxy (see below)
```

#### RDS (PostgreSQL)

1. Create an RDS PostgreSQL 15 instance
2. Update `DATABASE_URL` with the RDS endpoint:

```env
DATABASE_URL=postgresql+asyncpg://quantora:password@your-rds-endpoint.region.rds.amazonaws.com:5432/quantora
```

### Railway / Render

Both platforms support monorepo deployments:

#### Railway

1. Connect your GitHub repo
2. Create two services:
   - **Backend**: Set root directory to `backend/`, start command: `gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - **Frontend**: Set root directory to `frontend/`, build command: `npm run build`, start command: `npm run start`
3. Add a PostgreSQL plugin
4. Set environment variables in each service

#### Render

1. Create a **Web Service** for the backend:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
2. Create a **Web Service** for the frontend:
   - Root directory: `frontend`
   - Build command: `npm ci --legacy-peer-deps && npm run build`
   - Start command: `npm run start`
3. Create a **PostgreSQL** database
4. Wire `DATABASE_URL` from the PostgreSQL instance to the backend service

### Vercel + External API

Deploy only the frontend to Vercel, host the API separately:

1. Import the repo to Vercel
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to Next.js
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   ```
5. Update `next.config.js` rewrites to point to your external API
6. Deploy

---

## Reverse Proxy (Nginx)

### Configuration

Create `/etc/nginx/sites-available/quantora`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger docs
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_set_header Host $host;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000/redoc;
        proxy_set_header Host $host;
    }
}
```

### Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/quantora /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL / TLS

### Let's Encrypt (Certbot)

```bash
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

Certbot automatically:
- Obtains a free SSL certificate
- Configures Nginx to redirect HTTP → HTTPS
- Sets up auto-renewal via systemd timer

### Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Application Logs

**Backend** logs to stdout via Python's `logging` module:

```bash
# View live logs (systemd)
journalctl -u quantora-api -f

# View live logs (Docker)
docker compose logs -f api
```

**Frontend** logs via Next.js built-in logging:

```bash
journalctl -u quantora-web -f
```

### Health Monitoring

Set up a cron job or external monitor to ping the health endpoint:

```bash
# Simple cron check every 5 minutes
*/5 * * * * curl -sf http://localhost:8000/health > /dev/null || echo "Quantora API down" | mail -s "Alert" admin@example.com
```

### Recommended Monitoring Stack

| Tool | Purpose |
|------|---------|
| **UptimeRobot / Better Uptime** | External health checks & incident alerts |
| **Prometheus + Grafana** | Metrics collection & dashboarding |
| **Loki** | Log aggregation (pairs with Grafana) |
| **Sentry** | Error tracking for both Python and JavaScript |

---

## Security Checklist

Before deploying to production, verify the following:

- [ ] **Secret Key**: `SECRET_KEY` is a unique, random 64+ character string
- [ ] **Debug Mode**: `DEBUG=false` in production
- [ ] **CORS Origins**: Set to your exact production domain(s)
- [ ] **Database**: Using PostgreSQL (not SQLite) in production
- [ ] **Database Password**: Strong, unique password for PostgreSQL user
- [ ] **HTTPS**: SSL/TLS enabled via Certbot or cloud provider
- [ ] **Firewall**: Only ports 80, 443, and 22 exposed
- [ ] **Database Port**: PostgreSQL (5432) not exposed to the internet
- [ ] **Seed Data**: `SEED_DATA=false` in production
- [ ] **File Permissions**: Application files owned by non-root user
- [ ] **Rate Limiting**: Consider adding rate limiting via Nginx or middleware
- [ ] **Backups**: Database backup schedule configured
- [ ] **Log Rotation**: Configured to prevent disk space exhaustion
- [ ] **Dependency Audit**: `pip audit` and `npm audit` run with no critical findings

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

#### Module Not Found (Backend)

```bash
# Ensure virtual environment is activated
source .venv/bin/activate
pip install -r requirements.txt
```

#### npm Install Fails (Peer Dependencies)

```bash
# Three.js and React Three Fiber require --legacy-peer-deps
npm install --legacy-peer-deps
```

#### Database Connection Refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U quantora -h localhost -d quantora
```

#### CORS Errors in Browser

Ensure `CORS_ORIGINS` in your `.env` file matches your frontend URL exactly (including protocol and port):

```env
CORS_ORIGINS=["https://your-domain.com"]
```

#### Build Fails on Low Memory (< 2GB RAM)

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### SQLite Locked (Concurrent Writes)

SQLite does not support high concurrency. Switch to PostgreSQL for production:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/quantora
```

---

<div align="center">
  <p><sub>Quantora AI v3.0 — Deployment Guide</sub></p>
</div>
