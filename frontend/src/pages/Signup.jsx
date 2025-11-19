import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, User, Lock, ArrowRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PasswordField from "../components/PasswordField";
import { authService } from "../services/authService";
import { useRedirectIfLoggedIn } from "../hooks/useRedirectIfLoggedIn";

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const prefilledEmail = searchParams.get("email");

  const [formData, setFormData] = useState({
    name: "",
    email: prefilledEmail || "",
    password: "",
    password2: "",
  });

  useRedirectIfLoggedIn(redirectUrl);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.password2) {
      newErrors.password2 = "Please confirm your password";
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleBlur = (e) => {
    setTouched({
      ...touched,
      [e.target.name]: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      password: true,
      password2: true,
    });

    const isValid = validate();
    if (isValid) {
      const { password2, ...submitData } = formData;

      try {
        const response = await authService.signup(submitData);
        localStorage.setItem("access", response.data.access);

        // Redirect to the specified URL or dashboard
        if (redirectUrl) {
          navigate(redirectUrl);
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        if (err.response) {
          const status = err.response.status;
          const errorData = err.response.data;

          if (status === 400) {
            if (typeof errorData === "object") {
              const formattedErrors = {};

              for (const [field, messages] of Object.entries(errorData)) {
                formattedErrors[field] = Array.isArray(messages)
                  ? messages.join(", ")
                  : messages;
              }

              setErrors(formattedErrors);
            } else {
              setErrors({ general: "Something went wrong." });
            }
          } else {
            setErrors({ general: "Server error. Please try again later." });
          }
        } else {
          setErrors({ general: "Network error. Check your connection." });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex flex-col items-center justify-center px-6">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center py-6 max-w-6xl absolute top-0">
        <img src="/src/assets/splitzy.svg" className="mr-3 h-12" alt="Logo" />
      </nav>

      {/* Sign Up Form */}
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600">
              Join Splitzy and start managing expenses
            </p>
            {redirectUrl && (
              <p className="text-sm text-indigo-600 mt-2">
                Create an account to continue
              </p>
            )}
            {prefilledEmail && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-indigo-700">
                  You've been invited to join a group!
                </p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your name"
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.name && touched.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-600 focus:border-transparent"
                  }`}
                />
              </div>
              {errors.name && touched.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email"
                  disabled={!!prefilledEmail}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    prefilledEmail ? "bg-gray-50 cursor-not-allowed" : ""
                  } ${
                    errors.email && touched.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-indigo-600 focus:border-transparent"
                  }`}
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div onBlur={handleBlur}>
                <PasswordField
                  formData={formData.password}
                  handleChange={handleChange}
                  placeholder="Create a password"
                />
              </div>
              {errors.password && touched.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="password2"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div onBlur={handleBlur}>
                <PasswordField
                  formData={formData.password2}
                  handleChange={handleChange}
                  placeholder="Confirm password"
                  name="password2"
                />
              </div>
              {errors.password2 && touched.password2 && (
                <p className="mt-1 text-sm text-red-600">{errors.password2}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
              style={{ cursor: "pointer" }}
            >
              Create Account
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Divider */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to={
                redirectUrl
                  ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                  : "/login"
              }
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By signing up, you agree to our{" "}
          <a href="#" className="text-indigo-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-indigo-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
