import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function navClass({ isActive }) {
  return isActive ? "active" : "";
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>⬡</span> Performance Review
        </div>

        {user && (
          <div className="sidebar-user">
            <span className="user-name">{user.full_name}</span>
            <span className="role-badge">{user.role.name}</span>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">General</div>
          <NavLink to="/" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/reviews" className={navClass}>
            Monthly Reviews
          </NavLink>
          <NavLink to="/annual-reviews" className={navClass}>
            Annual Reviews
          </NavLink>

          {user?.role?.name === "Admin" && (
            <>
              <div className="sidebar-section-label">Administration</div>
              <NavLink to="/admin/masters/departments" className={navClass}>
                Masters
              </NavLink>
              <NavLink to="/admin/project-mapping" className={navClass}>
                Project Mapping
              </NavLink>
              <NavLink to="/admin/rating-parameter-mapping" className={navClass}>
                Rating Parameter Mapping
              </NavLink>
              <NavLink to="/admin/users" className={navClass}>
                Users
              </NavLink>
              <NavLink to="/admin/roles" className={navClass}>
                Roles &amp; Permissions
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/change-password" className={navClass} style={{ display: "block", marginBottom: "0.5rem" }}>
            Change password
          </NavLink>
          <button className="link-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <span className="hint">
            {user?.full_name} · {user?.role?.name}
          </span>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
