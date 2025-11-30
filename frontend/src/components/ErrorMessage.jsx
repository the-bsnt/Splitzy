// components/ErrorMessage.jsx
import React from "react";

const ErrorMessage = ({
  error,
  onDismiss,
  className = "",
  autoDismiss = false,
  dismissTime = 5000,
}) => {
  const [show, setShow] = React.useState(!!error);

  React.useEffect(() => {
    if (error) {
      setShow(true);

      if (autoDismiss && onDismiss) {
        const timer = setTimeout(() => {
          setShow(false);
          setTimeout(() => onDismiss(), 300); // Wait for fade out
        }, dismissTime);

        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [error, autoDismiss, dismissTime, onDismiss]);

  const handleDismiss = () => {
    setShow(false);
    setTimeout(() => onDismiss?.(), 300); // Wait for fade out
  };

  if (!error || !show) return null;

  return (
    <div
      className={`p-3 mb-4 border border-red-300 bg-red-50 rounded-lg transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="text-red-600 hover:text-red-800 ml-4 text-lg font-semibold focus:outline-none"
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
