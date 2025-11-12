import { useEffect, useState } from "react";
import api from "../api/axios";
import { authService } from "../services/authService";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
function Dashboard() {
  const navigate = useNavigate();
  const onLogout = async () => {
    const res = await authService.logout();
    localStorage.removeItem("access");
    navigate("/login");
  };
  const [user, setUser] = useState(null);
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.profile();
        setUser(res.data);
      } catch (err) {
        console.error("Unauthorized or expired token", err);
      }
    };
    fetchProfile();
  }, []);
  return (
    <div style={{ maxWidth: 600, margin: "100px auto", textAlign: "center" }}>
      <h2>Dashboard</h2>
      {user ? (
        <div>
          <p>Welcome, {user.name}</p>
          <p> {user.email}</p>
          <Button
            onClick={() => {
              onLogout();
            }}
          >
            Logout
          </Button>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}
export default Dashboard;
