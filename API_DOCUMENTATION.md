# Agency OS REST API Documentation

This document outlines the REST API endpoints provided by the NestJS backend of **Agency OS**.

Base URL: `http://localhost:3001`

---

## Table of Contents
1. [Overview](#overview)
2. [Clients API](#clients-api)
3. [Projects API](#projects-api)
4. [Quotations API](#quotations-api)
5. [Invoices API](#invoices-api)
6. [Payments API](#payments-api)
7. [Dashboard & Metrics API](#dashboard--metrics-api)
8. [Settings API](#settings-api)
9. [Database Schema](#database-schema)

---

## Overview
All requests and responses use standard JSON (`Content-Type: application/json`).

### Standard Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or invalid parameters.
- `404 Not Found`: Requested record does not exist.
- `500 Internal Server Error`: Server exception.

---

## Clients API

### 1. List All Clients
- **Endpoint**: `GET /api/clients`
- **Response** (`200 OK`):
```json
[
  {
    "id": "c1a2b3-...",
    "name": "Acme Corporation",
    "email": "contact@acmecorp.com",
    "phone": "+1 (555) 123-4567",
    "company": "Acme Corp",
    "address": "100 Industrial Parkway, CA",
    "taxId": "TX-998811",
    "status": "ACTIVE",
    "createdAt": "2026-09-28T21:00:00.000Z",
    "_count": {
      "projects": 2,
      "quotations": 1,
      "invoices": 3
    }
  }
]
```

### 2. Get Client by ID
- **Endpoint**: `GET /api/clients/:id`

### 3. Create Client
- **Endpoint**: `POST /api/clients`
- **Body**:
```json
{
  "name": "Globex Inc",
  "email": "hello@globex.io",
  "company": "Globex Enterprise",
  "phone": "+1 (555) 987-6543",
  "status": "ACTIVE"
}
```

### 4. Update Client
- **Endpoint**: `PATCH /api/clients/:id`

### 5. Delete Client
- **Endpoint**: `DELETE /api/clients/:id`

---

## Projects API

### 1. List All Projects
- **Endpoint**: `GET /api/projects`

### 2. Create Project
- **Endpoint**: `POST /api/projects`
- **Body**:
```json
{
  "name": "E-Commerce Platform Redesign",
  "description": "Next.js & Tailwind responsive store",
  "status": "IN_PROGRESS",
  "budget": 18500,
  "clientId": "<client-uuid>"
}
```

---

## Quotations API

### 1. List All Quotations
- **Endpoint**: `GET /api/quotations`

### 2. Create Quotation
- **Endpoint**: `POST /api/quotations`
- **Body**:
```json
{
  "title": "Enterprise Web Suite Proposal",
  "clientId": "<client-uuid>",
  "projectId": "<project-uuid>",
  "taxRate": 10,
  "items": [
    { "description": "Frontend Architecture", "quantity": 1, "unitPrice": 7000 },
    { "description": "Backend API Services", "quantity": 1, "unitPrice": 8000 }
  ]
}
```

### 3. Convert Quotation to Invoice
- **Endpoint**: `POST /api/quotations/:id/convert`
- **Description**: Automatically generates a new `SENT` invoice with matching line items and marks the quotation as `ACCEPTED`.

---

## Invoices API

### 1. List All Invoices
- **Endpoint**: `GET /api/invoices`

### 2. Create Invoice
- **Endpoint**: `POST /api/invoices`
- **Body**:
```json
{
  "title": "Milestone 1 Payment",
  "clientId": "<client-uuid>",
  "dueDate": "2026-10-30",
  "taxRate": 0,
  "items": [
    { "description": "Design Token Guidelines", "quantity": 1, "unitPrice": 4200 }
  ]
}
```

---

## Payments API

### 1. List All Payments
- **Endpoint**: `GET /api/payments`

### 2. Record Payment
- **Endpoint**: `POST /api/payments`
- **Body**:
```json
{
  "invoiceId": "<invoice-uuid>",
  "amount": 4200,
  "paymentMethod": "BANK_TRANSFER",
  "reference": "WIRE-9938472",
  "notes": "Milestone 1 settled"
}
```
*Note: Recording a payment automatically updates `paidAmount`, `balance`, and sets the invoice status to `PAID` or `PARTIALLY_PAID`.*

---

## Dashboard & Metrics API

### 1. Get Dashboard Metrics
- **Endpoint**: `GET /api/dashboard/metrics`
- **Response**:
```json
{
  "totalRevenue": 48250,
  "pendingAmount": 8250,
  "activeProjects": 4,
  "totalClients": 12,
  "activeQuotations": 3
}
```

### 2. Get Recent Activity
- **Endpoint**: `GET /api/dashboard/recent`

---

## Settings API

### 1. Get Agency Settings
- **Endpoint**: `GET /api/settings`

### 2. Update Agency Settings
- **Endpoint**: `PATCH /api/settings`
