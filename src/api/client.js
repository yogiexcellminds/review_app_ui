import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({ baseURL: BASE_URL });

// Attach the JWT (if we have one) to every request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is missing/expired -- bounce to login.
// (A 403 is a real permission error and should be shown, not redirected.)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("access_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}
