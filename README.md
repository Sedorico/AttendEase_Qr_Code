# AttendEase

A web-based QR attendance management system built for organizations that operate on flexible work schedules. Employees time in and out using a dynamic QR code scanned at a kiosk, and attendance data is tracked and reviewed through role-based dashboards.

---

## Live Demo

[https://attendease-qrcode.vercel.app](https://attendease-qrcode.vercel.app)

---

## Overview

AttendEase eliminates paper-based or manual attendance tracking by issuing each employee a cryptographically signed, time-limited QR code that refreshes every 25 seconds. A kiosk scanner reads the code and records the time in or time out. The system enforces a 9-hour workday (inclusive of a 1-hour break that is automatically deducted) and supports overtime and undertime request workflows that require manager approval.

---

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- MongoDB with Mongoose
- Tailwind CSS
- Framer Motion
- JWT authentication with HTTP-only cookies
- QR code generation via the `qrcode` library
- HMAC-SHA256 signed QR tokens for replay attack prevention

---

## Roles

The system has three access levels.

**Employee** — Can view their own QR code, monitor shift progress, submit overtime or undertime requests, and review personal attendance history.

**Manager** — Has the same capabilities as an employee for their own attendance. Additionally manages a department-scoped dashboard showing today's attendance, employee list, and pending overtime and undertime requests awaiting approval.

**Admin** — Has full access to all employees and departments. Can promote or demote employee roles, activate or deactivate accounts, and view system-wide attendance data and statistics.

---

## Attendance Logic

There is no late tracking. Employees may time in at any point during the day.

The required working duration per day is 9 hours. One hour of break time is automatically deducted from the total time between time in and time out, leaving 8 effective working hours required.

Attendance statuses are as follows.

- `in_progress` — employee has timed in and is currently on shift
- `complete` — employee has timed out at or near the 9-hour mark (within a 5-minute tolerance)
- `undertime` — employee timed out before completing 9 hours, with manager approval
- `overtime` — employee worked beyond 9 hours, with manager approval
- `auto_signed_out` — employee's overtime request was rejected and the system signed them out automatically

---

## Overtime and Undertime Workflow

Employees may submit an overtime or undertime request at any point during an active shift. Both request types are routed to the department manager for approval before any time out is recorded.

For overtime, if the manager approves, the shift continues tracking. If rejected, the employee is automatically signed out and notified.

For undertime, if the manager approves, the employee may proceed to time out. If rejected, the shift continues and the employee must complete the required hours.

Managers are exempt from the approval flow. Their overtime and undertime are calculated automatically upon time out.

---

## QR Code Security

Each QR code is valid for 30 seconds and contains the employee ID, an expiry timestamp, a unique nonce, and an HMAC-SHA256 signature. The signature is verified on the server before any attendance record is created. Used tokens are tracked to prevent replay attacks.

---

## Folder Structure

```
app/
  admin/          Admin dashboard, employee management
  manager/        Manager dashboard, department-scoped
  employee/       Employee QR, shift progress, history
  scanner/        Kiosk scanner page
  api/            All API routes

components/
  employee/       QR display, attendance history, today status
  admin/          Shared admin sidebar
  notifications/  Bell icon, toast notifications

lib/
  models/         Mongoose models (Employee, Attendance, Notification, QRSession)
  auth.ts         JWT utilities
  db.ts           MongoDB connection
  qr.ts           QR token generation and validation
  constants.ts    System-wide constants
```

---

## Setup

**Prerequisites:** Node.js 18 or later, MongoDB (local or Atlas), pnpm

**1. Clone the repository and install dependencies.**

```bash
git clone https://github.com/your-username/attendease.git
cd attendease
pnpm install
```

**2. Create a `.env.local` file in the project root.**

```env
MONGODB_URI=mongodb://localhost:27017/attendease
JWT_SECRET=your-jwt-secret-minimum-32-characters
QR_SECRET=your-qr-hmac-secret-minimum-32-characters
```

**3. Start the development server.**

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

**4. Access the system.**

| URL | Description |
|---|---|
| `/register` | Create a new employee account |
| `/login` | Sign in |
| `/employee` | Employee dashboard |
| `/scanner` | QR scanner kiosk |
| `/admin` | Admin panel (admin role required) |
| `/manager` | Manager dashboard (manager or admin role required) |

An admin account can be set up directly in the database by updating the `role` field of an existing employee document to `"admin"`. Once logged in, the admin can promote other employees through the admin panel without requiring direct database access.

---

## Deployment

The application is deployed on Vercel. Set the following environment variables in the Vercel dashboard before deploying.

```
MONGODB_URI
JWT_SECRET
QR_SECRET
```

If using MongoDB Atlas, ensure that the network access settings allow connections from all IP addresses (`0.0.0.0/0`) or from Vercel's IP ranges.

---

## License

MIT
