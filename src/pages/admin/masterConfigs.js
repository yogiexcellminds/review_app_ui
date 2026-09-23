import {
  companySettingsApi,
  departmentsApi,
  designationsApi,
  employeesApi,
  financialYearsApi,
  mappingsApi,
  overallRatingFormulasApi,
  projectsApi,
  ratingParametersApi,
  ratingScalesApi,
  reviewCyclesApi,
  usersApi,
} from "../../api/endpoints";

/**
 * One config per master drives a fully generic list+create+edit UI
 * (MastersPage.jsx) -- the same idea as the backend's crud_factory: add a
 * new master here and it gets a working screen with no new component code.
 *
 * field.type: "text" | "number" | "date" | "select" | "textarea"
 * field.optionsApi: { list } -- fetched for a "select" field's dropdown
 * field.optionLabel(row): string -- how to render each option
 *
 * config.hasCsv: true -- shows the "Download CSV template" / "Import CSV"
 * controls on MastersPage. Only set for masters that actually have those
 * routes attached backend-side (see app/routers/masters.py -- every master
 * there except the manager-employee mapping, which has no natural single
 * unique key to upsert on).
 *
 * config.codeField: "employee_code" / "code" -- set on a master whose code
 * is auto-generated ("EMP-001", "DEPT-001", "PRO-001", "DESG-001", ...).
 * MasterForm.jsx pre-fills that field with the backend's suggestion when
 * adding a new record; the field itself stays a normal editable text input,
 * so the admin can type a different value before saving.
 */
export const MASTER_CONFIGS = {
  departments: {
    title: "Departments",
    api: departmentsApi,
    hasCsv: true,
    codeField: "code",
    columns: [
      { key: "name", label: "Name" },
      { key: "code", label: "Code" },
      { key: "status", label: "Status" },
      { key: "start_date", label: "Start date" },
      { key: "end_date", label: "End date" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "code",
        label: "Code",
        type: "text",
        required: true,
        hint: "Auto-generated (e.g. DEPT-004) -- you can change it before saving.",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Active", "Inactive"],
        default: "Active",
      },
    ],
  },

  projects: {
    title: "Projects",
    api: projectsApi,
    hasCsv: true,
    codeField: "code",
    columns: [
      { key: "name", label: "Name" },
      { key: "code", label: "Code" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status" },
      { key: "start_date", label: "Start date" },
      { key: "end_date", label: "End date" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "code",
        label: "Code (unique)",
        type: "text",
        required: true,
        hint: "Auto-generated (e.g. PRO-004) -- you can change it before saving.",
      },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Active", "Inactive"],
        default: "Active",
      },
    ],
  },

  designations: {
    title: "Designations",
    api: designationsApi,
    hasCsv: true,
    codeField: "code",
    columns: [
      { key: "name", label: "Name" },
      { key: "code", label: "Code" },
      { key: "status", label: "Status" },
      { key: "start_date", label: "Start date" },
      { key: "end_date", label: "End date" },
    ],
    fields: [
      { name: "name", label: "Name (e.g. Software Engineer)", type: "text", required: true },
      {
        name: "code",
        label: "Code",
        type: "text",
        required: true,
        hint: "Auto-generated (e.g. DESG-004) -- you can change it before saving.",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Active", "Inactive"],
        default: "Active",
      },
    ],
  },

  employees: {
    title: "Employees",
    api: employeesApi,
    hasCsv: true,
    codeField: "employee_code",
    // Shows the EmployeeProjectAllocationsEditor inside the edit drawer
    // (see MastersPage.jsx) -- Department is a plain field on this form,
    // but Project is a separate master an employee can have several of at
    // once, so it gets its own mini-editor rather than a form field.
    hasProjectAllocations: true,
    columns: [
      { key: "employee_code", label: "Code" },
      { key: "full_name", label: "Name" },
      { key: "designation_name", label: "Designation" },
      { key: "status", label: "Status" },
      {
        // Auto-attached from the linked User account (Users page maps this
        // optionally, at most one user per employee) -- see EmployeeOut's
        // user_* fields and app/routers/users.py's mapping validation.
        key: "linked_user",
        label: "Linked User",
        render: (row) =>
          row.user_username ? `${row.user_username} (${row.user_role_name})` : "—",
      },
      {
        // Auto-attached from Employee-Project Mapping -- see EmployeeOut.projects
        // and EmployeeProjectAllocationsEditor.jsx, which is where these are
        // actually added/removed (edit this employee, then "+ Add" below).
        key: "projects",
        label: "Projects",
        render: (row) =>
          row.projects && row.projects.length > 0
            ? row.projects.map((p) => `${p.project_name} (${p.allocation_percent}%)`).join(", ")
            : "—",
      },
    ],
    fields: [
      {
        name: "employee_code",
        label: "Employee code",
        type: "text",
        required: true,
        hint: "Auto-generated (e.g. EMP-004) -- you can change it before saving.",
      },
      { name: "full_name", label: "Full name", type: "text", required: true },
      {
        name: "department_id",
        label: "Department",
        type: "select",
        optionsApi: departmentsApi,
        optionLabel: (row) => row.name,
        required: true,
      },
      {
        // Reverse direction of the Users page's "Linked employee" field --
        // pick an existing User account here instead, and this employee's
        // Full name is auto-filled from that user's own full_name (see
        // MasterForm.jsx's autofillFrom). Never required: most employees
        // have no login at all, and this only offers a User not already
        // linked to a *different* employee, mirroring UsersPage.jsx's
        // employeeOptions filter from the other side.
        name: "user_id",
        label: "Link to existing user (optional)",
        type: "select",
        optionsApi: usersApi,
        optionLabel: (row) => `${row.username} (${row.full_name})`,
        filterOptions: (options, initialValues) =>
          options.filter((u) => !u.employee_id || u.employee_id === initialValues?.id),
        autofillFrom: { full_name: "full_name" },
        hint: "Fills Full name from the selected user's account. Leave blank if this employee has no login.",
      },
      {
        // Designation is now its own master (see the "designations" config
        // above), not free text -- EmployeeOut.designation_name shows the
        // picked one on the table with no extra lookup.
        name: "designation_id",
        label: "Designation",
        type: "select",
        optionsApi: designationsApi,
        optionLabel: (row) => row.name,
      },
      { name: "date_of_joining", label: "Date of joining", type: "date" },
      {
        name: "reporting_manager_id",
        label: "Reporting manager",
        type: "select",
        optionsApi: employeesApi,
        optionLabel: (row) => `${row.full_name} (${row.employee_code})`,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Active", "Inactive"],
        default: "Active",
      },
    ],
  },

  "manager-employee-mappings": {
    title: "Manager → Employee Mapping",
    api: mappingsApi,
    columns: [
      { key: "manager_id", label: "Manager ID" },
      { key: "employee_id", label: "Employee ID" },
      { key: "start_date", label: "Start date" },
      { key: "end_date", label: "End date (blank = current)" },
    ],
    fields: [
      {
        name: "manager_id",
        label: "Manager",
        type: "select",
        optionsApi: employeesApi,
        optionLabel: (row) => `${row.full_name} (${row.employee_code})`,
        required: true,
      },
      {
        name: "employee_id",
        label: "Employee",
        type: "select",
        optionsApi: employeesApi,
        optionLabel: (row) => `${row.full_name} (${row.employee_code})`,
        required: true,
      },
    ],
  },

  "financial-years": {
    title: "Financial Years",
    api: financialYearsApi,
    hasCsv: true,
    columns: [
      { key: "year_label", label: "Year" },
      { key: "start_month", label: "Start month" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "year_label", label: "Year label (e.g. FY2026-27)", type: "text", required: true },
      {
        name: "start_month",
        label: "Start month (1-12)",
        type: "number",
        required: true,
        min: 1,
        max: 12,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Open", "Closed"],
        default: "Open",
      },
    ],
  },

  "review-cycles": {
    title: "Review Cycles",
    api: reviewCyclesApi,
    hasCsv: true,
    columns: [
      { key: "financial_year_id", label: "Financial Year ID" },
      { key: "month_year", label: "Month" },
      { key: "submission_due_date", label: "Due date" },
      { key: "status", label: "Status" },
    ],
    fields: [
      {
        name: "financial_year_id",
        label: "Financial Year",
        type: "select",
        optionsApi: financialYearsApi,
        optionLabel: (row) => row.year_label,
        required: true,
      },
      { name: "month_year", label: "Month (first day, e.g. 2026-09-01)", type: "date", required: true },
      { name: "submission_due_date", label: "Submission due date", type: "date", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Open", "Closed"],
        default: "Open",
      },
    ],
  },

  "rating-parameters": {
    title: "Rating Parameters",
    api: ratingParametersApi,
    hasCsv: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "display_order", label: "Order" },
      { key: "active_flag", label: "Active" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "display_order", label: "Display order", type: "number", default: 0 },
      {
        name: "active_flag",
        label: "Active",
        type: "select",
        options: ["true", "false"],
        default: "true",
      },
    ],
  },

  "rating-scales": {
    title: "Rating Scale",
    api: ratingScalesApi,
    hasCsv: true,
    columns: [
      { key: "score", label: "Score" },
      { key: "label", label: "Label" },
      { key: "description", label: "Description" },
    ],
    fields: [
      { name: "score", label: "Score (1-5)", type: "number", required: true, min: 1, max: 5 },
      { name: "label", label: "Label", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },

  "overall-rating-formulas": {
    title: "Overall Rating Formula",
    api: overallRatingFormulasApi,
    hasCsv: true,
    columns: [
      { key: "formula_name", label: "Name" },
      { key: "calculation_method", label: "Method" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "formula_name", label: "Formula name", type: "text", required: true },
      {
        name: "calculation_method",
        label: "Calculation method",
        type: "select",
        options: ["Simple Average", "Weighted Average", "Custom Formula"],
        default: "Simple Average",
      },
      {
        name: "rounding_rule",
        label: "Rounding rule",
        type: "select",
        options: ["Nearest 0.1", "Nearest whole number", "No rounding"],
        default: "Nearest 0.1",
      },
      { name: "min_score", label: "Min score", type: "number", default: 1 },
      { name: "max_score", label: "Max score", type: "number", default: 5 },
      {
        name: "applicable_financial_year_id",
        label: "Applicable Financial Year (blank = all years)",
        type: "select",
        optionsApi: financialYearsApi,
        optionLabel: (row) => row.year_label,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Draft", "Active", "Retired"],
        default: "Draft",
      },
    ],
    hasWeights: true,
  },

  "company-settings": {
    title: "Company Settings",
    api: companySettingsApi,
    hasCsv: true,
    columns: [
      { key: "company_name", label: "Company" },
      { key: "notification_email", label: "Notification email" },
    ],
    fields: [
      { name: "company_name", label: "Company name", type: "text", required: true },
      { name: "logo_url", label: "Logo URL", type: "text" },
      { name: "notification_email", label: "Notification email", type: "text" },
    ],
  },
};

export const MASTER_NAV_ORDER = [
  "departments",
  "projects",
  "designations",
  "employees",
  "manager-employee-mappings",
  "financial-years",
  "review-cycles",
  "rating-parameters",
  "rating-scales",
  "overall-rating-formulas",
  "company-settings",
];
