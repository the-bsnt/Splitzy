// hooks/useError.js
import { useState, useCallback } from "react";

export const useError = (initialError = null) => {
  const [error, setError] = useState(initialError);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setErrorWithTimeout = useCallback((errorMessage, timeout = 5000) => {
    setError(errorMessage);
    if (timeout > 0) {
      setTimeout(() => {
        setError(null);
      }, timeout);
    }
  }, []);

  return {
    error,
    setError,
    clearError,
    setErrorWithTimeout,
  };
};
