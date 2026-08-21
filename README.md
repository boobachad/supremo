# Supremo Ticket Booking Platform [![Supremo Booking Test Suite](https://github.com/boobachad/supremo/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/boobachad/supremo/actions/workflows/ci.yml)

The entire focus of the project is around testing with styling restricted to basic html only.

## Tech Stack

*   **Backend:** Node.js, Express, MySQL 8.0
*   **Frontend:** React (Vite)
*   **Unit Tests:** Mocha, Sinon, Chai
*   **Integration Tests:** Supertest, Mocha, Chai
*   **E2E Tests:** Playwright

## How to Run Locally

You must have Docker and Node.js (v20+) installed.

```bash
# 1. Start the MySQL database in the background
docker compose up -d

# 2. Install dependencies
npm install

# 3. Run database migrations
npm run db:migrate:test

# 4. Run the full test suite
npm run test:all       # Runs Unit & Integration tests
npm run test:e2e       # Runs Playwright E2E tests
```

## Test Architecture

This repository strictly adheres to the Testing Pyramid, separating logic into three isolated layers:

| Test Layer | Tools Used | Scope |
| :--- | :--- | :--- |
| **Unit Tests** | `Mocha`, `Sinon` | Tests isolated service logic, stubbed database calls, and middleware behavior. |
| **Integration Tests** | `Supertest`, `MySQL` | Tests full HTTP endpoints against a real transactional database. Verifies row-level locking, database constraints, and API schema validation. |
| **End-to-End Tests** | `Playwright` | Tests the full user journey (Register → Login → View Events → Book → Cancel)

### Test Counts
*   **~54 Unit Tests** 
*   **~40 Integration Tests**
*   **9 Playwright E2E Tests**
