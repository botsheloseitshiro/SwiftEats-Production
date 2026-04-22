# Free Deployment Guide

This project is prepared for a free-tier deployment using:

- Frontend: Vercel Hobby
- Backend: Render Free Web Service
- Database: Render Free Postgres

Notes:

- Vercel Hobby is free: https://vercel.com/pricing/
- Render Free supports free web services and Postgres, but free web services spin down after 15 minutes of inactivity: https://render.com/free
- Railway is not the best "free forever" option for this project because its free access is usage-credit/trial based, not the simplest permanent free path: https://railway.com/pricing

## 1. Before You Start

Make sure you have:

1. A GitHub account
2. A Vercel account
3. A Render account
4. This project pushed to a GitHub repository

## 2. Push the Project to GitHub

If you have not pushed it yet:

1. Create a new GitHub repository
2. Upload the full `SwiftEats-Production` project
3. Confirm GitHub shows:
   - `backend/`
   - `frontend/`
   - `DEPLOY_FREE.md`

## 3. Create the Free Database on Render

1. Sign in to Render
2. Click `New` -> `Postgres`
3. Choose the `Free` instance
4. Name it something like `swifteats-db`
5. Choose a region close to you
6. Create the database
7. After it is created, open the database dashboard
8. Copy the:
   - Internal Database URL
   - User
   - Password
   - Database name

Important:

- Use the internal database connection for your Render backend service
- Render Postgres uses PostgreSQL, so this project now includes the PostgreSQL driver as well

## 4. Deploy the Backend on Render

1. In Render click `New` -> `Web Service`
2. Connect your GitHub repository
3. Choose the repo that contains this project
4. Set these values:

- Name: `swifteats-backend`
- Region: same as your database
- Branch: your main branch
- Root Directory: `backend`
- Runtime: `Docker`

Render will build from `backend/Dockerfile`

### Backend Environment Variables

Add these environment variables in Render:

- `SPRING_PROFILES_ACTIVE=prod`
- `JWT_SECRET=replace-with-a-long-random-secret`
- `DB_URL=jdbc:postgresql://<render-internal-host>:5432/<database-name>`
- `DB_USERNAME=<render-postgres-user>`
- `DB_PASSWORD=<render-postgres-password>`
- `DB_DRIVER=org.postgresql.Driver`
- `HIBERNATE_DIALECT=org.hibernate.dialect.PostgreSQLDialect`
- `CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`

If you want both local development and production frontend access, use a comma-separated value:

- `CORS_ALLOWED_ORIGINS=http://localhost:3000,https://<your-vercel-domain>`
- `FRONTEND_RESET_PASSWORD_URL=https://<your-vercel-domain>/reset-password`
- `RESET_PASSWORD_EXPOSE_LINK=false`

Optional mail settings:

- `MAIL_HOST=`
- `MAIL_PORT=587`
- `MAIL_USERNAME=`
- `MAIL_PASSWORD=`
- `MAIL_FROM=no-reply@swifteats.app`

Optional API docs:

- `SPRINGDOC_API_DOCS_ENABLED=false`
- `SPRINGDOC_SWAGGER_UI_ENABLED=false`

Leave both disabled for normal production deployments.

### Seeder Settings

To populate the app one time in deployment:

- `SEEDER_ENABLED=true`

Deploy the backend once with seeding enabled.

After the first successful seed:

1. Open the backend Environment page
2. Change `SEEDER_ENABLED` to `false`
3. Redeploy the backend

This prevents repeated production seeding.

### Backend Verification

After deploy:

1. Open the Render backend URL
2. Visit:

`https://<your-render-backend-domain>/actuator/health`

You should see a health response.

## 5. Deploy the Frontend on Vercel

1. Sign in to Vercel
2. Click `Add New...` -> `Project`
3. Import the same GitHub repository
4. Configure:

- Framework Preset: `Create React App`
- Root Directory: `frontend`

### Frontend Environment Variable

Set:

- `REACT_APP_API_BASE_URL=https://<your-render-backend-domain>/api`

Then deploy.

This project includes `frontend/vercel.json` so React Router routes like `/login`, `/reset-password`, and `/profile` work correctly on Vercel refreshes.

## 6. Update the Backend After Frontend URL Exists

Once Vercel gives you the real frontend URL:

1. Go back to Render backend settings
2. Update:

- `CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`

You can also keep local access at the same time:

- `CORS_ALLOWED_ORIGINS=http://localhost:3000,https://<your-vercel-domain>`
- `FRONTEND_RESET_PASSWORD_URL=https://<your-vercel-domain>/reset-password`

3. Redeploy backend

## 7. First Login and Seeded Data

With seeding enabled on first deployment, the app should populate:

- system admins
- customers
- drivers
- 50+ restaurant branches
- restaurant admins
- menus
- orders
- reviews

Seed passwords:

- Admin: `AdminPass123!`
- Manager: `ManagerPass123!`
- Restaurant admins: `RestaurantAdmin123!`
- Customers: `Customer123!`
- Drivers: `Driver123!`

## 8. Full Deployment Checklist

1. Push project to GitHub
2. Create free Render Postgres
3. Deploy backend on Render from `backend/`
4. Set backend env vars
5. Set `SEEDER_ENABLED=true`
6. Deploy backend
7. Verify `/actuator/health`
8. Deploy frontend on Vercel from `frontend/`
9. Set `REACT_APP_API_BASE_URL`
10. Copy Vercel frontend URL
11. Update backend CORS and reset-password URL
12. Set `SEEDER_ENABLED=false`
13. Redeploy backend
14. Test login, nearby restaurants, forgot password, and orders
15. Confirm favorites, notifications, and role dashboards load correctly

## 9. Generate a Strong JWT Secret

Use one of these:

PowerShell:

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

OpenSSL:

```bash
openssl rand -base64 64
```

## 10. Important Free-Tier Limits

Render Free:

- free web services spin down after 15 minutes without traffic
- not recommended for heavy production traffic
- good for demos, learning, testing, and portfolio deployment

Vercel Hobby:

- free for personal projects
- good fit for this frontend

## 11. Recommended Deploy Order

Use this exact order:

1. Database first
2. Backend second
3. Frontend third
4. Backend env cleanup last

That order avoids broken CORS and reset-password links.
