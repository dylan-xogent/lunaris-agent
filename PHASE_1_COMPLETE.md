# Phase 1 Completion Guide - Lunaris Agent Platform v1.0

## Overview

Phase 1 has been completed with all core features and improvements implemented. This document provides a comprehensive guide to deploying and using the v1 release of the Lunaris Agent Platform.

---

## What's New in v1.0

### Core Features Completed

#### 1. Health Monitoring System
- **Health Check Endpoints**
  - `GET /api/health` - Overall system health with database and memory checks
  - `GET /api/health/live` - Liveness probe for container orchestration
  - `GET /api/health/ready` - Readiness probe to check if API can accept traffic
- **Configurable Thresholds**
  - Memory warning threshold (default: 75%)
  - Memory critical threshold (default: 90%)

#### 2. Configuration Management
- **Centralized Configuration**
  - All settings managed through environment variables
  - Type-safe configuration with validation
  - See `.env.example` for all available options
- **Key Configuration Options**
  - Agent heartbeat interval (default: 30 seconds)
  - Offline detection threshold (default: 90 seconds = 3 missed heartbeats)
  - Database connection pooling (min: 2, max: 10)
  - WebSocket reconnection settings with exponential backoff

#### 3. Enhanced Reliability
- **Agent Heartbeat Retry Logic**
  - Automatic retry with exponential backoff (5s, 10s, 20s)
  - Max 3 retry attempts before logging failure
  - Prevents false offline alerts due to transient network issues
- **WebSocket Reconnection**
  - Automatic reconnection with exponential backoff
  - Configurable delays and multipliers
  - Prevents connection storms during network issues

#### 4. API Documentation
- **Swagger/OpenAPI**
  - Interactive API documentation at `/api/docs`
  - All endpoints documented with request/response schemas
  - Try-it-out functionality for testing endpoints

---

## Architecture

### Technology Stack

**Backend API**
- NestJS 10.4
- PostgreSQL database
- Prisma ORM 6.1
- Socket.IO for WebSocket communication
- Swagger for API documentation

**Frontend (New - Vite+React)**
- Vite 5.4 build tool
- React 18.3
- TypeScript 5
- TailwindCSS for styling
- Socket.IO client for real-time updates

**Agent (Go Windows Service)**
- Go 1.25
- Windows Service integration
- Winget integration for package management
- Retry logic with exponential backoff

---

## Deployment Guide

### Prerequisites

- Docker & Docker Compose
- PostgreSQL 14+ (or use Docker compose)
- Node.js 20+ (for local development)
- Go 1.25+ (for building agent)
- Windows 10/11 (for agent deployment)

### 1. Environment Configuration

Copy the example environment file and configure:

```bash
cp apps/api/.env.example apps/api/.env
```

**Important Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://lunaris:lunaris@localhost:5432/lunaris_agent?schema=public"

# Server
PORT=3001
NODE_ENV=production

# CORS (set to your frontend URL)
CORS_ORIGIN=http://localhost:3000

# Agent Configuration
AGENT_HEARTBEAT_INTERVAL=30
AGENT_OFFLINE_THRESHOLD=90
AGENT_HEARTBEAT_RETRY_ATTEMPTS=3
AGENT_HEARTBEAT_RETRY_DELAY=5000

# WebSocket Configuration
WS_RECONNECT_DELAY=1000
WS_RECONNECT_MAX_DELAY=30000
WS_RECONNECT_BACKOFF_MULTIPLIER=1.5

# Health Check Configuration
HEALTH_CHECK_MEMORY_THRESHOLD_WARNING=75
HEALTH_CHECK_MEMORY_THRESHOLD_CRITICAL=90
```

### 2. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

**Services:**
- `api` - NestJS backend API (port 3001)
- `web` - React frontend (port 3000)
- `db` - PostgreSQL database (port 5432)
- `pgadmin` - Database management UI (port 5050)

### 3. Database Setup

```bash
# Generate Prisma client
cd apps/api
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (development)
npm run db:push
```

### 4. Deploy Windows Agent

#### Stop Existing Agent (if running)

```powershell
# Stop the service
Stop-Service -Name "LunarisAgent" -ErrorAction SilentlyContinue

# Or kill the process
Get-Process | Where-Object {$_.Name -like '*lunaris-agent*'} | Stop-Process -Force
```

#### Build Agent

```powershell
cd services/agent

# Build the agent executable
go build -o lunaris-agent.exe ./cmd/lunaris-agent
```

#### Install as Windows Service

```powershell
# Option 1: Use the installation script
.\install.ps1

# Option 2: Use the rebuild and install script (stops, rebuilds, reinstalls)
.\rebuild-and-install.ps1

# Option 3: Manual installation
.\install-service-user.ps1
```

#### Configure Agent

Edit `services/agent/config.json`:

```json
{
  "apiURL": "http://localhost:3001/api/agent",
  "heartbeatIntervalSec": 30,
  "updateScanIntervalMin": 60,
  "deviceID": ""
}
```

**Note:** `deviceID` will be automatically populated on first run.

#### Start Agent

```powershell
# Start the service
Start-Service -Name "LunarisAgent"

# Check service status
Get-Service -Name "LunarisAgent"

# View logs (if configured)
Get-Content "C:\ProgramData\Lunaris\logs\agent.log" -Tail 50 -Wait
```

---

## API Documentation

### Access Swagger UI

Once the API is running, access the interactive documentation:

```
http://localhost:3001/api/docs
```

### Key Endpoints

#### Health Endpoints

**GET /api/health**
- Returns overall system health
- Status codes: 200 (healthy), 503 (unhealthy/degraded)

```json
{
  "status": "healthy",
  "timestamp": "2025-12-09T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 5
    },
    "memory": {
      "status": "healthy",
      "usedMB": 150,
      "totalMB": 512,
      "usagePercent": 29
    }
  }
}
```

**GET /api/health/live**
- Liveness probe (always returns 200 if API is running)

**GET /api/health/ready**
- Readiness probe (returns 200 if database is accessible)

#### Device Endpoints

**GET /api/devices**
- List all devices
- Query params: `status` (online/offline/all), `search`

**GET /api/devices/:id**
- Get device details including metrics and updates

**POST /api/devices/:id/sync**
- Trigger immediate update scan on device

**POST /api/devices/bulk/add-to-group**
- Add multiple devices to a group

**POST /api/devices/bulk/add-tags**
- Add tags to multiple devices

**POST /api/devices/bulk/install-updates**
- Install updates on multiple devices

#### Group & Tag Endpoints

**GET /api/groups**
- List all device groups

**POST /api/groups**
- Create new group

**GET /api/tags**
- List all tags

**POST /api/tags**
- Create new tag

#### Stats Endpoints

**GET /api/stats**
- Get dashboard statistics
- Returns device counts, update counts, critical updates

---

## Testing the v1 Release

### 1. Verify API Health

```bash
curl http://localhost:3001/api/health
```

Expected response: Status 200 with healthy checks

### 2. Verify Database Connection

```bash
curl http://localhost:3001/api/health/ready
```

Expected response: Status 200 with ready status

### 3. Test Agent Registration

1. Install and start agent on Windows machine
2. Check logs for successful registration
3. Verify device appears in dashboard at `http://localhost:3000`

### 4. Test Heartbeat System

1. Watch device status in dashboard
2. Stop agent service
3. After 90 seconds (3 missed heartbeats), device should show as offline
4. Restart agent
5. Device should immediately return to online status

### 5. Test Update Detection

1. Agent should scan for updates every 60 minutes (configurable)
2. Or trigger manual scan: `POST /api/devices/:id/sync`
3. Updates should appear in dashboard

### 6. Test Update Installation

1. Select updates to install in dashboard
2. Click "Install Updates"
3. Agent should receive command and install packages
4. Installation results should be reported back

### 7. Test WebSocket Real-Time Updates

1. Open dashboard in browser
2. Open browser dev tools > Network > WS tab
3. Verify WebSocket connection to `/ws/console`
4. Make changes (e.g., stop/start agent)
5. Dashboard should update in real-time without refresh

---

## Configuration Reference

### Agent Configuration (config.json)

```json
{
  "apiURL": "http://localhost:3001/api/agent",
  "heartbeatIntervalSec": 30,
  "updateScanIntervalMin": 60,
  "deviceID": "auto-generated-on-first-run"
}
```

### API Environment Variables (.env)

See `apps/api/.env.example` for complete list with descriptions.

**Critical Settings:**

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - API server port (default: 3001)
- `CORS_ORIGIN` - Allowed frontend origin
- `AGENT_HEARTBEAT_INTERVAL` - How often agents send heartbeats (seconds)
- `AGENT_OFFLINE_THRESHOLD` - When to mark agent offline (seconds)
- `AGENT_HEARTBEAT_RETRY_ATTEMPTS` - Max retry attempts (default: 3)
- `AGENT_HEARTBEAT_RETRY_DELAY` - Delay between retries (milliseconds)

---

## Troubleshooting

### API Won't Start

**Check Database Connection:**
```bash
docker-compose ps
docker-compose logs db
```

**Check API Logs:**
```bash
docker-compose logs api
```

**Common Issues:**
- Database not running
- Invalid DATABASE_URL
- Port 3001 already in use

### Agent Not Registering

**Check Agent Logs:**
```powershell
Get-Service LunarisAgent
Get-EventLog -LogName Application -Source "Lunaris Agent" -Newest 20
```

**Common Issues:**
- API URL incorrect in config.json
- Network connectivity issues
- Firewall blocking port 3001

### Devices Showing Offline

**Check:**
1. Is agent service running? `Get-Service LunarisAgent`
2. Is API reachable from agent machine?
3. Check offline threshold setting (default: 90 seconds)
4. Review agent logs for heartbeat failures

### WebSocket Not Connecting

**Check:**
1. CORS_ORIGIN matches your frontend URL
2. WebSocket port not blocked by firewall
3. Browser console for connection errors
4. Verify reconnection attempts in Network tab

---

## Performance Tuning

### Database Connection Pooling

Adjust based on your load:

```env
DATABASE_POOL_MIN=2      # Minimum connections
DATABASE_POOL_MAX=10     # Maximum connections
DATABASE_CONNECTION_TIMEOUT=10000  # milliseconds
```

### Agent Heartbeat Interval

Lower values = more real-time, but higher load:

```env
AGENT_HEARTBEAT_INTERVAL=30  # Recommended: 20-60 seconds
AGENT_OFFLINE_THRESHOLD=90   # Should be >= 3x heartbeat interval
```

### WebSocket Reconnection

Tune for your network reliability:

```env
WS_RECONNECT_DELAY=1000              # Initial delay (ms)
WS_RECONNECT_MAX_DELAY=30000         # Max delay (ms)
WS_RECONNECT_BACKOFF_MULTIPLIER=1.5  # Exponential backoff factor
```

---

## Security Considerations

### Production Deployment

1. **Change Default Passwords**
   - Update PostgreSQL credentials
   - Secure pgAdmin access

2. **Use HTTPS/TLS**
   - Configure reverse proxy (nginx/Caddy)
   - Obtain SSL certificates (Let's Encrypt)

3. **Firewall Configuration**
   - Only expose necessary ports
   - Restrict database access to API server only

4. **Environment Variables**
   - Never commit `.env` files to version control
   - Use secrets management in production

5. **Agent Authentication**
   - Consider implementing EnrollmentSecret validation
   - Use VPN for agent-to-API communication if over internet

---

## Monitoring & Maintenance

### Health Checks

Configure your monitoring system to check:

- **Liveness:** `GET /api/health/live` every 10 seconds
- **Readiness:** `GET /api/health/ready` every 30 seconds
- **Overall Health:** `GET /api/health` every 60 seconds

### Log Rotation

**API Logs (Docker):**
```yaml
# In docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**Agent Logs:**
Configure Windows Event Log settings or implement file-based logging with rotation.

### Database Maintenance

```bash
# Backup database
docker-compose exec db pg_dump -U lunaris lunaris_agent > backup.sql

# Restore database
docker-compose exec -T db psql -U lunaris lunaris_agent < backup.sql
```

### Update Metrics History Cleanup

Consider implementing cleanup for old metrics:

```sql
-- Delete metrics older than 30 days
DELETE FROM "DeviceMetricsHistory"
WHERE "timestamp" < NOW() - INTERVAL '30 days';
```

---

## What's Next: Phase 2

Phase 1 is complete and ready for v1 release. Next steps:

### Immediate Next Phase (1.5 - UI Evolution)
- Complete Vite+React migration
- Implement AnimatedStatCard components
- Add SystemMetricsChart for historical data
- Implement ActivityFeed
- Add dark mode support

### Phase 2 (Monitoring & Observability)
- Historical metrics visualization
- Alert system for critical updates
- Email/webhook notifications
- Update compliance reports

---

## Support & Resources

- **API Documentation:** http://localhost:3001/api/docs
- **Database Admin:** http://localhost:5050 (pgAdmin)
- **Issue Tracker:** Create GitHub issues for bugs/features
- **Deployment Summary:** See `DEPLOYMENT_SUMMARY.md`
- **UI Migration Plan:** See `UI_MIGRATION_PLAN.md`

---

## Version Information

- **Version:** 1.0.0
- **Release Date:** December 9, 2025
- **Phase:** 1 (Foundation) - Complete
- **API Version:** 1.0.0
- **Agent Version:** 1.0.0
- **Database Schema Version:** Latest migration

---

## Acknowledgments

Phase 1 represents a solid foundation for the Lunaris Agent Platform with:

- ✅ Core device management
- ✅ Real-time WebSocket communication
- ✅ Update detection and installation
- ✅ Device grouping and tagging
- ✅ Bulk operations
- ✅ Health monitoring
- ✅ Configuration management
- ✅ Retry logic and error handling
- ✅ API documentation

The platform is now production-ready for v1 release!
