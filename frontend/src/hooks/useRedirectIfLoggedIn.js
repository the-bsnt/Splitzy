import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useRedirectIfLoggedIn = (redirectUrl = null) => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    if (accessToken) {
      // If there's a redirect URL, go there, otherwise go to dashboard
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate, redirectUrl]);
};
