import api from "../api/axios";

export const authService = {
  signup: (userData) => api.post("/auth/signup/", userData),
  login: (credentials) => api.post("/auth/login/", credentials),
  profile: () => api.get("/profile/"),
  logout: () => api.post("/logout/"),
  verify: (token) => api.post("/auth/verify/", token),
  listUsers: () => api.get("/users/"),
  changePassword: (passwordData) =>
    api.patch("/change/password/", passwordData),
};
