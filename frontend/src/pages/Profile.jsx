import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { authService } from "../services/authService";
import Button from "../components/Button";
import PasswordField from "../components/PasswordField";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.profile();
        setUser(res.data);
        setError(null);
      } catch (err) {
        console.error("Unauthorized or expired token", err);
        setError("Unauthorized or expired token");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validatePassword = () => {
    const errors = {};

    if (!passwordForm.oldPassword) {
      errors.oldPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)
    ) {
      errors.newPassword =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (
      passwordForm.oldPassword &&
      passwordForm.newPassword &&
      passwordForm.oldPassword === passwordForm.newPassword
    ) {
      errors.newPassword =
        "New password must be different from current password";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value,
    });

    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: "",
      });
    }
    if (apiError) {
      setApiError("");
    }
  };

  const handleBlur = (e) => {
    setTouched({
      ...touched,
      [e.target.name]: true,
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setTouched({
      oldPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    const isValid = validatePassword();
    if (!isValid) return;

    setChangePasswordLoading(true);
    setApiError("");

    try {
      // Replace this with your actual API call
      await authService.changePassword({
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword,
      });

      // Success - show notification and navigate
      alert("Password changed successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Password change failed", err);
      // Display API error
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to change password. Please check your current password.";
      setApiError(errorMessage);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Unauthorized Access
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            variant="primary"
            onClick={() => navigate("/login")}
            className="w-full"
          >
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-white to-purple-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-indigo-600">Splitzy</h1>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Profile Information
          </h2>
          <div className="flex items-center gap-6">
            <div className="bg-indigo-100 p-6 rounded-full">
              <User className="h-12 w-12 text-indigo-600" />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Full Name</label>
                <p className="text-lg font-semibold text-gray-800">
                  {user?.name}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email Address</label>
                <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Change Password Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              Change Password
            </h2>
          </div>

          <div className="space-y-5">
            {/* Current Password */}
            <div>
              <label
                htmlFor="oldPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Current Password
              </label>
              <PasswordField
                name="oldPassword"
                password={passwordForm.oldPassword}
                handleChange={handlePasswordChange}
                onBlur={handleBlur}
                placeholder="Enter current password"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition ${
                  touched.oldPassword && passwordErrors.oldPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {touched.oldPassword && passwordErrors.oldPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.oldPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <PasswordField
                name="newPassword"
                password={passwordForm.newPassword}
                handleChange={handlePasswordChange}
                onBlur={handleBlur}
                placeholder="Enter new password"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition ${
                  touched.newPassword && passwordErrors.newPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {touched.newPassword && passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <PasswordField
                name="confirmPassword"
                password={passwordForm.confirmPassword}
                handleChange={handlePasswordChange}
                onBlur={handleBlur}
                placeholder="Confirm new password"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition ${
                  touched.confirmPassword && passwordErrors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {touched.confirmPassword && passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* API Error Display */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-red-600 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600">{apiError}</p>
              </div>
            )}

            {/* Password Requirements */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Password requirements:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-600" />
                  At least 8 characters long
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-600" />
                  Contains uppercase and lowercase letters
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-600" />
                  Contains at least one number
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-600" />
                  Different from current password
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-all duration-200"
            >
              {changePasswordLoading ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Profile;
