// Base URL for your backend API
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

//Endpoints

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login/",
    REGISTER: "/auth/signup/",
    PROFILE: "/auth/profile/",
  },
};
