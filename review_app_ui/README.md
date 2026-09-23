# Performance Review UI (React + Vite)

Frontend for the role-based (Admin / Manager / Employee) performance review
application, talking to the FastAPI backend (`hr_review_app`) over its REST
API and JWT auth.

## What's implemented

- **Auth**: login, forgot password, reset password (reads `?token=` from the
  emailed/logged link), change password (forced automatically when the
  backend reports `must_change_password`, e.g. right after account
  creation or an admin-triggered reset).
- **Role-based navigation & routing**: `src/auth/ProtectedRoute.jsx` guards
  routes by login state and, optionally, role; Admin-only screens (Masters,
  Users, Roles & Permissions) are hidden from the nav and blocked by route
  for anyone else.
- **Generic master data screens**: `src/pages/admin/masterConfigs.js`
  describes each master (fields, types, dropdown sources) once;
  `MastersPage.jsx` + `MasterForm.jsx` turn that into a working list/create/
  edit/deactivate screen for all of them (Departments, Projects,
  Designations, Employees, Manager-Employee Mapping, Financial Years,
  Review Cycles, Rating Parameters, Rating Scale, Overall Rating Formula +
  its weight table, Company Settings) -- the same "config, not new code"
  idea as the backend's `crud_factory.py`.
- **Designations**: a plain master (name + code), same shape as Departments
  -- picked on the Employee form via a dropdown (`designation_id`) instead
  of typed free text, so the Employees table's Designation column always
  shows one of a fixed, manageable list.
- **Auto-generated codes**: Department, Project, Designation and Employee
  all show a suggested code ("DEPT-004", "PRO-004", "DESG-004", "EMP-004")
  already filled in when you click "+ Add new" (`MasterForm.jsx` calls the
  master's `nextCode()` on mount for a brand-new record) -- it's a normal
  editable text field, so type over it if you want a different code. The
  backend re-checks uniqueness on save regardless of whether you kept the
  suggestion or typed your own (see the backend README's "Auto-generated
  master codes").
- **CSV bulk import/template**: any master config with `hasCsv: true` gets
  a "Download CSV template" and an "Import CSV" control on its MastersPage
  header (see `endpoints.js::makeMasterApi().downloadTemplate/importCsv`).
  Importing shows how many rows were created/updated and lists any per-row
  errors (e.g. an unknown department code) so the admin can fix and re-
  upload just the bad rows.
- **Employee <-> Project mapping**: a dedicated page (not the generic
  MastersPage, since it needs more than plain CRUD) at Administration ->
  "Project Mapping". Picking an employee in the add-mapping drawer shows
  their live current utilization and remaining headroom before you submit,
  and the backend's 400 error when a mapping would exceed the 200% cap is
  surfaced as-is.
- **Project allocations right on the Employee form**: editing an existing
  employee shows an inline "Project allocations" section
  (`EmployeeProjectAllocationsEditor.jsx`, the same pattern as the Overall
  Rating Formula's weight editor) — add a project + percentage, remove one,
  and see the live total vs. the 200% cap, all without leaving the Employee
  drawer or navigating to the separate Project Mapping page (that page still
  exists too, for a cross-employee view). The Employees table also has a new
  "Projects" column so allocations are visible at a glance. Department stays
  a plain field on the Employee form itself, since it's a single required
  value rather than a many-to-many.
- **Users <-> Employee mapping**: the Users add/edit drawer has an optional
  "Linked employee" dropdown (never required) that only offers employees
  not already linked to a different user, so the one-employee-per-user rule
  is hard to violate from the UI; the backend re-checks it either way. Once
  set, the Employees master screen shows that user's username and role in a
  "Linked User" column automatically, with no separate lookup.
- **Same mapping, from the Employee form**: the Employee create/edit form
  now also has a "Link to existing user (optional)" dropdown -- the reverse
  of the field above, for setting up a new employee's login while creating
  the Employee record itself instead of switching to the Users screen
  afterward. Picking a user auto-fills this form's Full name from that
  user's own full_name (see `MasterForm.jsx`'s generic `autofillFrom` field
  option), and the dropdown only offers users not already linked to a
  *different* employee (`filterOptions`, the same rule as the Users page's
  own filter, mirrored from this side). Leaving it blank is fine -- most
  employees have no login of their own.
- **Rating Parameter Mapping**: a dedicated page at Administration ->
  "Rating Parameter Mapping" with two sections. Pick a Designation and
  check off which Rating Parameters apply to that role by default (a
  checkbox list, toggled on/off freely). Pick an Employee and their list
  auto-fills from their Designation's defaults -- no extra step -- with a
  small form to add a parameter just for that one person on top, and a
  Remove button on only the ones added that way (a role-level one is
  changed from the Designation side above, since it applies to everyone
  with that role). This is reference/config data for planning reviews, not
  a change to the actual review form -- see the backend README for why.
- **Roles & Permissions screen**: a grant matrix (role x permission
  checkboxes) plus forms to add a new role or a new permission code, wired
  to the backend endpoints that make RBAC extensible without a code change.
- **Monthly review workflow**: a list scoped by the backend to what the
  logged-in role can see, an Admin-only bulk-create-for-a-cycle action, and
  a detail page that swaps in the right form for the review's current
  status -- Self-Assessment, Manager Review, or HR Final -- with a
  read-only view once Closed. Which form shows is driven entirely by the
  review's `status`, never by the viewer's role, so a Manager opening their
  own review (now included in their own list -- see the backend README)
  gets the same Self-Assessment form an Employee would, with no UI change
  needed here.
- **Annual review**: list, an Admin-only "generate for a financial year"
  action, and the same Manager roll-up -> HR final pattern.
- **Department & Project shown on both review lists and detail pages**: the
  backend snapshots these onto each review at creation/generation time (see
  the backend README), and the UI just displays what comes back --
  `department_name` as its own column/line, and `project_allocations`
  formatted as "ProjectName (NN%), ..." -- no extra lookups needed.

## Setup

1. `cp .env.example .env` and point `VITE_API_BASE_URL` at your running
   FastAPI backend (default `http://localhost:8000`).
2. `npm install`
3. `npm run dev` and open the printed local URL (default
   `http://localhost:3000`).
4. Log in with the admin credentials `seed.py` printed when you set up the
   backend (username `admin`); you'll be forced to change that password on
   first login.

## Notes / next steps

- This talks to the backend's real permission model, so what a Manager or
  Employee can actually do is still enforced server-side -- the UI mostly
  just shows/hides screens for convenience; it does not duplicate the
  authorization logic.
- The Employee ID / Cycle ID / Financial Year ID columns in the review
  lists are shown as raw IDs for a first pass; swapping them for names
  (employee's full name, "September 2026", "FY2026-27") just needs the
  detail objects joined in on the frontend or added to the backend's list
  responses -- a good next increment.
- No component library is used (plain CSS in `src/styles/index.css`) to
  keep the project dependency-light; swapping in Tailwind or MUI later
  won't require restructuring the pages.
- CORS: the backend's `app/main.py` currently allows every origin for
  development. Restrict `allow_origins` there to this app's real URL
  before deploying either of them.
