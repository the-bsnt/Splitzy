import api from "../api/axios";

export const authService = {
  signup: (userData) => api.post("/auth/signup/", userData),
  login: (credentials) => api.post("/auth/login/", credentials),
  profile: () => api.get("/profile/"),
  logout: () => api.post("/logout/"),
  verify: (token) => api.post("/auth/verify/", token),
  //   forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  //   resetPassword: (token, newPassword) =>
  //     api.post("/auth/reset-password", { token, newPassword }),
};
