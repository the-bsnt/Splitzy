import api from "../api/axios";

export const authService = {
  signup: (userData) => api.post("/auth/signup/", userData),
  login: (credentials) => api.post("/auth/login/", credentials),
  profile: () => api.get("/auth/profile/"),
  //   logout: () => api.post("/auth/logout"),
  //   forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  //   resetPassword: (token, newPassword) =>
  //     api.post("/auth/reset-password", { token, newPassword }),
};
