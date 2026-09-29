# Agency OS

Agency OS is a quotation, invoice, and payment management application for
agencies. This project uses separate frontend and backend applications:

- **Frontend:** Next.js, TypeScript, and Tailwind CSS
- **Backend:** NestJS and TypeScript
- **Planned database:** PostgreSQL with Prisma ORM

## Request architecture

```text
Browser
  -> Next.js frontend
  -> REST API request
  -> NestJS controller
  -> NestJS service (business rules)
  -> Prisma ORM
  -> PostgreSQL
```

The controller receives HTTP requests, the service owns application rules,
Prisma communicates with the database, and PostgreSQL stores application data.
The frontend renders the user interface in the browser.

## Run the frontend

Open PowerShell in the `agency-os` directory:

```powershell
cd .\frontend
npm run dev
```

Open <http://localhost:3000> in a browser.

## Run the backend

Open a second PowerShell window in the `agency-os` directory:

```powershell
cd .\backend
npm run start:dev
```

The backend listens on port `3001` by default so it can run at the same time as
the frontend.

## Verify the backend API

With the backend running, use a second PowerShell window:

```powershell
Invoke-RestMethod http://localhost:3001/
```

The initial NestJS route should respond with:

```text
Hello World!
```

The frontend makes this same request in the browser and displays the response in
its **Backend connection** panel. The API allows requests from
`http://localhost:3000`; set `FRONTEND_URL` on the backend if the frontend is
served from another origin. Set `NEXT_PUBLIC_API_URL` in
`frontend/.env.local` if the backend is hosted at a different address, then
restart the frontend.

## PostgreSQL and Prisma

PostgreSQL 18 should be running as the Windows service `postgresql-x64-18`.
Create a dedicated application role and the `agency_os` database using an
interactive `psql` session:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d postgres -W
```

At the `postgres=#` prompt, run these commands one at a time:

```sql
CREATE ROLE agency_os_app LOGIN;
\password agency_os_app
CREATE DATABASE agency_os OWNER agency_os_app;
\q
```

`\password` asks for a new password without echoing it. Choose a strong
alphanumeric password so it can be put in a connection URL without URL
encoding. Do not use the PostgreSQL administrator account for the application.

From `agency-os\backend`, create the ignored local environment file and edit it:

```powershell
Copy-Item .env.example .env -Force
notepad .env
```

Replace `REPLACE_WITH_LOCAL_PASSWORD` with the password you set for
`agency_os_app`. Do not commit `.env`; `.env.example` is the safe template.

Initialize and validate Prisma from `agency-os\backend`:

```powershell
npx prisma validate
npx prisma generate
```

Prisma schema is at `backend\prisma\schema.prisma`; its generated TypeScript
client goes under `backend\src\generated\prisma`. Database models and migrations
will be added when we define the application data model.

## Build checks

Run these commands from the `agency-os` directory:

```powershell
Push-Location .\frontend
npm run build
Pop-Location

Push-Location .\backend
npm run build
Pop-Location
```
