# S-Curve Project Monitoring System

## 1. Project Overview

### Project Name

S-Curve Project Monitoring System

### Purpose

A web-based project monitoring platform that allows organizations from any industry to:

- Create projects
- Build dynamic Work Breakdown Structures (WBS)
- Track project progress
- Compare Baseline vs Actual progress
- Visualize project performance using S-Curve charts
- Monitor milestones
- Generate project status dashboards

The system should be generic and not tied to any specific industry.

Target industries:

- Construction
- Software Development
- Manufacturing
- Event Management
- Government Projects
- Consulting Projects
- Internal Corporate Projects

---

# 2. Business Goals

The system must answer these questions:

### Project Manager

- What is the current progress?
- Which tasks are delayed?
- Which milestones are approaching?

### Management

- Is the project on schedule?
- How much variance exists between plan and actual?
- Which projects require attention?

### Team

- What tasks are assigned?
- What should be updated today?

---

# 3. MVP Scope

The first version only includes:

## Included

- Authentication
- Project Management
- Dynamic WBS
- Milestones
- Progress Tracking
- Baseline Management
- S-Curve Visualization
- Dashboard

## Excluded

- Cost Tracking
- Resource Tracking
- Budget Management
- Timesheet
- Risk Register
- Procurement
- AI Forecasting
- EVM

These features may be added later.

---

# 4. Technology Stack

## Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

## Backend

- Next.js Server Actions
- Next.js Route Handlers

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Auth

## ORM

- Prisma

## Deployment

- Vercel

## Source Control

- GitHub

---

# 5. High Level Architecture

```text
Browser
   │
   ▼
Next.js App
   │
   ├── Server Actions
   ├── API Routes
   ├── Authentication
   └── Business Logic
   │
   ▼
Supabase PostgreSQL
```

---

# 6. Roles

## Admin

Can:

- Create projects
- Update projects
- Delete projects
- Manage users
- View all projects

---

## Project Manager

Can:

- Create WBS
- Update progress
- Manage milestones
- Manage baselines

---

## Viewer

Can:

- View dashboards
- View projects
- View reports

Cannot modify data.

---

# 7. Core Modules

## Module 1: Authentication

### Features

- Login
- Logout
- Forgot Password
- Profile

### Authentication Provider

Supabase Auth

---

## Module 2: Project Management

### Features

Create project

Fields:

```text
Project Name
Description
Start Date
End Date
Status
Owner
```

### Status

```text
Draft
Active
Completed
Cancelled
```

---

## Module 3: Dynamic WBS

### Objective

Create unlimited hierarchical project structures.

Example:

```text
Project
├── Phase 1
│
├── Module A
│   ├── Feature A1
│   │   ├── Task 1
│   │   └── Task 2
│
└── Phase 2
```

No depth limitation.

---

### WBS Item Fields

```text
Name
Description
Parent
Weight
Progress
Planned Start
Planned End
Status
```

---

### Status

```text
Not Started
In Progress
Completed
Delayed
```

---

### Progress Rules

Only leaf nodes can be manually updated.

Parent nodes are calculated automatically.

Example:

```text
Task A = 100%
Task B = 50%

Parent = 75%
```

---

## Module 4: Baseline

### Objective

Lock the original project plan.

### Workflow

Project Created

↓

Create WBS

↓

Create Milestones

↓

Create Baseline

↓

Baseline Locked

---

### Baseline Data

```text
Project Dates
Task Dates
Task Weights
Milestones
```

---

### Baseline Versioning

```text
Baseline v1
Baseline v2
Baseline v3
```

Future enhancement.

For MVP:

Only Baseline v1.

---

## Module 5: Milestones

### Features

Create milestone

Fields:

```text
Name
Description
Due Date
Actual Completion Date
Status
```

---

### Status

```text
Pending
Completed
Delayed
```

---

## Module 6: Progress Tracking

### Objective

Track historical progress.

Users should never overwrite history.

Store snapshots.

Example:

```text
01 Jan = 10%
05 Jan = 25%
10 Jan = 35%
15 Jan = 50%
```

Used for:

- S-Curve
- Historical Reports
- Future Forecasting

---

## Module 7: Dashboard

### Metrics

Show:

```text
Total Projects

Active Projects

Completed Projects

Delayed Projects
```

---

### Project Summary

```text
Planned Progress

Actual Progress

Variance
```

---

### Upcoming Milestones

```text
Milestone
Due Date
Days Remaining
```

---

# 8. S-Curve Module

## Objective

Compare:

- Planned Progress
- Actual Progress

---

### Planned Curve

Generated from:

```text
Task Weight
Planned Start
Planned End
```

---

### Actual Curve

Generated from:

```text
Progress Logs
```

---

### Variance

Formula:

```text
Variance =
Actual Progress
-
Planned Progress
```

Example:

```text
Actual = 45%

Planned = 60%

Variance = -15%
```

---

### Status Indicator

```text
Green
On Track

Yellow
Slight Delay

Red
Critical Delay
```

---

# 9. Database Design

## profiles

```sql
id uuid
auth_user_id uuid

full_name text
email text

created_at timestamp
updated_at timestamp
```

---

## projects

```sql
id uuid

name text
description text

start_date date
end_date date

status text

created_by uuid

created_at timestamp
updated_at timestamp
```

---

## wbs_items

```sql
id uuid

project_id uuid

parent_id uuid

name text
description text

weight numeric

progress numeric

planned_start date
planned_end date

status text

sort_order integer

created_at timestamp
updated_at timestamp
```

---

## milestones

```sql
id uuid

project_id uuid

name text
description text

due_date date

completed_date date

status text

created_at timestamp
updated_at timestamp
```

---

## project_baselines

```sql
id uuid

project_id uuid

baseline_name text

snapshot jsonb

created_at timestamp
```

---

## progress_logs

```sql
id uuid

project_id uuid

wbs_item_id uuid

progress numeric

remarks text

created_by uuid

created_at timestamp
```

---

# 10. Folder Structure

```text
src

├── app
│
├── components
│
├── features
│   ├── auth
│   ├── projects
│   ├── wbs
│   ├── milestones
│   ├── baselines
│   ├── dashboard
│   └── scurve
│
├── actions
│
├── lib
│   ├── prisma
│   ├── supabase
│   ├── auth
│   └── utils
│
├── hooks
│
├── services
│
├── types
│
└── constants
```

---

# 11. Development Roadmap

## Phase 1

Project Setup

Tasks:

- Create Next.js project
- Setup Supabase
- Setup Prisma
- Setup Tailwind
- Setup shadcn/ui
- Setup Authentication

---

## Phase 2

Project Module

Tasks:

- Create Project
- Edit Project
- Delete Project
- Project List

---

## Phase 3

Dynamic WBS

Tasks:

- Create WBS Item
- Update WBS Item
- Delete WBS Item
- Recursive Tree Rendering
- Automatic Parent Progress Calculation

---

## Phase 4

Milestones

Tasks:

- Create Milestone
- Edit Milestone
- Delete Milestone

---

## Phase 5

Baselines

Tasks:

- Baseline Snapshot
- Baseline Comparison

---

## Phase 6

Progress Tracking

Tasks:

- Progress Logs
- History View

---

## Phase 7

S-Curve

Tasks:

- Planned Curve
- Actual Curve
- Variance Calculation

---

## Phase 8

Dashboard

Tasks:

- KPI Cards
- Project Summary
- Milestone Summary
- S-Curve Widget

---

# 12. Setup Instructions

## Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Git

## Environment Variables

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your Supabase URL and anon key from the project settings
3. Get your database connection string from the project settings
4. Copy `.env.example` to `.env` and fill in the values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_connection_string
```

## Database Setup

**Important Note:** Due to compatibility issues between Prisma 7+ and Supabase connection pooling, use the migration workflow instead of `db push`:

1. After setting up your environment variables, run the following command to create the database schema:

```bash
npx prisma migrate dev --name init
```

This creates the database tables according to your schema definition.

2. Generate the Prisma client:

```bash
npx prisma generate
```

**Alternative approach** (if the above doesn't work):
- Use `npx prisma db push --skip-generate` to skip client generation during push
- Or manually create tables using Supabase Studio

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd s-curve
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Run database migrations:

```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Run the development server:

```bash
npm run dev
# or
pnpm dev
```

The application will be available at http://localhost:3000

---

# 13. Technical Implementation Guidelines

## Supabase Authentication & Session Management

1. **Session State Synchronization Consistency:**
   - Middleware, protected pages, and layout components must uniformly use `await supabase.auth.getSession()` to verify sessions
   - Do not mix with non-fresh methods like `getUser()`, which can cause 307 temporary redirect loops in SSR/CSR mixed scenarios
   - `@supabase/ssr` must be installed in `dependencies` and `createServerClient` initialized properly to ensure server-side session availability

2. **Authentication Path & Navigation Consistency:**
   - All authentication navigation links in frontend components (e.g., navbar) must strictly match route definitions
   - Login page is located at `/auth/login`
   - Registration/password reset paths must have `/auth/` prefix
   - Inconsistent paths will cause flow interruption or 307 loops

3. **Error Diagnosis & Interference Identification:**
   - Console errors like `SyntaxError: "undefined" is not valid JSON` with Chrome extension stack traces are symptoms of authentication state desynchronization
   - First, verify:
     a) `@supabase/ssr` is installed and correctly imported
     b) Proxy/middleware completes `createServerClient` call and `getSession()` verification
     c) Client-side components (like navbar) don't try to access `user.email` fields without valid session

## shadcn/ui Component On-Demand Installation

When encountering `Module not found: Can't resolve '@/components/ui/xxx'` errors, immediately execute `npx shadcn@latest add xxx` to install the corresponding component. Do not manually create or modify path aliases. All shadcn/ui components must be installed via the official CLI to ensure correct type definitions, style injection, and export configuration.

## Next.js + Supabase + Prisma 7+ Integration Guidelines

1. **Database Connection:**
   - `DATABASE_URL` environment variable must be non-empty and complete (direct Supabase PostgreSQL URI, disable pooler proxy)
   - Special characters in passwords must be URL-encoded
   - `.env` file must be in root directory, terminal/IDE must reload environment variables
   - `schema.prisma` must not declare `url` or `directUrl` fields (P1012 error) - move all to `prisma.config.ts` via `env("DATABASE_URL")`

2. **Prisma CLI Workflow:**
   - Avoid `npx prisma db push` with Supabase (connection pool compatibility issues, timeouts after 5+ minutes)
   - Use `npx prisma migrate dev --name init` instead
   - Successful initial `db push` connection shows `Datasource "db": PostgreSQL database "postgres", schema "public" at "xxx.supabase.co:port"`

3. **Next.js Middleware Migration:**
   - `middleware.ts` is deprecated, must migrate to `proxy` implementation
   - Install `@supabase/ssr` and declare in `dependencies` (not `devDependencies`)
   - Console warning "The 'middleware' file convention is deprecated..." requires immediate proxy migration

4. **Version & Dependency Pre-checks (Prisma 7+ + Next.js 15+/16+):**
   - Verify `schema.prisma` completely removes `url`/`directUrl`
   - Validate `DATABASE_URL` value effectiveness
   - Check `@supabase/ssr`, `next` key dependency version compatibility
   - Verify deprecated Next.js features (like middleware) are migrated

## Tailwind CSS Configuration & Directive Guidelines

1. **Configuration File Existence:** `tailwind.config.ts` must exist in the project root, otherwise all `@tailwind` directives, theme variables (like `border-border`), and custom class names will fail.

2. **PostCSS Plugin Declaration:** `postcss.config.mjs` Tailwind plugin must use standard name `tailwindcss`, not `@tailwindcss/postcss` (causes `next/font` loading failure).

3. **`@layer` Directive Mandatory Matching:** `@layer` directives (like `@layer base`) must appear in pairs with corresponding `@tailwind` directives (like `@tailwind base`) in the same CSS file, in strict order:
   - `@tailwind base` → `@layer base` → `@tailwind components` → `@layer components` → `@tailwind utilities` → `@layer utilities`

## Windows Terminal Command Execution Guidelines

In Windows environments, executing multi-step commands (like `cd && npx`) requires PowerShell-compatible syntax. Use semicolons `;` instead of `&&`, or execute each command separately. For scaffolding tools like `npx create-next-app`, if the directory is not empty, first clean conflicting files (like README.md) or specify a new directory to avoid interruptions from "conflicting files".

## Prisma 7+ Schema Validation Failure Root Cause Diagnosis

When Prisma CLI reports P1012 (url/directUrl unsupported) or P1013 (empty host) errors, follow this order:

1. Immediately check `prisma/schema.prisma` completely removes `url` and `directUrl` fields (keep only `provider`)
2. Verify `prisma.config.ts` calls `env("DATABASE_URL")` and environment variables are loaded
3. For P1013, directly parse `DATABASE_URL` value in `.env`, confirm it contains complete protocol, host, port, path, and URL-encoded special characters
4. Do not use `--force` to bypass validation - all schema changes must pass `npx prisma validate` first

## Build Failure Diagnosis Priority

For build failures, diagnose in this priority:

1. Check module resolution errors (like `Can't resolve '@/components/ui/...'`) → immediately supplement shadcn/ui components
2. Check missing environment configuration (like `.env`, `tailwind.config.ts`, `postcss.config.mjs`) → verify against README
3. Check type import/export mismatches (like `formatDate not exported`) → verify `src/lib/utils/index.ts` export completeness and TS path mapping
4. Ignore temporary cache warnings (like `ESLint: Invalid Options`), focus on blocking compilation errors

---

# 14. Common Issues and Solutions

## Authentication Issues

1. **307 Temporary Redirect Loop:**
   - Check that session is properly verified in middleware
   - Ensure login page redirects to dashboard after successful login
   - Verify dashboard page checks for valid session before rendering

2. **Chrome Extension Errors:**
   - Errors like `SyntaxError: "undefined" is not valid JSON` from Chrome extensions don't affect application functionality
   - These come from browser extensions (like password managers) trying to parse responses
   - Use incognito mode to verify actual application behavior

## Database Setup Issues

1. **Empty Host in Database URL:**
   - Verify that your Supabase database connection string is complete
   - Ensure the format is: `postgresql://postgres:your_password@your_project_id.region.supabase.co:5432/postgres`
   - URL-encode special characters in your password if present

2. **Schema Validation Errors:**
   - Remove `url` and `directUrl` from `prisma/schema.prisma`
   - Move database URL to `prisma.config.ts`
   - Use migration workflow instead of `db push` for Supabase

## Build Issues

1. **Missing Components:**
   - Install missing shadcn/ui components with `npx shadcn@latest add [component-name]`
   - Examples: `input`, `label`, `card`, `badge`, `tabs`, `button`, etc.

2. **Type Errors:**
   - Verify all utility functions are properly exported from `src/lib/utils/index.ts`
   - Check that imports match exports in all files

---

# 15. Future Enhancements

Version 2

- Cost Tracking
- Resource Tracking
- Budget Tracking
- Multiple Baselines
- Forecasting
- Notifications
- Realtime Dashboard

Version 3

- AI Forecasting
- Earned Value Management
- Portfolio Dashboard
- Multi-Tenant SaaS
- Mobile Application

```