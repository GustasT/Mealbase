# Mealbase

Mealbase is a mobile application for tracking meals and nutritional values.

The app allows users to scan food labels, store products with their nutritional information, and build dishes from those products while automatically calculating macros.

This project is built as a full-stack learning project to practice mobile development, backend APIs, and containerized infrastructure.

---

## Architecture

The system consists of three main parts:

- **Mobile app** — built with React Native (Expo)
- **Backend API** — built with Node.js and Fastify
- **Database** — PostgreSQL

---

## Tech Stack

### Web-MVP

- React
- Vite
- Typescript

### Mobile

- React Native
- Expo
- TypeScript

### Backend

- Node.js
- Fastify (Web framework)
- TypeScript

### Infrastructure

- PostgreSQL
- Docker
- Docker Compose

---

## Running Locally

### Requirements

- Docker

### Start the backend

From the project root:

```bash
docker compose up
```

### Migrate database schema and populate it from seed

```bash
npm run db:migrate
npm run db:seed
```

## Planned features

- Food label scanning and fetching info from Open Food Facts
- Scanning with OCR and Data processing using AI as fallback
- Mobile UI
