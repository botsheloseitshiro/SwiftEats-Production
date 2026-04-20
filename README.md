# 🍔 SwiftEats — Production-Ready Upgrade v2.0

> Full-stack food delivery platform — **Spring Boot 3.5 + React**  
> Upgraded to enterprise-grade, production-ready standards.

---

## Table of Contents

1. [Architecture Review](#1-architecture-review)
2. [Critical Issues Found & Fixed](#2-critical-issues-found--fixed)
3. [Refactoring Summary](#3-refactoring-summary)
4. [Deployment Guide](#4-deployment-guide)
5. [Production Readiness Checklist](#5-production-readiness-checklist)
6. [Future Enhancements](#6-future-enhancements)
7. [Assumptions & Risks](#7-assumptions--risks)

---

## 1. Architecture Review

### BEFORE
```
Controller → Service → Repository → Entity
```
Issues: DataSeeder ran in prod, no location fields, no Actuator,
Java version mismatch, no Docker, no CI/CD, no nearby-restaurants feature.

### AFTER
```
Controller → Service → Repository (+ Haversine geospatial queries)
                ↓
            DTO (location-aware) ← Mapper in Service
                ↓
        Entity (lat/lon/city/radius) + @Profile("dev") seeder
```

New: Haversine "nearby" query, location fields, profile-split config,
Actuator health checks, multi-stage Dockerfiles, GitHub Actions CI/CD.

---

## 2. Critical Issues Found & Fixed

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | DataSeeder ran in ALL profiles incl. production | CRITICAL | `@Profile("dev")` added |
| 2 | No lat/lon on Restaurant — location features impossible | CRITICAL | Fields added to model, DTO, service, seeder |
| 3 | No application-prod.yml — show-sql=true, H2 console open in prod | CRITICAL | Dev + Prod YAML profiles created |
| 4 | Java 17 in pom.xml, Java 21 in Dockerfile | HIGH | Unified to Java 21 everywhere |
| 5 | No Spring Actuator — Docker health checks fail | HIGH | actuator dependency + config added |
| 6 | No Docker setup — inconsistent deployments | HIGH | Multi-stage Dockerfiles + Compose |
| 7 | No CI/CD pipeline | HIGH | GitHub Actions created |
| 8 | No nearby restaurants feature (front + back) | MEDIUM | Haversine query + UI location picker |
| 9 | restaurant.service.js missing getNearby() | MEDIUM | getNearby(lat,lon,radiusKm) added |
| 10 | RegisterRestaurantRequest missing location fields | MEDIUM | city/lat/lon/radius added |
| 11 | updateRestaurant didn't persist location fields | MEDIUM | Fixed in RestaurantService |
| 12 | No .env.example for production setup | MEDIUM | Comprehensive guide created |

---

## 3. Refactoring Summary

### Backend

**Restaurant.java** — Added: `city`, `latitude`, `longitude`, `deliveryRadiusKm`

**RestaurantDTO.java** — Added: `city`, `latitude`, `longitude`, `deliveryRadiusKm`, `distanceKm`

**RestaurantRepository.java** — Added native Haversine SQL query:
```sql
SELECT *, (6371 * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(r.latitude)) *
  COS(RADIANS(r.longitude) - RADIANS(:lon)) +
  SIN(RADIANS(:lat)) * SIN(RADIANS(r.latitude)))) AS distance_km
FROM restaurants r WHERE is_active = true AND distance_km <= :radiusKm
ORDER BY distance_km ASC
```

**RestaurantService.java** — Added `getNearbyRestaurants()` + `haversineKm()` utility

**RestaurantController.java** — Added `GET /api/restaurants/nearby?lat=&lon=&radiusKm=`

**DataSeeder.java** — `@Profile("dev")` added; 5 restaurants seeded with real SA coordinates

**pom.xml** — Java 17→21; added `spring-boot-starter-actuator`

**New files:**
- `application-dev.yml` — H2, debug logging, expose reset links
- `application-prod.yml` — MySQL, no SQL logging, H2 disabled, actuator secured

### Frontend

**HomePage.jsx** — Full rewrite with:
- "Restaurants near me" button (browser Geolocation API)
- Live radius filter: 5 km / 10 km / 20 km
- Distance badge overlaid on restaurant cards in nearby mode
- Debounced search with clear (X) button
- 6-card skeleton loading

**restaurant.service.js** — Added `getNearby(lat, lon, radiusKm)`

### DevOps

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Multi-stage Java 21 build, non-root user, health check |
| `frontend/Dockerfile` | Multi-stage Node 20 build + Nginx alpine |
| `frontend/nginx.conf` | Gzip, security headers, /api proxy, SPA fallback |
| `docker-compose.yml` | MySQL 8 + Backend + Frontend, health-check ordering |
| `.github/workflows/ci.yml` | Build → Test → Docker build → Integration smoke test |
| `.env.example` | Complete production environment guide |

---

## 4. Deployment Guide

### Option A — Docker Compose (Self-hosted)

```bash
# 1. Copy and fill in environment file
cp .env.example .env
# Edit .env: set JWT_SECRET, DB_PASSWORD, MAIL_* etc.

# Generate a strong JWT secret:
openssl rand -base64 64

# 2. Start everything
docker compose up -d --build

# 3. Verify
curl http://localhost:8080/actuator/health
open http://localhost:3000
```

**URLs:**
- Frontend: http://localhost:3000
- API: http://localhost:8080/api
- Swagger: http://localhost:8080/swagger-ui/index.html
- Health: http://localhost:8080/actuator/health

---

### Option B — Free Cloud (Railway + Vercel)

**Backend on Railway:**
1. Create Railway project, add MySQL plugin
2. Set environment variables (see `.env.example`)
3. `railway up` from the `backend/` directory

**Frontend on Vercel:**
1. `cd frontend && vercel`
2. Set `REACT_APP_API_BASE_URL=https://your-backend.railway.app/api`

---

### Option C — Local Development

```bash
# Terminal 1 — Backend (H2 in-memory, auto-seeded)
cd backend
cp ../.env.example .env
# Set JWT_SECRET in .env (any 32+ char string for dev)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Terminal 2 — Frontend
cd frontend
echo "REACT_APP_API_BASE_URL=http://localhost:8080/api" > .env
npm install && npm start
```

**Seeded Dev Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@swifteats.com | Admin@123 |
| Restaurant Admin | nandos.admin@swifteats.com | Admin@123 |
| Customer | alice@example.com | Customer@123 |
| Driver | driver1@swifteats.com | Driver@123 |

---

## 5. Production Readiness Checklist

### Security
- [x] JWT access + refresh tokens
- [x] BCrypt password hashing (strength 10)
- [x] Role-based authorization (ADMIN, RESTAURANT_ADMIN, CUSTOMER, DRIVER)
- [x] Rate limiting on auth endpoints
- [x] CORS per environment
- [x] H2 console disabled in prod
- [x] Secrets via environment variables
- [x] Non-root Docker user
- [x] No SQL logging in prod
- [ ] HTTPS/TLS (add via hosting platform or reverse proxy)

### Reliability
- [x] Docker health checks on all services
- [x] Spring Actuator /actuator/health
- [x] Global exception handler (no stack traces to client)
- [x] Input validation on all DTOs
- [x] @Transactional on all service methods
- [x] Pagination on all list endpoints

### Performance
- [x] HikariCP connection pool (20 max in prod)
- [x] FetchType.LAZY on all relationships
- [x] Database indexes on FK, status, email
- [x] Nginx gzip compression
- [x] Static asset caching (1 year)
- [ ] Redis caching (menus, restaurant lists)
- [ ] CDN for static assets

### DevOps
- [x] Multi-stage Docker builds
- [x] docker-compose.yml with dependency ordering
- [x] GitHub Actions CI/CD
- [x] Environment configuration guide
- [ ] Flyway/Liquibase migrations
- [ ] Database backup strategy

---

## 6. Future Enhancements

| Priority | Feature | Value |
|----------|---------|-------|
| HIGH | Flyway database migrations | Schema version control |
| HIGH | Redis caching (menus/restaurants) | Performance at scale |
| HIGH | WebSocket order tracking | Real-time UX |
| HIGH | Email order notifications | Core user expectation |
| MEDIUM | Leaflet map with restaurant pins | Visual discovery |
| MEDIUM | Favourites (restaurants + items) | Retention feature |
| MEDIUM | One-click reorder | Convenience |
| MEDIUM | AI recommendations (history + time) | Engagement |
| LOW | PDF receipts | Professional touch |
| LOW | Scheduled orders ("order for 7pm") | Power user feature |
| LOW | OAuth2 (Sign in with Google) | Reduced friction |
| LOW | RabbitMQ for async email/notifications | Scale infra |

---

## 7. Assumptions & Risks

**Assumptions:**
1. MySQL 8.0+ in production — Haversine query uses standard ANSI math functions (ACOS, COS, SIN, RADIANS), compatible with both H2 (dev) and MySQL/PostgreSQL (prod)
2. Africa/Johannesburg timezone for restaurant hours
3. Monolith architecture is appropriate at current scale

**Risks:**

| Risk | Mitigation |
|------|------------|
| Rate limiter is in-memory — resets on restart | Acceptable for now; add Redis-backed bucket for prod |
| ddl-auto=update can be destructive | Use Flyway migrations in production |
| JWT secret must stay secret | Use Railway/Vercel secrets or AWS Secrets Manager |
| Location permission denied by user | Graceful fallback to all-restaurants view (implemented) |

---

## Project Structure

```
SwiftEats-Production/
├── backend/
│   ├── src/main/java/com/swifteats/swifteats/
│   │   ├── config/         SecurityConfig, JwtTokenProvider, RateLimiting
│   │   ├── controller/     Auth, Restaurant, Menu, Order, Review, User
│   │   ├── dto/            Request/Response DTOs (with location fields)
│   │   ├── exception/      GlobalExceptionHandler
│   │   ├── model/          JPA entities (Restaurant now has lat/lon/city)
│   │   ├── repository/     JPA repos (RestaurantRepository has Haversine query)
│   │   ├── seeder/         DataSeeder (@Profile("dev") only)
│   │   ├── service/        Business logic (getNearbyRestaurants added)
│   │   └── validation/     PasswordValidator, PhoneNumberValidator
│   ├── src/main/resources/
│   │   ├── application.properties   Base config
│   │   ├── application-dev.yml      H2, debug, expose-link=true
│   │   └── application-prod.yml     MySQL, no SQL log, H2 off
│   └── Dockerfile                   Multi-stage Java 21
├── frontend/
│   ├── src/
│   │   ├── pages/HomePage.jsx       UPGRADED — location + nearby feature
│   │   └── services/restaurant.service.js  getNearby() added
│   ├── Dockerfile                   Multi-stage Node 20 + Nginx
│   └── nginx.conf                   Gzip, proxy, SPA routing
├── .github/workflows/ci.yml         GitHub Actions CI/CD
├── docker-compose.yml               MySQL + Backend + Frontend
├── .env.example                     Full environment variable guide
└── README.md                        This file
```
