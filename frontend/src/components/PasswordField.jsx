import React, { useState, useId } from "react";
import { Lock, Eye, EyeOff } from "lucide-react"; // Import the necessary icons

function PasswordField({
  password,
  handleChange,
  placeholder = "Enter password",
  name = "password",
}) {
  // 1. Manage State for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // 2. Toggle Function
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 3. Generates a unique ID
  const inputId = useId();

  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      <input
        // 3. Update Input Type
        type={showPassword ? "text" : "password"}
        id={inputId}
        name={name}
        value={password}
        onChange={handleChange}
        placeholder={placeholder}
        // Adjust padding-right (pr-4) to make space for the eye icon (pr-11)
        className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
      />
      {/* 4. Add the Eye Icon with click handler */}
      <div
        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
        onClick={togglePasswordVisibility}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Conditionally render Eye or EyeOff icon */}
        {showPassword ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </div>
    </div>
  );
}

export default PasswordField;
