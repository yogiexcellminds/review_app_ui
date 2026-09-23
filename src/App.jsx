import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Layout } from "./components/Layout";

import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { DashboardPage } from "./pages/DashboardPage";

import { MastersPage } from "./pages/admin/MastersPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { RolesPermissionsPage } from "./pages/admin/RolesPermissionsPage";
import { EmployeeProjectMappingsPage } from "./pages/admin/EmployeeProjectMappingsPage";
import { RatingParameterMappingPage } from "./pages/admin/RatingParameterMappingPage";

import { MonthlyReviewsListPage } from "./pages/MonthlyReviewsListPage";
import { MonthlyReviewDetailPage } from "./pages/MonthlyReviewDetailPage";
import { AnnualReviewsListPage } from "./pages/AnnualReviewsListPage";
import { AnnualReviewDetailPage } from "./pages/AnnualReviewDetailPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          <Route path="/reviews" element={<MonthlyReviewsListPage />} />
          <Route path="/reviews/:id" element={<MonthlyReviewDetailPage />} />

          <Route path="/annual-reviews" element={<AnnualReviewsListPage />} />
          <Route path="/annual-reviews/:id" element={<AnnualReviewDetailPage />} />

          <Route
            path="/admin/masters/:masterType"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <MastersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/project-mapping"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <EmployeeProjectMappingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rating-parameter-mapping"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <RatingParameterMappingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <RolesPermissionsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </AuthProvider>
  );
}
