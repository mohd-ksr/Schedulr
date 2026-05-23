import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: { name: string; email: string; username: string; password: string; timezone?: string }) =>
    api.post("/auth/register", data),
};

// ── Users ────────────────────────────────────────────────
export const usersAPI = {
  me: () => api.get("/users/me"),
  updateMe: (data: Partial<{ name: string; bio: string; timezone: string; avatar_url: string }>) =>
    api.patch("/users/me", data),
  getPublic: (username: string) => api.get(`/users/${username}`),
};

// ── Event Types ────────────────────────────────────────────────
export const eventTypesAPI = {
  list: () => api.get("/event-types"),
  create: (data: any) => api.post("/event-types", data),
  get: (id: number) => api.get(`/event-types/${id}`),
  update: (id: number, data: any) => api.patch(`/event-types/${id}`, data),
  delete: (id: number) => api.delete(`/event-types/${id}`),
  listPublic: (username: string) => api.get(`/event-types/public/${username}`),
  getPublic: (username: string, slug: string) => api.get(`/event-types/public/${username}/${slug}`),
};

// ── Availability ────────────────────────────────────────────────
export const availabilityAPI = {
  listSchedules: () => api.get("/availability/schedules"),
  createSchedule: (data: any) => api.post("/availability/schedules", data),
  getSchedule: (id: number) => api.get(`/availability/schedules/${id}`),
  updateSchedule: (id: number, data: any) => api.put(`/availability/schedules/${id}`, data),
  deleteSchedule: (id: number) => api.delete(`/availability/schedules/${id}`),
  addOverride: (scheduleId: number, data: any) =>
    api.post(`/availability/schedules/${scheduleId}/overrides`, data),
  deleteOverride: (scheduleId: number, overrideId: number) =>
    api.delete(`/availability/schedules/${scheduleId}/overrides/${overrideId}`),
  getSlots: (username: string, slug: string, date: string) =>
    api.get(`/availability/slots/${username}/${slug}?date=${date}`),
  getBusyDates: (username: string, slug: string, year: number, month: number) =>
    api.get(`/availability/busy-dates/${username}/${slug}?year=${year}&month=${month}`),
};

// ── Bookings ────────────────────────────────────────────────
export const bookingsAPI = {
  create: (data: any) => api.post("/bookings", data),
  getByToken: (token: string) => api.get(`/bookings/token/${token}`),
  cancelByToken: (token: string, reason?: string) =>
    api.post(`/bookings/cancel/${token}`, { reason }),
  rescheduleByToken: (token: string, data: any) =>
    api.post(`/bookings/reschedule/${token}`, data),
  adminList: (params?: { status?: string; event_type_id?: number; search?: string }) =>
    api.get("/bookings/admin", { params }),
  adminGet: (id: number) => api.get(`/bookings/admin/${id}`),
  adminCancel: (id: number) => api.post(`/bookings/admin/${id}/cancel`),
};
