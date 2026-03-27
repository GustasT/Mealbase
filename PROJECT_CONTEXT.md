# Mealbase – Project Context

## Project Goal

Mealbase is a mobile application for tracking meals and nutritional values.

Users can:

- store food products with macros (per 100g)
- build meals from stored products
- automatically calculate meal macros
- view per-meal and per-serving nutrition data

This is a learning project focused on:

- backend development
- mobile development
- containerized environments
- authentication systems
- clean architecture & data modeling

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

Mobile (planned / starting)

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
├ .devcontainer/
├ docker-compose.yml
├ Makefile
├ PROJECT_CONTEXT.md
├ README.md
├ requests.http
├ services/
│ └ api/
│ ├ package.json
│ ├ src/
│ │ ├ index.ts
│ │ ├ db.ts
│ │ ├ authMiddleware.ts
│ │ ├ routes/
│ │ │ ├ auth.ts
│ │ │ ├ profile.ts
│ │ │ ├ products.ts
│ │ │ └ meals.ts
│ │ └ utils/
│ │ ├ mealsNormalization.ts
│ │ └ mealsHelpers.ts

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

# Backend Features (Current State)

## Authentication

- Register (POST /auth/register)
- Login (POST /auth/login)
- JWT-based authentication
- authMiddleware for protected routes

---

## Products

- Create product
- Get all products
- Get product by id
- Update product
- Delete product

Each product:

- belongs to user (user_id)
- stores macros per 100g

---

## Meals

Full CRUD implemented:

- POST /meals
- GET /meals
- GET /meals/:id
- PUT /meals/:id
- DELETE /meals/:id

Meal features:

- meals consist of multiple products
- each item has grams
- automatic macro calculation:
  - protein
  - carbs
  - fat
  - calories
- total macros per meal
- per-serving macros

---

## Data Handling Improvements

Implemented:

- normalization layer (DB → API format)
  - snake_case → camelCase
- consistent response structure
- macro calculation logic
- validation (schema + manual checks)

---

# Git Workflow (Updated)

Branches:

main  
→ stable, production-like state

develop  
→ integration branch for new features

feature/\*  
→ individual features

Examples:

- feature/auth
- feature/products
- feature/meals
- feature/frontend-mvp

Flow:

feature → develop → main

---

# Current Progress

## Backend

✅ Completed:

- Dockerized backend
- PostgreSQL integration
- Authentication system (JWT)
- Products CRUD
- Meals CRUD
- Macro calculations
- Data normalization layer
- Refactor of meals logic (helpers + utils)
- Clean API responses

---

## Frontend

🚧 Starting:

- Frontend MVP (React + Vite)
- API integration (meals, auth)
- Basic UI (list + create + view)

---

# Next Steps

## Frontend MVP

1. Setup React (Vite)
2. Implement auth (login + token storage)
3. Meals list page
4. Single meal page
5. Create meal form

---

## Backend (later improvements)

- Further refactoring (split large route files)
- Shared helpers for calculations
- Better typing (remove any)
- Validation improvements

---

## Future Features

- OCR / AI food label scanning
- Mobile UI (React Native)
- Image upload
- Search & filtering
- Favorites / templates

---

# Important Notes

Authentication:

- JWT (stateless)
- Authorization header required

Passwords:

- hashed using bcrypt

Data ownership:

- all resources scoped by user_id

Database conventions:

- snake_case in DB
- camelCase in API

---

# Project Status

Current state:

Backend is fully functional and stable  
Ready for frontend integration (MVP phase)
