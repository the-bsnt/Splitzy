export default function Button({
  children,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}) {
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800",
    ghost: "bg-gray-200 text-gray-700 hover:bg-gray-100 active:bg-gray-200",
    outline:
      "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100",
    green:
      "bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors",
    red: "bg-red-600 text-white hover:bg-red-800 active:bg-red-800",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={{ cursor: "pointer" }}
    >
      {children}
    </button>
  );
}
