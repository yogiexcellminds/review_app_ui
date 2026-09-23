import { useEffect, useState } from "react";
import { employeesApi, rolesApi, usersApi } from "../../api/endpoints";
import { extractErrorMessage } from "../../api/client";
import { DataTable } from "../../components/DataTable";
import { Banner } from "../../components/Banner";
import { Drawer } from "../../components/Drawer";

const EMPTY_FORM = { full_name: "", email: "", username: "", role_id: "", employee_id: "" };

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingUser, setEditingUser] = useState(null); // null (drawer closed) | {} (new) | row (edit)
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    usersApi.list().then(({ data }) => setUsers(data));
    rolesApi.list().then(({ data }) => setRoles(data));
    // Only employees with no user linked yet (or the one already linked to
    // whichever user is being edited) make sense to offer -- see
    // employeeOptionsFor() below, which adds the current one back in.
    employeesApi.list().then(({ data }) => setEmployees(data));
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingUser({});
  };

  const openEdit = (user) => {
    setForm({
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      role_id: user.role.id,
      employee_id: user.employee_id ?? "",
    });
    setEditingUser(user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const employee_id = form.employee_id ? Number(form.employee_id) : null;
      if (editingUser?.id) {
        await usersApi.update(editingUser.id, {
          full_name: form.full_name,
          role_id: Number(form.role_id),
          employee_id,
        });
      } else {
        await usersApi.create({
          full_name: form.full_name,
          email: form.email,
          username: form.username,
          role_id: Number(form.role_id),
          employee_id,
        });
      }
      setEditingUser(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (user) => {
    setError("");
    setNotice("");
    try {
      const { data } = await usersApi.adminResetPassword(user.id);
      setNotice(`${user.full_name}: ${data.message}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      await usersApi.update(user.id, { status: newStatus });
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  // The employee dropdown offers: every employee not yet linked to any user,
  // plus (when editing) whichever employee this user is already linked to --
  // otherwise that option would vanish from its own field. Linking is
  // optional (the blank "-- None --" option unlinks it).
  const employeeOptions = employees.filter(
    (emp) => !emp.user_id || emp.user_id === editingUser?.id
  );

  return (
    <div className="page">
      <div className="page-header-row">
        <h1>Users</h1>
        <button onClick={openNew}>+ Add user</button>
      </div>

      <Banner>{error}</Banner>
      <Banner type="success">{notice}</Banner>

      <DataTable
        columns={[
          { key: "full_name", label: "Name" },
          { key: "username", label: "Username" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role", render: (row) => row.role.name },
          {
            key: "employee",
            label: "Linked Employee",
            render: (row) =>
              row.employee_full_name
                ? `${row.employee_full_name} (${row.employee_code})`
                : "—",
          },
          { key: "status", label: "Status" },
        ]}
        rows={users}
        actions={(row) => (
          <>
            <button className="link-button" onClick={() => openEdit(row)}>
              Edit
            </button>
            <button className="link-button" onClick={() => handleStatusToggle(row)}>
              {row.status === "Active" ? "Deactivate" : "Activate"}
            </button>
            <button className="link-button" onClick={() => handleResetPassword(row)}>
              Reset password
            </button>
          </>
        )}
      />

      <Drawer
        open={editingUser !== null}
        title={editingUser?.id ? `Edit ${editingUser.full_name}` : "New user"}
        onClose={() => setEditingUser(null)}
      >
        <form className="master-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={!!editingUser?.id}
            />
          </label>
          <label>
            Username
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              disabled={!!editingUser?.id}
            />
          </label>
          {editingUser?.id && (
            <p className="hint">Email and username can't be changed once created.</p>
          )}
          <label>
            Role
            <select
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Linked employee (optional)
            <select
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
            >
              <option value="">— None —</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_code})
                </option>
              ))}
            </select>
          </label>
          <p className="hint">
            Linking a user to an employee is optional. Each employee can be linked to at most one
            user account -- their details then show automatically on the Employees screen.
          </p>
          <div className="form-actions">
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : editingUser?.id ? "Save" : "Create user"}
            </button>
            <button type="button" className="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </button>
          </div>
          {!editingUser?.id && (
            <p className="hint">
              A temporary password is generated automatically; the user must change it on first
              login.
            </p>
          )}
        </form>
      </Drawer>
    </div>
  );
}
