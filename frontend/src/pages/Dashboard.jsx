import { useEffect, useState } from "react";
import API from "../api";

function Dashboard({ onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("user/profile/"); // Adjust to your protected endpoint
        setUser(res.data);
      } catch (err) {
        console.error("Unauthorized or expired token", err);
        onLogout();
      }
    };
    fetchProfile();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "100px auto", textAlign: "center" }}>
      <h2>Dashboard</h2>
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              onLogout();
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}

export default Dashboard;
