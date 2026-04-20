# ─────────────────────────────────────────────
# Stage 1: Build React app
# ─────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json ./
RUN npm ci --silent

COPY . .

ARG REACT_APP_API_BASE_URL=/api
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ─────────────────────────────────────────────
FROM nginx:alpine

LABEL maintainer="SwiftEats Team"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
