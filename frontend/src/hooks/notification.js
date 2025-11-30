import React, { useState } from "react";

// Custom hook for managing notifications
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (msg, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    const notification = { id, msg, type, duration };

    setNotifications((prev) => [...prev, notification]);

    return id;
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    removeNotification,
  };
};
