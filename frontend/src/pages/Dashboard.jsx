import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Mail, Wallet, Users, TrendingUp } from "lucide-react";
import { authService } from "../services/authService";
import Button from "../components/Button";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.profile();

        // if (res?.status === 401)
        setUser(res.data);
      } catch (err) {
        console.error("Unauthorized or expired token", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const onLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem("access");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
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

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-white to-purple-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-indigo-600">Splitzy</h1>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-4 rounded-full">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Welcome back, {user?.name}!
                </h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <StatCard
            icon={<Wallet className="h-8 w-8 text-indigo-600" />}
            title="Total Expenses"
            value="$0.00"
            description="No expenses yet"
          />
          <StatCard
            icon={<Users className="h-8 w-8 text-indigo-600" />}
            title="Active Groups"
            value="0"
            description="Create your first group"
          />
          <StatCard
            icon={<TrendingUp className="h-8 w-8 text-indigo-600" />}
            title="Balance"
            value="$0.00"
            description="All settled up"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="primary"
              className="w-full py-4 text-lg"
              onClick={() => navigate("/groups/create")}
            >
              Create New Group
            </Button>
            <Button
              variant="outline"
              className="w-full py-4 text-lg"
              onClick={() => navigate("/expenses/add")}
            >
              Add Expense
            </Button>
          </div>
        </motion.div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center py-12"
        >
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-10 w-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No expenses yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start by creating a group and adding your first expense
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/groups/create")}
            >
              Get Started
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, description }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-indigo-100 p-3 rounded-full">{icon}</div>
        <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

export default Dashboard;
