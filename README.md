# SwiftEats

Professional, production-focused full-stack food delivery platform.

Why it matters
- Clear, deployable reference implementation for a food-delivery monolith.
- Demonstrates production patterns: Docker, Actuator, CI/CD, secure configs.

## Project Description

SwiftEats is a full-stack food delivery application providing restaurant discovery,
menu browsing, ordering, and role-based management (customers, drivers,
restaurant admins, and platform admins). The backend is Spring Boot (Java)
and the frontend is React. The project includes production-ready improvements
such as multi-stage Docker builds, health checks, secure configuration, and a
nearby-restaurant search using geospatial (Haversine) queries.

Why it matters
- Shows end-to-end system design and production hygiene.

## Features

- User authentication and roles (JWT access + refresh)
- Restaurant registration and administration
- Location-aware "Nearby restaurants" search (Haversine)
- Menu browsing, cart, and order flow
- Admin and driver dashboards
- Rate limiting on auth endpoints
- Spring Actuator health checks and metrics
- Multi-stage Dockerfiles and docker-compose setup
- GitHub Actions CI for build/test

## Screenshots

Include screenshots in `frontend/public/images/` and reference them here.

Example:

![Home](frontend/public/images/home-screenshot.png)

## Tech Stack

Frontend:
- React (Create React App)

Backend:
- Spring Boot 3.x, Java 21
- Maven build

Database:
- PostgreSQL (production), H2 for dev

DevOps / Tools:
- Docker / docker-compose
- GitHub Actions
- Nginx (frontend reverse proxy)

Why it matters
- Helps contributors understand runtime requirements and skills demonstrated.

## Architecture

Client → Frontend (React) → Backend (Spring Boot REST API) → Database

Key design notes:
- Controllers call Services which use Repositories for data access.
- DTOs are used for API boundaries; location-aware DTOs include distanceKm.
- A native Haversine query is used for efficient nearby searches.

## Project Structure

Top-level layout (important files):

- [backend/Dockerfile](backend/Dockerfile) — backend container build
- [frontend/Dockerfile](frontend/Dockerfile) — frontend build + nginx
- [docker-compose.yml](docker-compose.yml) — local orchestration
- [backend/src/main/resources/application-dev.yml](backend/src/main/resources/application-dev.yml) — dev config
- [backend/src/main/resources/application-prod.yml](backend/src/main/resources/application-prod.yml) — prod config

Code layout (detailed):

backend/
 ├── src/main/java/com/swifteats/swifteats/
 │   ├── config/                # SecurityConfig, JwtTokenProvider, RateLimiting
 │   ├── controller/            # AuthController, RestaurantController, OrderController, etc.
 │   ├── dto/                   # Request/Response DTOs (RegisterRestaurantRequest, RestaurantDTO, OrderDTO)
 │   ├── model/                 # JPA entities (User.java, Restaurant.java, MenuItem.java, Order.java)
 │   ├── repository/            # Spring Data JPA repos (UserRepository, RestaurantRepository with Haversine)
 │   ├── service/               # Business logic (AuthService, RestaurantService, OrderService)
 │   ├── seeder/                # DataSeeder (@Profile("dev"))
 │   ├── exception/             # GlobalExceptionHandler, custom exceptions
 │   └── validation/            # Custom validators (PasswordValidator, PhoneNumberValidator)
 ├── src/main/resources/
 │   ├── application.properties
 │   ├── application-dev.yml
 │   └── application-prod.yml
 └── Dockerfile

frontend/
 ├── src/
 │   ├── components/            # Reusable React components (Navbar, Pagination, Cards)
 │   ├── pages/                 # Page components (HomePage.jsx, MenuPage.jsx, ProfilePage.jsx)
 │   ├── context/               # React contexts (AuthContext, CartContext, FavoritesContext)
 │   ├── services/              # API wrappers (restaurant.service.js, auth.service.js)
 │   ├── utils/                 # Helpers (formatters, distance calc)
 │   └── styles/                # CSS / SASS files
 ├── public/                    # static assets, index.html, images/
 └── Dockerfile

ops/
 ├── docker-compose.yml        # Local orchestration (use Postgres service in compose if needed)
 ├── .github/workflows/ci.yml   # CI pipeline definitions
 └── nginx.conf                 # Optional reverse-proxy for production builds

config/
 ├── .env.example               # Example environment variables for dev/prod

Other top-level file:
 - README.md

## Installation

Prerequisites: Java 21, Docker, Docker Compose, Node 18+ (for local frontend dev).

Run with Docker Compose (recommended):

```bash
cp .env.example .env
# Edit .env with secrets (JWT_SECRET, DB_PASSWORD, etc.)
docker compose up -d --build
```

Local development (backend + frontend separately):

```bash
# Backend (dev profile, H2)
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Frontend
cd frontend
npm install
npm start
```

## Environment Variables

Required values (see `.env.example`):

- DB_URL / DB_USERNAME / DB_PASSWORD
- JWT_SECRET
- MAIL_HOST / MAIL_USERNAME / MAIL_PASSWORD (if email enabled)
- REACT_APP_API_BASE_URL (frontend)

Never commit real secrets to source control.

## Usage

1. Register a user or use seeded dev accounts (dev profile).
2. Use the Home page to search or click "Restaurants near me".
3. Create orders via the cart flow; admins and restaurant admins manage listings.

## API Documentation

The backend exposes REST endpoints under `/api`. Key examples:

- `POST /api/auth/login` — authenticate and receive JWT tokens
- `GET /api/restaurants` — list restaurants
- `GET /api/restaurants/nearby?lat=&lon=&radiusKm=` — nearby search

For full API details, open the running backend Swagger UI at:

- http://localhost:8080/swagger-ui/index.html

## Database Design

Core entities:

- `User` — platform users and roles
- `Restaurant` — includes `city`, `latitude`, `longitude`, `deliveryRadiusKm`
- `Menu` / `MenuItem` — menu model
- `Order` — order lifecycle and status

Use Flyway (planned) for schema migrations in production.

## Authentication & Security

- JWT for stateless authentication (access + refresh)
- BCrypt password hashing
- Role-based access control (ADMIN, RESTAURANT_ADMIN, CUSTOMER, DRIVER)
- CORS and actuator endpoint restrictions in prod

## Challenges & Solutions

- Challenge: Nearby search without geospatial DB features.
  Solution: Native Haversine SQL query with distance calculation.

- Challenge: Seeder running in production.
  Solution: `@Profile("dev")` added to DataSeeder.

## Testing

- Backend: JUnit tests (Maven)
- Frontend: Jest/React Testing Library
- CI: GitHub Actions runs unit tests and builds Docker images

## Deployment

Recommended deployment targets for this project:

- Frontend: Vercel (recommended for the React static site). Configure the
  `REACT_APP_API_BASE_URL` environment variable in the Vercel project settings
  to point to your backend (for example `https://your-backend.onrender.com/api`).
  Vercel will auto-deploy on pushes to the connected Git branch.

- Backend: Render (Web Service) — deploy the backend as a Docker-backed or
  native service from the repository. Configure environment variables on
  Render (database URL, `JWT_SECRET`, mail settings). Use Render's health
  checks to probe `/actuator/health` so the platform can restart unhealthy
  instances.

- Database: Managed PostgreSQL (use Render Postgres, Cloud SQL, or RDS).
  Store the connection string in Render and don't commit credentials to source
  control. Example connection string format: `postgres://USER:PASS@HOST:PORT/DBNAME`.

- CI/CD: GitHub Actions for build and test; Render and Vercel can auto-deploy
  from GitHub on push. You can also configure GitHub Actions to build Docker
  images and push to a registry before deploying.

Quick deploy notes:

Vercel (frontend):

```bash
# In Vercel dashboard: set `REACT_APP_API_BASE_URL` to https://<your-backend>/api
# Connect GitHub repo and deploy from main branch
```

Render (backend):

```bash
# Create a new Web Service on Render and connect your GitHub repo
# Set environment variables: DATABASE_URL, JWT_SECRET, MAIL_* etc.
# Set Health Check Path to /actuator/health
# Optionally add Render Postgres and use its DATABASE_URL
```

## Contributors

- Lead: Botshelo Seitshiro (Project Owner)
- See commit history for individual contributors


