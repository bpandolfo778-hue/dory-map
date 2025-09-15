# Dory MVP (Backend)

Run a Node.js server that connects to Gmail + Google Calendar and scans email for leads/meetings.

## Quick Start
1) `npm install`
2) Copy `.env.example` → `.env` and fill values
3) Create DB tables: `psql "$DATABASE_URL" -f sql/schema.sql`
4) `npm run dev`
5) Open `http://localhost:5000` to use the test page

## Google OAuth
Create a Web OAuth Client with redirect:
http://localhost:5000/auth/google/callback

Scopes:
- https://www.googleapis.com/auth/gmail.readonly
- https://www.googleapis.com/auth/calendar.events
