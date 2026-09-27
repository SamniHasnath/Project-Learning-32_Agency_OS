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
# Agency_OS
