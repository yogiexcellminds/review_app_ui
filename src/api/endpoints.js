import { apiClient } from "./client";

// ---------- Auth ----------
export const authApi = {
  login: (username, password) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    return apiClient.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  me: () => apiClient.get("/auth/me"),
  changePassword: (current_password, new_password) =>
    apiClient.post("/auth/change-password", { current_password, new_password }),
  forgotPassword: (email) => apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (token, new_password) =>
    apiClient.post("/auth/reset-password", { token, new_password }),
};

// ---------- Generic master CRUD (mirrors the backend's crud_factory) ----------
// Every master exposes the same shape, so one function builds all five calls
// for any of them from just its base path. `csv-template` / `import-csv` are
// only attached backend-side for masters that opted in (see masterConfigs.js
// -- MastersPage only renders the CSV controls when a config sets `hasCsv`),
// but the helpers are harmless to expose on every master.
export function makeMasterApi(basePath) {
  return {
    list: (includeInactive = false) =>
      apiClient.get(basePath, { params: { include_inactive: includeInactive } }),
    get: (id) => apiClient.get(`${basePath}/${id}`),
    create: (payload) => apiClient.post(basePath, payload),
    update: (id, payload) => apiClient.put(`${basePath}/${id}`, payload),
    deactivate: (id) => apiClient.post(`${basePath}/${id}/deactivate`),
    // Downloads the CSV template as a Blob the caller can save with a normal
    // <a download> link (see downloadBlob() below).
    downloadTemplate: () => apiClient.get(`${basePath}/csv-template`, { responseType: "blob" }),
    // Uploads a filled-in (or edited) copy of that template. The backend
    // upserts: rows matching an existing unique key are updated, everything
    // else is created. Response: { created, updated, errors: [ "Row n: ..." ] }.
    importCsv: (file) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient.post(`${basePath}/import-csv`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    // Suggests the next auto-generated code ("EMP-004", "DEPT-004", ...) to
    // pre-fill a master's code field when adding a new record -- only called
    // by masters whose config sets `codeField` (see masterConfigs.js and
    // MasterForm.jsx). The admin can still edit it before saving; the backend
    // re-checks uniqueness either way.
    nextCode: () => apiClient.get(`${basePath}/next-code`),
  };
}

// Triggers a browser download for a Blob response, e.g.:
//   const { data } = await departmentsApi.downloadTemplate();
//   downloadBlob(data, "departments_template.csv");
export function downloadBlob(blobData, filename) {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const departmentsApi = makeMasterApi("/departments");
export const projectsApi = makeMasterApi("/projects");
export const designationsApi = makeMasterApi("/designations");
export const employeesApi = makeMasterApi("/employees");
export const mappingsApi = makeMasterApi("/manager-employee-mappings");
export const financialYearsApi = makeMasterApi("/financial-years");
export const reviewCyclesApi = makeMasterApi("/review-cycles");
export const ratingParametersApi = makeMasterApi("/rating-parameters");
export const ratingScalesApi = makeMasterApi("/rating-scales");
export const overallRatingFormulasApi = makeMasterApi("/overall-rating-formulas");
export const companySettingsApi = makeMasterApi("/company-settings");

// ---------- Employee <-> Project allocation mapping ----------
// Not a plain master: creating/updating one is checked server-side against
// the employee's 200% max-utilization cap, and the UI shows a live
// utilization readout alongside the form (see EmployeeProjectMappingsPage.jsx).
export const employeeProjectMappingsApi = {
  list: (params = {}) => apiClient.get("/employee-project-mappings", { params }),
  create: (payload) => apiClient.post("/employee-project-mappings", payload),
  update: (id, payload) => apiClient.put(`/employee-project-mappings/${id}`, payload),
  deactivate: (id) => apiClient.post(`/employee-project-mappings/${id}/deactivate`),
};

// ---------- Rating Parameter <-> Designation / Employee mapping ----------
// Lets an Admin map Rating Parameters directly to a role (Designation) --
// the defaults everyone with that role gets -- plus add extra ones for one
// specific Employee on top of their role's defaults. Both create() calls
// are idempotent/toggle-friendly: posting an already-active pairing just
// returns it, posting a previously-deactivated one reactivates it, so a
// checkbox-style UI can call create()/deactivate() freely without piling up
// duplicate rows (see RatingParameterMappingPage.jsx).
export const designationRatingParameterMappingsApi = {
  list: (params = {}) => apiClient.get("/designation-rating-parameter-mappings", { params }),
  create: (payload) => apiClient.post("/designation-rating-parameter-mappings", payload),
  deactivate: (id) => apiClient.post(`/designation-rating-parameter-mappings/${id}/deactivate`),
};

export const employeeRatingParameterMappingsApi = {
  list: (params = {}) => apiClient.get("/employee-rating-parameter-mappings", { params }),
  create: (payload) => apiClient.post("/employee-rating-parameter-mappings", payload),
  deactivate: (id) => apiClient.post(`/employee-rating-parameter-mappings/${id}/deactivate`),
};

// The resolved, ready-to-display list for one employee: their Designation's
// mapped parameters auto-filled in, plus anything added just for them (each
// row says which via `source`) -- see Employee.applicable_rating_parameters
// on the backend.
export const employeeApplicableRatingParametersApi = {
  get: (employeeId) => apiClient.get(`/employees/${employeeId}/rating-parameters`),
};

export const utilizationApi = {
  get: (employeeId) => apiClient.get(`/employees/${employeeId}/utilization`),
};

export const formulaWeightsApi = {
  list: (formulaId) => apiClient.get(`/overall-rating-formulas/${formulaId}/weights`),
  set: (formulaId, parameter_id, weight_percent) =>
    apiClient.post(`/overall-rating-formulas/${formulaId}/weights`, { parameter_id, weight_percent }),
};

// ---------- Users & Roles ----------
export const usersApi = {
  list: () => apiClient.get("/users"),
  create: (payload) => apiClient.post("/users", payload),
  update: (id, payload) => apiClient.put(`/users/${id}`, payload),
  adminResetPassword: (id) => apiClient.post(`/users/${id}/admin-reset-password`),
};

export const rolesApi = {
  list: () => apiClient.get("/roles"),
  create: (payload) => apiClient.post("/roles", payload),
  grantPermission: (roleId, permission_id) =>
    apiClient.post(`/roles/${roleId}/permissions`, { permission_id }),
  revokePermission: (roleId, permissionId) =>
    apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`),
};

export const permissionsApi = {
  list: () => apiClient.get("/permissions"),
  create: (payload) => apiClient.post("/permissions", payload),
};

// ---------- Monthly review ----------
export const monthlyReviewsApi = {
  list: (params = {}) => apiClient.get("/monthly-reviews", { params }),
  get: (id) => apiClient.get(`/monthly-reviews/${id}`),
  bulkCreate: (review_cycle_id) => apiClient.post("/monthly-reviews/bulk-create", { review_cycle_id }),
  saveSelfAssessment: (id, payload) => apiClient.put(`/monthly-reviews/${id}/self-assessment`, payload),
  saveManagerReview: (id, payload) => apiClient.put(`/monthly-reviews/${id}/manager-review`, payload),
  saveHrFinal: (id, payload) => apiClient.put(`/monthly-reviews/${id}/hr-final`, payload),
};

// ---------- Annual review ----------
export const annualReviewsApi = {
  list: (params = {}) => apiClient.get("/annual-reviews", { params }),
  get: (id) => apiClient.get(`/annual-reviews/${id}`),
  generate: (financial_year_id) => apiClient.post("/annual-reviews/generate", { financial_year_id }),
  saveManagerReview: (id, payload) => apiClient.put(`/annual-reviews/${id}/manager-review`, payload),
  saveHrFinal: (id, payload) => apiClient.put(`/annual-reviews/${id}/hr-final`, payload),
};
