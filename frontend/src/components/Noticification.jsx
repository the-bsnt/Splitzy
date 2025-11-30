import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

// Notification Component
const Notification = ({ msg, type = "success", duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
  };

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible && !isExiting
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`flex items-center gap-3 min-w-80 max-w-md p-4 rounded-lg border shadow-lg ${styles[type]}`}
      >
        {icons[type]}
        <p className="flex-1 text-sm font-medium">{msg}</p>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Notification Container
const NotificationContainer = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notif) => (
        <Notification
          key={notif.id}
          msg={notif.msg}
          type={notif.type}
          duration={notif.duration}
          onClose={() => removeNotification(notif.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
// // Demo Component
// export default function NotificationDemo() {
//   const { notifications, addNotification, removeNotification } =
//     useNotification();

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
//       <div className="max-w-2xl mx-auto">
//         <h1 className="text-3xl font-bold text-slate-800 mb-2">
//           useNotification Hook
//         </h1>
//         <p className="text-slate-600 mb-8">
//           Custom hook for managing notifications with add and remove functions
//         </p>

//         <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
//           <button
//             onClick={() =>
//               addNotification("Operation completed successfully!", "success")
//             }
//             className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
//           >
//             Show Success Notification
//           </button>

//           <button
//             onClick={() =>
//               addNotification("An error occurred. Please try again.", "error")
//             }
//             className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
//           >
//             Show Error Notification
//           </button>

//           <button
//             onClick={() => {
//               addNotification("File uploaded successfully!", "success");
//               setTimeout(
//                 () => addNotification("Processing file...", "success"),
//                 500
//               );
//               setTimeout(() => addNotification("All done!", "success"), 1000);
//             }}
//             className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
//           >
//             Show Multiple Notifications
//           </button>

//           <button
//             onClick={() =>
//               addNotification("This stays for 10 seconds", "success", 10000)
//             }
//             className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
//           >
//             Show Long Duration (10s)
//           </button>
//         </div>

//         <div className="mt-8 bg-slate-800 rounded-xl p-6 text-slate-200">
//           <h2 className="text-lg font-semibold mb-3">Hook Usage</h2>
//           <pre className="text-sm overflow-x-auto">
//             {`const {
//   notifications,
//   addNotification,
//   removeNotification
// } = useNotification();

// // Add notification
// addNotification('Message', 'success', 3000);
// addNotification('Error!', 'error', 5000);

// // Remove notification (optional, auto-removes)
// removeNotification(notificationId);`}
//           </pre>
//         </div>

//         <div className="mt-4 bg-slate-800 rounded-xl p-6 text-slate-200">
//           <h2 className="text-lg font-semibold mb-3">Component Usage</h2>
//           <pre className="text-sm overflow-x-auto">
//             {`<NotificationContainer
//   notifications={notifications}
//   removeNotification={removeNotification}
// />`}
//           </pre>
//         </div>
//       </div>

//       <NotificationContainer
//         notifications={notifications}
//         removeNotification={removeNotification}
//       />
//     </div>
//   );
// }
