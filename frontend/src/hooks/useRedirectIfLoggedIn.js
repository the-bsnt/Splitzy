import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useRedirectIfLoggedIn = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    if (accessToken) {
      navigate("/dashboard");
    }
  }, [navigate]);
};
