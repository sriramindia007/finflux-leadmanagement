# Finflux Lead Management

Monorepo containing the full lead management system — mobile (Field Officer) + web (Hub Team).

## Quick Start

### 1. Start the API server (required by both apps)
```bash
cd packages/api
npm install
npm start
# Runs on http://localhost:3001
```

### 2. Start the Web app (Hub Team)
```bash
cd packages/web
npm install
npm run dev
# Opens on http://localhost:5173
```

### 3. Start the Mobile app (Field Officer)
```bash
cd packages/mobile
npm install
npx expo start
# Scan QR with Expo Go app, or press 'w' for web
```

## Lead Flow
```
Mobile (Field Officer)     →    Web (Hub Team)         →    Mobile (Field Officer)
─────────────────────           ──────────────               ──────────────────────
Create Lead (APPROVAL_PENDING)  Qualify + Call Logs          Meet Lead
                                Approve (→ QUALIFIED)        Convert → Loan Application
                                Reject (→ REJECTED)
```

## Structure
```
packages/
├── api/     Express mock server (port 3001) — shared data layer
├── mobile/  React Native + Expo — Field Officer app
└── web/     React + Vite — Hub Team app (port 5173)
```

## Screens

### Mobile (Field Officer)
| Screen | Description |
|---|---|
| Home | Dashboard with stats, calendar, upcoming tasks |
| Leads Pool | Filtered list of leads (All/Pending/Qualified/Rejected/Converted) |
| New Lead | Create lead form (submits as APPROVAL_PENDING) |
| Onboarding Journey | Step tracker per lead |
| Rejection | Reject lead with reason |

### Web (Hub Team)
| Screen | Description |
|---|---|
| Leads Pool | Full table with filters, pagination, New Lead button |
| Lead Detail | Step tracker + Basic Details + Field Officer + Call Logs |
| Call Logs | Full call history per lead |
| Drawers | New Lead (right drawer), Add Call Log (right panel) |
