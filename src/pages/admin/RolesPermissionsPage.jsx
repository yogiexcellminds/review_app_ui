import { useEffect, useState } from "react";
import { permissionsApi, rolesApi } from "../../api/endpoints";
import { extractErrorMessage } from "../../api/client";
import { Banner } from "../../components/Banner";

/**
 * This is the screen that makes the RBAC system extensible without a
 * developer: create a Permission (a code a new API endpoint checks for),
 * then grant it to whichever Role(s) should have it.
 */
export function RolesPermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState("");

  const [newRoleName, setNewRoleName] = useState("");
  const [newPermissionCode, setNewPermissionCode] = useState("");
  const [newPermissionDescription, setNewPermissionDescription] = useState("");

  const load = () => {
    rolesApi.list().then(({ data }) => setRoles(data));
    permissionsApi.list().then(({ data }) => setPermissions(data));
  };

  useEffect(load, []);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await rolesApi.create({ name: newRoleName });
      setNewRoleName("");
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleCreatePermission = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await permissionsApi.create({ code: newPermissionCode, description: newPermissionDescription });
      setNewPermissionCode("");
      setNewPermissionDescription("");
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const togglePermission = async (role, permission) => {
    setError("");
    try {
      if (role.permissions.includes(permission.code)) {
        await rolesApi.revokePermission(role.id, permission.id);
      } else {
        await rolesApi.grantPermission(role.id, permission.id);
      }
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="page">
      <h1>Roles &amp; Permissions</h1>
      <Banner>{error}</Banner>

      <div className="two-column">
        <form className="master-form compact" onSubmit={handleCreateRole}>
          <h3>New role</h3>
          <label>
            Name
            <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} required />
          </label>
          <button type="submit">Add role</button>
        </form>

        <form className="master-form compact" onSubmit={handleCreatePermission}>
          <h3>New permission</h3>
          <label>
            Code
            <input
              value={newPermissionCode}
              onChange={(e) => setNewPermissionCode(e.target.value)}
              placeholder="e.g. training:write"
              required
            />
          </label>
          <label>
            Description
            <input
              value={newPermissionDescription}
              onChange={(e) => setNewPermissionDescription(e.target.value)}
            />
          </label>
          <button type="submit">Add permission</button>
        </form>
      </div>

      <h3>Grant matrix</h3>
      <p className="hint">
        Tick a box to grant that permission to that role, or untick to revoke. Admin implicitly has
        every permission regardless of this matrix.
      </p>
      <div className="table-scroll">
        <table className="data-table grant-matrix">
          <thead>
            <tr>
              <th>Permission</th>
              {roles.map((role) => (
                <th key={role.id}>{role.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.id}>
                <td>
                  <code>{permission.code}</code>
                  {permission.description && <div className="hint">{permission.description}</div>}
                </td>
                {roles.map((role) => (
                  <td key={role.id} style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={role.permissions.includes(permission.code)}
                      disabled={role.name === "Admin"}
                      onChange={() => togglePermission(role, permission)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
