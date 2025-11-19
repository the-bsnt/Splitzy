import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import Button from "../components/Button";
import { API_BASE_URL } from "../api/endpoints";
import { authService } from "../services/authService";

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [invitedEmail, setInvitedEmail] = useState("");
  const [errorCode, setErrorCode] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link. Token is missing.");
      return;
    }

    acceptInvitation();
  }, [token]);

  const acceptInvitation = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/groups/join/?token=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.code === "SUCCESS") {
        setStatus("success");
        setMessage(data.detail);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        // Handle different error codes
        handleErrorResponse(data);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
      console.error("Invitation acceptance error:", error);
    }
  };

  const handleErrorResponse = (data) => {
    setErrorCode(data.code);
    setMessage(data.detail);
    setInvitedEmail(data.invited_email || "");
    console.log(data.code);
    // Handle specific error codes with navigation
    if (data.code === "AUTH_REQUIRED") {
      setStatus("auth_required");
      // Redirect to login after 2 seconds
      setTimeout(() => {
        const currentPath = `/accept-invitation?token=${token}`;
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }, 2000);
    } else if (data.code === "REGISTER_REQUIRED") {
      setStatus("register_required");
      // Redirect to signup after 2 seconds
      setTimeout(() => {
        const currentPath = `/accept-invitation?token=${token}`;
        navigate(
          `/signup?email=${data.invited_email}&redirect=${encodeURIComponent(
            currentPath
          )}`
        );
      }, 2000);
    } else if (data.code === "WRONG_USER") {
      setStatus("wrong_user");
      // Don't auto-redirect, let user decide
    } else {
      setStatus("error");
    }
  };

  const handleLogout = () => {
    authService.logout();
    localStorage.removeItem("access");
    const currentPath = `/accept-invitation?token=${token}`;
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleManualLogin = () => {
    const currentPath = `/accept-invitation?token=${token}`;
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleManualSignup = () => {
    const currentPath = `/accept-invitation?token=${token}`;
    navigate(
      `/signup?email=${invitedEmail}&redirect=${encodeURIComponent(
        currentPath
      )}`
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        {/* Loading State */}
        {status === "loading" && (
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Processing Invitation
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your invitation...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Invitation Accepted!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        )}

        {/* Auth Required State */}
        {status === "auth_required" && (
          <div className="text-center">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Login Required
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to login page...
            </p>
            <Button
              onClick={handleManualLogin}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
            >
              Go to Login
            </Button>
          </div>
        )}

        {/* Register Required State */}
        {status === "register_required" && (
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Account Required
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {invitedEmail && (
              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">{invitedEmail}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to signup page...
            </p>
            <Button
              onClick={handleManualSignup}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
            >
              Create Account
            </Button>
          </div>
        )}

        {/* Wrong User State */}
        {status === "wrong_user" && (
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Wrong Account
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {invitedEmail && (
              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-1">Invitation is for:</p>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-gray-800">
                    {invitedEmail}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={handleLogout}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
              >
                Logout & Login with Invited Email
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="w-full py-3"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* General Error State */}
        {status === "error" && (
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Invitation Error
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full py-3"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
