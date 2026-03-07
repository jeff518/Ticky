# Ticky – Enterprise Helpdesk

Electron desktop app for ticket triage with automated classification, routing, SLA tracking, and escalation.

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3) – no external DB required
- **Auth**: JWT (Admin, Agent, Manager roles)

## Features

- **Ticket Intake**: Form with name, email, department, subject, description, optional attachment
- **Classification Engine**: Keyword-based NLP (Technical, Billing, Account, Feature Request, Security)
- **Routing Engine**: Auto-assigns tickets to teams (IT, Finance, Customer Support, Security, Product)
- **SLA System**: 2h (Critical), 8h (High), 24h (Medium), 48h (Low)
- **Escalation**: Auto-escalate on Critical urgency, SLA breach
- **Role Dashboards**: Admin (overview, analytics), Agent (assigned tickets, status), Manager (escalated, override)
- **Notifications**: On create, escalation, SLA breach
- **Search & filter**, sort by urgency, analytics chart

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Seed users

```bash
cd backend && npm run seed
```

Demo users:

- Admin: `admin@ticky.com` / `admin123`
- Agent: `agent@ticky.com` / `agent123`
- Manager: `manager@ticky.com` / `manager123`
- User: `user@ticky.com` / `user123` (raise tickets & delete own tickets only)

### 3. Run (web dev)

```bash
npm run dev:backend   # Terminal 1 – API on :3001
npm run dev:frontend  # Terminal 2 – UI on :5173
```

Or both: `npm run dev`

Then open http://localhost:5173 and log in.

### 4. Run Electron

```bash
npm run dev           # Start backend + frontend
npm run start         # In another terminal – launch Electron
```

Or use `npx concurrently "npm run dev" "wait-on http://localhost:3001 http://localhost:5173 && electron ."` to start all at once.

## Project Structure

```
kaizen/
├── electron/          # Electron main process
├── backend/           # Express API
│   ├── routes/        # Auth, tickets, notifications
│   ├── services/      # Classification, routing, SLA, escalation
│   └── middleware/    # JWT auth
├── frontend/          # React (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       └── contexts/
└── package.json
```

## API

- `POST /api/auth/login` – Login
- `GET /api/auth/me` – Current user
- `GET /api/tickets` – List (query: status, category, urgency, search, sort, order)
- `POST /api/tickets` – Create ticket (form-data)
- `GET /api/tickets/:id` – Ticket detail
- `PATCH /api/tickets/:id/status` – Update status
- `PATCH /api/tickets/:id/override` – Override urgency/team (Manager/Admin)
- `GET /api/tickets/stats` – Admin stats
- `GET /api/tickets/assigned/:team` – By team
- `GET /api/notifications` – Notifications
