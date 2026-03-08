# Mealbase – Project Context

## Project Goal

Mealbase is a mobile application for tracking meals and nutritional values.

Users can:

- scan food labels
- store food products with macros (per 100g)
- build dishes from stored products
- automatically calculate dish macros

This is a learning project focused on:

- backend development
- mobile development
- containerized environments
- authentication systems
- AI/OCR integration

---

# Architecture

Mobile App
React Native (Expo)

Backend API
Node.js + Fastify + TypeScript

Database
PostgreSQL

Infrastructure
Docker + Docker Compose

Architecture flow:

Mobile App → Backend API → PostgreSQL

---

# Current Stack

Mobile

- React Native
- Expo
- TypeScript

Backend

- Node.js
- Fastify
- TypeScript

Database

- PostgreSQL

Dev Infrastructure

- Docker
- Docker Compose

---

# Current Repository Structure

mealbase/
│
├ docker-compose.yml
├ README.md
├ PROJECT_CONTEXT.md
│
└ services/
└ api/
├ package.json
├ src/
│ └ index.ts

---

# Docker Setup

Services:

mealbase-api
Node.js backend

mealbase-db
PostgreSQL database

Important containers:

mealbase-api
mealbase-db

Health endpoint:

GET /health

Example:

curl http://localhost:3001/health

Expected response:

{ "ok": true, "db": true }

---

# Git Workflow

main
stable branch

feature/\*
feature branches

Example:

feature/auth
feature/products
feature/dishes
feature/ocr

Current branch:

feature/auth

---

# Current Progress

Completed:

- Dockerized backend setup
- PostgreSQL container running
- Fastify API server running
- /health endpoint implemented
- Git repository configured
- GitHub repository created
- GitHub SSH authentication configured
- VS Code Git integration fixed
- README created

---

# Next Steps

Authentication system:

1. Create users table
2. Install bcrypt
3. Install jsonwebtoken
4. Implement POST /auth/register
5. Implement POST /auth/login
6. Add JWT middleware

After auth:

products CRUD
dishes builder
macro calculations
OCR / AI food label scanning
mobile app UI

---

# Important Notes

Passwords will be stored using:

bcrypt (password hashing)

Authentication will use:

JWT (JSON Web Tokens)

Each resource will belong to a user:

products.user_id
dishes.user_id
