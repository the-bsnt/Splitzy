import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/endpoints";

export const useRedirectIfLoggedIn = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    if (accessToken) {
      navigate("/dashboard");
    }
  }, [navigate]);
};
