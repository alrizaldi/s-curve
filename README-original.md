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

# 12. Future Enhancements

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

```
