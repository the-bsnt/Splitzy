import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  Mail,
  Wallet,
  Users,
  TrendingUp,
  X,
  Lock,
  Plus,
  ChevronRight,
  Info,
  Settings,
} from "lucide-react";
import { authService } from "../services/authService";
import Button from "../components/Button";
import PasswordField from "../components/PasswordField";
import api from "../api/axios";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false); // Added missing state
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [groupName, setGroupName] = useState(""); // Added missing state
  const [groupDescription, setGroupDescription] = useState(""); // Added missing state
  const [createGroupError, setCreateGroupError] = useState(""); // Added missing state

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.profile();
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

  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await api.get("/groups/");
        setGroups(response.data);
      } catch (err) {
        console.error("Failed to fetch groups", err);
      } finally {
        setLoadingGroups(false);
      }
    };
    if (!loading) {
      fetchGroups();
    }
  }, [loading]);

  const onLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem("access");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords don't match");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/change/password/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify({
            old_password: passwordForm.old_password,
            new_password: passwordForm.new_password,
          }),
        }
      );

      if (response.ok) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordForm({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        const error = await response.json();
        setPasswordError(error.message || "Failed to change password");
      }
    } catch (err) {
      setPasswordError("Failed to change password");
    }
  };

  // Added missing function
  const handleCreateGroup = async () => {
    setCreateGroupError("");

    if (!groupName.trim()) {
      setCreateGroupError("Group name is required");
      return;
    }

    try {
      const response = await api.post("/groups/", {
        name: groupName,
        description: groupDescription,
      });

      if (response.status === 201) {
        setShowCreateGroup(false);
        setGroupName("");
        setGroupDescription("");
        // Refresh groups list
        const groupsResponse = await api.get("/groups/");
        setGroups(groupsResponse.data);
      }
    } catch (err) {
      setCreateGroupError(
        err.response?.data?.message || "Failed to create group"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-indigo-600">Splitzy</h1>
          </div>
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

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Profile Info */}
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-indigo-200 p-3 rounded-full">
                      <User className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {user?.name}
                      </h3>
                      <p className="text-gray-600 flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.old_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            old_password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            new_password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirm_password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    {passwordError && (
                      <p className="text-red-600 text-sm">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-green-600 text-sm">
                        {passwordSuccess}
                      </p>
                    )}
                    <Button
                      onClick={handlePasswordChange}
                      variant="primary"
                      className="w-full"
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateGroup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Create New Group
                  </h2>
                  <button
                    onClick={() => setShowCreateGroup(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter group description"
                      rows="3"
                    />
                  </div>
                  {createGroupError && (
                    <p className="text-red-600 text-sm">{createGroupError}</p>
                  )}
                  <Button
                    onClick={handleCreateGroup}
                    variant="primary"
                    className="w-full"
                  >
                    Create Group
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center justify-between relative">
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
              <button
                onClick={() => setShowProfile(true)}
                className="absolute top-0 right-0  flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 px-4 py-2 rounded-lg transition-colors"
              >
                {/* Replaced User with Settings icon */}
                <Settings className="h-5 w-5 text-indigo-600" />
                <span className="text-indigo-600 font-medium">Profile</span>
              </button>
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
            value={groups.length.toString()}
            description={
              groups.length === 0
                ? "Create your first group"
                : `${groups.length} group${groups.length !== 1 ? "s" : ""}`
            }
          />
          <StatCard
            icon={<TrendingUp className="h-8 w-8 text-indigo-600" />}
            title="Balance"
            value="$0.00"
            description="All settled up"
          />
        </motion.div>

        {/* Groups Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Your Groups</h3>
            <Button
              variant="primary"
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </div>

          {loadingGroups ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading groups...</p>
            </div>
          ) : groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} navigate={navigate} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <p className="text-gray-600">
                No groups yet. Create your first group to get started!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function GroupCard({ group, navigate }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const groupId = group.id;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer border border-indigo-100"
      onClick={() => navigate(`/group/${group.name}`, { state: { groupId } })}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-200 p-3 rounded-full">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800">
              {group.name}
            </h4>
            <p className="text-sm text-gray-600">
              {group.description || "No description"}
            </p>
          </div>
        </div>
        <ChevronRight className="h-6 w-6 text-indigo-600" />
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg z-10 w-64"
          >
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">
                  Click to view group details
                </p>
                <p className="text-gray-300">
                  See expenses, members, and manage this group
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
