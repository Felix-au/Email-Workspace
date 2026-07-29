# Domain Email Workspace — Quick Guide

A private, self-hosted webmail client and administrative manager built as a template for custom domain email systems. Send emails securely, configure suffix sender aliases, and organize template signatures from a unified Next.js dashboard.

> [!IMPORTANT]
> **Unlike commercial workspace accounts** that charge hefty monthly fees per user domain address, this custom domain email workspace template operates directly over the **Resend API and a self-hosted MongoDB database**. Users can register, administrators can approve accounts, and multiple email aliases can be managed dynamically under a single deployment, keeping operational costs close to zero.

---

## Table of Contents

- 🚀 [How to Run](#how-to-run)
  - [Option A: From Source (Development)](#option-a-from-source-development)
  - [Option B: Serverless Deployment (Production)](#option-b-serverless-deployment-production)
- 🔧 [Database and Service Setup](#database-and-service-setup)
- 🎯 [How to Use](#how-to-use)
- 📩 [Usage Basics and Interface Map](#usage-basics-and-interface-map)
  - [User Dashboard](#user-dashboard)
  - [Compose Modal](#compose-modal)
  - [Settings Panel](#settings-panel)
  - [Admin Approvals and Accounts](#admin-approvals-and-accounts)
- ⚡ [Emails Sync Pipeline](#emails-sync-pipeline)
- ⚙️ [Configuration](#configuration)
- ⚠️ [Important Deployment Notes](#important-deployment-notes)
- 📁 [Directory Index Checklist](#directory-index-checklist)

---

## How to Run

### Option A: From Source (Development)

**Prerequisites:** Node.js 20+, MongoDB database, Resend account with your custom domain (e.g. `yourdomain.com`) verified in Resend.

```bash
# 1. Install project dependencies
npm install

# 2. Start the hot-reloading development server
npm run dev
```

The application will run locally at [http://localhost:3000](http://localhost:3000). On boot, the database seeder will automatically initialize the administrative account (`admin@yourdomain.com` / `admin123`) if it is absent.

### Option B: Serverless Deployment (Production)

Deploy the application to **Vercel** for automatic serverless scaling. 

1. Push this repository to your GitHub account.
2. Link the repository in the Vercel Dashboard.
3. Inject the core variables (`MONGODB_URI`, `RESEND_API_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) in Vercel's Environment Variables panel.
4. Deploy the project. The build pipeline will execute:
   ```bash
   npm run build
   npm run start
   ```

---

## Database and Service Setup

To ensure fully functional synchronization:

1. **MongoDB Atlas Cluster**: Set up a free-tier database and whitelist incoming IP addresses (or allow access from anywhere, `0.0.0.0/0`, for serverless compatibility). Retrieve the cluster connection string.
2. **Resend SDK**: Retrieve your API key from the Resend console. Ensure your custom domain is verified in the Resend dashboard to authorize outbound mail dispatch.

---

## How to Use

1. **Initialize Admin**: Open the application landing page. Log in with the default admin credentials (`admin` / `admin123` or your configured admin user).
2. **First Action**: Immediately navigate to the admin Settings panel and change the default administrative password for security.
3. **Register User**: Log out of the admin panel. Click "Request registration" on the login card. Fill in a username, desired email prefix (e.g. `john` to form `john@yourdomain.com`), and a password.
4. **Approve User**: Log back in as `admin`. Go to the **Approvals** tab and click **Approve** on the newly requested registration.
5. **Verify Inbox**: Log in as the newly approved user. Your custom inbox is now live and will sync emails on load.

---

## Usage Basics and Interface Map

### User Dashboard

The core user screen is divided into three key panels:

- **Sidebar (Left)**: Instantly swap between **Inbox**, **Sent**, and **Settings** panes. Shows real-time badge counts for received and sent emails.
- **Email List (Middle)**: Displays a chronological stream of emails matching your primary address or aliases. Includes a manual refresh sync button.
- **Reading Pane (Right)**: Shows chosen email text or renders HTML layout securely.

### Compose Modal

Clicking "Compose Email" triggers a popup dialog:
- **From Dropdown**: Swap sender address between your primary address and any registered alias.
- **To**: Input target recipient email address.
- **Subject / Message**: Standard subject line and rich text body editor.
- **Footer Select**: Choose one of your registered signatures to append instantly.

### Settings Panel

Located in the user dashboard:
- **Sender Email Aliases**: Click "+" to register custom prefixes (e.g. `billing`, `support`).
- **Signature Template Footers**: Save formatted templates to sign off your emails automatically.
- **Security**: Reset your own password.

### Admin Approvals and Accounts

Located in the admin panel:
- **Approvals**: Lists all users requesting registrations.
- **Accounts**: Lists all active users, allows password resets, or triggers deletion. Deleting a user cascades to clear all associated emails from the database.

---

## Emails Sync Pipeline

The system does not require continuous active listeners. Email sync runs in the backend on demand:
1. When you access `/dashboard` or press the **Sync** button, the client hits `GET /api/emails`.
2. The server pulls a list of incoming emails from the Resend SDK.
3. It filters items where recipient fields match your primary email or aliases, and saves new entries to MongoDB.
4. It reads the local database and returns the combined email history.

---

## Configuration

All configuration variables are managed in `.env.local`:

| Variable | Description |
|---|---|
| `MONGODB_URI` | Connection URI for the MongoDB cluster |
| `RESEND_API_KEY` | Resend API credential token |
| `NEXTAUTH_SECRET` | Secret token securing NextAuth JWT |
| `NEXTAUTH_URL` | Application canonical endpoint |

---

## Important Deployment Notes

- **Password Rules**: User passwords must be at least 6 characters.
- **Domain Restriction**: Outbound emails will fail if the Resend account domain is not verified for your custom domain. Use `mock_key` for local sandbox simulation.
- **Cascade Deletes**: Account deletion is final and permanently cleans up all sent/received logs matching their registered addresses.

---

## Directory Index Checklist

Use this registry checklist to locate and study the core modules and routes of the project:

| Read? | File / Module | Core Functional Purpose |
| :---: | :--- | :--- |
| `[ ]` | **[src/app/layout.tsx](./src/app/layout.tsx)** | Root HTML/body wrapper initializing fonts, providers, and SSR theme loaders. |
| `[ ]` | **[src/app/page.tsx](./src/app/page.tsx)** | Authentication portal containing login inputs, registration prefix form, and theme toggler. |
| `[ ]` | **[src/app/dashboard/page.tsx](./src/app/dashboard/page.tsx)** | Primary interface for inbox listing, message compose forms, alias registries, and signature controls. |
| `[ ]` | **[src/app/admin/page.tsx](./src/app/admin/page.tsx)** | Administrator dashboard for registration approvals, account tables, password overrides, and account purging. |
| `[ ]` | **[src/app/api/emails/route.ts](./src/app/api/emails/route.ts)** | Main backend engine for sending messages and demand-driven inbox syncing via Resend. |
| `[ ]` | **[src/app/api/auth/[...nextauth]/route.ts](./src/app/api/auth/[...nextauth]/route.ts)** | Credentials authentication configurations, encryption checkers, and user session resolvers. |
| `[ ]` | **[src/app/api/auth/register/route.ts](./src/app/api/auth/register/route.ts)** | Registration validations, domain suffix generators, and database insertions. |
| `[ ]` | **[src/app/api/user/settings/route.ts](./src/app/api/user/settings/route.ts)** | User parameters modification handler (alias bindings, template signature editor, password updates). |
| `[ ]` | **[src/app/api/admin/users/route.ts](./src/app/api/admin/users/route.ts)** | Admin operations mapping user collection listings and registration approval flags. |
| `[ ]` | **[src/app/api/admin/users/[id]/route.ts](./src/app/api/admin/users/[id]/route.ts)** | Admin endpoints supporting force password overrides and account cascading deletions. |
| `[ ]` | **[src/lib/db.ts](./src/lib/db.ts)** | Connection pool manager for MongoDB and administrative seeding orchestrator. |
| `[ ]` | **[src/lib/resend.ts](./src/lib/resend.ts)** | Client wrapper initializing the Resend Email SDK. |
| `[ ]` | **[src/models/User.ts](./src/models/User.ts)** | MongoDB schema properties for accounts, alias lists, footers, and bcrypt helpers. |
| `[ ]` | **[src/models/Email.ts](./src/models/Email.ts)** | MongoDB schema mapping sent and received headers, content parameters, and indexed IDs. |
| `[ ]` | **[src/types/next-auth.d.ts](./src/types/next-auth.d.ts)** | Augmentation interfaces extending token definitions for NextAuth sessions. |
| `[ ]` | **[src/app/globals.css](./src/app/globals.css)** | Core stylesheet containing light/dark theme variables, transitions, animations, and custom scrollbars. |
